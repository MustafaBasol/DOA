import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendTemplateMessage,
  scheduleMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  getScheduledMessageStats,
  processPendingMessages,
} from '../controllers/whatsapp.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send template messages
router.post('/send-template', sendTemplateMessage);

// Schedule messages
router.post('/schedule', scheduleMessage);
router.get('/scheduled', getScheduledMessages);
router.delete('/scheduled/:id', cancelScheduledMessage);
router.get('/scheduled/stats', getScheduledMessageStats);

// Process pending messages (internal/cron)
router.post('/process-pending', processPendingMessages);

export default router;
