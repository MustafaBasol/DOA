import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class AdvancedSearchController {
  /**
   * Create a new saved search
   * POST /api/search/saved
   */
  async createSavedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, entity, filters, isDefault } = req.body;
      const userId = req.user!.id;

      // Validate entity
      const validEntities = ['MESSAGES', 'USERS', 'PAYMENTS', 'SUBSCRIPTIONS'];
      if (!validEntities.includes(entity)) {
        throw new AppError(400, `Invalid entity. Must be one of: ${validEntities.join(', ')}`);
      }

      // If this search is set as default, unset other defaults for this entity
      if (isDefault) {
        await prisma.savedSearch.updateMany({
          where: {
            userId,
            entity,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const savedSearch = await prisma.savedSearch.create({
        data: {
          userId,
          name,
          description: description || null,
          entity,
          filters,
          isDefault: isDefault || false,
        },
      });

      res.status(201).json({
        success: true,
        data: savedSearch,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all saved searches for the current user
   * GET /api/search/saved?entity=...
   */
  async getSavedSearches(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { entity } = req.query;

      const where: any = { userId };
      if (entity) {
        where.entity = entity as string;
      }

      const savedSearches = await prisma.savedSearch.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      res.json({
        success: true,
        data: savedSearches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific saved search
   * GET /api/search/saved/:id
   */
  async getSavedSearchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const savedSearch = await prisma.savedSearch.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!savedSearch) {
        throw new AppError(404, 'Saved search not found');
      }

      res.json({
        success: true,
        data: savedSearch,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a saved search
   * PATCH /api/search/saved/:id
   */
  async updateSavedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name, description, filters, isDefault } = req.body;

      // Verify ownership
      const existingSearch = await prisma.savedSearch.findFirst({
        where: { id, userId },
      });

      if (!existingSearch) {
        throw new AppError(404, 'Saved search not found');
      }

      // If setting as default, unset others
      if (isDefault && !existingSearch.isDefault) {
        await prisma.savedSearch.updateMany({
          where: {
            userId,
            entity: existingSearch.entity,
            isDefault: true,
            id: { not: id },
          },
          data: {
            isDefault: false,
          },
        });
      }

      const updatedSearch = await prisma.savedSearch.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(filters && { filters }),
          ...(isDefault !== undefined && { isDefault }),
        },
      });

      res.json({
        success: true,
        data: updatedSearch,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a saved search
   * DELETE /api/search/saved/:id
   */
  async deleteSavedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const savedSearch = await prisma.savedSearch.findFirst({
        where: { id, userId },
      });

      if (!savedSearch) {
        throw new AppError(404, 'Saved search not found');
      }

      await prisma.savedSearch.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Saved search deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Execute an advanced search with complex filters
   * POST /api/search/advanced
   */
  async advancedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity, filters, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.body;
      const userId = req.user!.id;

      let results: any[] = [];
      let total = 0;

      switch (entity) {
        case 'MESSAGES':
          ({ results, total } = await this.searchMessages(userId, filters, page, limit, sortBy, sortOrder));
          break;
        case 'USERS':
          ({ results, total } = await this.searchUsers(userId, filters, page, limit, sortBy, sortOrder));
          break;
        case 'PAYMENTS':
          ({ results, total } = await this.searchPayments(userId, filters, page, limit, sortBy, sortOrder));
          break;
        case 'SUBSCRIPTIONS':
          ({ results, total } = await this.searchSubscriptions(userId, filters, page, limit, sortBy, sortOrder));
          break;
        default:
          throw new AppError(400, 'Invalid search entity');
      }

      res.json({
        success: true,
        data: {
          results,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Search implementation methods
  private async searchMessages(userId: string, filters: any, page: number, limit: number, sortBy: string, sortOrder: string) {
    const where: any = { userId };

    // Text search
    if (filters.search) {
      where.OR = [
        { messageContent: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search } },
      ];
    }

    // Direction filter
    if (filters.direction) {
      where.direction = filters.direction;
    }

    // Read status
    if (filters.readStatus !== undefined) {
      where.readStatus = filters.readStatus === 'true' || filters.readStatus === true;
    }

    // Date range
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    // Message type
    if (filters.messageType) {
      where.messageType = filters.messageType;
    }

    // Customer phone
    if (filters.customerPhone) {
      where.customerPhone = { contains: filters.customerPhone };
    }

    const [results, total] = await Promise.all([
      prisma.whatsappMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.whatsappMessage.count({ where }),
    ]);

    return { results, total };
  }

  private async searchUsers(userId: string, filters: any, page: number, limit: number, sortBy: string, sortOrder: string) {
    const where: any = {};

    // Role filter (only for admins)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
      throw new AppError(403, 'Insufficient permissions to search users');
    }

    // Text search
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    // Role filter
    if (filters.role) {
      where.role = filters.role;
    }

    // Active status
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    // Date range
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [results, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          companyName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              messages: true,
              payments: true,
              subscriptions: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { results, total };
  }

  private async searchPayments(userId: string, filters: any, page: number, limit: number, sortBy: string, sortOrder: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const where: any = user?.role === 'CLIENT' ? { userId } : {};

    // Amount range
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) where.amount.gte = parseFloat(filters.minAmount);
      if (filters.maxAmount !== undefined) where.amount.lte = parseFloat(filters.maxAmount);
    }

    // Status
    if (filters.status) {
      where.status = filters.status;
    }

    // Currency
    if (filters.currency) {
      where.currency = filters.currency;
    }

    // Date range
    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) where.paymentDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.paymentDate.lte = new Date(filters.endDate);
    }

    // Payment method
    if (filters.paymentMethod) {
      where.paymentMethod = { contains: filters.paymentMethod, mode: 'insensitive' };
    }

    const [results, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true,
            },
          },
          subscription: {
            select: {
              id: true,
              planName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return { results, total };
  }

  private async searchSubscriptions(userId: string, filters: any, page: number, limit: number, sortBy: string, sortOrder: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const where: any = user?.role === 'CLIENT' ? { userId } : {};

    // Status
    if (filters.status) {
      where.status = filters.status;
    }

    // Auto-renew
    if (filters.autoRenew !== undefined) {
      where.autoRenew = filters.autoRenew === 'true' || filters.autoRenew === true;
    }

    // Date ranges
    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
    }

    if (filters.endDateFrom || filters.endDateTo) {
      where.endDate = {};
      if (filters.endDateFrom) where.endDate.gte = new Date(filters.endDateFrom);
      if (filters.endDateTo) where.endDate.lte = new Date(filters.endDateTo);
    }

    // Plan name
    if (filters.planName) {
      where.planName = { contains: filters.planName, mode: 'insensitive' };
    }

    const [results, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    return { results, total };
  }

  /**
   * Get search suggestions based on entity and field
   * GET /api/search/suggestions?entity=...&field=...&query=...
   */
  async getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity, field, query } = req.query;
      const userId = req.user!.id;

      if (!entity || !field || !query) {
        throw new AppError(400, 'Missing required parameters: entity, field, query');
      }

      let suggestions: string[] = [];

      switch (entity) {
        case 'MESSAGES':
          suggestions = await this.getMessageSuggestions(userId, field as string, query as string);
          break;
        case 'USERS':
          suggestions = await this.getUserSuggestions(field as string, query as string);
          break;
        case 'PAYMENTS':
          suggestions = await this.getPaymentSuggestions(userId, field as string, query as string);
          break;
        default:
          throw new AppError(400, 'Invalid entity');
      }

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  private async getMessageSuggestions(userId: string, field: string, query: string): Promise<string[]> {
    switch (field) {
      case 'customerName':
        const names = await prisma.whatsappMessage.findMany({
          where: {
            userId,
            customerName: { contains: query, mode: 'insensitive' },
          },
          select: { customerName: true },
          distinct: ['customerName'],
          take: 10,
        });
        return names.map((n) => n.customerName).filter((n): n is string => n !== null);

      case 'customerPhone':
        const phones = await prisma.whatsappMessage.findMany({
          where: {
            userId,
            customerPhone: { contains: query },
          },
          select: { customerPhone: true },
          distinct: ['customerPhone'],
          take: 10,
        });
        return phones.map((p) => p.customerPhone);

      default:
        return [];
    }
  }

  private async getUserSuggestions(field: string, query: string): Promise<string[]> {
    switch (field) {
      case 'email':
        const emails = await prisma.user.findMany({
          where: { email: { contains: query, mode: 'insensitive' } },
          select: { email: true },
          take: 10,
        });
        return emails.map((e) => e.email);

      case 'companyName':
        const companies = await prisma.user.findMany({
          where: { companyName: { contains: query, mode: 'insensitive' } },
          select: { companyName: true },
          distinct: ['companyName'],
          take: 10,
        });
        return companies.map((c) => c.companyName).filter((c): c is string => c !== null);

      default:
        return [];
    }
  }

  private async getPaymentSuggestions(_userId: string, field: string, query: string): Promise<string[]> {
    switch (field) {
      case 'paymentMethod':
        const methods = await prisma.payment.findMany({
          where: { paymentMethod: { contains: query, mode: 'insensitive' } },
          select: { paymentMethod: true },
          distinct: ['paymentMethod'],
          take: 10,
        });
        return methods.map((m) => m.paymentMethod).filter((m): m is string => m !== null);

      default:
        return [];
    }
  }
}

export const advancedSearchController = new AdvancedSearchController();
