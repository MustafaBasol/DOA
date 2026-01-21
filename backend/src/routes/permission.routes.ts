import { Router } from 'express';
import { permissionController } from '../controllers/permission.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission, requireAdmin } from '../middleware/permission';

const router = Router();

// All routes require authentication and role management permission
router.use(authenticate);

// Get all permissions
router.get(
  '/permissions',
  checkPermission('roles', 'read'),
  permissionController.getAllPermissions.bind(permissionController)
);

// Get permissions grouped by resource
router.get(
  '/permissions/by-resource',
  checkPermission('roles', 'read'),
  permissionController.getPermissionsByResource.bind(permissionController)
);

// Get all roles with their permissions
router.get(
  '/roles',
  checkPermission('roles', 'read'),
  permissionController.getAllRoles.bind(permissionController)
);

// Get permissions for specific role
router.get(
  '/roles/:role/permissions',
  checkPermission('roles', 'read'),
  permissionController.getRolePermissions.bind(permissionController)
);

// Assign permission to role
router.post(
  '/roles/:role/permissions',
  checkPermission('roles', 'assign'),
  permissionController.assignPermission.bind(permissionController)
);

// Remove permission from role
router.delete(
  '/roles/:role/permissions/:permissionId',
  checkPermission('roles', 'assign'),
  permissionController.removePermission.bind(permissionController)
);

// Sync role permissions (replace all)
router.put(
  '/roles/:role/permissions',
  checkPermission('roles', 'assign'),
  permissionController.syncRolePermissions.bind(permissionController)
);

// Get user's effective permissions
router.get(
  '/users/:userId/permissions',
  checkPermission('users', 'read'),
  permissionController.getUserPermissions.bind(permissionController)
);

// Check if user has permission
router.post(
  '/users/:userId/check-permission',
  checkPermission('users', 'read'),
  permissionController.checkUserPermission.bind(permissionController)
);

// Clear permission cache (admin only)
router.post(
  '/cache/clear',
  requireAdmin,
  permissionController.clearCache.bind(permissionController)
);

export default router;
