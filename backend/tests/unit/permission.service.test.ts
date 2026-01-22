// Unit tests for Permission Service
import { permissionService } from '../../src/services/permission.service';
import { prisma } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  prisma: {
    rolePermission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('PermissionService', () => {
  beforeEach(() => {
    // Clear cache before each test
    permissionService.clearCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('should return true if role has permission', async () => {
      const mockRolePermissions = [
        {
          id: 'rp-1',
          role: 'ADMIN',
          permissionId: 'perm-1',
          permission: {
            id: 'perm-1',
            resource: 'users',
            action: 'create',
            description: 'Create users',
          },
        },
      ];

      (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue(mockRolePermissions);

      const result = await permissionService.hasPermission('ADMIN', 'users', 'create');

      expect(result).toBe(true);
    });

    it('should return false if role does not have permission', async () => {
      (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await permissionService.hasPermission('CLIENT', 'users', 'delete');

      expect(result).toBe(false);
    });

    it('should always return true for SUPER_ADMIN', async () => {
      const result = await permissionService.hasPermission('SUPER_ADMIN', 'users', 'delete');

      expect(result).toBe(true);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permission strings for a role', async () => {
      const mockRolePermissions = [
        {
          id: 'rp-1',
          role: 'ADMIN',
          permissionId: 'perm-1',
          permission: {
            id: 'perm-1',
            resource: 'users',
            action: 'create',
            description: 'Create users',
          },
        },
        {
          id: 'rp-2',
          role: 'ADMIN',
          permissionId: 'perm-2',
          permission: {
            id: 'perm-2',
            resource: 'users',
            action: 'read',
            description: 'Read users',
          },
        },
      ];

      (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue(mockRolePermissions);

      const result = await permissionService.getRolePermissions('ADMIN');

      expect(result).toContain('users:create');
      expect(result).toContain('users:read');
      expect(result.length).toBe(2);
    });

    it('should return empty array if no permissions found', async () => {
      (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await permissionService.getRolePermissions('CLIENT');

      expect(result).toEqual([]);
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role successfully', async () => {
      const mockRolePermission = {
        id: 'new-rp-id',
        role: 'MANAGER',
        permissionId: 'perm-1',
        grantedById: 'admin-id',
        createdAt: new Date(),
      };

      (prisma.rolePermission.create as jest.Mock).mockResolvedValue(mockRolePermission);

      const result = await permissionService.assignPermissionToRole(
        'MANAGER',
        'perm-1',
        'admin-id'
      );

      expect(result.id).toBe('new-rp-id');
      expect(prisma.rolePermission.create).toHaveBeenCalledWith({
        data: {
          role: 'MANAGER',
          permissionId: 'perm-1',
          grantedById: 'admin-id',
        },
      });
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove permission from role successfully', async () => {
      (prisma.rolePermission.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await permissionService.removePermissionFromRole('MANAGER', 'perm-1');

      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: {
          role: 'MANAGER',
          permissionId: 'perm-1',
        },
      });
    });
  });

  describe('getAllPermissions', () => {
    it('should return all available permissions', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          resource: 'users',
          action: 'create',
          description: 'Create users',
        },
        {
          id: 'perm-2',
          resource: 'users',
          action: 'read',
          description: 'Read users',
        },
      ];

      (prisma.permission.findMany as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.getAllPermissions();

      expect(result.length).toBe(2);
      expect(result[0].resource).toBe('users');
    });
  });
});
