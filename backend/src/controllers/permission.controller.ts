import { Request, Response } from 'express';
import { permissionService } from '../services/permission.service';
import { auditService } from '../services/audit.service';
import { Role } from '@prisma/client';

export class PermissionController {
  // Get all permissions
  async getAllPermissions(req: Request, res: Response) {
    try {
      const permissions = await permissionService.getAllPermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get permissions grouped by resource
  async getPermissionsByResource(req: Request, res: Response) {
    try {
      const grouped = await permissionService.getPermissionsByResource();
      res.json(grouped);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all roles with their permissions
  async getAllRoles(req: Request, res: Response) {
    try {
      const roles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CLIENT'];
      
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await permissionService.getRolePermissionsDetailed(role);
          return {
            role,
            permissionCount: permissions.length,
            permissions
          };
        })
      );

      res.json(rolesWithPermissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get permissions for specific role
  async getRolePermissions(req: Request, res: Response) {
    try {
      const { role } = req.params;

      if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CLIENT'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const permissions = await permissionService.getRolePermissionsDetailed(role as Role);
      
      res.json({
        role,
        permissionCount: permissions.length,
        permissions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Assign permission to role
  async assignPermission(req: Request, res: Response) {
    try {
      const { role } = req.params;
      const { permissionId } = req.body;

      if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CLIENT'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      if (!permissionId) {
        return res.status(400).json({ error: 'Permission ID is required' });
      }

      const rolePermission = await permissionService.assignPermissionToRole(
        role as Role,
        permissionId,
        req.user?.id
      );

      // Log the action
      await auditService.logFromRequest(req, {
        userId: req.user?.id,
        action: 'assign_permission',
        resource: 'roles',
        resourceId: role,
        changes: { permissionId }
      });

      res.json(rolePermission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Remove permission from role
  async removePermission(req: Request, res: Response) {
    try {
      const { role, permissionId } = req.params;

      if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CLIENT'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const result = await permissionService.removePermissionFromRole(
        role as Role,
        permissionId
      );

      // Log the action
      await auditService.logFromRequest(req, {
        userId: req.user?.id,
        action: 'remove_permission',
        resource: 'roles',
        resourceId: role,
        changes: { permissionId }
      });

      res.json({ 
        success: true, 
        deletedCount: result.count 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Sync role permissions (replace all)
  async syncRolePermissions(req: Request, res: Response) {
    try {
      const { role } = req.params;
      const { permissionIds } = req.body;

      if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CLIENT'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ error: 'permissionIds must be an array' });
      }

      const permissions = await permissionService.syncRolePermissions(
        role as Role,
        permissionIds,
        req.user?.id
      );

      // Log the action
      await auditService.logFromRequest(req, {
        userId: req.user?.id,
        action: 'sync_permissions',
        resource: 'roles',
        resourceId: role,
        changes: { 
          permissionCount: permissionIds.length,
          permissionIds 
        }
      });

      res.json({
        role,
        permissionCount: permissions.length,
        permissions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user's effective permissions
  async getUserPermissions(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Get user to find their role
      const { prisma } = await import('../config/database');
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const permissions = await permissionService.getRolePermissionsDetailed(user.role);
      
      res.json({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissionCount: permissions.length,
        permissions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Check if user has permission
  async checkUserPermission(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { resource, action } = req.body;

      if (!resource || !action) {
        return res.status(400).json({ 
          error: 'resource and action are required' 
        });
      }

      // Get user to find their role
      const { prisma } = await import('../config/database');
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hasPermission = await permissionService.hasPermission(
        user.role,
        resource,
        action
      );

      res.json({
        userId: user.id,
        role: user.role,
        resource,
        action,
        hasPermission
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Clear permission cache
  async clearCache(req: Request, res: Response) {
    try {
      const { role } = req.query;

      if (role && typeof role === 'string') {
        permissionService.clearRoleCache(role as Role);
      } else {
        permissionService.clearCache();
      }

      // Log the action
      await auditService.logFromRequest(req, {
        userId: req.user?.id,
        action: 'clear_cache',
        resource: 'permissions',
        changes: { role: role || 'all' }
      });

      res.json({ 
        success: true, 
        message: role ? `Cache cleared for role: ${role}` : 'All cache cleared' 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const permissionController = new PermissionController();
