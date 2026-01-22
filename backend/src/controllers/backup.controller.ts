import { Request, Response, NextFunction } from 'express';
import { backupService } from '../services/backup.service';

/**
 * Create a new backup
 */
export const createBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tables } = req.body;

    let backup;
    if (tables && Array.isArray(tables) && tables.length > 0) {
      // Backup specific tables
      backup = await backupService.createTableBackup(tables, 'manual');
    } else {
      // Full backup
      backup = await backupService.createBackup('manual');
    }

    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      data: backup,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all backups
 */
export const listBackups = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const backups = await backupService.listBackups();

    res.json({
      success: true,
      count: backups.length,
      data: backups,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get backup statistics
 */
export const getBackupStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await backupService.getBackupStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore from backup
 */
export const restoreBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { backupId } = req.params;

    if (!backupId) {
      res.status(400).json({ error: 'Backup ID is required' });
      return;
    }

    // ⚠️ DANGEROUS OPERATION - Drops and recreates database
    await backupService.restoreBackup(backupId);

    res.json({
      success: true,
      message: 'Database restored successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a backup
 */
export const deleteBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { backupId } = req.params;

    if (!backupId) {
      res.status(400).json({ error: 'Backup ID is required' });
      return;
    }

    await backupService.deleteBackup(backupId);

    res.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clean old backups
 */
export const cleanOldBackups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { keepLast } = req.query;
    const keep = keepLast ? parseInt(keepLast as string, 10) : 7;

    const deletedCount = await backupService.cleanOldBackups(keep);

    res.json({
      success: true,
      message: `Cleaned ${deletedCount} old backups`,
      data: { deletedCount, keptLast: keep },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Health check
 */
export const backupHealthCheck = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const health = await backupService.healthCheck();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};
