import { PaymentService } from '../../src/modules/payments/payments.service';
import { prismaMock } from '../setup';

describe('PaymentService', () => {
  describe('getPayments', () => {
    it('should return paginated payments', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          amount: 99.99,
          currency: 'TRY',
          paymentMethod: 'CREDIT_CARD',
          status: 'COMPLETED',
          transactionId: 'txn-123',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            email: 'test@example.com',
            fullName: 'Test User',
            companyName: 'Test Company',
          },
          subscription: {
            id: 'sub-1',
            planName: 'Premium Plan',
          },
        },
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);
      prismaMock.payment.count.mockResolvedValue(1);

      const result = await PaymentService.getPayments({
        page: 1,
        limit: 20,
      });

      expect(result.payments).toEqual(mockPayments);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          include: expect.any(Object),
        })
      );
    });

    it('should filter payments by userId', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await PaymentService.getPayments({
        userId: 123,
        page: 1,
        limit: 20,
      });

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 123 },
        })
      );
    });

    it('should filter payments by status', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await PaymentService.getPayments({
        status: 'COMPLETED',
        page: 1,
        limit: 20,
      });

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'COMPLETED' },
        })
      );
    });

    it('should filter payments by payment method', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await PaymentService.getPayments({
        paymentMethod: 'CREDIT_CARD',
        page: 1,
        limit: 20,
      });

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { paymentMethod: 'CREDIT_CARD' },
        })
      );
    });

    it('should filter payments by date range', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await PaymentService.getPayments({
        startDate,
        endDate,
        page: 1,
        limit: 20,
      });

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(100);

      const result = await PaymentService.getPayments({
        page: 5,
        limit: 15,
      });

      expect(result.pagination.totalPages).toBe(7); // Math.ceil(100 / 15)
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 60, // (page 5 - 1) * 15
          take: 15,
        })
      );
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by id', async () => {
      const mockPayment = {
        id: 'pay-123',
        userId: 'user-1',
        amount: 99.99,
        currency: 'TRY',
        paymentMethod: 'CREDIT_CARD',
        status: 'COMPLETED',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          companyName: 'Test Company',
        },
        subscription: {
          id: 'sub-1',
          planName: 'Premium Plan',
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment as any);

      const result = await PaymentService.getPaymentById('pay-123');

      expect(result).toEqual(mockPayment);
      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'pay-123' },
        include: expect.any(Object),
      });
    });

    it('should throw error if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(PaymentService.getPaymentById('non-existent')).rejects.toThrow(
        'Payment not found'
      );
    });
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData = {
        userId: 'user-123',
        subscriptionId: 'sub-123',
        amount: 99.99,
        currency: 'TRY',
        paymentMethod: 'CREDIT_CARD' as const,
        transactionId: 'txn-123',
        description: 'Premium Plan Payment',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        planName: 'Premium Plan',
      };

      const expectedPayment = {
        id: 'pay-123',
        ...paymentData,
        status: 'PENDING',
        createdAt: new Date(),
        user: mockUser,
        subscription: mockSubscription,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prismaMock.payment.create.mockResolvedValue(expectedPayment as any);

      const result = await PaymentService.createPayment(paymentData);

      expect(result).toEqual(expectedPayment);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
      });
      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          amount: 99.99,
          status: 'PENDING',
        }),
        include: expect.any(Object),
      });
    });

    it('should default currency to TRY if not provided', async () => {
      const paymentData = {
        userId: 'user-123',
        amount: 99.99,
        paymentMethod: 'CREDIT_CARD' as const,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.payment.create.mockResolvedValue({} as any);

      await PaymentService.createPayment(paymentData);

      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'TRY',
          }),
        })
      );
    });

    it('should throw error if user not found', async () => {
      const paymentData = {
        userId: 'non-existent',
        amount: 99.99,
        paymentMethod: 'CREDIT_CARD' as const,
      };

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(PaymentService.createPayment(paymentData)).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error if subscription not found', async () => {
      const paymentData = {
        userId: 'user-123',
        subscriptionId: 'non-existent',
        amount: 99.99,
        paymentMethod: 'CREDIT_CARD' as const,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(PaymentService.createPayment(paymentData)).rejects.toThrow(
        'Subscription not found'
      );
    });

    it('should throw error if subscription does not belong to user', async () => {
      const paymentData = {
        userId: 'user-123',
        subscriptionId: 'sub-123',
        amount: 99.99,
        paymentMethod: 'CREDIT_CARD' as const,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'different-user',
        planName: 'Premium Plan',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription as any);

      await expect(PaymentService.createPayment(paymentData)).rejects.toThrow(
        'Subscription does not belong to user'
      );
    });
  });

  describe('updatePayment', () => {
    it('should update payment successfully', async () => {
      const existingPayment = {
        id: 'pay-123',
        userId: 'user-1',
        status: 'PENDING',
      };

      const updateData = {
        status: 'COMPLETED' as const,
        transactionId: 'txn-456',
      };

      const updatedPayment = {
        ...existingPayment,
        ...updateData,
      };

      prismaMock.payment.findUnique.mockResolvedValue(existingPayment as any);
      prismaMock.payment.update.mockResolvedValue(updatedPayment as any);

      const result = await PaymentService.updatePayment('pay-123', updateData);

      expect(result).toEqual(updatedPayment);
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-123' },
        data: updateData,
        include: expect.any(Object),
      });
    });

    it('should throw error if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(
        PaymentService.updatePayment('non-existent', { status: 'COMPLETED' })
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('deletePayment', () => {
    it('should delete payment successfully', async () => {
      const existingPayment = {
        id: 'pay-123',
        userId: 'user-1',
      };

      prismaMock.payment.findUnique.mockResolvedValue(existingPayment as any);
      prismaMock.payment.delete.mockResolvedValue(existingPayment as any);

      await PaymentService.deletePayment('pay-123');

      expect(prismaMock.payment.delete).toHaveBeenCalledWith({
        where: { id: 'pay-123' },
      });
    });

    it('should throw error if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(PaymentService.deletePayment('non-existent')).rejects.toThrow(
        'Payment not found'
      );
    });
  });

  describe('getStats', () => {
    it('should return payment statistics for all users', async () => {
      prismaMock.payment.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(50) // completed
        .mockResolvedValueOnce(3) // failed
        .mockResolvedValueOnce(2); // refunded

      prismaMock.payment.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
      } as any);

      const result = await PaymentService.getStats();

      expect(result).toEqual({
        pending: 5,
        completed: 50,
        failed: 3,
        refunded: 2,
        total: 60,
        totalAmount: 5000,
      });
      expect(prismaMock.payment.count).toHaveBeenCalledTimes(4);
    });

    it('should return payment statistics for specific user', async () => {
      prismaMock.payment.count
        .mockResolvedValueOnce(1) // pending
        .mockResolvedValueOnce(10) // completed
        .mockResolvedValueOnce(0) // failed
        .mockResolvedValueOnce(0); // refunded

      prismaMock.payment.aggregate.mockResolvedValue({
        _sum: { amount: 999.9 },
      } as any);

      const result = await PaymentService.getStats(123);

      expect(result).toEqual({
        pending: 1,
        completed: 10,
        failed: 0,
        refunded: 0,
        total: 11,
        totalAmount: 999.9,
      });
      expect(prismaMock.payment.count).toHaveBeenCalledWith({
        where: { userId: 123, status: 'PENDING' },
      });
    });

    it('should handle null totalAmount from aggregate', async () => {
      prismaMock.payment.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prismaMock.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      } as any);

      const result = await PaymentService.getStats(456);

      expect(result.totalAmount).toBe(0);
    });
  });

  describe('getUserPaymentSummary', () => {
    it('should return payment summary for user', async () => {
      const mockLastPayment = {
        id: 'pay-123',
        userId: 'user-1',
        amount: 99.99,
        status: 'COMPLETED',
        createdAt: new Date(),
      };

      const mockStats = {
        pending: 0,
        completed: 5,
        failed: 0,
        refunded: 0,
        total: 5,
        totalAmount: 499.95,
      };

      const mockRecentPayments = [
        {
          id: 'pay-1',
          amount: 99.99,
          status: 'COMPLETED',
          subscription: { planName: 'Premium Plan' },
        },
        {
          id: 'pay-2',
          amount: 99.99,
          status: 'COMPLETED',
          subscription: { planName: 'Premium Plan' },
        },
      ];

      prismaMock.payment.findFirst.mockResolvedValue(mockLastPayment as any);
      prismaMock.payment.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaMock.payment.aggregate.mockResolvedValue({
        _sum: { amount: 499.95 },
      } as any);
      prismaMock.payment.findMany.mockResolvedValue(mockRecentPayments as any);

      const result = await PaymentService.getUserPaymentSummary('user-1');

      expect(result).toEqual({
        lastPayment: mockLastPayment,
        stats: mockStats,
        recentPayments: mockRecentPayments,
      });
      expect(prismaMock.payment.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should handle user with no payments', async () => {
      prismaMock.payment.findFirst.mockResolvedValue(null);
      prismaMock.payment.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaMock.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      } as any);
      prismaMock.payment.findMany.mockResolvedValue([]);

      const result = await PaymentService.getUserPaymentSummary('user-2');

      expect(result.lastPayment).toBeNull();
      expect(result.stats.total).toBe(0);
      expect(result.recentPayments).toEqual([]);
    });
  });
});
