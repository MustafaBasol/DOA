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

/**
 * @swagger
 * /api/devices/register:
 *   post:
 *     tags: [Devices]
 *     summary: Register device for push notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - platform
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM device token
 *               platform:
 *                 type: string
 *                 enum: [IOS, ANDROID, WEB]
 *               deviceName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device registered successfully
 */
router.post('/register', authenticate, registerDevice);

/**
 * @swagger
 * /api/devices/unregister:
 *   post:
 *     tags: [Devices]
 *     summary: Unregister device
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device unregistered
 */
router.post('/unregister', authenticate, unregisterDevice);

/**
 * @swagger
 * /api/devices/my-devices:
 *   get:
 *     tags: [Devices]
 *     summary: Get current user's devices
 *     responses:
 *       200:
 *         description: List of user devices
 */
router.get('/my-devices', authenticate, getUserDevices);

/**
 * @swagger
 * /api/devices/test-notification:
 *   post:
 *     tags: [Devices]
 *     summary: Send test notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.post('/test-notification', authenticate, sendTestNotification);

/**
 * @swagger
 * /api/devices/subscribe-topic:
 *   post:
 *     tags: [Devices]
 *     summary: Subscribe device to topic
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokens
 *               - topic
 *             properties:
 *               tokens:
 *                 type: array
 *                 items:
 *                   type: string
 *               topic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscribed to topic
 */
router.post('/subscribe-topic', authenticate, subscribeToTopic);

/**
 * @swagger
 * /api/devices/unsubscribe-topic:
 *   post:
 *     tags: [Devices]
 *     summary: Unsubscribe device from topic
 *     responses:
 *       200:
 *         description: Unsubscribed from topic
 */
router.post('/unsubscribe-topic', authenticate, unsubscribeFromTopic);

/**
 * @swagger
 * /api/devices/send-to-users:
 *   post:
 *     tags: [Devices]
 *     summary: Send push notification to specific users (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - title
 *               - body
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Notifications sent
 */
router.post('/send-to-users', authenticate, sendPushToUsers);

/**
 * @swagger
 * /api/devices/send-to-role:
 *   post:
 *     tags: [Devices]
 *     summary: Send push notification to role (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - title
 *               - body
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, MANAGER, CLIENT]
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications sent
 */
router.post('/send-to-role', authenticate, sendPushToRole);

export default router;
