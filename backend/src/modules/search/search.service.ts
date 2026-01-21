import { prisma } from '../../config/database';

type SearchEntity = 'MESSAGES' | 'CUSTOMERS' | 'PAYMENTS' | 'SUBSCRIPTIONS';

// Search filter interfaces
export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: any;
}

export interface SearchParams {
  entity: SearchEntity;
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  userId?: string; // For CLIENT role filtering
}

export interface SearchResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SavedSearchInput {
  name: string;
  description?: string;
  entity: SearchEntity;
  filters: SearchFilter[];
  isDefault?: boolean;
}

class SearchService {
  // Build Prisma where clause from filters
  private buildWhereClause(filters: SearchFilter[]): any {
    const where: any = {};

    filters.forEach(filter => {
      const { field, operator, value } = filter;

      switch (operator) {
        case 'equals':
          where[field] = value;
          break;
        case 'contains':
          where[field] = { contains: value, mode: 'insensitive' };
          break;
        case 'startsWith':
          where[field] = { startsWith: value, mode: 'insensitive' };
          break;
        case 'endsWith':
          where[field] = { endsWith: value, mode: 'insensitive' };
          break;
        case 'gt':
          where[field] = { gt: value };
          break;
        case 'gte':
          where[field] = { gte: value };
          break;
        case 'lt':
          where[field] = { lt: value };
          break;
        case 'lte':
          where[field] = { lte: value };
          break;
        case 'in':
          where[field] = { in: Array.isArray(value) ? value : [value] };
          break;
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            where[field] = { gte: value[0], lte: value[1] };
          }
          break;
      }
    });

