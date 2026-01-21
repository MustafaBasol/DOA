// Unit tests for Permission Service
import { PermissionService } from '../../src/services/permission.service';
import { prisma } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  prisma: {
    permission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    permissionService = new PermissionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPermissionsByRole', () => {
    it('should return permissions for a specific role', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          role: 'ADMIN',
          resource: 'users',
          action: 'create',
          granted: true,
          description: 'Create users',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'perm-2',
          role: 'ADMIN',
          resource: 'users',
          action: 'read',
          granted: true,
          description: 'View users',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.permission.findMany as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.getPermissionsByRole('ADMIN');

      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: { role: 'ADMIN' },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
      expect(result).toEqual(mockPermissions);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no permissions found', async () => {
      (prisma.permission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await permissionService.getPermissionsByRole('CLIENT');

      expect(result).toEqual([]);
    });
  });

  describe('checkPermission', () => {
    it('should return true if permission is granted', async () => {
      const mockPermission = {
        id: 'perm-1',
        role: 'ADMIN',
        resource: 'users',
        action: 'create',
        granted: true,
        description: 'Create users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.permission.findFirst as jest.Mock).mockResolvedValue(mockPermission);

      const result = await permissionService.checkPermission('ADMIN', 'users', 'create');

      expect(prisma.permission.findFirst).toHaveBeenCalledWith({
        where: {
          role: 'ADMIN',
          resource: 'users',
          action: 'create',
          granted: true,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if permission is not granted', async () => {
      (prisma.permission.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await permissionService.checkPermission('CLIENT', 'users', 'delete');

      expect(result).toBe(false);
    });

    it('should always return true for SUPER_ADMIN', async () => {
      const result = await permissionService.checkPermission('SUPER_ADMIN', 'users', 'delete');

      expect(prisma.permission.findFirst).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('updatePermission', () => {
    it('should update permission successfully', async () => {
      const permissionId = 'perm-1';
      const updateData = { granted: false };

      const updatedPermission = {
        id: permissionId,
        role: 'ADMIN',
        resource: 'users',
        action: 'delete',
        granted: false,
        description: 'Delete users',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.permission.update as jest.Mock).mockResolvedValue(updatedPermission);

      const result = await permissionService.updatePermission(permissionId, updateData);

      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: permissionId },
        data: updateData,
      });
      expect(result.granted).toBe(false);
    });

    it('should throw error if permission not found', async () => {
      (prisma.permission.update as jest.Mock).mockRejectedValue(
        new Error('Permission not found')
      );

      await expect(
        permissionService.updatePermission('invalid-id', { granted: false })
      ).rejects.toThrow();
    });
  });

  describe('createPermission', () => {
    it('should create new permission successfully', async () => {
      const newPermission = {
        role: 'MANAGER' as const,
        resource: 'reports',
        action: 'export',
        granted: true,
        description: 'Export reports',
      };

      const createdPermission = {
        id: 'new-perm-id',
        ...newPermission,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.permission.create as jest.Mock).mockResolvedValue(createdPermission);

      const result = await permissionService.createPermission(newPermission);

      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: newPermission,
      });
      expect(result.id).toBe('new-perm-id');
    });
  });

  describe('deletePermission', () => {
    it('should delete permission successfully', async () => {
      const permissionId = 'perm-to-delete';

      (prisma.permission.delete as jest.Mock).mockResolvedValue({
        id: permissionId,
      });

      await permissionService.deletePermission(permissionId);

      expect(prisma.permission.delete).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
    });

    it('should throw error if permission not found', async () => {
      (prisma.permission.delete as jest.Mock).mockRejectedValue(
        new Error('Permission not found')
      );

      await expect(permissionService.deletePermission('invalid-id')).rejects.toThrow();
    });
  });

  describe('getPermissionMatrix', () => {
    it('should return grouped permissions by resource', async () => {
      const mockPermissions = [
        {
          id: 'perm-1',
          role: 'ADMIN',
          resource: 'users',
          action: 'create',
          granted: true,
          description: 'Create users',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'perm-2',
          role: 'ADMIN',
          resource: 'users',
          action: 'read',
          granted: true,
          description: 'View users',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'perm-3',
          role: 'ADMIN',
          resource: 'payments',
          action: 'create',
          granted: false,
          description: 'Create payments',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.permission.findMany as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await permissionService.getPermissionMatrix('ADMIN');

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('payments');
      expect(result.users.length).toBe(2);
      expect(result.payments.length).toBe(1);
    });
  });
});
