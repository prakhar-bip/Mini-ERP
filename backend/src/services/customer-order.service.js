import prisma from '../config/database.js';

export class CustomerOrderService {
  async getCustomerOrders({ locationId, status } = {}) {
    const where = {};
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    return prisma.customerOrder.findMany({
      where,
      include: {
        item: {
          select: { id: true, name: true, sku: true, category: true, unit: true }
        },
        location: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomerOrderById(id) {
    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: { item: true, location: true }
    });

    if (!order) {
      const error = new Error('Customer Order not found');
      error.status = 404;
      throw error;
    }

    return order;
  }

  /**
   * Concurrency-Safe Customer Order Creation and Stock Reservation.
   * Uses PostgreSQL row-level locking (SELECT ... FOR UPDATE) inside an ACID transaction
   * to guarantee that simultaneous requests cannot oversell or double-reserve stock.
   */
  async createCustomerOrder({ orderNumber, customerName, locationId, itemId, quantity }) {
    if (quantity <= 0) {
      const error = new Error('Order quantity must be greater than 0');
      error.status = 400;
      throw error;
    }

    const finalOrderNumber = orderNumber || `SO-${Date.now().toString().slice(-6)}`;

    // Verify location and item
    const [location, item] = await Promise.all([
      prisma.location.findUnique({ where: { id: locationId } }),
      prisma.item.findUnique({ where: { id: itemId } })
    ]);

    if (!location) {
      const error = new Error('Location not found');
      error.status = 404;
      throw error;
    }
    if (!item) {
      const error = new Error('Item not found');
      error.status = 404;
      throw error;
    }

    return prisma.$transaction(
      async (tx) => {
        // Concurrency Lock: Lock inventory rows for this item at this location using SELECT FOR UPDATE
        const lockedInventories = await tx.$queryRaw`
          SELECT id, "itemId", "locationId", batch, "physicalQty", "reservedQty", version 
          FROM inventories 
          WHERE "itemId" = ${itemId} AND "locationId" = ${locationId}
          FOR UPDATE
        `;

        if (!lockedInventories || lockedInventories.length === 0) {
          const error = new Error('No inventory available for this item at the selected location');
          error.status = 400;
          throw error;
        }

        // Calculate total currently available stock under row lock
        const totalAvailable = lockedInventories.reduce(
          (sum, inv) => sum + Math.max(0, inv.physicalQty - inv.reservedQty),
          0
        );

        if (totalAvailable < quantity) {
          const error = new Error(
            `Cannot reserve more than available inventory. Requested: ${quantity}, Available: ${totalAvailable}`
          );
          error.status = 400;
          throw error;
        }

        // Allocate reserved quantity across batch records
        let remainingToReserve = quantity;
        for (const inv of lockedInventories) {
          const availableInBatch = Math.max(0, inv.physicalQty - inv.reservedQty);
          if (availableInBatch <= 0) continue;

          const reserveFromThis = Math.min(remainingToReserve, availableInBatch);

          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              reservedQty: inv.reservedQty + reserveFromThis,
              version: { increment: 1 }
            }
          });

          remainingToReserve -= reserveFromThis;
          if (remainingToReserve === 0) break;
        }

        // Create confirmed customer order record
        const order = await tx.customerOrder.create({
          data: {
            orderNumber: finalOrderNumber,
            customerName,
            locationId,
            itemId,
            quantity,
            status: 'CONFIRMED'
          },
          include: {
            item: true,
            location: true
          }
        });

        return order;
      },
      {
        timeout: 10000
      }
    );
  }

  /**
   * Cancel Customer Order - Releases reserved inventory atomically.
   * Future-proof implementation for Live Verification Round.
   */
  async cancelCustomerOrder(orderId) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        const error = new Error('Customer Order not found');
        error.status = 404;
        throw error;
      }

      if (order.status === 'CANCELLED') {
        const error = new Error('Order is already cancelled');
        error.status = 400;
        throw error;
      }

      // Find reserved inventory buckets to release reservation
      const inventories = await tx.inventory.findMany({
        where: {
          itemId: order.itemId,
          locationId: order.locationId,
          reservedQty: { gt: 0 }
        },
        orderBy: { reservedQty: 'desc' }
      });

      let remainingToRelease = order.quantity;
      for (const inv of inventories) {
        const releaseFromThis = Math.min(remainingToRelease, inv.reservedQty);
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            reservedQty: Math.max(0, inv.reservedQty - releaseFromThis),
            version: { increment: 1 }
          }
        });
        remainingToRelease -= releaseFromThis;
        if (remainingToRelease === 0) break;
      }

      return tx.customerOrder.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { item: true, location: true }
      });
    });
  }
}

export const customerOrderService = new CustomerOrderService();
