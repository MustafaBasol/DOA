import request from 'supertest';
import express, { Express } from 'express';
import subscriptionsRouter from '../../src/modules/subscriptions/subscriptions.routes';
import { prismaMock } from '../setup';
import * as jwtUtils from '../../src/utils/jwt';

// Mock JWT utilities
jest.mock('../../src/utils/jwt');

// Mock permission middleware
jest.mock('../../src/middleware/permission', () => ({
  checkPermission: () => (req: any, res: any, next: any) => next(),
}));

// Mock audit middleware
jest.mock('../../src/middleware/auditLog', () => ({
  auditLog: () => (req: any, res: any, next: any) => next(),
}));

describe('Subscriptions API Integration Tests', () => {
  let app: Express;
  const validToken = 'valid-jwt-token';
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockClientUser = {
    id: 'client-123',
    email: 'client@example.com',
    role: 'CLIENT',
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/subscriptions', subscriptionsRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockAdminUser);
  });

  describe('GET /api/subscriptions', () => {
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

      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('subscriptions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.subscriptions).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter subscriptions by status', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.subscription.count.mockResolvedValue(0);

      await request(app)
        .get('/api/subscriptions?status=ACTIVE')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should filter subscriptions by userId', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.subscription.count.mockResolvedValue(0);

      await request(app)
        .get('/api/subscriptions?userId=user-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.subscription.count.mockResolvedValue(50);

      const response = await request(app)
        .get('/api/subscriptions?page=3&limit=10')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.pagination).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });

    it('should return 401 without authentication', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await request(app).get('/api/subscriptions').expect(401);
    });
  });

  describe('GET /api/subscriptions/stats', () => {
    it('should return subscription statistics', async () => {
      prismaMock.subscription.count
        .mockResolvedValueOnce(25) // active
        .mockResolvedValueOnce(10) // cancelled
        .mockResolvedValueOnce(5) // expired
        .mockResolvedValueOnce(3); // suspended

      const response = await request(app)
        .get('/api/subscriptions/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        active: 25,
        cancelled: 10,
        expired: 5,
        suspended: 3,
        total: 43,
      });
    });

    it('should return stats for specific user when userId provided', async () => {
      prismaMock.subscription.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const response = await request(app)
        .get('/api/subscriptions/stats?userId=user-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.total).toBe(1);
    });
  });

  describe('GET /api/subscriptions/user/:userId/active', () => {
    it('should return active subscription for user', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        planName: 'Premium Plan',
        status: 'ACTIVE',
        endDate: new Date('2026-12-31'),
      };

      prismaMock.subscription.findFirst.mockResolvedValue(mockSubscription as any);

      const response = await request(app)
        .get('/api/subscriptions/user/user-123/active')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'sub-123');
      expect(response.body).toHaveProperty('status', 'ACTIVE');
    });

    it('should return 404 if no active subscription found', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue(null);

      await request(app)
        .get('/api/subscriptions/user/user-123/active')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('GET /api/subscriptions/:id', () => {
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

      const response = await request(app)
        .get('/api/subscriptions/sub-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'sub-123');
      expect(response.body).toHaveProperty('planName', 'Premium Plan');
    });

    it('should return 404 if subscription not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await request(app)
        .get('/api/subscriptions/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('POST /api/subscriptions', () => {
    it('should create new subscription', async () => {
      const newSubscription = {
        userId: 'user-123',
        planName: 'Premium Plan',
        planPrice: 99.99,
        billingCycle: 'MONTHLY',
        maxMessages: 10000,
        maxUsers: 5,
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        autoRenew: true,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const createdSubscription = {
        id: 'sub-123',
        ...newSubscription,
        status: 'ACTIVE',
        user: mockUser,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findFirst.mockResolvedValue(null);
      prismaMock.subscription.create.mockResolvedValue(createdSubscription as any);

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newSubscription)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'ACTIVE');
    });

    it('should return 400 if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'non-existent',
          planName: 'Premium Plan',
          planPrice: 99.99,
          billingCycle: 'MONTHLY',
          startDate: '2026-01-01',
          endDate: '2026-02-01',
        })
        .expect(400);
    });

    it('should return 400 if user already has active subscription', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const existingSubscription = {
        id: 'sub-existing',
        userId: 'user-123',
        status: 'ACTIVE',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findFirst.mockResolvedValue(existingSubscription as any);

      await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'user-123',
          planName: 'Premium Plan',
          planPrice: 99.99,
          billingCycle: 'MONTHLY',
          startDate: '2026-01-01',
          endDate: '2026-02-01',
        })
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          // Missing required fields
          planName: 'Premium Plan',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/subscriptions/:id', () => {
    it('should update subscription', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId: 'user-1',
        planName: 'Basic Plan',
        status: 'ACTIVE',
      };

      const updateData = {
        planName: 'Premium Plan',
        planPrice: 149.99,
      };

      const updatedSubscription = {
        ...existingSubscription,
        ...updateData,
      };

      prismaMock.subscription.findUnique.mockResolvedValue(existingSubscription as any);
      prismaMock.subscription.update.mockResolvedValue(updatedSubscription as any);

      const response = await request(app)
        .patch('/api/subscriptions/sub-123')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('planName', 'Premium Plan');
      expect(response.body).toHaveProperty('planPrice', 149.99);
    });

    it('should return 404 if subscription not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await request(app)
        .patch('/api/subscriptions/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ planName: 'Updated Plan' })
        .expect(404);
    });
  });

  describe('POST /api/subscriptions/:id/cancel', () => {
    it('should cancel subscription', async () => {
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

      const response = await request(app)
        .post('/api/subscriptions/sub-123/cancel')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'CANCELED');
      expect(response.body).toHaveProperty('autoRenew', false);
    });

    it('should return 404 if subscription not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await request(app)
        .post('/api/subscriptions/non-existent/cancel')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/subscriptions/:id', () => {
    it('should delete subscription', async () => {
      const existingSubscription = {
        id: 'sub-123',
        userId: 'user-1',
      };

      prismaMock.subscription.findUnique.mockResolvedValue(existingSubscription as any);
      prismaMock.subscription.delete.mockResolvedValue(existingSubscription as any);

      await request(app)
        .delete('/api/subscriptions/sub-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(204);
    });

    it('should return 404 if subscription not found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await request(app)
        .delete('/api/subscriptions/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.subscription.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
