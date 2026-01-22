import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Tüm rapor route'ları authentication gerektirir
router.use(authenticate);

// JSON Reports
router.get('/messages', (req, res, next) => reportsController.getMessagesReport(req, res, next));
router.get('/customers', (req, res, next) => reportsController.getCustomersReport(req, res, next));
router.get('/payments', (req, res, next) => reportsController.getPaymentsReport(req, res, next));
router.get('/subscriptions', (req, res, next) => reportsController.getSubscriptionsReport(req, res, next));

// Excel Exports
router.get('/messages/excel', (req, res, next) => reportsController.exportMessagesToExcel(req, res, next));
router.get('/customers/excel', (req, res, next) => reportsController.exportCustomersToExcel(req, res, next));
router.get('/payments/excel', (req, res, next) => reportsController.exportPaymentsToExcel(req, res, next));
router.get('/subscriptions/excel', (req, res, next) => reportsController.exportSubscriptionsToExcel(req, res, next));

// PDF Exports
router.get('/messages/pdf', (req, res, next) => reportsController.exportMessagesToPDF(req, res, next));
router.get('/payments/pdf', (req, res, next) => reportsController.exportPaymentsToPDF(req, res, next));

// Enhanced Reports
router.get('/analytics/pdf', (req, res, next) => reportsController.exportAnalyticsPDF(req, res, next));
router.get('/payments/summary', (req, res, next) => reportsController.exportPaymentSummaryExcel(req, res, next));
router.get('/subscriptions/expiring', (req, res, next) => reportsController.exportSubscriptionExpiryReport(req, res, next));
router.get('/users/activity', (req, res, next) => reportsController.exportUserActivityReport(req, res, next));

export default router;
