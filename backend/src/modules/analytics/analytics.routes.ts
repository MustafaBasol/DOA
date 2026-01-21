import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Tüm analytics route'ları authentication gerektirir
router.use(authenticate);

// Analytics endpoints
router.get('/message-trends', (req, res, next) => analyticsController.getMessageTrends(req, res, next));
router.get('/customer-growth', (req, res, next) => analyticsController.getCustomerGrowth(req, res, next));
router.get('/revenue', (req, res, next) => analyticsController.getRevenueAnalysis(req, res, next));
router.get('/top-customers', (req, res, next) => analyticsController.getTopCustomers(req, res, next));
router.get('/peak-hours', (req, res, next) => analyticsController.getPeakHours(req, res, next));
router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));
router.get('/comparative', (req, res, next) => analyticsController.getComparative(req, res, next));

export default router;
