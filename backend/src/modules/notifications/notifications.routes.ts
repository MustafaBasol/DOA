import { Router } from 'express';
import { notificationController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get current user's notifications
 * @access  Private
 * @query   page, limit, unreadOnly
 */
router.get('/', notificationController.getMyNotifications.bind(notificationController));

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get('/preferences', notificationController.getPreferences.bind(notificationController));

/**
 * @route   PATCH /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 * @body    { email: boolean, push: boolean, inApp: boolean }
 */
router.patch('/preferences', notificationController.updatePreferences.bind(notificationController));

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification
 * @access  Private
 */
router.post('/test', notificationController.sendTestNotification.bind(notificationController));

export default router;
