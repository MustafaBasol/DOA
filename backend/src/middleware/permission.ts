import { Request, Response, NextFunction } from 'express';
import { permissionService } from '../services/permission.service';
import { AppError } from './errorHandler';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CLIENT';


// Check if user has specific permission
export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, ___res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError(401, 'Authentication required');
      }

      // SUPER_ADMIN has all permissions
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      const hasPermission = await permissionService.hasPermission(
        user.role as Role,
        resource,
        action
      );

      if (!hasPermission) {
        throw new AppError(
          403,
          `Permission denied: ${resource}:${action}`
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
  return async (req: Request, __res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError(401, 'Authentication required');
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
        user.role as Role,
        checks
      );

      if (!hasAnyPermission) {
        throw new AppError(
          403,
          'Permission denied: insufficient privileges'
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
  return async (req: Request, __res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError(401, 'Authentication required');
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
        user.role as Role,
        checks
      );

      if (!hasAllPermissions) {
        throw new AppError(
          403,
          'Permission denied: insufficient privileges'
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
  return (req: Request, __res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError(401, 'Authentication required');
      }

      if (!roles.includes(user.role as Role)) {
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
