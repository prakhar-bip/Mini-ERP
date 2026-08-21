import { workOrderService } from '../services/work-order.service.js';

export class WorkOrderController {
  async getWorkOrders(req, res, next) {
    try {
      const { locationId, status } = req.query;
      const workOrders = await workOrderService.getWorkOrders({ locationId, status });
      res.status(200).json({ success: true, data: workOrders });
    } catch (err) {
      next(err);
    }
  }

  async getWorkOrderById(req, res, next) {
    try {
      const workOrder = await workOrderService.getWorkOrderById(req.params.id);
      res.status(200).json({ success: true, data: workOrder });
    } catch (err) {
      next(err);
    }
  }

  async createWorkOrder(req, res, next) {
    try {
      const workOrder = await workOrderService.createWorkOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Work order created successfully',
        data: workOrder
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await workOrderService.updateWorkOrderStatus(id, status);
      res.status(200).json({
        success: true,
        message: `Work order status updated to '${status}'`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
}

export const workOrderController = new WorkOrderController();
