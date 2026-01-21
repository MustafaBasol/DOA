import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).required(),
  companyName: Joi.string().optional(),
  phone: Joi.string().optional(),
  whatsappNumber: Joi.string().optional(),
  language: Joi.string().valid('TR', 'EN', 'FR').default('TR'),
});

export const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).optional(),
  companyName: Joi.string().optional(),
  phone: Joi.string().optional(),
  whatsappNumber: Joi.string().optional(),
  language: Joi.string().valid('TR', 'EN', 'FR').optional(),
  isActive: Joi.boolean().optional(),
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).optional(),
  companyName: Joi.string().optional(),
  phone: Joi.string().optional(),
  language: Joi.string().valid('TR', 'EN', 'FR').optional(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});
