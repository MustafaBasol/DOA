import { PrismaClient, MessageDirection } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class MessagesService {
  async createMessage(data: any) {
    const message = await prisma.whatsappMessage.create({
      data: {
        userId: data.userId,
        n8nMessageId: data.n8nMessageId,
        direction: data.direction,
        fromNumber: data.fromNumber,
        toNumber: data.toNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        messageContent: data.messageContent,
        messageType: data.messageType || 'text',
        mediaUrl: data.mediaUrl,
        timestamp: new Date(data.timestamp),
        readStatus: false,
      },
      select: {
        id: true,
        direction: true,
        customerName: true,
        customerPhone: true,
        messageContent: true,
        messageType: true,
        timestamp: true,
        readStatus: true,
        createdAt: true,
      },
    });

    return message;
  }

  async getMessages(filters: any) {
    const {
      page = 1,
      limit = 20,
      userId,
      customerPhone,
      readStatus,
      direction,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (customerPhone) {
      where.customerPhone = customerPhone;
    }

    if (readStatus !== undefined) {
      where.readStatus = readStatus;
    }

    if (direction) {
      where.direction = direction;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { messageContent: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [messages, total] = await Promise.all([
      prisma.whatsappMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          direction: true,
          fromNumber: true,
          toNumber: true,
          customerName: true,
          customerPhone: true,
          messageContent: true,
          messageType: true,
          mediaUrl: true,
          timestamp: true,
          readStatus: true,
          createdAt: true,
        },
      }),
      prisma.whatsappMessage.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversations(userId: string) {
    // Group messages by customer phone
    const conversations = await prisma.whatsappMessage.groupBy({
      by: ['customerPhone', 'customerName'],
      where: { userId },
      _count: {
        id: true,
      },
      _max: {
        timestamp: true,
      },
      orderBy: {
        _max: {
          timestamp: 'desc',
        },
      },
    });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.whatsappMessage.count({
          where: {
            userId,
            customerPhone: conv.customerPhone,
            readStatus: false,
            direction: MessageDirection.INBOUND,
          },
        });

        // Get last message
        const lastMessage = await prisma.whatsappMessage.findFirst({
          where: {
            userId,
            customerPhone: conv.customerPhone,
          },
          orderBy: { timestamp: 'desc' },
          select: {
            messageContent: true,
            direction: true,
            timestamp: true,
          },
        });

        return {
          customerPhone: conv.customerPhone,
          customerName: conv.customerName,
          messageCount: conv._count.id,
          lastMessageTime: conv._max.timestamp,
          lastMessage: lastMessage?.messageContent,
          lastMessageDirection: lastMessage?.direction,
          unreadCount,
        };
      })
    );

    return conversationsWithUnread;
  }

  async getMessageById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const message = await prisma.whatsappMessage.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
          },
        },
      },
    });

    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    return message;
  }

  async updateMessageReadStatus(id: string, userId: string, readStatus: boolean) {
    const message = await prisma.whatsappMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    if (message.userId !== userId) {
      throw new AppError(403, 'Forbidden');
    }

    const updated = await prisma.whatsappMessage.update({
      where: { id },
      data: { readStatus },
    });

    return updated;
  }

  async markConversationAsRead(userId: string, customerPhone: string) {
    await prisma.whatsappMessage.updateMany({
      where: {
        userId,
        customerPhone,
        readStatus: false,
      },
      data: {
        readStatus: true,
      },
    });

    return { message: 'Conversation marked as read' };
  }

  async getMessageStats(userId: string) {
    const [total, unread, inbound, outbound] = await Promise.all([
      prisma.whatsappMessage.count({
        where: { userId },
      }),
      prisma.whatsappMessage.count({
        where: { userId, readStatus: false, direction: MessageDirection.INBOUND },
      }),
      prisma.whatsappMessage.count({
        where: { userId, direction: MessageDirection.INBOUND },
      }),
      prisma.whatsappMessage.count({
        where: { userId, direction: MessageDirection.OUTBOUND },
      }),
    ]);

    return {
      total,
      unread,
      inbound,
      outbound,
    };
  }
}
