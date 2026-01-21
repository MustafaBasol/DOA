import Joi from 'joi';

/**
 * Validation schemas for subscription endpoints
 */

export const createSubscriptionSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  planName: Joi.string().min(2).max(100).required(),
  planPrice: Joi.number().positive().required(),
  billingCycle: Joi.string().valid('MONTHLY', 'QUARTERLY', 'YEARLY').required(),
  maxMessages: Joi.number().integer().positive().allow(null).optional(),
  maxUsers: Joi.number().integer().positive().allow(null).optional(),
  features: Joi.array().items(Joi.string()).optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  autoRenew: Joi.boolean().default(true),
});

export const updateSubscriptionSchema = Joi.object({
  planName: Joi.string().min(2).max(100).optional(),
  planPrice: Joi.number().positive().optional(),
  billingCycle: Joi.string().valid('MONTHLY', 'QUARTERLY', 'YEARLY').optional(),
  maxMessages: Joi.number().integer().positive().allow(null).optional(),
  maxUsers: Joi.number().integer().positive().allow(null).optional(),
  features: Joi.array().items(Joi.string()).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  autoRenew: Joi.boolean().optional(),
  status: Joi.string().valid('ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED').optional(),
}).min(1);

export const querySubscriptionsSchema = Joi.object({
  userId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
