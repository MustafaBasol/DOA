import { Router } from 'express';
import { MessagesController } from './messages.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const messagesController = new MessagesController();

// Get messages (filtered)
router.get('/', authenticate, (req, res, next) =>
  messagesController.getMessages(req, res, next)
);

// Get conversations (grouped by customer)
router.get('/conversations', authenticate, (req, res, next) =>
  messagesController.getConversations(req, res, next)
);

// Get message stats
router.get('/stats', authenticate, (req, res, next) =>
  messagesController.getStats(req, res, next)
);

// Get single message
router.get('/:id', authenticate, (req, res, next) =>
  messagesController.getMessageById(req, res, next)
);

// Update message read status
router.patch('/:id/read', authenticate, (req, res, next) =>
  messagesController.updateMessageReadStatus(req, res, next)
);

// Mark conversation as read
router.post('/conversations/mark-read', authenticate, (req, res, next) =>
  messagesController.markConversationAsRead(req, res, next)
);

export default router;
