import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { permissionService } from '../services/permission.service';
import { AppError } from './errorHandler';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

// Check if user has specific permission
export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError('Authentication required', 401);
      }

      // SUPER_ADMIN has all permissions
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      const hasPermission = await permissionService.hasPermission(
        user.role,
        resource,
        action
      );

      if (!hasPermission) {
        throw new AppError(
          `Permission denied: ${resource}:${action}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has ANY of the specified permissions (OR logic)
export const checkAnyPermission = (...permissions: Array<[string, string]>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError('Authentication required', 401);
      }

      // SUPER_ADMIN has all permissions
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      const checks = permissions.map(([resource, action]) => ({
        resource,
        action
      }));

      const hasAnyPermission = await permissionService.hasAnyPermission(
        user.role,
        checks
      );

      if (!hasAnyPermission) {
        throw new AppError(
          'Permission denied: insufficient privileges',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has ALL of the specified permissions (AND logic)
export const checkAllPermissions = (...permissions: Array<[string, string]>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError('Authentication required', 401);
      }

      // SUPER_ADMIN has all permissions
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      const checks = permissions.map(([resource, action]) => ({
        resource,
        action
      }));

      const hasAllPermissions = await permissionService.hasAllPermissions(
        user.role,
        checks
      );

      if (!hasAllPermissions) {
        throw new AppError(
          'Permission denied: insufficient privileges',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has specific role
export const checkRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError('Authentication required', 401);
      }

      if (!roles.includes(user.role)) {
        throw new AppError(
          `Access denied: requires one of ${roles.join(', ')} role`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is admin or super admin
export const requireAdmin = checkRole('ADMIN', 'SUPER_ADMIN');

// Check if user is manager or above
export const requireManager = checkRole('MANAGER', 'ADMIN', 'SUPER_ADMIN');
