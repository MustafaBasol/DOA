import request from 'supertest';
import express, { Express } from 'express';
import messagesRouter from '../../src/modules/messages/messages.routes';
import { prismaMock } from '../setup';
import * as jwtUtils from '../../src/utils/jwt';

// Mock JWT utilities
jest.mock('../../src/utils/jwt');

describe('Messages API Integration Tests', () => {
  let app: Express;
  const validToken = 'valid-jwt-token';
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'CLIENT',
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/messages', messagesRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockUser);
  });

  describe('GET /api/messages', () => {
    it('should return paginated messages', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          direction: 'INBOUND',
          fromNumber: '+905551234567',
          toNumber: '+905559876543',
          customerName: 'Ahmet Yılmaz',
          customerPhone: '+905551234567',
          messageContent: 'Test message 1',
          messageType: 'text',
          mediaUrl: null,
          timestamp: new Date('2026-01-21T10:00:00Z'),
          readStatus: false,
          createdAt: new Date(),
        },
      ];

      prismaMock.whatsappMessage.findMany.mockResolvedValue(mockMessages as any);
      prismaMock.whatsappMessage.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('messages');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter messages by customerPhone', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await request(app)
        .get('/api/messages?customerPhone=%2B905551234567')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerPhone: '+905551234567',
          }),
        })
      );
    });

    it('should filter messages by readStatus', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await request(app)
        .get('/api/messages?readStatus=false')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            readStatus: false,
          }),
        })
      );
    });

    it('should apply search filter', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await request(app)
        .get('/api/messages?search=Ahmet')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { customerName: { contains: 'Ahmet', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(50);

      const response = await request(app)
        .get('/api/messages?page=2&limit=10')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/messages').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await request(app)
        .get('/api/messages')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should return grouped conversations', async () => {
      prismaMock.whatsappMessage.groupBy.mockResolvedValue([
        {
          customerPhone: '+905551234567',
          customerName: 'Ahmet Yılmaz',
          _count: { id: 5 },
          _max: { timestamp: new Date('2026-01-21T10:00:00Z') },
        },
      ] as any);
      prismaMock.whatsappMessage.count.mockResolvedValue(2);
      prismaMock.whatsappMessage.findFirst.mockResolvedValue({
        messageContent: 'Son mesaj',
        direction: 'INBOUND',
        timestamp: new Date('2026-01-21T10:00:00Z'),
      } as any);

      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('customerPhone');
      expect(response.body[0]).toHaveProperty('unreadCount');
      expect(response.body[0]).toHaveProperty('lastMessage');
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/messages/conversations').expect(401);
    });
  });

  describe('GET /api/messages/stats', () => {
    it('should return message statistics', async () => {
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(15) // unread
        .mockResolvedValueOnce(60) // inbound
        .mockResolvedValueOnce(40); // outbound

      const response = await request(app)
        .get('/api/messages/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        total: 100,
        unread: 15,
        inbound: 60,
        outbound: 40,
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/messages/stats').expect(401);
    });
  });

  describe('GET /api/messages/:id', () => {
    it('should return message by id', async () => {
      const mockMessage = {
        id: 'msg-123',
        direction: 'INBOUND',
        fromNumber: '+905551234567',
        toNumber: '+905559876543',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '+905551234567',
        messageContent: 'Test message',
        messageType: 'text',
        timestamp: new Date(),
        readStatus: false,
        user: {
          id: 'user-123',
          fullName: 'Test User',
          companyName: 'Test Company',
        },
      };

      prismaMock.whatsappMessage.findUnique.mockResolvedValue(mockMessage as any);

      const response = await request(app)
        .get('/api/messages/msg-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'msg-123');
      expect(response.body).toHaveProperty('customerName', 'Ahmet Yılmaz');
    });

    it('should return 404 if message not found', async () => {
      prismaMock.whatsappMessage.findUnique.mockResolvedValue(null);

      await request(app)
        .get('/api/messages/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/messages/msg-123').expect(401);
    });
  });

  describe('PATCH /api/messages/:id/read', () => {
    it('should update message read status', async () => {
      const mockMessage = {
        id: 'msg-123',
        userId: 'user-123',
        readStatus: false,
      };

      const updatedMessage = {
        ...mockMessage,
        readStatus: true,
      };

      prismaMock.whatsappMessage.findUnique.mockResolvedValue(mockMessage as any);
      prismaMock.whatsappMessage.update.mockResolvedValue(updatedMessage as any);

      const response = await request(app)
        .patch('/api/messages/msg-123/read')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ readStatus: true })
        .expect(200);

      expect(response.body).toHaveProperty('readStatus', true);
    });

    it('should return 404 if message not found', async () => {
      prismaMock.whatsappMessage.findUnique.mockResolvedValue(null);

      await request(app)
        .patch('/api/messages/non-existent/read')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ readStatus: true })
        .expect(404);
    });

    it('should return 403 if user does not own message', async () => {
      const mockMessage = {
        id: 'msg-123',
        userId: 'different-user',
        readStatus: false,
      };

      prismaMock.whatsappMessage.findUnique.mockResolvedValue(mockMessage as any);

      await request(app)
        .patch('/api/messages/msg-123/read')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ readStatus: true })
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .patch('/api/messages/msg-123/read')
        .send({ readStatus: true })
        .expect(401);
    });
  });

  describe('POST /api/messages/conversations/mark-read', () => {
    it('should mark all messages in conversation as read', async () => {
      prismaMock.whatsappMessage.updateMany.mockResolvedValue({ count: 5 } as any);

      const response = await request(app)
        .post('/api/messages/conversations/mark-read')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ customerPhone: '+905551234567' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Conversation marked as read');
      expect(prismaMock.whatsappMessage.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          customerPhone: '+905551234567',
          readStatus: false,
        },
        data: {
          readStatus: true,
        },
      });
    });

    it('should return 400 without customerPhone', async () => {
      await request(app)
        .post('/api/messages/conversations/mark-read')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/messages/conversations/mark-read')
        .send({ customerPhone: '+905551234567' })
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.whatsappMessage.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate query parameters', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      await request(app)
        .get('/api/messages?page=invalid&limit=abc')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Should use default values
      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });
  });
});
