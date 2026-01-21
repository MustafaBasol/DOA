import { prismaMock } from '../setup';

// Import the service instance directly
const { auditService } = require('../../src/services/audit.service');

describe('AuditService', () => {
  let service = auditService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('log', () => {
    it('should create audit log entry with all fields', async () => {
      const auditData = {
        userId: 'user-123',
        action: 'CREATE',
        resource: 'messages',
        resourceId: 'msg-456',
        changes: { status: 'sent' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const mockCreatedLog = {
        id: 'log-1',
        ...auditData,
        createdAt: new Date()
      };

      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue(mockCreatedLog);

      const result = await service.log(auditData);

      expect(result).toEqual(mockCreatedLog);
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: auditData
      });
    });

    it('should create audit log with minimal required fields', async () => {
      const auditData = {
        action: 'READ',
        resource: 'users'
      };

      const mockCreatedLog = {
        id: 'log-2',
        userId: undefined,
        action: 'READ',
        resource: 'users',
        resourceId: undefined,
        changes: {},
        ipAddress: undefined,
        userAgent: undefined,
        createdAt: new Date()
      };

      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue(mockCreatedLog);

      const result = await service.log(auditData);

      expect(result).toEqual(mockCreatedLog);
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          ...auditData,
          changes: {}
        }
      });
    });

    it('should default changes to empty object if not provided', async () => {
      const auditData = {
        userId: 'user-123',
        action: 'UPDATE',
        resource: 'profile'
      };

      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-3' });

      await service.log(auditData);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: {}
        })
      });
    });

    it('should not throw error on database failure', async () => {
      const auditData = {
        action: 'DELETE',
        resource: 'users',
        resourceId: 'user-789'
      };

      (prismaMock.auditLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(service.log(auditData)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Audit log error:', expect.any(Error));
    });

    it('should handle complex changes object', async () => {
      const complexChanges = {
        before: { status: 'pending', amount: 100 },
        after: { status: 'completed', amount: 150 },
        metadata: { updatedBy: 'admin' }
      };

      const auditData = {
        userId: 'user-123',
        action: 'UPDATE',
        resource: 'payments',
        resourceId: 'pay-456',
        changes: complexChanges
      };

      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-4' });

      await service.log(auditData);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: complexChanges
        })
      });
    });
  });

  describe('logFromRequest', () => {
    it('should extract IP and user agent from request', async () => {
      const mockReq: any = {
        ip: '10.0.0.1',
        get: jest.fn().mockReturnValue('Chrome/90.0'),
        socket: {}
      };

      const auditData = {
        userId: 'user-123',
        action: 'LOGIN',
        resource: 'auth'
      };

      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-5' });

      await service.logFromRequest(mockReq, auditData);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          ...auditData,
          changes: {},
          ipAddress: '10.0.0.1',
          userAgent: 'Chrome/90.0'
        }
      });
      expect(mockReq.get).toHaveBeenCalledWith('user-agent');
    });

    it('should fallback to socket remoteAddress if req.ip not available', async () => {
      const mockReq: any = {
        ip: undefined,
        socket: { remoteAddress: '192.168.1.100' },
        get: jest.fn().mockReturnValue('Firefox/88.0')
      };

      const auditData = {
        action: 'LOGOUT',
        resource: 'auth'
      };

      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-6' });

      await service.logFromRequest(mockReq, auditData);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '192.168.1.100'
        })
      });
    });

    it('should handle missing user agent', async () => {
      const mockReq: any = {
        ip: '172.16.0.1',
        get: jest.fn().mockReturnValue(undefined),
        socket: {}
      };

      const auditData = {
        action: 'VIEW',
        resource: 'dashboard'
      };

      (prismaMock.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-7' });

      await service.logFromRequest(mockReq, auditData);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userAgent: undefined
        })
      });
    });
  });

  describe('getLogs', () => {
    it('should fetch logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-123',
          action: 'CREATE',
          resource: 'messages',
          createdAt: new Date(),
          user: { id: 'user-123', email: 'test@example.com', fullName: 'Test User', role: 'ADMIN' }
        }
      ];

      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(25);

      const result = await service.getLogs({ page: 2, limit: 10 });

      expect(result.data).toEqual(mockLogs);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10
      });
    });

    it('should filter logs by userId', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({ userId: 'user-456' });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-456' }
        })
      );
    });

    it('should filter logs by action (case insensitive)', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({ action: 'create' });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { action: { contains: 'create', mode: 'insensitive' } }
        })
      );
    });

    it('should filter logs by resource', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({ resource: 'payments' });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resource: 'payments' }
        })
      );
    });

    it('should filter logs by resourceId', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({ resourceId: 'res-789' });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resourceId: 'res-789' }
        })
      );
    });

    it('should filter logs by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({ startDate, endDate });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      );
    });

    it('should filter logs with only startDate', async () => {
      const startDate = new Date('2024-01-01');

      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({ startDate });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: { gte: startDate }
          }
        })
      );
    });

    it('should filter logs with only endDate', async () => {
      const endDate = new Date('2024-01-31');

      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({ endDate });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: { lte: endDate }
          }
        })
      );
    });

    it('should combine multiple filters', async () => {
      const filters = {
        userId: 'user-123',
        action: 'UPDATE',
        resource: 'messages',
        startDate: new Date('2024-01-01'),
        page: 1,
        limit: 20
      };

      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs(filters);

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-123',
            action: { contains: 'UPDATE', mode: 'insensitive' },
            resource: 'messages',
            createdAt: { gte: filters.startDate }
          }
        })
      );
    });

    it('should use default pagination values', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({});

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50
        })
      );
    });

    it('should calculate correct totalPages', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(47);

      const result = await service.getLogs({ limit: 10 });

      expect(result.totalPages).toBe(5); // Math.ceil(47/10)
    });

    it('should order logs by createdAt descending', async () => {
      (prismaMock.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.auditLog.count as jest.Mock).mockResolvedValue(0);

      await service.getLogs({});

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      );
    });
  });
});
