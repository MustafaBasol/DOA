import { PrismaClient } from '@prisma/client';
import { firebaseService } from './firebase.service';

const prisma = new PrismaClient();

export interface PushNotificationData {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

export class PushNotificationService {
  /**
   * Send push notification to specific user
   */
  async sendToUser(
    userId: string,
    notification: PushNotificationData
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all active device tokens for user
      const devices = await prisma.deviceToken.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (devices.length === 0) {
        console.log(`No active devices found for user ${userId}`);
        return { success: 0, failed: 0 };
      }

      const tokens = devices.map((d: any) => d.token);

      // Send multicast notification
      const result = await firebaseService.sendMulticastNotification(
        tokens,
        {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        notification.data
      );

      return {
        success: result.successCount,
        failed: result.failureCount,
      };
    } catch (error) {
      console.error('Failed to send push notification to user:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    notification: PushNotificationData
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all active device tokens for users
      const devices = await prisma.deviceToken.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
        },
      });

      if (devices.length === 0) {
        console.log('No active devices found for users');
        return { success: 0, failed: 0 };
      }

      const tokens = devices.map((d: any) => d.token);

      // Send multicast notification (max 500 tokens per call)
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        const result = await firebaseService.sendMulticastNotification(
          batch,
          {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
          },
          notification.data
        );

        totalSuccess += result.successCount;
        totalFailed += result.failureCount;
      }

      return {
        success: totalSuccess,
        failed: totalFailed,
      };
    } catch (error) {
      console.error('Failed to send push notifications to users:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Send push notification to all users with specific role
   */
  async sendToRole(
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CLIENT',
    notification: PushNotificationData
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all users with role
      const users = await prisma.user.findMany({
        where: { role, isActive: true },
        select: { id: true },
      });

      const userIds = users.map((u) => u.id);
      return await this.sendToUsers(userIds, notification);
    } catch (error) {
      console.error('Failed to send push notifications to role:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Send push notification to a topic (e.g., "all-admins", "payment-alerts")
   */
  async sendToTopic(
    topic: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      return await firebaseService.sendTopicNotification(
        topic,
        {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        notification.data
      );
    } catch (error) {
      console.error('Failed to send topic notification:', error);
      return false;
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDevice(
    userId: string,
    token: string,
    platform: 'IOS' | 'ANDROID' | 'WEB',
    deviceId?: string,
    deviceName?: string,
    appVersion?: string
  ): Promise<void> {
    try {
      // Validate token with Firebase
      const isValid = await firebaseService.validateToken(token);
      if (!isValid) {
        throw new Error('Invalid FCM token');
      }

      // Check if token already exists
      const existing = await prisma.deviceToken.findUnique({
        where: { token },
      });

      if (existing) {
        // Update existing token
        await prisma.deviceToken.update({
          where: { token },
          data: {
            userId,
            platform,
            deviceId,
            deviceName,
            appVersion,
            isActive: true,
            lastUsedAt: new Date(),
          },
        });
      } else {
        // Create new token
        await prisma.deviceToken.create({
          data: {
            userId,
            token,
            platform,
            deviceId,
            deviceName,
            appVersion,
            isActive: true,
          },
        });
      }

      console.log(`✅ Device registered for user ${userId}`);
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDevice(token: string): Promise<void> {
    try {
      await prisma.deviceToken.update({
        where: { token },
        data: { isActive: false },
      });

      console.log(`✅ Device unregistered: ${token}`);
    } catch (error) {
      console.error('Failed to unregister device:', error);
      throw error;
    }
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string) {
    return await prisma.deviceToken.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /**
   * Subscribe user devices to a topic
   */
  async subscribeUserToTopic(userId: string, topic: string): Promise<number> {
    try {
      const devices = await prisma.deviceToken.findMany({
        where: { userId, isActive: true },
      });

      if (devices.length === 0) {
        return 0;
      }

      const tokens = devices.map((d: any) => d.token);
      return await firebaseService.subscribeToTopic(tokens, topic);
    } catch (error) {
      console.error('Failed to subscribe user to topic:', error);
      return 0;
    }
  }

  /**
   * Unsubscribe user devices from a topic
   */
  async unsubscribeUserFromTopic(userId: string, topic: string): Promise<number> {
    try {
      const devices = await prisma.deviceToken.findMany({
        where: { userId, isActive: true },
      });

      if (devices.length === 0) {
        return 0;
      }

      const tokens = devices.map((d: any) => d.token);
      return await firebaseService.unsubscribeFromTopic(tokens, topic);
    } catch (error) {
      console.error('Failed to unsubscribe user from topic:', error);
      return 0;
    }
  }

  /**
   * Clean up invalid/expired tokens
   */
  async cleanupInvalidTokens(): Promise<number> {
    try {
      const allTokens = await prisma.deviceToken.findMany({
        where: { isActive: true },
      });

      let cleaned = 0;

      for (const device of allTokens) {
        const isValid = await firebaseService.validateToken(device.token);
        if (!isValid) {
          await prisma.deviceToken.update({
            where: { id: device.id },
            data: { isActive: false },
          });
          cleaned++;
        }
      }

      console.log(`✅ Cleaned up ${cleaned} invalid tokens`);
      return cleaned;
    } catch (error) {
      console.error('Failed to cleanup tokens:', error);
      return 0;
    }
  }

  /**
   * Delete old inactive tokens (older than 90 days)
   */
  async deleteOldTokens(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await prisma.deviceToken.deleteMany({
        where: {
          isActive: false,
          lastUsedAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      console.log(`✅ Deleted ${result.count} old tokens`);
      return result.count;
    } catch (error) {
      console.error('Failed to delete old tokens:', error);
      return 0;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
