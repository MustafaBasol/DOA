import { Router } from 'express';
import { PaymentController } from './payments.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createPaymentSchema,
  updatePaymentSchema,
  queryPaymentsSchema,
} from './payments.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get payment statistics
router.get('/stats', PaymentController.getStats);

// Get payment summary for a user
router.get('/user/:userId/summary', PaymentController.getUserPaymentSummary);

// Get payments with filtering
router.get(
  '/',
  validate(queryPaymentsSchema, 'query'),
  PaymentController.getPayments
);

// Get payment by ID
router.get('/:id', PaymentController.getPaymentById);

// Create payment (admin only)
router.post(
  '/',
  validate(createPaymentSchema),
  PaymentController.createPayment
);

// Update payment (admin only)
router.patch(
  '/:id',
  validate(updatePaymentSchema),
  PaymentController.updatePayment
);

// Delete payment (admin only)
router.delete('/:id', PaymentController.deletePayment);

export default router;
