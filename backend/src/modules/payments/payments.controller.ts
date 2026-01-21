import { Request, Response } from 'express';
import { PaymentService } from './payments.service';

export class PaymentController {
  /**
   * GET /api/payments
   * Get payments with filtering and pagination
   */
  static async getPayments(req: Request, res: Response) {
    try {
      const query = {
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        subscriptionId: req.query.subscriptionId ? parseInt(req.query.subscriptionId as string) : undefined,
        status: req.query.status as any,
        paymentMethod: req.query.paymentMethod as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await PaymentService.getPayments(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch payments',
      });
    }
  }

  /**
   * GET /api/payments/stats
   * Get payment statistics
   */
  static async getStats(req: Request, res: Response) {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const stats = await PaymentService.getStats(userId);

      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch statistics',
      });
    }
  }

  /**
   * GET /api/payments/user/:userId/summary
   * Get payment summary for a user
   */
  static async getUserPaymentSummary(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const summary = await PaymentService.getUserPaymentSummary(userId);

      res.json({
        success: true,
        summary,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch payment summary',
      });
    }
  }

  /**
   * GET /api/payments/:id
   * Get payment by ID
   */
  static async getPaymentById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const payment = await PaymentService.getPaymentById(id);

      res.json({
        success: true,
        payment,
      });
    } catch (error: any) {
      const status = error.message === 'Payment not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch payment',
      });
    }
  }

  /**
   * POST /api/payments
   * Create payment
   */
  static async createPayment(req: Request, res: Response) {
    try {
      const payment = await PaymentService.createPayment(req.body);

      res.status(201).json({
        success: true,
        payment,
      });
    } catch (error: any) {
      const status = error.message.includes('not found') || error.message.includes('does not belong') ? 400 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to create payment',
      });
    }
  }

  /**
   * PATCH /api/payments/:id
   * Update payment
   */
  static async updatePayment(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const payment = await PaymentService.updatePayment(id, req.body);

      res.json({
        success: true,
        payment,
      });
    } catch (error: any) {
      const status = error.message === 'Payment not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to update payment',
      });
    }
  }

  /**
   * DELETE /api/payments/:id
   * Delete payment
   */
  static async deletePayment(req: Request, res: Response) {
    try {
      const id = req.params.id;
      await PaymentService.deletePayment(id);

      res.json({
        success: true,
        message: 'Payment deleted successfully',
      });
    } catch (error: any) {
      const status = error.message === 'Payment not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to delete payment',
      });
    }
  }
}
