import { Request, Response } from 'express';
import { SubscriptionService } from './subscriptions.service';

export class SubscriptionController {
  /**
   * GET /api/subscriptions
   * Get subscriptions with filtering and pagination
   */
  static async getSubscriptions(req: Request, res: Response) {
    try {
      const query = {
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        status: req.query.status as any,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await SubscriptionService.getSubscriptions(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch subscriptions',
      });
    }
  }

  /**
   * GET /api/subscriptions/stats
   * Get subscription statistics
   */
  static async getStats(req: Request, res: Response) {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const stats = await SubscriptionService.getStats(userId);

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
   * GET /api/subscriptions/:id
   * Get subscription by ID
   */
  static async getSubscriptionById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const subscription = await SubscriptionService.getSubscriptionById(id);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      const status = error.message === 'Subscription not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch subscription',
      });
    }
  }

  /**
   * GET /api/subscriptions/user/:userId/active
   * Get active subscription for a user
   */
  static async getActiveSubscription(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const subscription = await SubscriptionService.getActiveSubscription(userId);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch active subscription',
      });
    }
  }

  /**
   * POST /api/subscriptions
   * Create subscription
   */
  static async createSubscription(req: Request, res: Response) {
    try {
      const subscription = await SubscriptionService.createSubscription({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      });

      res.status(201).json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      const status = error.message.includes('not found') || error.message.includes('already has') ? 400 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to create subscription',
      });
    }
  }

  /**
   * PATCH /api/subscriptions/:id
   * Update subscription
   */
  static async updateSubscription(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = { ...req.body };

      // Convert date strings to Date objects
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);

      const subscription = await SubscriptionService.updateSubscription(id, data);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      const status = error.message === 'Subscription not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to update subscription',
      });
    }
  }

  /**
   * POST /api/subscriptions/:id/cancel
   * Cancel subscription
   */
  static async cancelSubscription(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const subscription = await SubscriptionService.cancelSubscription(id);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      const status = error.message === 'Subscription not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to cancel subscription',
      });
    }
  }

  /**
   * DELETE /api/subscriptions/:id
   * Delete subscription
   */
  static async deleteSubscription(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await SubscriptionService.deleteSubscription(id);

      res.json({
        success: true,
        message: 'Subscription deleted successfully',
      });
    } catch (error: any) {
      const status = error.message === 'Subscription not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to delete subscription',
      });
    }
  }
}
