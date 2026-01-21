import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';

// Middleware to automatically log actions
export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = function (data: any) {
      // Log after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = req.params.id || data?.id;
        
        auditService.logFromRequest(req, {
          userId: req.user?.id,
          action,
          resource,
          resourceId,
          changes: {
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query
          }
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

// Middleware to log data changes (before/after)
export const auditChanges = (resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const beforeData = req.body._before; // Expected to be set by controller

    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = req.params.id || data?.id;
        
        auditService.logFromRequest(req, {
          userId: req.user?.id,
          action: `${resource}.${req.method.toLowerCase()}`,
          resource,
          resourceId,
          changes: {
            before: beforeData,
            after: data,
            method: req.method,
            path: req.path
          }
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
};
