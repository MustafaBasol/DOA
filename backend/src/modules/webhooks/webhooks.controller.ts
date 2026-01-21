import { Request, Response, NextFunction } from 'express';
import { MessagesService } from '../messages/messages.service';
import { PrismaClient } from '@prisma/client';

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
