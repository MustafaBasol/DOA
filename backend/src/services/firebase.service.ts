import * as admin from 'firebase-admin';

export class FirebaseService {
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initialize() {
    try {
      // Check if service account credentials are provided
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      
      if (!serviceAccount) {
        console.warn('⚠️ Firebase service account not configured. Push notifications disabled.');
        return;
      }

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccount)),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      this.initialized = false;
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendPushNotification(
    token: string,
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping push notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent:', response);
      return true;
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticastNotification(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping multicast notification');
      return { successCount: 0, failureCount: tokens.length };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(
        `✅ Multicast sent: ${response.successCount} success, ${response.failureCount} failed`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('❌ Failed to send multicast notification:', error);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendTopicNotification(
    topic: string,
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping topic notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: data || {},
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Topic notification sent:', response);
      return true;
    } catch (error) {
      console.error('❌ Failed to send topic notification:', error);
      return false;
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<number> {
    if (!this.initialized) {
      return 0;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`✅ ${response.successCount} devices subscribed to ${topic}`);
      return response.successCount;
    } catch (error) {
      console.error('❌ Failed to subscribe to topic:', error);
      return 0;
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<number> {
    if (!this.initialized) {
      return 0;
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`✅ ${response.successCount} devices unsubscribed from ${topic}`);
      return response.successCount;
    } catch (error) {
      console.error('❌ Failed to unsubscribe from topic:', error);
      return 0;
    }
  }

  /**
   * Validate FCM token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      await admin.messaging().send({ token }, true); // dry run
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return false;
      }
      return false;
    }
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const firebaseService = new FirebaseService();
