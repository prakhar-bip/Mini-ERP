import prisma from '../config/database.js';

export class InventoryService {
  async getInventories({ locationId, itemId } = {}) {
    const where = {};
    if (locationId) where.locationId = locationId;
    if (itemId) where.itemId = itemId;

    const inventories = await prisma.inventory.findMany({
      where,
      include: {
        item: {
          select: { id: true, name: true, sku: true, category: true, unit: true }
        },
        location: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: [{ location: { name: 'asc' } }, { item: { name: 'asc' } }]
    });

    return inventories.map((inv) => ({
      ...inv,
      availableQty: Math.max(0, inv.physicalQty - inv.reservedQty)
    }));
  }

  async getInventorySummary(locationId = null) {
    const where = locationId ? { locationId } : {};
    const inventories = await prisma.inventory.findMany({
      where,
      include: { item: true, location: true }
    });

    const summaryMap = new Map();

    for (const inv of inventories) {
      const key = `${inv.locationId}_${inv.itemId}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          locationId: inv.locationId,
          locationName: inv.location.name,
          locationCode: inv.location.code,
          itemId: inv.itemId,
          itemName: inv.item.name,
          itemSku: inv.item.sku,
          itemCategory: inv.item.category,
          unit: inv.item.unit,
          physicalQty: 0,
          reservedQty: 0,
          availableQty: 0,
          batches: []
        });
      }

      const entry = summaryMap.get(key);
      entry.physicalQty += inv.physicalQty;
      entry.reservedQty += inv.reservedQty;
      entry.availableQty += Math.max(0, inv.physicalQty - inv.reservedQty);
      entry.batches.push({
        id: inv.id,
        batch: inv.batch,
        physicalQty: inv.physicalQty,
        reservedQty: inv.reservedQty,
        availableQty: Math.max(0, inv.physicalQty - inv.reservedQty)
      });
    }

    return Array.from(summaryMap.values());
  }

  async addStock({ itemId, locationId, batch, physicalQty }) {
    if (physicalQty <= 0) {
      const error = new Error('Physical quantity must be greater than 0');
      error.status = 400;
      throw error;
    }

    // Verify item and location exist
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      const error = new Error('Item not found');
      error.status = 404;
      throw error;
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      const error = new Error('Location not found');
      error.status = 404;
      throw error;
    }

    // Upsert inventory bucket for compound key (itemId, locationId, batch)
    const inventory = await prisma.inventory.upsert({
      where: {
        itemId_locationId_batch: {
          itemId,
          locationId,
          batch
        }
      },
      update: {
        physicalQty: { increment: physicalQty }
      },
      create: {
        itemId,
        locationId,
        batch,
        physicalQty,
        reservedQty: 0
      },
      include: {
        item: true,
        location: true
      }
    });

    return {
      ...inventory,
      availableQty: Math.max(0, inventory.physicalQty - inventory.reservedQty)
    };
  }

  async adjustStock({ inventoryId, adjustmentQty }) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { id: inventoryId },
        include: { item: true, location: true }
      });

      if (!inventory) {
        const error = new Error('Inventory record not found');
        error.status = 404;
        throw error;
      }

      const newPhysicalQty = inventory.physicalQty + adjustmentQty;

      if (newPhysicalQty < 0) {
        const error = new Error('Operation rejected: Inventory cannot be negative');
        error.status = 400;
        throw error;
      }

      if (newPhysicalQty < inventory.reservedQty) {
        const error = new Error(
          `Operation rejected: Physical quantity (${newPhysicalQty}) cannot be less than reserved quantity (${inventory.reservedQty})`
        );
        error.status = 400;
        throw error;
      }

      const updated = await tx.inventory.update({
        where: { id: inventoryId },
        data: {
          physicalQty: newPhysicalQty,
          version: { increment: 1 }
        },
        include: { item: true, location: true }
      });

      return {
        ...updated,
        availableQty: Math.max(0, updated.physicalQty - updated.reservedQty)
      };
    });
  }
}

export const inventoryService = new InventoryService();