    return where;
  }

  // Search messages
  async searchMessages(params: SearchParams): Promise<SearchResult> {
    const { filters, sortBy = 'timestamp', sortOrder = 'desc', page = 1, limit = 20, userId } = params;

    let where = this.buildWhereClause(filters);

    // Apply role-based filtering
    if (userId) {
      where.userId = userId;
    }

    const [data, total] = await Promise.all([
      prisma.whatsappMessage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true
            }
          }
        }
      }),
      prisma.whatsappMessage.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Search customers (distinct users from messages)
  async searchCustomers(params: SearchParams): Promise<SearchResult> {
    const { filters, sortBy = 'lastActivity', sortOrder = 'desc', page = 1, limit = 20, userId } = params;

    // Build where clause for messages
    let messageWhere: any = {};
    
    filters.forEach(filter => {
      const { field, operator, value } = filter;
      
      // Map customer fields to message fields
      if (field === 'name') {
        messageWhere.customerName = this.buildFieldCondition(operator, value);
      } else if (field === 'phone') {
        messageWhere.customerPhone = this.buildFieldCondition(operator, value);
      } else if (field === 'lastActivity') {
        messageWhere.timestamp = this.buildFieldCondition(operator, value);
      }
    });

    // Apply role-based filtering
    if (userId) {
      messageWhere.userId = userId;
    }

    // Get distinct customers with message counts
    const customers = await prisma.whatsappMessage.groupBy({
      by: ['customerPhone', 'customerName', 'userId'],
      where: messageWhere,
      _count: {
        id: true
      },
      _max: {
        timestamp: true
      },
      orderBy: sortBy === 'messageCount' 
        ? { _count: { id: sortOrder } }
        : { _max: { timestamp: sortOrder } }
    });

    const total = customers.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedCustomers = customers.slice(start, end);

    // Enrich with user data
    const data = await Promise.all(
      paginatedCustomers.map(async (customer: any) => {
        const user = await prisma.user.findUnique({
          where: { id: customer.userId },
          select: {
            id: true,
            fullName: true,
            companyName: true,
            email: true
          }
        });

        return {
          customerPhone: customer.customerPhone,
          customerName: customer.customerName,
          messageCount: customer._count.id,
          lastActivity: customer._max.timestamp,
          user
        };
      })
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Search payments
  async searchPayments(params: SearchParams): Promise<SearchResult> {
    const { filters, sortBy = 'paymentDate', sortOrder = 'desc', page = 1, limit = 20, userId } = params;

    let where = this.buildWhereClause(filters);

    // Apply role-based filtering
    if (userId) {
      where.userId = userId;
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true
            }
          },
          subscription: {
            select: {
              id: true,
              planName: true,
              monthlyPrice: true
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Search subscriptions
  async searchSubscriptions(params: SearchParams): Promise<SearchResult> {
    const { filters, sortBy = 'startDate', sortOrder = 'desc', page = 1, limit = 20, userId } = params;

    let where = this.buildWhereClause(filters);

    // Apply role-based filtering
    if (userId) {
      where.userId = userId;
    }

    const [data, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              email: true
            }
          },
          _count: {
            select: {
              payments: true
            }
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Universal search method
  async search(params: SearchParams): Promise<SearchResult> {
    switch (params.entity) {
      case 'MESSAGES':
        return this.searchMessages(params);
      case 'CUSTOMERS':
        return this.searchCustomers(params);
      case 'PAYMENTS':
        return this.searchPayments(params);
      case 'SUBSCRIPTIONS':
        return this.searchSubscriptions(params);
      default:
        throw new Error(`Unsupported entity: ${params.entity}`);
    }
  }

  // Helper: Build field condition
  private buildFieldCondition(operator: string, value: any): any {
    switch (operator) {
      case 'equals':
        return value;
      case 'contains':
        return { contains: value, mode: 'insensitive' };
      case 'startsWith':
        return { startsWith: value, mode: 'insensitive' };
      case 'endsWith':
        return { endsWith: value, mode: 'insensitive' };
      case 'gt':
        return { gt: value };
      case 'gte':
        return { gte: value };
      case 'lt':
        return { lt: value };
      case 'lte':
        return { lte: value };
      case 'in':
        return { in: Array.isArray(value) ? value : [value] };
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return { gte: value[0], lte: value[1] };
        }
        return value;
      default:
        return value;
    }
  }

  // --- Saved Searches ---

  // Create saved search
  async createSavedSearch(userId: string, input: SavedSearchInput) {
    // If setting as default, unset other defaults for this entity
    if (input.isDefault) {
      await prisma.savedSearch.updateMany({
        where: {
          userId,
          entity: input.entity,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    return prisma.savedSearch.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        entity: input.entity,
        filters: input.filters as any,
        isDefault: input.isDefault || false
      }
    });
  }

  // Get saved searches for user
  async getSavedSearches(userId: string, entity?: SearchEntity) {
    const where: any = { userId };
    
    if (entity) {
      where.entity = entity;
    }

    return prisma.savedSearch.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  // Get saved search by ID
  async getSavedSearchById(id: string, userId: string) {
    return prisma.savedSearch.findFirst({
      where: {
        id,
        userId
      }
    });
  }

  // Update saved search
  async updateSavedSearch(id: string, userId: string, input: Partial<SavedSearchInput>) {
    // If setting as default, unset other defaults for this entity
    if (input.isDefault) {
      const savedSearch = await prisma.savedSearch.findFirst({
        where: { id, userId }
      });

      if (savedSearch) {
        await prisma.savedSearch.updateMany({
          where: {
            userId,
            entity: savedSearch.entity,
            isDefault: true,
            id: { not: id }
          },
          data: {
            isDefault: false
          }
        });
      }
    }

    return prisma.savedSearch.updateMany({
      where: {
        id,
        userId
      },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.filters && { filters: input.filters as any }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault })
      }
    });
  }

  // Delete saved search
  async deleteSavedSearch(id: string, userId: string) {
    return prisma.savedSearch.deleteMany({
      where: {
        id,
        userId
      }
    });
  }

  // Execute saved search
  async executeSavedSearch(id: string, userId: string, additionalParams?: Partial<SearchParams>): Promise<SearchResult> {
    const savedSearch = await this.getSavedSearchById(id, userId);

    if (!savedSearch) {
      throw new Error('Saved search not found');
    }

    const searchParams: SearchParams = {
      entity: savedSearch.entity,
        filters: (savedSearch.filters as unknown) as SearchFilter[],
      userId,
      ...additionalParams
    };

    return this.search(searchParams);
  }
}

export const searchService = new SearchService();
