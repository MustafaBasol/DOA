import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { serverConfig } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: serverConfig.frontendUrl,
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(generalLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: serverConfig.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
