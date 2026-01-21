import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type BillingCycle = 'MONTHLY' | 'YEARLY';
type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAUSED';

interface CreateSubscriptionDto {
  userId: string;
  planName: string;
  planPrice: number;
  billingCycle: BillingCycle;
  maxMessages?: number | null;
  maxUsers?: number | null;
  features?: string[];
  startDate: Date;
  endDate: Date;
  autoRenew?: boolean;
}

interface UpdateSubscriptionDto {
  planName?: string;
  planPrice?: number;
  billingCycle?: BillingCycle;
  maxMessages?: number | null;
  maxUsers?: number | null;
  features?: string[];
  startDate?: Date;
  endDate?: Date;
  autoRenew?: boolean;
  status?: SubscriptionStatus;
}

interface QuerySubscriptionsDto {
  userId?: number;
  status?: SubscriptionStatus;
  page: number;
  limit: number;
}

export class SubscriptionService {
  /**
   * Get subscriptions with filtering and pagination
   */
  static async getSubscriptions(query: QuerySubscriptionsDto) {
    const { userId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get subscription by ID
   */
  static async getSubscriptionById(id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return subscription;
  }

  /**
   * Get active subscription for a user
   */
  static async getActiveSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    return subscription;
  }

  /**
   * Create subscription
   */
  static async createSubscription(data: CreateSubscriptionDto) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.getActiveSubscription(data.userId);
    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    const subscription = await prisma.subscription.create({
      data: {
        ...data,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
          },
        },
      },
    });

    return subscription;
  }

  /**
   * Update subscription
   */
  static async updateSubscription(id: string, data: UpdateSubscriptionDto) {
    // Check if subscription exists
    await this.getSubscriptionById(id);

    const subscription = await prisma.subscription.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
          },
        },
      },
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(id: string) {
    const subscription = await this.updateSubscription(id, {
      status: 'CANCELED',
      autoRenew: false,
    });

    return subscription;
  }

  /**
   * Delete subscription (hard delete)
   */
  static async deleteSubscription(id: string) {
    // Check if subscription exists
    await this.getSubscriptionById(id);

    await prisma.subscription.delete({
      where: { id },
    });
  }

  /**
   * Check and update expired subscriptions (cron job)
   */
  static async checkExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: now,
        },
        autoRenew: false,
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return expiredSubscriptions.count;
  }

  /**
   * Get subscription statistics
   */
  static async getStats(userId?: number) {
    const where: any = userId ? { userId } : {};

    const [active, cancelled, expired, suspended] = await Promise.all([
      prisma.subscription.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { ...where, status: 'CANCELED' } }),
      prisma.subscription.count({ where: { ...where, status: 'EXPIRED' } }),
      prisma.subscription.count({ where: { ...where, status: 'SUSPENDED' } }),
    ]);

    return {
      active,
      cancelled,
      expired,
      suspended,
      total: active + cancelled + expired + suspended,
    };
  }
}
