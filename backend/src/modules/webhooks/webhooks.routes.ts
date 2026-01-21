import { Router } from 'express';
import { WebhooksController } from './webhooks.controller';
import { verifyN8nWebhook } from './webhook.middleware';

const router = Router();
const webhooksController = new WebhooksController();

// n8n webhook endpoint
router.post('/n8n/message', verifyN8nWebhook, (req, res, next) =>
  webhooksController.handleN8nMessage(req, res, next)
);

// Health check
router.get('/n8n/health', (req, res) =>
  webhooksController.healthCheck(req, res)
);

export default router;
