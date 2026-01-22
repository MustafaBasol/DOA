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

// Template CRUD
router.post('/', createTemplate);
router.get('/', getTemplates);
router.get('/search', searchTemplates);
router.get('/stats', getTemplateStats);
router.get('/:id', getTemplateById);
router.patch('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Template operations
router.post('/preview', previewTemplate);
router.post('/:id/duplicate', duplicateTemplate);

export default router;
