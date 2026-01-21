import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permission';

const router = Router();

// All routes require authentication and audit read permission
router.use(authMiddleware);

// Get audit logs with filters
router.get(
  '/',
  checkPermission('audit', 'read'),
  auditController.getAuditLogs.bind(auditController)
);

// Get user activity
router.get(
  '/users/:userId',
  checkPermission('audit', 'read'),
  auditController.getUserActivity.bind(auditController)
);

// Get resource history
router.get(
  '/resources/:resource/:resourceId',
  checkPermission('audit', 'read'),
  auditController.getResourceHistory.bind(auditController)
);

// Get activity statistics
router.get(
  '/stats',
  checkPermission('audit', 'read'),
  auditController.getActivityStats.bind(auditController)
);

// Clean old logs (admin only)
router.post(
  '/clean',
  checkPermission('audit', 'delete'),
  auditController.cleanOldLogs.bind(auditController)
);

export default router;
