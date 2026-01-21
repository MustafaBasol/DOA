import { SubscriptionService } from '../../src/modules/subscriptions/subscriptions.service';
import { prismaMock } from '../setup';

describe('SubscriptionService', () => {
  describe('getSubscriptions', () => {
    it('should return paginated subscriptions', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-1',
          userId: 'user-1',
          planName: 'Premium Plan',
          planPrice: 99.99,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-02-01'),
          autoRenew: true,
          user: {
            id: 'user-1',
            email: 'test@example.com',
            fullName: 'Test User',
            companyName: 'Test Company',
          },
        },
      ];

      prismaMock.subscription.findMany.mockResolvedValue(mockSubscriptions as any);
      prismaMock.subscription.count.mockResolvedValue(1);

      const result = await SubscriptionService.getSubscriptions({
        page: 1,
        limit: 20,
      });

      expect(result.subscriptions).toEqual(mockSubscriptions);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          include: expect.any(Object),
        })
      );
    });

    it('should filter subscriptions by userId', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.subscription.count.mockResolvedValue(0);

      await SubscriptionService.getSubscriptions({
        userId: 123,
        page: 1,
        limit: 20,
      });

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 123 },
        })
      );
    });

    it('should filter subscriptions by status', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.subscription.count.mockResolvedValue(0);

      await SubscriptionService.getSubscriptions({
        status: 'ACTIVE',
        page: 1,
        limit: 20,
      });

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.subscription.count.mockResolvedValue(50);

      const result = await SubscriptionService.getSubscriptions({
        page: 3,
        limit: 10,
      });

      expect(result.pagination.totalPages).toBe(5);
      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * 10
          take: 10,
        })
      );
    });
  });

  describe('getSubscriptionById', () => {
    it('should return subscription by id', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-1',
        planName: 'Premium Plan',
        planPrice: 99.99,
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          companyName: 'Test Company',
        },
      };

      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription as any);

      const result = await SubscriptionService.getSubscriptionById('sub-123');

      expect(result).toEqual(mockSubscription);
      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        include: expect.any(Object),
      });
    });

    it('should throw error if subscription not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(
        SubscriptionService.getSubscriptionById('non-existent')
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('getActiveSubscription', () => {
    it('should return active subscription for user', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-1',
        planName: 'Premium Plan',
        status: 'ACTIVE',
        endDate: new Date('2026-12-31'),
      };

      prismaMock.subscription.findFirst.mockResolvedValue(mockSubscription as any);

      const result = await SubscriptionService.getActiveSubscription('user-1');

      expect(result).toEqual(mockSubscription);
      expect(prismaMock.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: 'ACTIVE',
          endDate: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          endDate: 'desc',
        },
      });
    });

    it('should return null if no active subscription found', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue(null);

      const result = await SubscriptionService.getActiveSubscription('user-1');

      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const subscriptionData = {
        userId: 'user-123',
        planName: 'Premium Plan',
        planPrice: 99.99,
        billingCycle: 'MONTHLY' as const,
        maxMessages: 10000,
        maxUsers: 5,
        features: ['Feature 1', 'Feature 2'],
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-01'),
        autoRenew: true,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const expectedSubscription = {
        id: 'sub-123',
        ...subscriptionData,
        status: 'ACTIVE',
        user: mockUser,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findFirst.mockResolvedValue(null); // No existing subscription
      prismaMock.subscription.create.mockResolvedValue(expectedSubscription as any);

      const result = await SubscriptionService.createSubscription(subscriptionData);

      expect(result).toEqual(expectedSubscription);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: {
          ...subscriptionData,
          status: 'ACTIVE',
        },
        include: expect.any(Object),
      });
    });

    it('should throw error if user not found', async () => {
      const subscriptionData = {
        userId: 'non-existent',
        planName: 'Premium Plan',
        planPrice: 99.99,
        billingCycle: 'MONTHLY' as const,
        startDate: new Date(),
        endDate: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        SubscriptionService.createSubscription(subscriptionData)
      ).rejects.toThrow('User not found');
    });

    it('should throw error if user already has active subscription', async () => {
      const subscriptionData = {
        userId: 'user-123',
        planName: 'Premium Plan',
        planPrice: 99.99,
        billingCycle: 'MONTHLY' as const,
        startDate: new Date(),
        endDate: new Date(),
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const existingSubscription = {
        id: 'sub-existing',
        userId: 'user-123',
        status: 'ACTIVE',
        endDate: new Date('2026-12-31'),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findFirst.mockResolvedValue(existingSubscription as any);

      await expect(
        SubscriptionService.createSubscription(subscriptionData)
      ).rejects.toThrow('User already has an active subscription');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId: 'user-1',
        planName: 'Basic Plan',
        status: 'ACTIVE',
      };

      const updateData = {
        planName: 'Premium Plan',
        planPrice: 149.99,
        status: 'ACTIVE' as const,
      };

      const updatedSubscription = {
        ...existingSubscription,
        ...updateData,
      };

      prismaMock.subscription.findUnique.mockResolvedValue(existingSubscription as any);
      prismaMock.subscription.update.mockResolvedValue(updatedSubscription as any);

      const result = await SubscriptionService.updateSubscription('sub-123', updateData);

      expect(result).toEqual(updatedSubscription);
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: updateData,
        include: expect.any(Object),
      });
    });

    it('should throw error if subscription not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(
        SubscriptionService.updateSubscription('non-existent', { planName: 'Test' })
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId: 'user-1',
        status: 'ACTIVE',
        autoRenew: true,
      };

      const cancelledSubscription = {
        ...existingSubscription,
        status: 'CANCELED',
        autoRenew: false,
      };

      prismaMock.subscription.findUnique.mockResolvedValue(existingSubscription as any);
      prismaMock.subscription.update.mockResolvedValue(cancelledSubscription as any);

      const result = await SubscriptionService.cancelSubscription('sub-123');

      expect(result.status).toBe('CANCELED');
      expect(result.autoRenew).toBe(false);
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          status: 'CANCELED',
          autoRenew: false,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription successfully', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId: 'user-1',
      };

      prismaMock.subscription.findUnique.mockResolvedValue(existingSubscription as any);
      prismaMock.subscription.delete.mockResolvedValue(existingSubscription as any);

      await SubscriptionService.deleteSubscription('sub-123');

      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
      });
    });

    it('should throw error if subscription not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(
        SubscriptionService.deleteSubscription('non-existent')
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('checkExpiredSubscriptions', () => {
    it('should update expired subscriptions', async () => {
      prismaMock.subscription.updateMany.mockResolvedValue({ count: 5 } as any);

      const result = await SubscriptionService.checkExpiredSubscriptions();

      expect(result).toBe(5);
      expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          endDate: {
            lt: expect.any(Date),
          },
          autoRenew: false,
        },
        data: {
          status: 'EXPIRED',
        },
      });
    });

    it('should return 0 if no expired subscriptions found', async () => {
      prismaMock.subscription.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await SubscriptionService.checkExpiredSubscriptions();

      expect(result).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return subscription statistics for all users', async () => {
      prismaMock.subscription.count
        .mockResolvedValueOnce(25) // active
        .mockResolvedValueOnce(10) // cancelled
        .mockResolvedValueOnce(5) // expired
        .mockResolvedValueOnce(3); // suspended

      const result = await SubscriptionService.getStats();

      expect(result).toEqual({
        active: 25,
        cancelled: 10,
        expired: 5,
        suspended: 3,
        total: 43,
      });
      expect(prismaMock.subscription.count).toHaveBeenCalledTimes(4);
    });

    it('should return subscription statistics for specific user', async () => {
      prismaMock.subscription.count
        .mockResolvedValueOnce(1) // active
        .mockResolvedValueOnce(0) // cancelled
        .mockResolvedValueOnce(0) // expired
        .mockResolvedValueOnce(0); // suspended

      const result = await SubscriptionService.getStats(123);

      expect(result).toEqual({
        active: 1,
        cancelled: 0,
        expired: 0,
        suspended: 0,
        total: 1,
      });
      expect(prismaMock.subscription.count).toHaveBeenCalledWith({
        where: { userId: 123, status: 'ACTIVE' },
      });
    });

    it('should return zero stats for user with no subscriptions', async () => {
      prismaMock.subscription.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await SubscriptionService.getStats(456);

      expect(result).toEqual({
        active: 0,
        cancelled: 0,
        expired: 0,
        suspended: 0,
        total: 0,
      });
    });
  });
});
