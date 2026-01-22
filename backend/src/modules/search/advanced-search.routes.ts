import { Router } from 'express';
import { advancedSearchController } from './advanced-search.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Saved Searches
router.post('/saved', (req, res, next) => advancedSearchController.createSavedSearch(req, res, next));
router.get('/saved', (req, res, next) => advancedSearchController.getSavedSearches(req, res, next));
router.get('/saved/:id', (req, res, next) => advancedSearchController.getSavedSearchById(req, res, next));
router.patch('/saved/:id', (req, res, next) => advancedSearchController.updateSavedSearch(req, res, next));
router.delete('/saved/:id', (req, res, next) => advancedSearchController.deleteSavedSearch(req, res, next));

// Advanced Search
router.post('/advanced', (req, res, next) => advancedSearchController.advancedSearch(req, res, next));

// Search Suggestions (Autocomplete)
router.get('/suggestions', (req, res, next) => advancedSearchController.getSearchSuggestions(req, res, next));

export default router;
