import { analyticsService, TimeRange } from '../../src/modules/analytics/analytics.service';
import { prismaMock } from '../setup';

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTimeRange: TimeRange = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  };

  describe('getMessageTrends', () => {
    it('should return daily message trends grouped by date', async () => {
      const mockMessages = [
        { timestamp: new Date('2024-01-15T10:30:00'), direction: 'INBOUND' },
        { timestamp: new Date('2024-01-15T11:45:00'), direction: 'OUTBOUND' },
        { timestamp: new Date('2024-01-15T14:20:00'), direction: 'INBOUND' },
        { timestamp: new Date('2024-01-16T09:15:00'), direction: 'OUTBOUND' }
      ];

      prismaMock.whatsappMessage.findMany.mockResolvedValue(mockMessages as any);

      const result = await analyticsService.getMessageTrends(mockTimeRange);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        inbound: 2,
        outbound: 1,
        total: 3
      });
      expect(result[1]).toEqual({
        date: '2024-01-16',
        inbound: 0,
        outbound: 1,
        total: 1
      });
      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: mockTimeRange.startDate,
            lte: mockTimeRange.endDate
          }
        },
        select: { timestamp: true, direction: true },
        orderBy: { timestamp: 'asc' }
      });
    });

    it('should apply userId filter when provided', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);

      await analyticsService.getMessageTrends(mockTimeRange, 'user1');

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1'
          })
        })
      );
    });

    it('should handle empty message list', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);

      const result = await analyticsService.getMessageTrends(mockTimeRange);

      expect(result).toEqual([]);
    });
  });

  describe('getCustomerGrowth', () => {
    it('should return cumulative customer growth by date', async () => {
      const mockCustomers = [
        { createdAt: new Date('2024-01-15T08:00:00') },
        { createdAt: new Date('2024-01-15T10:00:00') },
        { createdAt: new Date('2024-01-16T09:00:00') }
      ];

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any);

      const result = await analyticsService.getCustomerGrowth(mockTimeRange);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        newCustomers: 2,
        totalCustomers: 2
      });
      expect(result[1]).toEqual({
        date: '2024-01-16',
        newCustomers: 1,
        totalCustomers: 3
      });
    });

    it('should apply userId filter when provided', async () => {
      prismaMock.customer.findMany.mockResolvedValue([]);

      await analyticsService.getCustomerGrowth(mockTimeRange, 'user1');

      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1'
          })
        })
      );
    });

    it('should handle empty customer list', async () => {
      prismaMock.customer.findMany.mockResolvedValue([]);

      const result = await analyticsService.getCustomerGrowth(mockTimeRange);

      expect(result).toEqual([]);
    });
  });

  describe('getRevenueAnalysis', () => {
    it('should return daily revenue aggregated by date', async () => {
      const mockPayments = [
        { paymentDate: new Date('2024-01-15'), amount: 299 },
        { paymentDate: new Date('2024-01-15'), amount: 499 },
        { paymentDate: new Date('2024-01-16'), amount: 799 }
      ];

      prismaMock.payment.findMany.mockResolvedValue(mockPayments as any);

      const result = await analyticsService.getRevenueAnalysis(mockTimeRange);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        amount: 798,
        count: 2
      });
      expect(result[1]).toEqual({
        date: '2024-01-16',
        amount: 799,
        count: 1
      });
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: {
          paymentDate: {
            gte: mockTimeRange.startDate,
            lte: mockTimeRange.endDate
          }
        },
        select: { paymentDate: true, amount: true },
        orderBy: { paymentDate: 'asc' }
      });
    });

    it('should apply userId filter when provided', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);

      await analyticsService.getRevenueAnalysis(mockTimeRange, 'user1');

      expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1'
          })
        })
      );
    });

    it('should handle empty payments', async () => {
      prismaMock.payment.findMany.mockResolvedValue([]);

      const result = await analyticsService.getRevenueAnalysis(mockTimeRange);

      expect(result).toEqual([]);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by message count', async () => {
      const mockCustomers = [
        {
          id: 'cust1',
          name: 'Ahmet Yılmaz',
          phone: '+905551234567',
          _count: { messages: 15 },
          messages: [{ timestamp: new Date('2024-01-20') }]
        },
        {
          id: 'cust2',
          name: 'Mehmet Kaya',
          phone: '+905559876543',
          _count: { messages: 10 },
          messages: [{ timestamp: new Date('2024-01-19') }]
        }
      ];

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any);

      const result = await analyticsService.getTopCustomers(10);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        customerId: 'cust1',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '+905551234567',
        messageCount: 15,
        lastMessageAt: new Date('2024-01-20')
      });
      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          orderBy: { messages: { _count: 'desc' } }
        })
      );
    });

    it('should apply userId filter when provided', async () => {
      prismaMock.customer.findMany.mockResolvedValue([]);

      await analyticsService.getTopCustomers(10, 'user1');

      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' }
        })
      );
    });

    it('should handle customers with no messages (fallback to current date)', async () => {
      const mockCustomers = [
        {
          id: 'cust1',
          name: 'Test Customer',
          phone: '+905550000000',
          _count: { messages: 0 },
          messages: []
        }
      ];

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any);

      const result = await analyticsService.getTopCustomers();

      expect(result[0].lastMessageAt).toBeInstanceOf(Date);
    });

    it('should use default limit of 10 when not specified', async () => {
      prismaMock.customer.findMany.mockResolvedValue([]);

      await analyticsService.getTopCustomers();

      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('getPeakHours', () => {
    it('should return message counts grouped by hour (0-23)', async () => {
      const mockMessages = [
        { timestamp: new Date('2024-01-15T09:30:00') },
        { timestamp: new Date('2024-01-15T09:45:00') },
        { timestamp: new Date('2024-01-15T14:20:00') },
        { timestamp: new Date('2024-01-16T09:15:00') },
        { timestamp: new Date('2024-01-16T21:30:00') }
      ];

      prismaMock.whatsappMessage.findMany.mockResolvedValue(mockMessages as any);

      const result = await analyticsService.getPeakHours(mockTimeRange);

      expect(result).toHaveLength(24);
      expect(result[9]).toEqual({ hour: 9, messageCount: 3 });
      expect(result[14]).toEqual({ hour: 14, messageCount: 1 });
      expect(result[21]).toEqual({ hour: 21, messageCount: 1 });
      expect(result[0]).toEqual({ hour: 0, messageCount: 0 });
    });

    it('should only count INBOUND messages', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);

      await analyticsService.getPeakHours(mockTimeRange);

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: mockTimeRange.startDate,
            lte: mockTimeRange.endDate
          },
          direction: 'INBOUND'
        },
        select: { timestamp: true }
      });
    });

    it('should apply userId filter when provided', async () => {
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);

      await analyticsService.getPeakHours(mockTimeRange, 'user1');

      expect(prismaMock.whatsappMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1'
          })
        })
      );
    });
  });

  describe('getOverallStats', () => {
    it('should return overall statistics for time range', async () => {
      const mockUniqueCustomers = [
        { customerPhone: '+905551234567' },
        { customerPhone: '+905559876543' }
      ];

      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(100) // totalMessages
        .mockResolvedValueOnce(60)  // inboundMessages
        .mockResolvedValueOnce(40); // outboundMessages

      prismaMock.whatsappMessage.findMany.mockResolvedValue(mockUniqueCustomers as any);
      prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } } as any);

      const result = await analyticsService.getOverallStats(mockTimeRange);

      expect(result).toEqual({
        totalMessages: 100,
        inboundMessages: 60,
        outboundMessages: 40,
        uniqueCustomers: 2,
        totalRevenue: 5000,
        averageResponseTime: null,
        period: {
          startDate: mockTimeRange.startDate,
          endDate: mockTimeRange.endDate
        }
      });
    });

    it('should apply userId filter for all queries', async () => {
      prismaMock.whatsappMessage.count.mockResolvedValue(0);
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } } as any);

      await analyticsService.getOverallStats(mockTimeRange, 'user1');

      expect(prismaMock.whatsappMessage.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user1' })
        })
      );
      expect(prismaMock.payment.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user1' })
        })
      );
    });

    it('should handle null total revenue', async () => {
      prismaMock.whatsappMessage.count.mockResolvedValue(0);
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: null } } as any);

      const result = await analyticsService.getOverallStats(mockTimeRange);

      expect(result.totalRevenue).toBe(0);
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should compare current and previous period statistics', async () => {
      const currentRange: TimeRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29')
      };
      const previousRange: TimeRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      // Mock current period
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(150) // current total
        .mockResolvedValueOnce(90)  // current inbound
        .mockResolvedValueOnce(60); // current outbound
      prismaMock.whatsappMessage.findMany.mockResolvedValueOnce([
        { customerPhone: '+1' },
        { customerPhone: '+2' },
        { customerPhone: '+3' }
      ] as any);
      prismaMock.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 7500 } } as any);

      // Mock previous period
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(100) // previous total
        .mockResolvedValueOnce(60)  // previous inbound
        .mockResolvedValueOnce(40); // previous outbound
      prismaMock.whatsappMessage.findMany.mockResolvedValueOnce([
        { customerPhone: '+1' },
        { customerPhone: '+2' }
      ] as any);
      prismaMock.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 5000 } } as any);

      const result = await analyticsService.getComparativeAnalysis(currentRange, previousRange);

      expect(result.current.totalMessages).toBe(150);
      expect(result.previous.totalMessages).toBe(100);
      expect(result.changes.totalMessages).toEqual({
        value: 50,
        percentage: 50
      });
      expect(result.changes.inboundMessages).toEqual({
        value: 30,
        percentage: 50
      });
      expect(result.changes.uniqueCustomers).toEqual({
        value: 1,
        percentage: 50
      });
      expect(result.changes.totalRevenue).toEqual({
        value: 2500,
        percentage: 50
      });
    });

    it('should handle zero previous values (avoid division by zero)', async () => {
      const currentRange: TimeRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29')
      };
      const previousRange: TimeRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      // Mock current period
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(20);
      prismaMock.whatsappMessage.findMany.mockResolvedValueOnce([{ customerPhone: '+1' }] as any);
      prismaMock.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 1000 } } as any);

      // Mock previous period (all zeros)
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaMock.whatsappMessage.findMany.mockResolvedValueOnce([]);
      prismaMock.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 0 } } as any);

      const result = await analyticsService.getComparativeAnalysis(currentRange, previousRange);

      expect(result.changes.totalMessages.percentage).toBe(0);
      expect(result.changes.inboundMessages.percentage).toBe(0);
      expect(result.changes.uniqueCustomers.percentage).toBe(0);
      expect(result.changes.totalRevenue.percentage).toBe(0);
    });

    it('should calculate negative growth correctly', async () => {
      const currentRange: TimeRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29')
      };
      const previousRange: TimeRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      // Mock current period (lower than previous)
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30);
      prismaMock.whatsappMessage.findMany.mockResolvedValueOnce([{ customerPhone: '+1' }] as any);
      prismaMock.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 4000 } } as any);

      // Mock previous period (higher)
      prismaMock.whatsappMessage.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(60)
        .mockResolvedValueOnce(40);
      prismaMock.whatsappMessage.findMany.mockResolvedValueOnce([
        { customerPhone: '+1' },
        { customerPhone: '+2' }
      ] as any);
      prismaMock.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 5000 } } as any);

      const result = await analyticsService.getComparativeAnalysis(currentRange, previousRange);

      expect(result.changes.totalMessages.value).toBe(-20);
      expect(result.changes.totalMessages.percentage).toBe(-20);
      expect(result.changes.totalRevenue.value).toBe(-1000);
      expect(result.changes.totalRevenue.percentage).toBe(-20);
    });

    it('should apply userId filter to both periods', async () => {
      const currentRange: TimeRange = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29')
      };
      const previousRange: TimeRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      // Mock minimal responses
      prismaMock.whatsappMessage.count.mockResolvedValue(0);
      prismaMock.whatsappMessage.findMany.mockResolvedValue([]);
      prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } } as any);

      await analyticsService.getComparativeAnalysis(currentRange, previousRange, 'user1');

      // Should be called 6 times total (3 for current + 3 for previous)
      expect(prismaMock.whatsappMessage.count).toHaveBeenCalledTimes(6);
      expect(prismaMock.payment.aggregate).toHaveBeenCalledTimes(2);
    });
  });
});
