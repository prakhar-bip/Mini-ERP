import { inventoryService } from '../services/inventory.service.js';

export class InventoryController {
  async getInventories(req, res, next) {
    try {
      const { locationId, itemId } = req.query;
      const inventories = await inventoryService.getInventories({ locationId, itemId });
      res.status(200).json({ success: true, data: inventories });
    } catch (err) {
      next(err);
    }
  }

  async getSummary(req, res, next) {
    try {
      const { locationId } = req.query;
      const summary = await inventoryService.getInventorySummary(locationId);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  async addStock(req, res, next) {
    try {
      const result = await inventoryService.addStock(req.body);
      res.status(201).json({
        success: true,
        message: 'Stock added successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const result = await inventoryService.adjustStock(req.body);
      res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
