import { Router } from 'express';
import { searchController } from './search.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search endpoints
router.post('/', searchController.search.bind(searchController));
router.get('/quick', searchController.quickSearch.bind(searchController));
router.get('/fields/:entity', searchController.getSearchFields.bind(searchController));

// Saved searches endpoints
router.post('/saved', searchController.createSavedSearch.bind(searchController));
router.get('/saved', searchController.getSavedSearches.bind(searchController));
router.get('/saved/:id', searchController.getSavedSearchById.bind(searchController));
router.patch('/saved/:id', searchController.updateSavedSearch.bind(searchController));
router.delete('/saved/:id', searchController.deleteSavedSearch.bind(searchController));
router.post('/saved/:id/execute', searchController.executeSavedSearch.bind(searchController));

export default router;
