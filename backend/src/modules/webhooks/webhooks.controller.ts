import { Request, Response, NextFunction } from 'express';
import { MessagesService } from '../messages/messages.service';
import { PrismaClient } from '@prisma/client';
import { socketService } from '../../socket';
import { emailService } from '../notifications/email.service';
import { serverConfig } from '../../config';

const messagesService = new MessagesService();
const prisma = new PrismaClient();

export class WebhooksController {
  async handleN8nMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        client_id,
        to_number,
        n8n_message_id,
        direction,
        from_number,
        customer_name,
        customer_phone,
        message_content,
        message_type,
        media_url,
        timestamp,
      } = req.body;

      // Find user by client_id or WhatsApp number
      let userId = client_id;

      if (!userId && to_number) {
        // Try to find user by WhatsApp number (for business account)
        const user = await prisma.user.findFirst({
          where: { whatsappNumber: to_number },
        });

        if (!user) {
          res.status(404).json({
            error: 'User not found',
            message: 'No user associated with this WhatsApp number',
          });
          return;
        }

        userId = user.id;
      }

      if (!userId) {
        res.status(400).json({
          error: 'Bad request',
          message: 'client_id or to_number is required',
        });
        return;
      }

      // Create message
      const message = await messagesService.createMessage({
        userId,
        n8nMessageId: n8n_message_id,
        direction: direction || 'INBOUND',
        fromNumber: from_number,
        toNumber: to_number,
        customerName: customer_name,
        customerPhone: customer_phone,
        messageContent: message_content,
        messageType: message_type || 'text',
        mediaUrl: media_url,
        timestamp: timestamp || new Date(),
      });

      // Emit real-time notification via WebSocket
      if (socketService) {
        // Notify the specific user
        socketService.emitNewMessage(userId, {
          id: message.id,
          customerName: customer_name,
          customerPhone: customer_phone,
          messageContent: message_content,
          messageType: message_type || 'text',
          direction: direction || 'INBOUND',
          timestamp: message.timestamp,
          isRead: message.readStatus,
        });

        // Also notify all admins
        socketService.emitToAdmins('new_message', {
          id: message.id,
          userId,
          customerName: customer_name,
          customerPhone: customer_phone,
          messageContent: message_content,
          direction: direction || 'INBOUND',
        });

        console.log(`📨 WebSocket notification sent for message ${message.id}`);
      }

      // Send email notification to user (only for inbound messages)
      if (direction === 'INBOUND' || !direction) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId.toString() },
            select: { email: true, fullName: true, companyName: true },
          });

          if (user && user.email) {
            await emailService.sendNewMessageNotification({
              to: user.email,
              customerName: customer_name || 'Bilinmeyen',
              customerPhone: customer_phone || from_number || 'Bilinmeyen',
              messageContent: message_content || '(Medya mesajı)',
              panelUrl: `${serverConfig.frontendUrl}/client.html`,
            });
            console.log(`📧 Email notification sent to ${user.email}`);
          }
        } catch (emailError) {
          // Don't fail the request if email fails
          console.error('⚠️ Email notification error:', emailError);
        }
      }

      res.status(201).json({
        success: true,
        message_id: message.id,
        stored_at: message.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(req: Request, res: Response) {
    res.json({
      status: 'ok',
      service: 'n8n-webhook',
      timestamp: new Date().toISOString(),
    });
  }
}
