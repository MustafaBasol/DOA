import Joi from 'joi';

export const createMessageSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  n8nMessageId: Joi.string().optional(),
  direction: Joi.string().valid('INBOUND', 'OUTBOUND').required(),
  fromNumber: Joi.string().required(),
  toNumber: Joi.string().required(),
  customerName: Joi.string().optional(),
  customerPhone: Joi.string().required(),
  messageContent: Joi.string().optional(),
  messageType: Joi.string().default('text'),
  mediaUrl: Joi.string().uri().optional(),
  timestamp: Joi.date().required(),
});

export const updateMessageSchema = Joi.object({
  readStatus: Joi.boolean().optional(),
});

export const messageQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  userId: Joi.string().uuid().optional(),
  customerPhone: Joi.string().optional(),
  readStatus: Joi.boolean().optional(),
  direction: Joi.string().valid('INBOUND', 'OUTBOUND').optional(),
  search: Joi.string().optional(),
});
