import { Request, Response } from 'express';
import { pushNotificationService } from '../services/push-notification.service';

/**
 * Register device for push notifications
 */
export const registerDevice = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token, platform, deviceId, deviceName, appVersion } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ error: 'Token and platform are required' });
    }

    if (!['IOS', 'ANDROID', 'WEB'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    await pushNotificationService.registerDevice(
      userId,
      token,
      platform,
      deviceId,
      deviceName,
      appVersion
    );

    res.json({
      success: true,
      message: 'Device registered successfully',
    });
  } catch (error: any) {
    console.error('Register device error:', error);
    res.status(500).json({ error: error.message || 'Failed to register device' });
  }
};

/**
 * Unregister device from push notifications
 */
export const unregisterDevice = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    await pushNotificationService.unregisterDevice(token);

    res.json({
      success: true,
      message: 'Device unregistered successfully',
    });
  } catch (error: any) {
    console.error('Unregister device error:', error);
    res.status(500).json({ error: error.message || 'Failed to unregister device' });
  }
};

/**
 * Get user's registered devices
 */
export const getUserDevices = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const devices = await pushNotificationService.getUserDevices(userId);

    res.json({
      success: true,
      devices: devices.map((d: any) => ({
        id: d.id,
        platform: d.platform,
        deviceName: d.deviceName,
        appVersion: d.appVersion,
        isActive: d.isActive,
        lastUsedAt: d.lastUsedAt,
        createdAt: d.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: error.message || 'Failed to get devices' });
  }
};

/**
 * Send test push notification
 */
export const sendTestNotification = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pushNotificationService.sendToUser(userId, {
      title: 'Test Notification',
      body: 'This is a test push notification from DOA Panel',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      result: {
        success: result.success,
        failed: result.failed,
      },
    });
  } catch (error: any) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: error.message || 'Failed to send notification' });
  }
};

/**
 * Subscribe to topic (Admin only)
 */
export const subscribeToTopic = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const count = await pushNotificationService.subscribeUserToTopic(userId, topic);

    res.json({
      success: true,
      message: `Subscribed ${count} devices to topic: ${topic}`,
      count,
    });
  } catch (error: any) {
    console.error('Subscribe to topic error:', error);
    res.status(500).json({ error: error.message || 'Failed to subscribe to topic' });
  }
};

/**
 * Unsubscribe from topic (Admin only)
 */
export const unsubscribeFromTopic = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const count = await pushNotificationService.unsubscribeUserFromTopic(userId, topic);

    res.json({
      success: true,
      message: `Unsubscribed ${count} devices from topic: ${topic}`,
      count,
    });
  } catch (error: any) {
    console.error('Unsubscribe from topic error:', error);
    res.status(500).json({ error: error.message || 'Failed to unsubscribe from topic' });
  }
};

/**
 * Send push notification to users (Admin only)
 */
export const sendPushToUsers = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userRole = req.user?.role;

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userIds, title, body, imageUrl, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const result = await pushNotificationService.sendToUsers(userIds, {
      title,
      body,
      imageUrl,
      data,
    });

    res.json({
      success: true,
      message: 'Push notifications sent',
      result: {
        success: result.success,
        failed: result.failed,
      },
    });
  } catch (error: any) {
    console.error('Send push to users error:', error);
    res.status(500).json({ error: error.message || 'Failed to send notifications' });
  }
};

/**
 * Send push notification to role (Admin only)
 */
export const sendPushToRole = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userRole = req.user?.role;

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { role, title, body, imageUrl, data } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CLIENT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const result = await pushNotificationService.sendToRole(role, {
      title,
      body,
      imageUrl,
      data,
    });

    res.json({
      success: true,
      message: `Push notifications sent to ${role}`,
      result: {
        success: result.success,
        failed: result.failed,
      },
    });
  } catch (error: any) {
    console.error('Send push to role error:', error);
    res.status(500).json({ error: error.message || 'Failed to send notifications' });
  }
};
