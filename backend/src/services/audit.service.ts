import { prisma } from '../config/database';
import { Request } from 'express';

interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  // Create audit log entry
  async log(data: AuditLogData) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          changes: data.changes || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw error, just log it
      // We don't want audit failures to break the main flow
    }
  }

  // Log from Express request
  async logFromRequest(req: Request, data: Omit<AuditLogData, 'ipAddress' | 'userAgent'>) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    return this.log({
      ...data,
      ipAddress,
      userAgent
    });
  }

  // Get audit logs with filters
  async getLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get user activity
  async getUserActivity(userId: string, limit = 20) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // Get resource history
  async getResourceHistory(resource: string, resourceId: string) {
    return prisma.auditLog.findMany({
      where: {
        resource,
        resourceId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get activity statistics
  async getActivityStats(startDate: Date, endDate: Date) {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        action: true,
        resource: true,
        userId: true
      }
    });

    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    return {
      totalActions: logs.length,
      actionBreakdown: actionCounts,
      resourceBreakdown: resourceCounts,
      activeUsers: Object.keys(userCounts).length,
      topUsers: Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count }))
    };
  }

  // Clean old logs (data retention)
  async cleanOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    return deleted.count;
  }
}

export const auditService = new AuditService();
