import { Request, Response, NextFunction } from 'express';
import { analyticsService, TimeRange } from './analytics.service';
import { AppError } from '../../middleware/errorHandler';

export class AnalyticsController {
  // GET /api/analytics/message-trends
  async getMessageTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = this.parseTimeRange(req.query);
      const userId = req.user?.role === 'CLIENT' ? req.user.id : req.query.userId as string | undefined;

      const data = await analyticsService.getMessageTrends(timeRange, userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/analytics/customer-growth
  async getCustomerGrowth(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = this.parseTimeRange(req.query);
      const userId = req.user?.role === 'CLIENT' ? req.user.id : req.query.userId as string | undefined;

      const data = await analyticsService.getCustomerGrowth(timeRange, userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/analytics/revenue
  async getRevenueAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = this.parseTimeRange(req.query);
      const userId = req.user?.role === 'CLIENT' ? req.user.id : req.query.userId as string | undefined;

      const data = await analyticsService.getRevenueAnalysis(timeRange, userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/analytics/top-customers
  async getTopCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const userId = req.user?.role === 'CLIENT' ? req.user.id : req.query.userId as string | undefined;

      const data = await analyticsService.getTopCustomers(limit, userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/analytics/peak-hours
  async getPeakHours(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = this.parseTimeRange(req.query);
      const userId = req.user?.role === 'CLIENT' ? req.user.id : req.query.userId as string | undefined;

      const data = await analyticsService.getPeakHours(timeRange, userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/analytics/overview
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = this.parseTimeRange(req.query);
      const userId = req.user?.role === 'CLIENT' ? req.user.id : req.query.userId as string | undefined;

      const data = await analyticsService.getOverallStats(timeRange, userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/analytics/comparative
  async getComparative(req: Request, res: Response, next: NextFunction) {
    try {
      const currentRange = this.parseTimeRange(req.query);
      
      // Önceki dönem için aynı uzunlukta bir range hesapla
      const rangeDuration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
      const previousRange: TimeRange = {
        startDate: new Date(currentRange.startDate.getTime() - rangeDuration),
        endDate: new Date(currentRange.startDate.getTime() - 1),
      };

      const userId = req.user?.role === 'CLIENT' ? req.user.id : req.query.userId as string | undefined;

      const data = await analyticsService.getComparativeAnalysis(currentRange, previousRange, userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper: Parse time range from query
  private parseTimeRange(query: any): TimeRange {
    let startDate: Date;
    let endDate: Date;

    if (query.startDate && query.endDate) {
      // Custom range
      try {
        startDate = new Date(query.startDate);
        endDate = new Date(query.endDate);
      } catch (error) {
        throw new AppError(400, 'Invalid date format');
      }
    } else if (query.period) {
      // Preset periods
      const now = new Date();
      endDate = now;

      switch (query.period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          // Default: last 30 days
          startDate = new Date(now.setDate(now.getDate() - 30));
      }
    } else {
      // Default: last 30 days
      const now = new Date();
      endDate = now;
      startDate = new Date(now.setDate(now.getDate() - 30));
    }

    return { startDate, endDate };
  }
}

export const analyticsController = new AnalyticsController();
