import prisma from '../config/database.js';

export class WorkOrderService {
  async getWorkOrders({ locationId, status } = {}) {
    const where = {};
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        item: {
          select: { id: true, name: true, sku: true, category: true, unit: true }
        },
        location: {
          select: { id: true, name: true, code: true }
        },
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute live available stock and shortage for each work order
    const enrichedWorkOrders = await Promise.all(
      workOrders.map(async (wo) => {
        const inventoryAgg = await prisma.inventory.aggregate({
          where: {
            itemId: wo.itemId,
            locationId: wo.locationId
          },
          _sum: {
            physicalQty: true,
            reservedQty: true
          }
        });

        const physical = inventoryAgg._sum.physicalQty || 0;
        const reserved = inventoryAgg._sum.reservedQty || 0;
        const available = Math.max(0, physical - reserved);
        const shortage = Math.max(0, wo.requiredQty - available);

        return {
          ...wo,
          availableAtLocation: available,
          shortage,
          hasShortage: shortage > 0
        };
      })
    );

    return enrichedWorkOrders;
  }

  async getWorkOrderById(id) {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        item: true,
        location: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    if (!wo) {
      const error = new Error('Work Order not found');
      error.status = 404;
      throw error;
    }

    const inventoryAgg = await prisma.inventory.aggregate({
      where: {
        itemId: wo.itemId,
        locationId: wo.locationId
      },
      _sum: {
        physicalQty: true,
        reservedQty: true
      }
    });

    const physical = inventoryAgg._sum.physicalQty || 0;
    const reserved = inventoryAgg._sum.reservedQty || 0;
    const available = Math.max(0, physical - reserved);
    const shortage = Math.max(0, wo.requiredQty - available);

    return {
      ...wo,
      availableAtLocation: available,
      shortage,
      hasShortage: shortage > 0
    };
  }

  async createWorkOrder({ orderNumber, locationId, itemId, requiredQty, assignedUserId, status = 'ASSIGNED' }) {
    if (requiredQty <= 0) {
      const error = new Error('Required quantity must be greater than 0');
      error.status = 400;
      throw error;
    }

    // Auto-generate order number if omitted
    const finalOrderNumber = orderNumber || `WO-${Date.now().toString().slice(-6)}`;

    const existing = await prisma.workOrder.findUnique({
      where: { orderNumber: finalOrderNumber }
    });
    if (existing) {
      const error = new Error(`Work Order '${finalOrderNumber}' already exists`);
      error.status = 400;
      throw error;
    }

    // Verify foreign keys
    const [item, location, user] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      prisma.location.findUnique({ where: { id: locationId } }),
      prisma.user.findUnique({ where: { id: assignedUserId } })
    ]);

    if (!item) {
      const error = new Error('Item not found');
      error.status = 404;
      throw error;
    }
    if (!location) {
      const error = new Error('Location not found');
      error.status = 404;
      throw error;
    }
    if (!user) {
      const error = new Error('Assigned user not found');
      error.status = 404;
      throw error;
    }

    const created = await prisma.workOrder.create({
      data: {
        orderNumber: finalOrderNumber,
        locationId,
        itemId,
        requiredQty,
        assignedUserId,
        status
      },
      include: {
        item: true,
        location: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Calculate live shortage
    const inventoryAgg = await prisma.inventory.aggregate({
      where: { itemId, locationId },
      _sum: { physicalQty: true, reservedQty: true }
    });

    const physical = inventoryAgg._sum.physicalQty || 0;
    const reserved = inventoryAgg._sum.reservedQty || 0;
    const available = Math.max(0, physical - reserved);
    const shortage = Math.max(0, requiredQty - available);

    return {
      ...created,
      availableAtLocation: available,
      shortage,
      hasShortage: shortage > 0
    };
  }

  async updateWorkOrderStatus(id, newStatus) {
    const validTransitions = {
      ASSIGNED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: []
    };

    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) {
      const error = new Error('Work Order not found');
      error.status = 404;
      throw error;
    }

    if (workOrder.status === newStatus) {
      return workOrder;
    }

    const allowed = validTransitions[workOrder.status] || [];
    if (!allowed.includes(newStatus)) {
      const error = new Error(
        `Invalid status transition from '${workOrder.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'None (Completed)'}`
      );
      error.status = 400;
      throw error;
    }

    return prisma.workOrder.update({
      where: { id },
      data: { status: newStatus },
      include: {
        item: true,
        location: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }
}

export const workOrderService = new WorkOrderService();
