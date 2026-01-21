import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface MessageTrendData {
  date: string;
  inbound: number;
  outbound: number;
  total: number;
}

export interface CustomerGrowthData {
  date: string;
  newCustomers: number;
  totalCustomers: number;
}

export interface RevenueData {
  date: string;
  amount: number;
  count: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  customerPhone: string;
  messageCount: number;
  lastMessageAt: Date;
}

export interface PeakHour {
  hour: number;
  messageCount: number;
}

export class AnalyticsService {
  // Mesaj trend analizi (günlük/haftalık/aylık)
  async getMessageTrends(timeRange: TimeRange, userId?: string): Promise<MessageTrendData[]> {
    const where: any = {
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    const messages = await prisma.whatsappMessage.findMany({
      where,
      select: {
        timestamp: true,
        direction: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Günlük grupla
    const dailyData: Record<string, { inbound: number; outbound: number; total: number }> = {};

    messages.forEach((msg: any) => {
      const date = msg.timestamp.toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = { inbound: 0, outbound: 0, total: 0 };
      }

      dailyData[date].total++;
      if (msg.direction === 'INBOUND') {
        dailyData[date].inbound++;
      } else {
        dailyData[date].outbound++;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  // Müşteri büyüme analizi
  async getCustomerGrowth(timeRange: TimeRange, userId?: string): Promise<CustomerGrowthData[]> {
    const where: any = {
      createdAt: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Günlük grupla ve kümülatif hesapla
    const dailyData: Record<string, number> = {};
    let cumulativeCount = 0;

    customers.forEach((customer: any) => {
      const date = customer.createdAt.toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    return Object.entries(dailyData).map(([date, newCustomers]) => {
      cumulativeCount += newCustomers;
      return {
        date,
        newCustomers,
        totalCustomers: cumulativeCount,
      };
    });
  }

  // Gelir analizi
  async getRevenueAnalysis(timeRange: TimeRange, userId?: string): Promise<RevenueData[]> {
    const where: any = {
      paymentDate: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        paymentDate: true,
        amount: true,
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Günlük grupla
    const dailyData: Record<string, { amount: number; count: number }> = {};

    payments.forEach((payment: any) => {
      const date = payment.paymentDate.toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = { amount: 0, count: 0 };
      }

      dailyData[date].amount += payment.amount;
      dailyData[date].count++;
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  // En aktif müşteriler
  async getTopCustomers(limit: number = 10, userId?: string): Promise<TopCustomer[]> {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    // Mesaj sayısına göre müşterileri getir
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        _count: {
          select: {
            messages: true,
          },
        },
        messages: {
          select: {
            timestamp: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        messages: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return customers.map((customer: any) => ({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      messageCount: customer._count.messages,
      lastMessageAt: customer.messages[0]?.timestamp || new Date(),
    }));
  }

  // Peak hours analizi (hangi saatte daha çok mesaj geliyor)
  async getPeakHours(timeRange: TimeRange, userId?: string): Promise<PeakHour[]> {
    const where: any = {
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
      direction: 'INBOUND', // Sadece gelen mesajlar
    };

    if (userId) {
      where.userId = userId;
    }

    const messages = await prisma.whatsappMessage.findMany({
      where,
      select: {
        timestamp: true,
      },
    });

    // Saatlere göre grupla
    const hourlyData: Record<number, number> = {};

    // 0-23 arası tüm saatleri initialize et
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    messages.forEach((msg: any) => {
      const hour = msg.timestamp.getHours();
      hourlyData[hour]++;
    });

    return Object.entries(hourlyData).map(([hour, messageCount]) => ({
      hour: parseInt(hour),
      messageCount,
    }));
  }

  // Genel özet istatistikler
  async getOverallStats(timeRange: TimeRange, userId?: string) {
    const where: any = {
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    // Paralel sorgu
    const [
      totalMessages,
      inboundMessages,
      outboundMessages,
      uniqueCustomers,
      totalRevenue,
      averageResponseTime,
    ] = await Promise.all([
      // Toplam mesaj
      prisma.whatsappMessage.count({ where }),
      
      // Gelen mesaj
      prisma.whatsappMessage.count({
        where: { ...where, direction: 'INBOUND' },
      }),
      
      // Giden mesaj
      prisma.whatsappMessage.count({
        where: { ...where, direction: 'OUTBOUND' },
      }),
      
      // Unique müşteri sayısı
      prisma.whatsappMessage.findMany({
        where,
        select: { customerPhone: true },
        distinct: ['customerPhone'],
      }),
      
      // Toplam gelir
      prisma.payment.aggregate({
        where: userId
          ? {
              userId,
              paymentDate: {
                gte: timeRange.startDate,
                lte: timeRange.endDate,
              },
            }
          : {
              paymentDate: {
                gte: timeRange.startDate,
                lte: timeRange.endDate,
              },
            },
        _sum: {
          amount: true,
        },
      }),
      
      // Ortalama yanıt süresi (mock - gerçek hesaplama için conversation tracking gerekir)
      Promise.resolve(null),
    ]);

    return {
      totalMessages,
      inboundMessages,
      outboundMessages,
      uniqueCustomers: uniqueCustomers.length,
      totalRevenue: totalRevenue._sum.amount || 0,
      averageResponseTime: null, // TODO: Implement conversation tracking
      period: {
        startDate: timeRange.startDate,
        endDate: timeRange.endDate,
      },
    };
  }

  // Karşılaştırmalı analiz (bu dönem vs önceki dönem)
  async getComparativeAnalysis(currentRange: TimeRange, previousRange: TimeRange, userId?: string) {
    const [currentStats, previousStats] = await Promise.all([
      this.getOverallStats(currentRange, userId),
      this.getOverallStats(previousRange, userId),
    ]);

    return {
      current: currentStats,
      previous: previousStats,
      changes: {
        totalMessages: {
          value: currentStats.totalMessages - previousStats.totalMessages,
          percentage: previousStats.totalMessages > 0
            ? ((currentStats.totalMessages - previousStats.totalMessages) / previousStats.totalMessages) * 100
            : 0,
        },
        inboundMessages: {
          value: currentStats.inboundMessages - previousStats.inboundMessages,
          percentage: previousStats.inboundMessages > 0
            ? ((currentStats.inboundMessages - previousStats.inboundMessages) / previousStats.inboundMessages) * 100
            : 0,
        },
        uniqueCustomers: {
          value: currentStats.uniqueCustomers - previousStats.uniqueCustomers,
          percentage: previousStats.uniqueCustomers > 0
            ? ((currentStats.uniqueCustomers - previousStats.uniqueCustomers) / previousStats.uniqueCustomers) * 100
            : 0,
        },
        totalRevenue: {
          value: currentStats.totalRevenue - previousStats.totalRevenue,
          percentage: previousStats.totalRevenue > 0
            ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
            : 0,
        },
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
