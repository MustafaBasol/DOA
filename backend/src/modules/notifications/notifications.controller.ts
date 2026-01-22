import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { AppError } from '../../middleware/errorHandler';

export class NotificationController {
  /**
   * Get current user's notifications
   * GET /api/notifications
   */
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await notificationService.getUserNotifications(userId, {
        page,
        limit,
        unreadOnly,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = parseInt(req.user!.id);

      await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);

      await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);

      const result = await notificationService.getUserNotifications(userId, {
        limit: 1,
        unreadOnly: true,
      });

      res.json({
        success: true,
        count: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification preferences
   * PATCH /api/notifications/preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { email, push, inApp } = req.body;

      // Validate preferences
      if (
        typeof email !== 'boolean' ||
        typeof push !== 'boolean' ||
        typeof inApp !== 'boolean'
      ) {
        throw new AppError(400, 'Invalid preferences format');
      }

      const { prisma } = await import('../../config/database');
      await prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: {
            email,
            push,
            inApp,
          } as any,
        },
      });

      res.json({
        success: true,
        message: 'Preferences updated',
        preferences: { email, push, inApp },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification preferences
   * GET /api/notifications/preferences
   */
  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const { prisma } = await import('../../config/database');
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true
        },
      }) as any;

      const preferences = user?.notificationPreferences || {
        email: true,
        push: false,
        inApp: true,
      };

      res.json({
        success: true,
        preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send test notification (for testing)
   * POST /api/notifications/test
   */
  async sendTestNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);

      await notificationService.sendNotification({
        userId,
        type: 'SYSTEM_ALERT',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working.',
        priority: 'medium',
      });

      res.json({
        success: true,
        message: 'Test notification sent',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
