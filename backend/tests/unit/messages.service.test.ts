import { MessagesService } from '../../src/modules/messages/messages.service';
import { prismaMock } from '../setup';
import { AppError } from '../../src/middleware/errorHandler';

describe('MessagesService', () => {
  let messagesService: MessagesService;

  beforeEach(() => {
    messagesService = new MessagesService();
  });

  describe('createMessage', () => {
    it('should create a new message successfully', async () => {
      const messageData = {
        userId: 'user-123',
        n8nMessageId: 'n8n-msg-001',
        direction: 'INBOUND',
        fromNumber: '+905551234567',
        toNumber: '+905559876543',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '+905551234567',
        messageContent: 'Merhaba, bilgi almak istiyorum',
        messageType: 'text',
        mediaUrl: null,
        timestamp: '2026-01-21T10:00:00Z',
      };

      const expectedMessage = {
        id: 'msg-123',
        direction: 'INBOUND',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '+905551234567',
        messageContent: 'Merhaba, bilgi almak istiyorum',
        messageType: 'text',
        timestamp: new Date('2026-01-21T10:00:00Z'),
        readStatus: false,
        createdAt: new Date(),
      };

      prismaMock.whatsappMessage.create.mockResolvedValue(expectedMessage as any);

      const result = await messagesService.createMessage(messageData);

      expect(result).toEqual(expectedMessage);
      expect(prismaMock.whatsappMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: messageData.userId,
          n8nMessageId: messageData.n8nMessageId,
          direction: messageData.direction,
          customerName: messageData.customerName,
          readStatus: false,
        }),
        select: expect.any(Object),
      });
    });

    it('should default messageType to "text" if not provided', async () => {
      const messageData = {
        userId: 'user-123',
        n8nMessageId: 'n8n-msg-002',
        direction: 'OUTBOUND',
        fromNumber: '+905559876543',
        toNumber: '+905551234567',
        customerName: 'Ayşe Demir',
        customerPhone: '+905551234567',
        messageContent: 'Size yardımcı olabilirim',
        timestamp: new Date().toISOString(),
      };

      prismaMock.whatsappMessage.create.mockResolvedValue({} as any);

      await messagesService.createMessage(messageData);

      expect(prismaMock.whatsappMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            messageType: 'text',
          }),
        })
      );
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages with filters', async () => {
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
          timestamp: new Date(),
          readStatus: false,
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          direction: 'INBOUND',
          fromNumber: '+905551234567',
          toNumber: '+905559876543',
          customerName: 'Ahmet Yılmaz',
          customerPhone: '+905551234567',
          messageContent: 'Test message 2',
          messageType: 'text',
          mediaUrl: null,
          timestamp: new Date(),
          readStatus: false,
          createdAt: new Date(),
        },
      ];

      prismaMock.whatsappMessage.findMany.mockResolvedValue(mockMessages as any);
      prismaMock.whatsappMessage.count.mockResolvedValue(2);

      const filters = {
        page: 1,
        limit: 20,
        userId: 'user-123',
        readStatus: false,
      };

      const result = await messagesService.getMessages(filters);

      expect(result.messages).toEqual(mockMessages);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            readStatus: false,
          }),
          skip: 0,
          take: 20,
        })
      );
    });

    it('should apply search filter with OR conditions', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      const filters = {
        userId: 'user-123',
        search: 'Ahmet',
      };

      await messagesService.getMessages(filters);

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            OR: [
              { customerName: { contains: 'Ahmet', mode: 'insensitive' } },
              { customerPhone: { contains: 'Ahmet' } },
              { messageContent: { contains: 'Ahmet', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(50);

      const filters = {
        page: 3,
        limit: 10,
        userId: 'user-123',
      };

      const result = await messagesService.getMessages(filters);

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * 10
          take: 10,
        })
      );
    });

    it('should filter by customerPhone', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      const filters = {
        userId: 'user-123',
        customerPhone: '+905551234567',
      };

      await messagesService.getMessages(filters);

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            customerPhone: '+905551234567',
          }),
        })
      );
    });

    it('should filter by direction', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.whatsappMessage.count.mockResolvedValue(0);

      const filters = {
        userId: 'user-123',
        direction: 'INBOUND',
      };

      await messagesService.getMessages(filters);

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            direction: 'INBOUND',
          }),
        })
      );
    });
  });

  describe('getConversations', () => {
    it('should return conversations with unread counts and last messages', async () => {
      const mockGroupedData = [
        {
          customerPhone: '+905551234567',
          customerName: 'Ahmet Yılmaz',
          _count: { id: 5 },
          _max: { timestamp: new Date('2026-01-21T10:00:00Z') },
        },
        {
          customerPhone: '+905559876543',
          customerName: 'Ayşe Demir',
          _count: { id: 3 },
          _max: { timestamp: new Date('2026-01-21T09:00:00Z') },
        },
      ];

      const mockLastMessage = {
        messageContent: 'Son mesaj',
        direction: 'INBOUND',
        timestamp: new Date('2026-01-21T10:00:00Z'),
      };

      prismaMock.whatsappMessage.groupBy.mockResolvedValue(mockGroupedData as any);
      prismaMock.whatsappMessage.count.mockResolvedValue(2);
      prismaMock.whatsappMessage.findFirst.mockResolvedValue(mockLastMessage as any);

      const result = await messagesService.getConversations('user-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        customerPhone: '+905551234567',
        customerName: 'Ahmet Yılmaz',
        messageCount: 5,
        lastMessageTime: expect.any(Date),
        lastMessage: 'Son mesaj',
        lastMessageDirection: 'INBOUND',
        unreadCount: 2,
      });
      expect(prismaMock.whatsappMessage.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['customerPhone', 'customerName'],
          where: { userId: 'user-123' },
        })
      );
    });

    it('should count unread messages correctly for each conversation', async () => {
      const mockGroupedData = [
        {
          customerPhone: '+905551234567',
          customerName: 'Ahmet Yılmaz',
          _count: { id: 5 },
          _max: { timestamp: new Date() },
        },
      ];

      prismaMock.whatsappMessage.groupBy.mockResolvedValue(mockGroupedData as any);
      prismaMock.whatsappMessage.count.mockResolvedValue(3); // 3 unread
      prismaMock.whatsappMessage.findFirst.mockResolvedValue({
        messageContent: 'Test',
        direction: 'INBOUND',
        timestamp: new Date(),
      } as any);

      await messagesService.getConversations('user-123');

      expect(prismaMock.whatsappMessage.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          customerPhone: '+905551234567',
          readStatus: false,
          direction: 'INBOUND',
        },
      });
    });
  });

  describe('getMessageById', () => {
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

      const result = await messagesService.getMessageById('msg-123');

      expect(result).toEqual(mockMessage);
      expect(prismaMock.whatsappMessage.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-123' },
          include: expect.any(Object),
        })
      );
    });

    it('should throw 404 error if message not found', async () => {
      prismaMock.whatsappMessage.findUnique.mockResolvedValue(null);

      await expect(messagesService.getMessageById('non-existent')).rejects.toThrow(
        AppError
      );
      await expect(messagesService.getMessageById('non-existent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Message not found',
      });
    });

    it('should filter by userId if provided', async () => {
      prismaMock.whatsappMessage.findUnique.mockResolvedValue({
        id: 'msg-123',
      } as any);

      await messagesService.getMessageById('msg-123', 'user-123');

      expect(prismaMock.whatsappMessage.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-123', userId: 'user-123' },
        })
      );
    });
  });

  describe('updateMessageReadStatus', () => {
    it('should update message read status successfully', async () => {
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

      const result = await messagesService.updateMessageReadStatus(
        'msg-123',
        'user-123',
        true
      );

      expect(result.readStatus).toBe(true);
      expect(prismaMock.whatsappMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        data: { readStatus: true },
      });
    });

    it('should throw 404 error if message not found', async () => {
      prismaMock.whatsappMessage.findUnique.mockResolvedValue(null);

      await expect(
        messagesService.updateMessageReadStatus('non-existent', 'user-123', true)
      ).rejects.toThrow(AppError);
      await expect(
        messagesService.updateMessageReadStatus('non-existent', 'user-123', true)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Message not found',
      });
    });

    it('should throw 403 error if userId does not match', async () => {
      const mockMessage = {
        id: 'msg-123',
        userId: 'different-user',
        readStatus: false,
      };

      prismaMock.whatsappMessage.findUnique.mockResolvedValue(mockMessage as any);

      await expect(
        messagesService.updateMessageReadStatus('msg-123', 'user-123', true)
      ).rejects.toThrow(AppError);
      await expect(
        messagesService.updateMessageReadStatus('msg-123', 'user-123', true)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'Forbidden',
      });
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all messages in conversation as read', async () => {
      prismaMock.whatsappMessage.updateMany.mockResolvedValue({ count: 5 } as any);

      const result = await messagesService.markConversationAsRead(
        'user-123',
        '+905551234567'
      );

      expect(result).toEqual({ message: 'Conversation marked as read' });
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

    it('should handle conversation with no unread messages', async () => {
      prismaMock.whatsappMessage.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await messagesService.markConversationAsRead(
        'user-123',
        '+905551234567'
      );

      expect(result).toEqual({ message: 'Conversation marked as read' });
      expect(prismaMock.whatsappMessage.updateMany).toHaveBeenCalled();
    });
  });

  describe('getMessageStats', () => {
    it('should return message statistics', async () => {
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(15) // unread
        .mockResolvedValueOnce(60) // inbound
        .mockResolvedValueOnce(40); // outbound

      const result = await messagesService.getMessageStats('user-123');

      expect(result).toEqual({
        total: 100,
        unread: 15,
        inbound: 60,
        outbound: 40,
      });
      expect(prismaMock.whatsappMessage.count).toHaveBeenCalledTimes(4);
    });

    it('should count unread inbound messages correctly', async () => {
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(20);

      await messagesService.getMessageStats('user-123');

      expect(prismaMock.whatsappMessage.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          readStatus: false,
          direction: 'INBOUND',
        },
      });
    });

    it('should return zero stats for user with no messages', async () => {
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await messagesService.getMessageStats('user-456');

      expect(result).toEqual({
        total: 0,
        unread: 0,
        inbound: 0,
        outbound: 0,
      });
    });
  });
});
