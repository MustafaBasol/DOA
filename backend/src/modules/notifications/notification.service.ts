import { prisma } from '../../config/database';
import { socketService } from '../../socket';
import { EmailService } from './email.service';
import { pushNotificationService } from '../../services/push-notification.service';

export interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'MESSAGE_READ'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SYSTEM_ALERT'
  | 'WELCOME'
  | 'PASSWORD_CHANGED';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send notification to user via multiple channels
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const { userId, type, title, message, data, priority = 'medium', actionUrl } = payload;

    try {
      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId.toString() },
        select: {
          email: true,
          fullName: true,
          notificationPreferences: true,
        },
      });

      if (!user) {
        console.error(`User ${userId} not found`);
        return;
      }

      const preferences = (user.notificationPreferences as any) || {
        email: true,
        push: false,
        inApp: true,
      };

      // Store notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: userId.toString(),
          type,
          title,
          message,
          data: data || {},
          priority: priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          actionUrl,
          isRead: false,
        },
      });

      // Send via WebSocket (real-time)
      if (preferences.inApp && socketService) {
        socketService.emitNewMessage(userId, {
          event: 'notification',
          notification: {
            id: notification.id,
            type,
            title,
            message,
            data,
            priority,
            actionUrl,
            createdAt: notification.createdAt,
          },
        });
      }

      // Send via Email
      if (preferences.email && user.fullName && this.shouldSendEmail(type, priority)) {
        await this.sendEmailNotification(user.email, user.fullName, payload);
      }

      // Send via Push Notification
      if (preferences.push) {
        await pushNotificationService.sendToUser(parseInt(userId.toString()), {
          title,
          body: message,
          data: data ? Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ) : {
            type,
            notificationId: notification.id,
          },
        }).catch((error) => {
          console.error('Failed to send push notification:', error);
          // Don't throw - push failures shouldn't break the flow
        });
      }

      console.log(`✅ Notification sent to user ${userId}: ${type}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(userIds: number[], payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
    const promises = userIds.map((userId) =>
      this.sendNotification({ ...payload, userId }).catch((error) => {
        console.error(`Failed to send notification to user ${userId}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Send notification to all admins
   */
  async sendToAdmins(payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN'] },
        isActive: true,
      },
      select: { id: true },
    });

    const adminIds = admins.map((admin) => parseInt(admin.id));
    await this.sendBulkNotification(adminIds, payload);

    // Also emit to admin room via WebSocket
    if (socketService) {
      socketService.emitToAdmins('notification', {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        priority: payload.priority,
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId.toString(),
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId: userId.toString(),
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const where: any = {
      userId: userId.toString(),
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: userId.toString(),
          isRead: false,
        },
      }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * Delete old read notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        readAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old notifications`);
    return result.count;
  }

  /**
   * Determine if email should be sent based on type and priority
   */
  private shouldSendEmail(type: NotificationType, priority: string): boolean {
    // Always send email for high priority
    if (priority === 'high' || priority === 'urgent') {
      return true;
    }

    // Send email for specific types
    const emailTypes: NotificationType[] = [
      'PAYMENT_RECEIVED',
      'PAYMENT_FAILED',
      'SUBSCRIPTION_EXPIRING',
      'SUBSCRIPTION_EXPIRED',
      'WELCOME',
      'PASSWORD_CHANGED',
    ];

    return emailTypes.includes(type);
  }

  /**
   * Send email notification using appropriate template
   */
  private async sendEmailNotification(
    email: string,
    fullName: string,
    payload: NotificationPayload
  ): Promise<void> {
    const { type, title, message, data, actionUrl } = payload;

    const templateMap: Record<NotificationType, string> = {
      NEW_MESSAGE: 'new-message',
      MESSAGE_READ: 'message-read',
      PAYMENT_RECEIVED: 'payment-received',
      PAYMENT_FAILED: 'payment-failed',
      SUBSCRIPTION_EXPIRING: 'subscription-expiring',
      SUBSCRIPTION_EXPIRED: 'subscription-expired',
      SUBSCRIPTION_RENEWED: 'subscription-renewed',
      SYSTEM_ALERT: 'system-alert',
      WELCOME: 'welcome',
      PASSWORD_CHANGED: 'password-changed',
    };

    const template = templateMap[type] || 'generic-notification';

    try {
      await this.emailService.sendTemplateEmail({
        to: email,
        subject: title,
        template,
        context: {
          fullName,
          title,
          message,
          actionUrl: actionUrl || `${process.env.FRONTEND_URL}/dashboard`,
          data,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
      // Don't throw - email failures shouldn't break the flow
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeNotification(userId: number, email: string, fullName: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'WELCOME',
      title: 'Hoş Geldiniz! 🎉',
      message: `Merhaba ${fullName}, hesabınız başarıyla oluşturuldu. Hizmetimizi kullanmaya başlayabilirsiniz.`,
      priority: 'high',
      actionUrl: '/dashboard',
    });
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceivedNotification(
    userId: number,
    amount: number,
    currency: string = 'TRY'
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Ödeme Alındı ✅',
      message: `${amount} ${currency} tutarındaki ödemeniz başarıyla alındı.`,
      data: { amount, currency },
      priority: 'high',
      actionUrl: '/payments',
    });
  }

  /**
   * Send subscription expiring notification
   */
  async sendSubscriptionExpiringNotification(userId: number, daysLeft: number): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'SUBSCRIPTION_EXPIRING',
      title: 'Abonelik Süresi Dolmak Üzere ⚠️',
      message: `Aboneliğinizin süresi ${daysLeft} gün içinde dolacak. Lütfen yenileyin.`,
      data: { daysLeft },
      priority: 'high',
      actionUrl: '/subscriptions',
    });
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    userId: number,
    fromNumber: string,
    messagePreview: string
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'NEW_MESSAGE',
      title: 'Yeni Mesaj 💬',
      message: `${fromNumber}: ${messagePreview.substring(0, 50)}...`,
      data: { fromNumber },
      priority: 'medium',
      actionUrl: '/messages',
    });
  }
}

export const notificationService = new NotificationService();
