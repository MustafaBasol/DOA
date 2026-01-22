import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  registerDevice,
  unregisterDevice,
  getUserDevices,
  sendTestNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendPushToUsers,
  sendPushToRole,
} from '../controllers/device.controller';

const router = Router();

// Device registration (all authenticated users)
router.post('/register', authenticate, registerDevice);
router.post('/unregister', authenticate, unregisterDevice);
router.get('/my-devices', authenticate, getUserDevices);
router.post('/test-notification', authenticate, sendTestNotification);

// Topic subscription (Admin only)
router.post('/subscribe-topic', authenticate, subscribeToTopic);
router.post('/unsubscribe-topic', authenticate, unsubscribeFromTopic);

// Send push notifications (Admin only)
router.post('/send-to-users', authenticate, sendPushToUsers);
router.post('/send-to-role', authenticate, sendPushToRole);

export default router;
