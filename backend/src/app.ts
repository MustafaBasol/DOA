import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { serverConfig } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import messagesRoutes from './modules/messages/messages.routes';
import webhooksRoutes from './modules/webhooks/webhooks.routes';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import reportsRoutes from './modules/reports/reports.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import searchRoutes from './modules/search/search.routes';
import advancedSearchRoutes from './modules/search/advanced-search.routes';
import permissionRoutes from './routes/permission.routes';
import auditRoutes from './routes/audit.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import deviceRoutes from './routes/device.routes';
import messageTemplateRoutes from './routes/message-template.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import backupRoutes from './routes/backup.routes';

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = serverConfig.frontendUrl.split(',').map(url => url.trim());
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Swagger documentation
setupSwagger(app);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: serverConfig.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/search-advanced', advancedSearchRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/templates', messageTemplateRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/backup', backupRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
