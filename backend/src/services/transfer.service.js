import prisma from '../config/database.js';

export class TransferService {
  async getTransfers({ sourceLocationId, destLocationId, status } = {}) {
    const where = {};
    if (sourceLocationId) where.sourceLocationId = sourceLocationId;
    if (destLocationId) where.destLocationId = destLocationId;
    if (status) where.status = status;

    return prisma.internalTransfer.findMany({
      where,
      include: {
        item: {
          select: { id: true, name: true, sku: true, category: true, unit: true }
        },
        sourceLocation: {
          select: { id: true, name: true, code: true }
        },
        destLocation: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTransferById(id) {
    const transfer = await prisma.internalTransfer.findUnique({
      where: { id },
      include: {
        item: true,
        sourceLocation: true,
        destLocation: true
      }
    });

    if (!transfer) {
      const error = new Error('Transfer record not found');
      error.status = 404;
      throw error;
    }

    return transfer;
  }

  async createTransfer({ transferNumber, sourceLocationId, destLocationId, itemId, quantity }) {
    if (sourceLocationId === destLocationId) {
      const error = new Error('Source and Destination locations must be different');
      error.status = 400;
      throw error;
    }

    if (quantity <= 0) {
      const error = new Error('Transfer quantity must be greater than 0');
      error.status = 400;
      throw error;
    }

    const finalTransferNumber = transferNumber || `TR-${Date.now().toString().slice(-6)}`;

    const existing = await prisma.internalTransfer.findUnique({
      where: { transferNumber: finalTransferNumber }
    });
    if (existing) {
      const error = new Error(`Transfer '${finalTransferNumber}' already exists`);
      error.status = 400;
      throw error;
    }

    // Verify locations and item
    const [source, dest, item] = await Promise.all([
      prisma.location.findUnique({ where: { id: sourceLocationId } }),
      prisma.location.findUnique({ where: { id: destLocationId } }),
      prisma.item.findUnique({ where: { id: itemId } })
    ]);

    if (!source || !dest) {
      const error = new Error('Invalid source or destination location');
      error.status = 404;
      throw error;
    }
    if (!item) {
      const error = new Error('Item not found');
      error.status = 404;
      throw error;
    }

    return prisma.internalTransfer.create({
      data: {
        transferNumber: finalTransferNumber,
        sourceLocationId,
        destLocationId,
        itemId,
        quantity,
        status: 'REQUESTED'
      },
      include: {
        item: true,
        sourceLocation: true,
        destLocation: true
      }
    });
  }

  /**
   * Dispatch Transfer - Deducts stock from source location inside an ACID transaction.
   * Does NOT increase destination stock (in-transit).
   */
  async dispatchTransfer(transferId) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.internalTransfer.findUnique({
        where: { id: transferId },
        include: { item: true, sourceLocation: true, destLocation: true }
      });

      if (!transfer) {
        const error = new Error('Transfer not found');
        error.status = 404;
        throw error;
      }

      if (transfer.status !== 'REQUESTED') {
        const error = new Error(
          `Cannot dispatch transfer with status '${transfer.status}'. Must be 'REQUESTED'.`
        );
        error.status = 400;
        throw error;
      }

      // Check available inventory at source location
      const sourceInventories = await tx.inventory.findMany({
        where: {
          itemId: transfer.itemId,
          locationId: transfer.sourceLocationId
        },
        orderBy: { physicalQty: 'desc' }
      });

      const totalAvailable = sourceInventories.reduce(
        (sum, inv) => sum + Math.max(0, inv.physicalQty - inv.reservedQty),
        0
      );

      if (totalAvailable < transfer.quantity) {
        const error = new Error(
          `Cannot transfer more than available inventory. Requested: ${transfer.quantity}, Available at source: ${totalAvailable}`
        );
        error.status = 400;
        throw error;
      }

      // Deduct quantity from source inventory batch(es)
      let remainingToDeduct = transfer.quantity;
      for (const inv of sourceInventories) {
        const availableInBatch = Math.max(0, inv.physicalQty - inv.reservedQty);
        if (availableInBatch <= 0) continue;

        const deductFromThis = Math.min(remainingToDeduct, availableInBatch);
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            physicalQty: inv.physicalQty - deductFromThis,
            version: { increment: 1 }
          }
        });

        remainingToDeduct -= deductFromThis;
        if (remainingToDeduct === 0) break;
      }

      // Update transfer to DISPATCHED
      const updatedTransfer = await tx.internalTransfer.update({
        where: { id: transferId },
        data: {
          status: 'DISPATCHED',
          dispatchedAt: new Date()
        },
        include: {
          item: true,
          sourceLocation: true,
          destLocation: true
        }
      });

      return updatedTransfer;
    });
  }

  /**
   * Receive Transfer - Adds stock to destination location inside an ACID transaction.
   * Strictly prevents duplicate receipt.
   */
  async receiveTransfer(transferId) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.internalTransfer.findUnique({
        where: { id: transferId },
        include: { item: true, sourceLocation: true, destLocation: true }
      });

      if (!transfer) {
        const error = new Error('Transfer not found');
        error.status = 404;
        throw error;
      }

      if (transfer.status === 'RECEIVED') {
        const error = new Error('Transfer has already been received. Duplicate receipt is not allowed.');
        error.status = 400;
        throw error;
      }

      if (transfer.status !== 'DISPATCHED') {
        const error = new Error(
          `Transfer must be in 'DISPATCHED' status before receipt. Current status: '${transfer.status}'.`
        );
        error.status = 400;
        throw error;
      }

      // Add inventory to destination location
      // Find default batch or create transfer batch
      const destBatchName = `TR-BATCH-${transfer.transferNumber}`;
      await tx.inventory.upsert({
        where: {
          itemId_locationId_batch: {
            itemId: transfer.itemId,
            locationId: transfer.destLocationId,
            batch: destBatchName
          }
        },
        update: {
          physicalQty: { increment: transfer.quantity },
          version: { increment: 1 }
        },
        create: {
          itemId: transfer.itemId,
          locationId: transfer.destLocationId,
          batch: destBatchName,
          physicalQty: transfer.quantity,
          reservedQty: 0
        }
      });

      // Update transfer status to RECEIVED
      const receivedTransfer = await tx.internalTransfer.update({
        where: { id: transferId },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date()
        },
        include: {
          item: true,
          sourceLocation: true,
          destLocation: true
        }
      });

      return receivedTransfer;
    });
  }
}

export const transferService = new TransferService();
