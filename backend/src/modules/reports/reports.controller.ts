import { Request, Response, NextFunction } from 'express';
import { reportsService, ReportFilters } from './reports.service';
import { enhancedReportsService } from './enhanced-reports.service';
import { AppError } from '../../middleware/errorHandler';

export class ReportsController {
  // GET /api/reports/messages - Mesaj raporu JSON
  async getMessagesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const report = await reportsService.getMessagesReport(filters);
      
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/customers - Müşteri raporu JSON
  async getCustomersReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const report = await reportsService.getCustomersReport(filters);
      
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/payments - Ödeme raporu JSON
  async getPaymentsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const report = await reportsService.getPaymentsReport(filters);
      
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/subscriptions - Abonelik raporu JSON
  async getSubscriptionsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const report = await reportsService.getSubscriptionsReport(filters);
      
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/messages/excel - Mesaj Excel export
  async exportMessagesToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await reportsService.exportMessagesToExcel(filters);
      
      const filename = `mesaj-raporu-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/customers/excel - Müşteri Excel export
  async exportCustomersToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await reportsService.exportCustomersToExcel(filters);
      
      const filename = `musteri-raporu-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/payments/excel - Ödeme Excel export
  async exportPaymentsToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await reportsService.exportPaymentsToExcel(filters);
      
      const filename = `odeme-raporu-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/subscriptions/excel - Abonelik Excel export
  async exportSubscriptionsToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await reportsService.exportSubscriptionsToExcel(filters);
      
      const filename = `abonelik-raporu-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/messages/pdf - Mesaj PDF export
  async exportMessagesToPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await reportsService.exportMessagesToPDF(filters);
      
      const filename = `mesaj-raporu-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/payments/pdf - Ödeme PDF export
  async exportPaymentsToPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await reportsService.exportPaymentsToPDF(filters);
      
      const filename = `odeme-raporu-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/analytics/pdf - Comprehensive Analytics PDF
  async exportAnalyticsPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await enhancedReportsService.generateAnalyticsReportPDF(filters);
      
      const filename = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/payments/summary - Payment Summary Excel with monthly breakdown
  async exportPaymentSummaryExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await enhancedReportsService.generatePaymentSummaryExcel(filters);
      
      const filename = `payment-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/subscriptions/expiring - Expiring Subscriptions Report
  async exportSubscriptionExpiryReport(_req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await enhancedReportsService.generateSubscriptionExpiryReport();
      
      const filename = `expiring-subscriptions-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reports/users/activity - User Activity Report
  async exportUserActivityReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = this.parseFilters(req.query);
      const buffer = await enhancedReportsService.generateUserActivityReport(filters);
      
      const filename = `user-activity-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // Helper: Parse query filters
  private parseFilters(query: any): ReportFilters {
    const filters: ReportFilters = {};

    if (query.userId) filters.userId = query.userId;
    if (query.status) filters.status = query.status;
    if (query.direction) filters.direction = query.direction;
    if (query.customerPhone) filters.customerPhone = query.customerPhone;
    
    if (query.startDate) {
      try {
        filters.startDate = new Date(query.startDate);
      } catch (error) {
        throw new AppError(400, 'Invalid startDate format');
      }
    }
    
    if (query.endDate) {
      try {
        filters.endDate = new Date(query.endDate);
      } catch (error) {
        throw new AppError(400, 'Invalid endDate format');
      }
    }

    return filters;
  }
}

export const reportsController = new ReportsController();
