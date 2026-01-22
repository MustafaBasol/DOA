import { Router } from 'express';
import { MessagesController } from './messages.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const messagesController = new MessagesController();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Get messages
 *     description: Get filtered list of WhatsApp messages
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [INBOUND, OUTBOUND]
 *       - in: query
 *         name: readStatus
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 */
router.get('/', authenticate, (req, res, next) =>
  messagesController.getMessages(req, res, next)
);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: Get conversations
 *     description: Get messages grouped by customer
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', authenticate, (req, res, next) =>
  messagesController.getConversations(req, res, next)
);

/**
 * @swagger
 * /api/messages/stats:
 *   get:
 *     tags: [Messages]
 *     summary: Get message statistics
 *     description: Get message counts and statistics
 *     responses:
 *       200:
 *         description: Message statistics
 */
router.get('/stats', authenticate, (req, res, next) =>
  messagesController.getStats(req, res, next)
);

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     tags: [Messages]
 *     summary: Get message by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 */
router.get('/:id', authenticate, (req, res, next) =>
  messagesController.getMessageById(req, res, next)
);

/**
 * @swagger
 * /api/messages/{id}/read:
 *   patch:
 *     tags: [Messages]
 *     summary: Mark message as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message updated
 */
router.patch('/:id/read', authenticate, (req, res, next) =>
  messagesController.updateMessageReadStatus(req, res, next)
);

/**
 * @swagger
 * /api/messages/conversations/mark-read:
 *   post:
 *     tags: [Messages]
 *     summary: Mark conversation as read
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.post('/conversations/mark-read', authenticate, (req, res, next) =>
  messagesController.markConversationAsRead(req, res, next)
);

export default router;
