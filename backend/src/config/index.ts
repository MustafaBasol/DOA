import { config } from 'dotenv';
config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

export const dbConfig = {
  url: process.env.DATABASE_URL || '',
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export const n8nConfig = {
  webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
  ipWhitelist: process.env.N8N_IP_WHITELIST?.split(',') || [],
};

export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'DOA WhatsApp Manager',
    email: process.env.EMAIL_FROM_EMAIL || 'noreply@autoviseo.com',
  },
};
