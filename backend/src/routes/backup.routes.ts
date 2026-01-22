import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permission';
import {
  createBackup,
  listBackups,
  getBackupStats,
  restoreBackup,
  deleteBackup,
  cleanOldBackups,
  backupHealthCheck,
} from '../controllers/backup.controller';

const router = Router();

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(checkPermission('backup', 'manage')); // Only super admins

/**
 * @swagger
 * /api/backup/health:
 *   get:
 *     tags: [Backup]
 *     summary: Check backup system health
 *     description: Verify pg_dump is available
 *     responses:
 *       200:
 *         description: Health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                     version:
 *                       type: string
 */
router.get('/health', backupHealthCheck);

/**
 * @swagger
 * /api/backup:
 *   post:
 *     tags: [Backup]
 *     summary: Create a new backup
 *     description: Create full database backup or backup specific tables
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of table names to backup
 *           examples:
 *             full:
 *               summary: Full backup
 *               value: {}
 *             tables:
 *               summary: Specific tables
 *               value:
 *                 tables: ["User", "WhatsappMessage"]
 *     responses:
 *       201:
 *         description: Backup created
 *       500:
 *         description: Backup failed
 */
router.post('/', createBackup);

/**
 * @swagger
 * /api/backup:
 *   get:
 *     tags: [Backup]
 *     summary: List all backups
 *     responses:
 *       200:
 *         description: List of backups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                         enum: [manual, automatic]
 *                       status:
 *                         type: string
 *                         enum: [completed, failed, in_progress]
 */
router.get('/', listBackups);

/**
 * @swagger
 * /api/backup/stats:
 *   get:
 *     tags: [Backup]
 *     summary: Get backup statistics
 *     responses:
 *       200:
 *         description: Backup statistics
 */
router.get('/stats', getBackupStats);

/**
 * @swagger
 * /api/backup/{backupId}/restore:
 *   post:
 *     tags: [Backup]
 *     summary: Restore from backup
 *     description: ⚠️ DANGEROUS - Drops existing database and restores from backup
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Database restored
 *       400:
 *         description: Invalid backup ID
 *       500:
 *         description: Restore failed
 */
router.post('/:backupId/restore', restoreBackup);

/**
 * @swagger
 * /api/backup/{backupId}:
 *   delete:
 *     tags: [Backup]
 *     summary: Delete a backup
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup deleted
 *       404:
 *         description: Backup not found
 */
router.delete('/:backupId', deleteBackup);

/**
 * @swagger
 * /api/backup/clean:
 *   post:
 *     tags: [Backup]
 *     summary: Clean old backups
 *     description: Delete old backups, keeping only the last N backups
 *     parameters:
 *       - in: query
 *         name: keepLast
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of recent backups to keep
 *     responses:
 *       200:
 *         description: Old backups cleaned
 */
router.post('/clean', cleanOldBackups);

export default router;
