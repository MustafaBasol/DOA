import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { messageTemplateService } from './message-template.service';

const prisma = new PrismaClient();

export interface ScheduledMessageData {
  templateId: string;
  recipients: string[];
  variables: Record<string, any>;
  scheduledFor: Date;
}

export class WhatsAppService {
  private n8nWebhookUrl: string;

  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL || '';
  }

  /**
   * Send WhatsApp message via n8n webhook
   */
  async sendMessage(
    to: string,
    message: string,
    mediaUrl?: string
  ): Promise<boolean> {
    try {
      if (!this.n8nWebhookUrl) {
        console.error('N8N webhook URL not configured');
        return false;
      }

      const response = await axios.post(this.n8nWebhookUrl, {
        to,
        message,
        mediaUrl,
        timestamp: new Date().toISOString(),
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ WhatsApp message sent to ${to}`);
      return response.status === 200;
    } catch (error: any) {
      console.error('Failed to send WhatsApp message:', error.message);
      return false;
    }
  }

  /**
   * Send WhatsApp template message
   */
  async sendTemplateMessage(
    to: string,
    templateId: string,
    variables: Record<string, any>
  ): Promise<boolean> {
    try {
      const template = await messageTemplateService.getTemplateById(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      if (template.status !== 'ACTIVE') {
        throw new Error('Template is not active');
      }

      // Render template with variables
      const message = messageTemplateService.renderTemplate(
        template.content,
        variables
      );

      return await this.sendMessage(to, message);
    } catch (error: any) {
      console.error('Failed to send template message:', error.message);
      return false;
    }
  }

  /**
   * Send bulk template messages
   */
  async sendBulkTemplateMessage(
    recipients: string[],
    templateId: string,
    variables: Record<string, any>
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const sent = await this.sendTemplateMessage(recipient, templateId, variables);
      
      if (sent) {
        successCount++;
      } else {
        failedCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `✅ Bulk send complete: ${successCount} success, ${failedCount} failed`
    );

    return { success: successCount, failed: failedCount };
  }

  /**
   * Schedule message for later delivery
   */
  async scheduleMessage(
    userId: string,
    data: ScheduledMessageData
  ): Promise<any> {
    try {
      const scheduled = await prisma.scheduledMessage.create({
        data: {
          templateId: data.templateId,
          userId,
          recipients: data.recipients,
          variables: data.variables,
          scheduledFor: data.scheduledFor,
          status: 'PENDING',
        },
      });

      console.log(`✅ Message scheduled for ${data.scheduledFor}`);
      return scheduled;
    } catch (error) {
      console.error('Failed to schedule message:', error);
      throw error;
    }
  }

  /**
   * Process pending scheduled messages
   */
  async processPendingMessages(): Promise<number> {
    try {
      const now = new Date();

      // Get pending messages that should be sent now
      const pending = await prisma.scheduledMessage.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: now,
          },
        },
        include: {
          template: true,
        },
      });

      console.log(`📨 Processing ${pending.length} scheduled messages...`);

      for (const scheduled of pending) {
        // Mark as processing
        await prisma.scheduledMessage.update({
          where: { id: scheduled.id },
          data: { status: 'PROCESSING' },
        });

        // Send to all recipients
        const result = await this.sendBulkTemplateMessage(
          scheduled.recipients,
          scheduled.templateId,
          scheduled.variables as Record<string, any>
        );

        // Update status
        await prisma.scheduledMessage.update({
          where: { id: scheduled.id },
          data: {
            status: result.failed === 0 ? 'COMPLETED' : 'FAILED',
            sentAt: new Date(),
            successCount: result.success,
            failedCount: result.failed,
            errorMessage:
              result.failed > 0
                ? `${result.failed} recipients failed`
                : null,
          },
        });
      }

      return pending.length;
    } catch (error) {
      console.error('Failed to process pending messages:', error);
      return 0;
    }
  }

  /**
   * Get scheduled messages for user
   */
  async getUserScheduledMessages(userId: string) {
    return await prisma.scheduledMessage.findMany({
      where: { userId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
      },
      orderBy: { scheduledFor: 'desc' },
    });
  }

  /**
   * Cancel scheduled message
   */
  async cancelScheduledMessage(id: string, userId: string): Promise<void> {
    try {
      const scheduled = await prisma.scheduledMessage.findUnique({
        where: { id },
      });

      if (!scheduled) {
        throw new Error('Scheduled message not found');
      }

      if (scheduled.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (scheduled.status !== 'PENDING') {
        throw new Error('Cannot cancel message that is not pending');
      }

      await prisma.scheduledMessage.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      console.log(`✅ Scheduled message cancelled: ${id}`);
    } catch (error) {
      console.error('Failed to cancel scheduled message:', error);
      throw error;
    }
  }

  /**
   * Get statistics for scheduled messages
   */
  async getScheduledMessageStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, pending, completed, failed, cancelled] = await Promise.all([
      prisma.scheduledMessage.count({ where }),
      prisma.scheduledMessage.count({ where: { ...where, status: 'PENDING' } }),
      prisma.scheduledMessage.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.scheduledMessage.count({ where: { ...where, status: 'FAILED' } }),
      prisma.scheduledMessage.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    return {
      total,
      pending,
      completed,
      failed,
      cancelled,
    };
  }

  /**
   * Clean up old completed messages (older than 90 days)
   */
  async cleanupOldMessages(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await prisma.scheduledMessage.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'CANCELLED'] },
          sentAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      console.log(`🧹 Cleaned up ${result.count} old scheduled messages`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old messages:', error);
      return 0;
    }
  }
}

export const whatsAppService = new WhatsAppService();
