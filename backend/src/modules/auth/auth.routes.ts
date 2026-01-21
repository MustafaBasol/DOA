import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();
const authController = new AuthController();

router.post('/login', authLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/logout', authenticate, (req, res, next) =>
  authController.logout(req, res, next)
);

router.post('/refresh', validate(refreshTokenSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);

export default router;
