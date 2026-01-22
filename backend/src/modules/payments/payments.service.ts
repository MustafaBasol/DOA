import { PrismaClient } from '@prisma/client';
import { notificationService } from '../notifications/notification.service';

const prisma = new PrismaClient();

type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'CASH' | 'OTHER';

interface CreatePaymentDto {
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  description?: string;
  metadata?: any;
}

interface UpdatePaymentDto {
  status?: PaymentStatus;
  transactionId?: string;
  description?: string;
  metadata?: any;
}

interface QueryPaymentsDto {
  userId?: number;
  subscriptionId?: number;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export class PaymentService {
  /**
   * Get payments with filtering and pagination
   */
  static async getPayments(query: QueryPaymentsDto) {
    const { userId, subscriptionId, status, paymentMethod, startDate, endDate, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
          subscription: {
            select: {
              id: true,
              planName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
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
        subscription: {
          select: {
            id: true,
            planName: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Create payment
   */
  static async createPayment(data: CreatePaymentDto) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if subscription exists (if provided)
    if (data.subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: data.subscriptionId },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Verify subscription belongs to user
      if (subscription.userId !== data.userId) {
        throw new Error('Subscription does not belong to user');
      }
    }

    const payment = await prisma.payment.create({
      data: {
        ...data,
        currency: data.currency || 'TRY',
        status: 'PENDING',
      } as any,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            companyName: true,
          },
        },
        subscription: {
          select: {
            id: true,
            planName: true,
          },
        },
      },
    });

    return payment;
  }

  /**
   * Update payment
   */
  static async updatePayment(id: string, data: UpdatePaymentDto) {
    // Check if payment exists
    const existingPayment = await this.getPaymentById(id);

    const payment = await prisma.payment.update({
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
        subscription: {
          select: {
            id: true,
            planName: true,
          },
        },
      },
    });

    // Send notification on status change
    if (data.status && data.status !== existingPayment.status) {
      const userId = parseInt(payment.userId);
      const amount = parseFloat(payment.amount.toString());
      
      if (data.status === 'COMPLETED') {
        await notificationService.sendPaymentReceivedNotification(
          userId,
          amount,
          payment.currency
        ).catch(err => console.error('Failed to send payment notification:', err));
      } else if (data.status === 'FAILED') {
        await notificationService.sendNotification({
          userId,
          type: 'PAYMENT_FAILED',
          title: 'Ödeme Başarısız ❌',
          message: `${amount} ${payment.currency} tutarındaki ödemeniz başarısız oldu.`,
          priority: 'high',
          actionUrl: '/payments',
        }).catch(err => console.error('Failed to send payment notification:', err));
      }
    }

    return payment;
  }

  /**
   * Delete payment (hard delete)
   */
  static async deletePayment(id: string) {
    // Check if payment exists
    await this.getPaymentById(id);

    await prisma.payment.delete({
      where: { id },
    });
  }

  /**
   * Get payment statistics
   */
  static async getStats(userId?: string) {
    const where: any = userId ? { userId } : {};

    const [pending, completed, failed, refunded, totalAmount] = await Promise.all([
      prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
      prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.payment.count({ where: { ...where, status: 'FAILED' } }),
      prisma.payment.count({ where: { ...where, status: 'REFUNDED' } }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      pending,
      completed,
      failed,
      refunded,
      total: pending + completed + failed + refunded,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }

  /**
   * Get payment summary for a user (for client dashboard)
   */
  static async getUserPaymentSummary(userId: string) {
    const [lastPayment, stats, recentPayments] = await Promise.all([
      prisma.payment.findFirst({
        where: { userId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      }),
      this.getStats(userId),
      prisma.payment.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              planName: true,
            },
          },
        },
      }),
    ]);

    return {
      lastPayment,
      stats,
      recentPayments,
    };
  }
}
