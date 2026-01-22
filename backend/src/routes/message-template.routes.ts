import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  duplicateTemplate,
  getTemplateStats,
  searchTemplates,
} from '../controllers/message-template.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/templates:
 *   post:
 *     tags: [Templates]
 *     summary: Create message template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 example: Welcome Message
 *               content:
 *                 type: string
 *                 example: Hello {{name}}, welcome to {{company}}!
 *               category:
 *                 type: string
 *                 example: MARKETING
 *               language:
 *                 type: string
 *                 enum: [TR, EN, FR]
 *     responses:
 *       201:
 *         description: Template created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageTemplate'
 */
router.post('/', createTemplate);

/**
 * @swagger
 * /api/templates:
 *   get:
 *     tags: [Templates]
 *     summary: Get all templates
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, INACTIVE, ARCHIVED]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/', getTemplates);

/**
 * @swagger
 * /api/templates/search:
 *   get:
 *     tags: [Templates]
 *     summary: Search templates
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchTemplates);

/**
 * @swagger
 * /api/templates/stats:
 *   get:
 *     tags: [Templates]
 *     summary: Get template statistics
 *     responses:
 *       200:
 *         description: Template statistics
 */
router.get('/stats', getTemplateStats);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     tags: [Templates]
 *     summary: Get template by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageTemplate'
 */
router.get('/:id', getTemplateById);

/**
 * @swagger
 * /api/templates/{id}:
 *   patch:
 *     tags: [Templates]
 *     summary: Update template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template updated
 */
router.patch('/:id', updateTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     tags: [Templates]
 *     summary: Delete template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted
 */
router.delete('/:id', deleteTemplate);

/**
 * @swagger
 * /api/templates/preview:
 *   post:
 *     tags: [Templates]
 *     summary: Preview template with variables
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - variables
 *             properties:
 *               content:
 *                 type: string
 *               variables:
 *                 type: object
 *     responses:
 *       200:
 *         description: Rendered template
 */
router.post('/preview', previewTemplate);

/**
 * @swagger
 * /api/templates/{id}/duplicate:
 *   post:
 *     tags: [Templates]
 *     summary: Duplicate template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Template duplicated
 */
router.post('/:id/duplicate', duplicateTemplate);

export default router;
