import { customerOrderService } from '../services/customer-order.service.js';

export class CustomerOrderController {
  async getCustomerOrders(req, res, next) {
    try {
      const { locationId, status } = req.query;
      const orders = await customerOrderService.getCustomerOrders({ locationId, status });
      res.status(200).json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerOrderById(req, res, next) {
    try {
      const order = await customerOrderService.getCustomerOrderById(req.params.id);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async createCustomerOrder(req, res, next) {
    try {
      const order = await customerOrderService.createCustomerOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Customer order created and stock reserved successfully',
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelCustomerOrder(req, res, next) {
    try {
      const order = await customerOrderService.cancelCustomerOrder(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Customer order cancelled and reserved stock released',
        data: order
      });
    } catch (err) {
      next(err);
    }
  }
}

export const customerOrderController = new CustomerOrderController();
