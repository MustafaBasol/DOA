import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '../config';

export const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});
