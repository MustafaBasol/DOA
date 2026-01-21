import { prisma } from '../config/database';
import { Role } from '@prisma/client';

interface PermissionCheck {
  resource: string;
  action: string;
}

class PermissionService {
  private permissionCache = new Map<string, Set<string>>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Get all permissions for a role
  async getRolePermissions(role: Role): Promise<string[]> {
    const cacheKey = `role:${role}`;
    const now = Date.now();

    // Check cache
    if (this.permissionCache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && expiry > now) {
        return Array.from(this.permissionCache.get(cacheKey)!);
      }
    }

    // Fetch from database
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role },
      include: {
        permission: true
      }
    });

    const permissions = rolePermissions.map(
      rp => `${rp.permission.resource}:${rp.permission.action}`
    );

    // Update cache
    this.permissionCache.set(cacheKey, new Set(permissions));
    this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

    return permissions;
  }

  // Check if role has specific permission
  async hasPermission(role: Role, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    const permissionKey = `${resource}:${action}`;
    return permissions.includes(permissionKey);
  }

  // Check multiple permissions (OR logic)
  async hasAnyPermission(role: Role, checks: PermissionCheck[]): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    return checks.some(check => 
      permissions.includes(`${check.resource}:${check.action}`)
    );
  }

  // Check multiple permissions (AND logic)
  async hasAllPermissions(role: Role, checks: PermissionCheck[]): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    return checks.every(check => 
      permissions.includes(`${check.resource}:${check.action}`)
    );
  }

  // Get all permissions with details
  async getAllPermissions() {
    return prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });
  }

  // Get permissions grouped by resource
  async getPermissionsByResource() {
    const permissions = await this.getAllPermissions();
    
    const grouped: Record<string, typeof permissions> = {};
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });

    return grouped;
  }

  // Get role permissions with details
  async getRolePermissionsDetailed(role: Role) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role },
      include: {
        permission: true
      },
      orderBy: {
        permission: {
          resource: 'asc'
        }
      }
    });

    return rolePermissions.map(rp => ({
      id: rp.id,
      resource: rp.permission.resource,
      action: rp.permission.action,
      description: rp.permission.description,
      grantedAt: rp.createdAt
    }));
  }

  // Assign permission to role
  async assignPermissionToRole(role: Role, permissionId: string, grantedById?: string) {
    return prisma.rolePermission.create({
      data: {
        role,
        permissionId,
        grantedById
      }
    });
  }

  // Remove permission from role
  async removePermissionFromRole(role: Role, permissionId: string) {
    const deleted = await prisma.rolePermission.deleteMany({
      where: {
        role,
        permissionId
      }
    });

    // Clear cache for this role
    this.permissionCache.delete(`role:${role}`);
    this.cacheExpiry.delete(`role:${role}`);

    return deleted;
  }

  // Sync role permissions (replace all)
  async syncRolePermissions(role: Role, permissionIds: string[], grantedById?: string) {
    // Delete all existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { role }
    });

    // Create new permissions
    await prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({
        role,
        permissionId,
        grantedById
      }))
    });

    // Clear cache
    this.permissionCache.delete(`role:${role}`);
    this.cacheExpiry.delete(`role:${role}`);

    return this.getRolePermissionsDetailed(role);
  }

  // Clear all permission cache
  clearCache() {
    this.permissionCache.clear();
    this.cacheExpiry.clear();
  }

  // Clear cache for specific role
  clearRoleCache(role: Role) {
    this.permissionCache.delete(`role:${role}`);
    this.cacheExpiry.delete(`role:${role}`);
  }
}

export const permissionService = new PermissionService();
