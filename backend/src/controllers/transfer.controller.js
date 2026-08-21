import { transferService } from '../services/transfer.service.js';

export class TransferController {
  async getTransfers(req, res, next) {
    try {
      const { sourceLocationId, destLocationId, status } = req.query;
      const transfers = await transferService.getTransfers({
        sourceLocationId,
        destLocationId,
        status
      });
      res.status(200).json({ success: true, data: transfers });
    } catch (err) {
      next(err);
    }
  }

  async getTransferById(req, res, next) {
    try {
      const transfer = await transferService.getTransferById(req.params.id);
      res.status(200).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  async createTransfer(req, res, next) {
    try {
      const transfer = await transferService.createTransfer(req.body);
      res.status(201).json({
        success: true,
        message: 'Transfer requested successfully',
        data: transfer
      });
    } catch (err) {
      next(err);
    }
  }

  async dispatchTransfer(req, res, next) {
    try {
      const transfer = await transferService.dispatchTransfer(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Stock dispatched successfully. Source inventory reduced.',
        data: transfer
      });
    } catch (err) {
      next(err);
    }
  }

  async receiveTransfer(req, res, next) {
    try {
      const transfer = await transferService.receiveTransfer(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Stock received successfully. Destination inventory increased.',
        data: transfer
      });
    } catch (err) {
      next(err);
    }
  }
}

export const transferController = new TransferController();
