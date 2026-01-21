import request from 'supertest';
import express, { Express } from 'express';
import paymentsRouter from '../../src/modules/payments/payments.routes';
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

describe('Payments API Integration Tests', () => {
  let app: Express;
  const validToken = 'valid-jwt-token';
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/payments', paymentsRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockAdminUser);
  });

  describe('GET /api/payments', () => {
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

      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.payments).toHaveLength(1);
    });

    it('should filter payments by status', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await request(app)
        .get('/api/payments?status=COMPLETED')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'COMPLETED',
          }),
        })
      );
    });

    it('should filter payments by userId', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await request(app)
        .get('/api/payments?userId=user-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
    });

    it('should filter payments by payment method', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await request(app)
        .get('/api/payments?paymentMethod=CREDIT_CARD')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentMethod: 'CREDIT_CARD',
          }),
        })
      );
    });

    it('should filter payments by date range', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      await request(app)
        .get('/api/payments?startDate=2026-01-01&endDate=2026-01-31')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(100);

      const response = await request(app)
        .get('/api/payments?page=5&limit=15')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.pagination).toEqual({
        total: 100,
        page: 5,
        limit: 15,
        totalPages: 7,
      });
    });

    it('should return 401 without authentication', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await request(app).get('/api/payments').expect(401);
    });
  });

  describe('GET /api/payments/stats', () => {
    it('should return payment statistics', async () => {
      prismaMock.payment.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(50) // completed
        .mockResolvedValueOnce(3) // failed
        .mockResolvedValueOnce(2); // refunded

      prismaMock.payment.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
      } as any);

      const response = await request(app)
        .get('/api/payments/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        pending: 5,
        completed: 50,
        failed: 3,
        refunded: 2,
        total: 60,
        totalAmount: 5000,
      });
    });

    it('should return stats for specific user when userId provided', async () => {
      prismaMock.payment.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prismaMock.payment.aggregate.mockResolvedValue({
        _sum: { amount: 999.9 },
      } as any);

      const response = await request(app)
        .get('/api/payments/stats?userId=user-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.total).toBe(11);
      expect(response.body.totalAmount).toBe(999.9);
    });
  });

  describe('GET /api/payments/user/:userId/summary', () => {
    it('should return payment summary for user', async () => {
      const mockLastPayment = {
        id: 'pay-123',
        userId: 'user-1',
        amount: 99.99,
        status: 'COMPLETED',
        createdAt: new Date(),
      };

      const mockRecentPayments = [
        {
          id: 'pay-1',
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

      const response = await request(app)
        .get('/api/payments/user/user-1/summary')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('lastPayment');
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('recentPayments');
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

      const response = await request(app)
        .get('/api/payments/user/user-2/summary')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.lastPayment).toBeNull();
      expect(response.body.stats.total).toBe(0);
    });
  });

  describe('GET /api/payments/:id', () => {
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

      const response = await request(app)
        .get('/api/payments/pay-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'pay-123');
      expect(response.body).toHaveProperty('amount', 99.99);
    });

    it('should return 404 if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await request(app)
        .get('/api/payments/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('POST /api/payments', () => {
    it('should create new payment', async () => {
      const newPayment = {
        userId: 'user-123',
        subscriptionId: 'sub-123',
        amount: 99.99,
        currency: 'TRY',
        paymentMethod: 'CREDIT_CARD',
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

      const createdPayment = {
        id: 'pay-123',
        ...newPayment,
        status: 'PENDING',
        createdAt: new Date(),
        user: mockUser,
        subscription: mockSubscription,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prismaMock.payment.create.mockResolvedValue(createdPayment as any);

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newPayment)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should default currency to TRY if not provided', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.payment.create.mockResolvedValue({} as any);

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'user-123',
          amount: 99.99,
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(201);

      expect(prismaMock.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: 'TRY',
          }),
        })
      );
    });

    it('should return 400 if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'non-existent',
          amount: 99.99,
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(400);
    });

    it('should return 400 if subscription not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'user-123',
          subscriptionId: 'non-existent',
          amount: 99.99,
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(400);
    });

    it('should return 400 if subscription does not belong to user', async () => {
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

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'user-123',
          subscriptionId: 'sub-123',
          amount: 99.99,
          paymentMethod: 'CREDIT_CARD',
        })
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          // Missing required fields
          amount: 99.99,
        })
        .expect(400);
    });
  });

  describe('PATCH /api/payments/:id', () => {
    it('should update payment status', async () => {
      const existingPayment = {
        id: 'pay-123',
        userId: 'user-1',
        status: 'PENDING',
      };

      const updateData = {
        status: 'COMPLETED',
        transactionId: 'txn-456',
      };

      const updatedPayment = {
        ...existingPayment,
        ...updateData,
      };

      prismaMock.payment.findUnique.mockResolvedValue(existingPayment as any);
      prismaMock.payment.update.mockResolvedValue(updatedPayment as any);

      const response = await request(app)
        .patch('/api/payments/pay-123')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'COMPLETED');
      expect(response.body).toHaveProperty('transactionId', 'txn-456');
    });

    it('should return 404 if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await request(app)
        .patch('/api/payments/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ status: 'COMPLETED' })
        .expect(404);
    });
  });

  describe('DELETE /api/payments/:id', () => {
    it('should delete payment', async () => {
      const existingPayment = {
        id: 'pay-123',
        userId: 'user-1',
      };

      prismaMock.payment.findUnique.mockResolvedValue(existingPayment as any);
      prismaMock.payment.delete.mockResolvedValue(existingPayment as any);

      await request(app)
        .delete('/api/payments/pay-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(204);
    });

    it('should return 404 if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await request(app)
        .delete('/api/payments/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.payment.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid payment method', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'user-123',
          amount: 99.99,
          paymentMethod: 'INVALID_METHOD',
        })
        .expect(400);
    });
  });
});
