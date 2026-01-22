import { Request, Response } from 'express';
import { whatsAppService } from '../services/whatsapp.service';

/**
 * Send template message to recipients
 */
export const sendTemplateMessage = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { recipients, templateId, variables } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const result = await whatsAppService.sendBulkTemplateMessage(
      recipients,
      templateId,
      variables || {}
    );

    res.json({
      success: true,
      message: 'Messages sent',
      result: {
        success: result.success,
        failed: result.failed,
      },
    });
  } catch (error: any) {
    console.error('Send template message error:', error);
    res.status(500).json({ error: error.message || 'Failed to send messages' });
  }
};

/**
 * Schedule message for later delivery
 */
export const scheduleMessage = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { recipients, templateId, variables, scheduledFor } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    if (!scheduledFor) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const scheduled = await whatsAppService.scheduleMessage(userId, {
      templateId,
      recipients,
      variables: variables || {},
      scheduledFor: scheduledDate,
    });

    res.status(201).json({
      success: true,
      message: 'Message scheduled successfully',
      scheduled,
    });
  } catch (error: any) {
    console.error('Schedule message error:', error);
    res.status(500).json({ error: error.message || 'Failed to schedule message' });
  }
};

/**
 * Get user's scheduled messages
 */
export const getScheduledMessages = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const messages = await whatsAppService.getUserScheduledMessages(userId);

    res.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Get scheduled messages error:', error);
    res.status(500).json({ error: error.message || 'Failed to get scheduled messages' });
  }
};

/**
 * Cancel scheduled message
 */
export const cancelScheduledMessage = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await whatsAppService.cancelScheduledMessage(id, userId);

    res.json({
      success: true,
      message: 'Scheduled message cancelled',
    });
  } catch (error: any) {
    console.error('Cancel scheduled message error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel message' });
  }
};

/**
 * Get scheduled message statistics
 */
export const getScheduledMessageStats = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Super admins and admins can see all stats
    const stats = await whatsAppService.getScheduledMessageStats(
      ['SUPER_ADMIN', 'ADMIN'].includes(userRole || '') ? undefined : userId
    );

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get stats' });
  }
};

/**
 * Process pending scheduled messages (internal endpoint)
 */
export const processPendingMessages = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userRole = req.user?.role;

    // Only super admins can trigger this
    if (userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const processed = await whatsAppService.processPendingMessages();

    res.json({
      success: true,
      message: `Processed ${processed} scheduled messages`,
      processed,
    });
  } catch (error: any) {
    console.error('Process pending messages error:', error);
    res.status(500).json({ error: error.message || 'Failed to process messages' });
  }
};
