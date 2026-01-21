import Joi from 'joi';

/**
 * Validation schemas for payment endpoints
 */

export const createPaymentSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  subscriptionId: Joi.number().integer().positive().optional(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().default('TRY'),
  paymentMethod: Joi.string().valid('CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'OTHER').required(),
  transactionId: Joi.string().max(255).optional(),
  description: Joi.string().max(500).optional(),
  metadata: Joi.object().optional(),
});

export const updatePaymentSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED').optional(),
  transactionId: Joi.string().max(255).optional(),
  description: Joi.string().max(500).optional(),
  metadata: Joi.object().optional(),
}).min(1);

export const queryPaymentsSchema = Joi.object({
  userId: Joi.number().integer().positive().optional(),
  subscriptionId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED').optional(),
  paymentMethod: Joi.string().valid('CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'OTHER').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
