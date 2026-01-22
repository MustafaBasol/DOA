import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SocketUser {
  id: number;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CLIENT';
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export class SocketService {
  private io: Server;

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as SocketUser;

        // Verify user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.id.toString() },
          select: { id: true, email: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.user = {
          id: parseInt(user.id),
          email: user.email,
          role: user.role,
        };

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ User connected: ${socket.user?.email} (ID: ${socket.user?.id})`);

      // Join user-specific room
      if (socket.user) {
        const userRoom = `user:${socket.user.id}`;
        socket.join(userRoom);
        console.log(`📍 User ${socket.user.id} joined room: ${userRoom}`);

        // Admin and Manager join admin room
        if (socket.user.role === 'ADMIN' || socket.user.role === 'SUPER_ADMIN' || socket.user.role === 'MANAGER') {
          socket.join('admin');
          console.log(`👑 Admin ${socket.user.id} joined admin room`);
        }
      }

      // Handle typing indicator
      socket.on('typing', (data: { conversationId: number; isTyping: boolean }) => {
        if (socket.user) {
          // Broadcast to all users in the conversation except sender
          socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
            userId: socket.user.id,
            conversationId: data.conversationId,
            isTyping: data.isTyping,
          });
        }
      });

      // Handle join conversation room
      socket.on('join_conversation', (conversationId: number) => {
        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        console.log(`💬 User ${socket.user?.id} joined conversation: ${conversationId}`);
      });

      // Handle leave conversation room
      socket.on('leave_conversation', (conversationId: number) => {
        const roomName = `conversation:${conversationId}`;
        socket.leave(roomName);
        console.log(`🚪 User ${socket.user?.id} left conversation: ${conversationId}`);
      });

      // Handle mark as read
      socket.on('mark_read', async (data: { messageId: number }) => {
        try {
          if (socket.user) {
            // Update message read status in database
            await prisma.whatsappMessage.update({
              where: { id: data.messageId.toString() },
              data: { readStatus: true },
            });

            // Broadcast to all users (admin + client)
            this.io.emit('message_read', {
              messageId: data.messageId,
              readBy: socket.user.id,
              readAt: new Date(),
            });
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`❌ User disconnected: ${socket.user?.email} (Reason: ${reason})`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  // Emit new message to specific user
  public emitNewMessage(userId: number, message: any) {
    const userRoom = `user:${userId}`;
    this.io.to(userRoom).emit('new_message', message);
    console.log(`📨 New message emitted to user: ${userId}`);
  }

  // Emit new message to conversation
  public emitToConversation(conversationId: number, event: string, data: any) {
    const roomName = `conversation:${conversationId}`;
    this.io.to(roomName).emit(event, data);
    console.log(`📨 Event '${event}' emitted to conversation: ${conversationId}`);
  }

  // Emit to all admins
  public emitToAdmins(event: string, data: any) {
    this.io.to('admin').emit(event, data);
    console.log(`👑 Event '${event}' emitted to all admins`);
  }

  // Emit to all connected clients
  public emitToAll(event: string, data: any) {
    this.io.emit(event, data);
    console.log(`🌐 Event '${event}' emitted to all users`);
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.io.sockets.sockets.size;
  }

  // Check if user is online
  public async isUserOnline(userId: number): Promise<boolean> {
    const userRoom = `user:${userId}`;
    const sockets = await this.io.in(userRoom).fetchSockets();
    return sockets.length > 0;
  }

  // Get Socket.IO instance
  public getIO(): Server {
    return this.io;
  }
}

export let socketService: SocketService;

export const initializeSocket = (httpServer: HTTPServer): SocketService => {
  socketService = new SocketService(httpServer);
  console.log('🔌 Socket.IO initialized');
  return socketService;
};
