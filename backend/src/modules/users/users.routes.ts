import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './users.validation';

const router = Router();
const usersController = new UsersController();

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createUserSchema),
  (req, res, next) => usersController.createUser(req, res, next)
);

router.get('/', authenticate, authorize('ADMIN'), (req, res, next) =>
  usersController.getUsers(req, res, next)
);

router.get('/:id', authenticate, authorize('ADMIN'), (req, res, next) =>
  usersController.getUserById(req, res, next)
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateUserSchema),
  (req, res, next) => usersController.updateUser(req, res, next)
);

router.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) =>
  usersController.deleteUser(req, res, next)
);

// Profile routes (both admin and client)
router.get('/profile/me', authenticate, (req, res, next) =>
  usersController.getProfile(req, res, next)
);

router.patch(
  '/profile/me',
  authenticate,
  validate(updateProfileSchema),
  (req, res, next) => usersController.updateProfile(req, res, next)
);

router.patch(
  '/profile/password',
  authenticate,
  validate(changePasswordSchema),
  (req, res, next) => usersController.changePassword(req, res, next)
);

export default router;
