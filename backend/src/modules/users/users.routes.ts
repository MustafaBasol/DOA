import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { checkPermission } from '../../middleware/permission';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './users.validation';

const router = Router();
const usersController = new UsersController();

// Stats route
router.get('/stats', authenticate, (req, res, next) =>
  usersController.getStats(req, res, next)
);

// Admin routes
router.post(
  '/',
  authenticate,
  checkPermission('users', 'create'),
  auditLog('create_user', 'users'),
  validate(createUserSchema),
  (req, res, next) => usersController.createUser(req, res, next)
);

router.get('/', authenticate, checkPermission('users', 'list'), (req, res, next) =>
  usersController.getUsers(req, res, next)
);

router.get('/:id', authenticate, checkPermission('users', 'read'), (req, res, next) =>
  usersController.getUserById(req, res, next)
);

router.patch(
  '/:id',
  authenticate,
  checkPermission('users', 'update'),
  auditLog('update_user', 'users'),
  validate(updateUserSchema),
  (req, res, next) => usersController.updateUser(req, res, next)
);

router.delete(
  '/:id', 
  authenticate, 
  checkPermission('users', 'delete'), 
  auditLog('delete_user', 'users'),
  (req, res, next) => usersController.deleteUser(req, res, next)
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
