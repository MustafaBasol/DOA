import { Response, NextFunction } from 'express';
import { MessagesService } from './messages.service';
import { AuthRequest } from '../../middleware/auth';

const messagesService = new MessagesService();

export class MessagesController {
  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const userId = userRole === 'ADMIN' ? req.query.userId as string : req.user!.sub;

      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        userId,
        customerPhone: req.query.customerPhone as string,
        readStatus: req.query.readStatus === 'true' ? true : req.query.readStatus === 'false' ? false : undefined,
        direction: req.query.direction as string,
        search: req.query.search as string,
      };

      const result = await messagesService.getMessages(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const userId = userRole === 'ADMIN' 
        ? req.query.userId as string || req.user!.sub
        : req.user!.sub;

      const conversations = await messagesService.getConversations(userId);
      res.json({ conversations });
    } catch (error) {
      next(error);
    }
  }

  async getMessageById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const userId = userRole === 'CLIENT' ? req.user!.sub : undefined;

      const message = await messagesService.getMessageById(req.params.id, userId);
      res.json(message);
    } catch (error) {
      next(error);
    }
  }

  async updateMessageReadStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const { readStatus } = req.body;

      const message = await messagesService.updateMessageReadStatus(
        req.params.id,
        userId,
        readStatus
      );
      res.json(message);
    } catch (error) {
      next(error);
    }
  }

  async markConversationAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const { customerPhone } = req.body;

      const result = await messagesService.markConversationAsRead(userId, customerPhone);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const userId = userRole === 'ADMIN'
        ? req.query.userId as string || req.user!.sub
        : req.user!.sub;

      const stats = await messagesService.getMessageStats(userId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
