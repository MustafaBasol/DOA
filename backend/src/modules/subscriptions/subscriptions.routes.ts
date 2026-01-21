import { Router } from 'express';
import { SubscriptionController } from './subscriptions.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  querySubscriptionsSchema,
} from './subscriptions.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get subscription statistics
router.get('/stats', SubscriptionController.getStats);

// Get active subscription for a user
router.get('/user/:userId/active', SubscriptionController.getActiveSubscription);

// Get subscriptions with filtering
router.get(
  '/',
  validate(querySubscriptionsSchema, 'query'),
  SubscriptionController.getSubscriptions
);

// Get subscription by ID
router.get('/:id', SubscriptionController.getSubscriptionById);

// Create subscription (admin only)
router.post(
  '/',
  validate(createSubscriptionSchema),
  SubscriptionController.createSubscription
);

// Update subscription (admin only)
router.patch(
  '/:id',
  validate(updateSubscriptionSchema),
  SubscriptionController.updateSubscription
);

// Cancel subscription
router.post('/:id/cancel', SubscriptionController.cancelSubscription);

// Delete subscription (admin only)
router.delete('/:id', SubscriptionController.deleteSubscription);

export default router;
