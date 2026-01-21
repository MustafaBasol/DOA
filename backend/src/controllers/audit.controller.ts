import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';

export class AuditController {
  // Get audit logs with filters
  async getAuditLogs(req: Request, res: Response) {
    try {
      const {
        userId,
        action,
        resource,
        resourceId,
        startDate,
        endDate,
        page,
        limit
      } = req.query;

      const filters: any = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50
      };

      if (userId) filters.userId = userId as string;
      if (action) filters.action = action as string;
      if (resource) filters.resource = resource as string;
      if (resourceId) filters.resourceId = resourceId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await auditService.getLogs(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user activity
  async getUserActivity(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const activity = await auditService.getUserActivity(
        userId,
        limit ? parseInt(limit as string) : 20
      );

      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get resource history
  async getResourceHistory(req: Request, res: Response) {
    try {
      const { resource, resourceId } = req.params;

      const history = await auditService.getResourceHistory(resource, resourceId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get activity statistics
  async getActivityStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          error: 'startDate and endDate are required'
        });
        return;
      }

      const stats = await auditService.getActivityStats(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Clean old logs
  async cleanOldLogs(req: Request, res: Response) {
    try {
      const { daysToKeep } = req.body;

      const deletedCount = await auditService.cleanOldLogs(
        daysToKeep ? parseInt(daysToKeep) : 90
      );

      // Log the cleanup action
      await auditService.logFromRequest(req, {
        userId: req.user?.id,
        action: 'clean_logs',
        resource: 'audit',
        changes: { 
          daysToKeep: daysToKeep || 90,
          deletedCount 
        }
      });

      res.json({
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} audit log entries`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const auditController = new AuditController();
