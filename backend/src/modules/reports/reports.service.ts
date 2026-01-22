import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export interface ReportFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  customerPhone?: string;
}

export class ReportsService {
  // Mesaj Raporları
  async getMessagesReport(filters: ReportFilters) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.direction) where.direction = filters.direction;
    if (filters.customerPhone) where.customerPhone = { contains: filters.customerPhone };
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const messages = await prisma.whatsappMessage.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            companyName: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const stats = {
      total: messages.length,
      inbound: messages.filter((m: any) => m.direction === 'INBOUND').length,
      outbound: messages.filter((m: any) => m.direction === 'OUTBOUND').length,
      read: messages.filter((m: any) => m.readStatus).length,
      unread: messages.filter((m: any) => !m.readStatus).length,
    };

    return { messages, stats };
  }

  // Müşteri Raporları
  async getCustomersReport(filters: ReportFilters) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    // TODO: Customer model not in schema yet - using empty array for now
    const customers: any[] = []; // await prisma.customer.findMany({
    //   where,
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         companyName: true,
    //         fullName: true,
    //       },
    //     },
    //     _count: {
    //       select: {
    //         messages: true,
    //       },
    //     },
    //   },
    //   orderBy: { createdAt: 'desc' },
    // });

    const stats = {
      total: customers.length,
      active: customers.filter((c: any) => c.status === 'ACTIVE').length,
      inactive: customers.filter((c: any) => c.status === 'INACTIVE').length,
      totalMessages: customers.reduce((sum: number, c: any) => sum + c._count.messages, 0),
    };

    return { customers, stats };
  }

  // Ödeme Raporları
  async getPaymentsReport(filters: ReportFilters) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) where.paymentDate.gte = filters.startDate;
      if (filters.endDate) where.paymentDate.lte = filters.endDate;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            companyName: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const stats = {
      total: payments.length,
      totalAmount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
      averageAmount: payments.length > 0 
        ? payments.reduce((sum: number, p: any) => sum + p.amount, 0) / payments.length 
        : 0,
      byMethod: payments.reduce((acc: any, p: any) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return { payments, stats };
  }

  // Abonelik Raporları
  async getSubscriptionsReport(filters: ReportFilters) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = filters.startDate;
      if (filters.endDate) where.startDate.lte = filters.endDate;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            companyName: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const now = new Date();
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter((s: any) => s.status === 'ACTIVE').length,
      cancelled: subscriptions.filter((s: any) => s.status === 'CANCELLED').length,
      expired: subscriptions.filter((s: any) => s.status === 'ACTIVE' && s.endDate < now).length,
      expiringSoon: subscriptions.filter((s: any) => {
        const daysUntilExpiry = Math.ceil((s.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return s.status === 'ACTIVE' && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      }).length,
      totalRevenue: subscriptions
        .filter((s: any) => s.status === 'ACTIVE')
        .reduce((sum: number, s: any) => sum + s.price, 0),
    };

    return { subscriptions, stats };
  }

  // Excel Export - Mesajlar
  async exportMessagesToExcel(filters: ReportFilters): Promise<Buffer> {
    const { messages, stats } = await this.getMessagesReport(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DOA WhatsApp Manager';
    workbook.created = new Date();

    // Özet Sayfası
    const summarySheet = workbook.addWorksheet('Özet');
    summarySheet.columns = [
      { header: 'Metrik', key: 'metric', width: 30 },
      { header: 'Değer', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Toplam Mesaj', value: stats.total },
      { metric: 'Gelen Mesaj', value: stats.inbound },
      { metric: 'Giden Mesaj', value: stats.outbound },
      { metric: 'Okundu', value: stats.read },
      { metric: 'Okunmadı', value: stats.unread },
      { metric: 'Rapor Tarihi', value: new Date().toLocaleString('tr-TR') },
    ]);

    // Header styling
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Detay Sayfası
    const detailSheet = workbook.addWorksheet('Mesajlar');
    detailSheet.columns = [
      { header: 'Tarih', key: 'timestamp', width: 20 },
      { header: 'Kullanıcı', key: 'user', width: 25 },
      { header: 'Yön', key: 'direction', width: 10 },
      { header: 'Müşteri', key: 'customerName', width: 25 },
      { header: 'Telefon', key: 'customerPhone', width: 20 },
      { header: 'Mesaj', key: 'messageContent', width: 50 },
      { header: 'Tür', key: 'messageType', width: 10 },
      { header: 'Durum', key: 'readStatus', width: 10 },
    ];

    messages.forEach((msg: any) => {
      detailSheet.addRow({
        timestamp: msg.timestamp.toLocaleString('tr-TR'),
        user: msg.user?.companyName || msg.user?.fullName || 'N/A',
        direction: msg.direction === 'INBOUND' ? 'Gelen' : 'Giden',
        customerName: msg.customerName,
        customerPhone: msg.customerPhone,
        messageContent: msg.messageContent,
        messageType: msg.messageType,
        readStatus: msg.readStatus ? 'Okundu' : 'Okunmadı',
      });
    });

    // Header styling
    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Auto-filter
    detailSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 8 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Excel Export - Müşteriler
  async exportCustomersToExcel(filters: ReportFilters): Promise<Buffer> {
    const { customers, stats } = await this.getCustomersReport(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DOA WhatsApp Manager';
    workbook.created = new Date();

    // Özet
    const summarySheet = workbook.addWorksheet('Özet');
    summarySheet.columns = [
      { header: 'Metrik', key: 'metric', width: 30 },
      { header: 'Değer', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Toplam Müşteri', value: stats.total },
      { metric: 'Aktif Müşteri', value: stats.active },
      { metric: 'Pasif Müşteri', value: stats.inactive },
      { metric: 'Toplam Mesaj', value: stats.totalMessages },
      { metric: 'Rapor Tarihi', value: new Date().toLocaleString('tr-TR') },
    ]);

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Detay
    const detailSheet = workbook.addWorksheet('Müşteriler');
    detailSheet.columns = [
      { header: 'Kayıt Tarihi', key: 'createdAt', width: 20 },
      { header: 'Kullanıcı', key: 'user', width: 25 },
      { header: 'Müşteri Adı', key: 'customerName', width: 30 },
      { header: 'Telefon', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mesaj Sayısı', key: 'messageCount', width: 15 },
      { header: 'Durum', key: 'status', width: 10 },
      { header: 'Notlar', key: 'notes', width: 40 },
    ];

    customers.forEach((customer: any) => {
      detailSheet.addRow({
        createdAt: customer.createdAt.toLocaleString('tr-TR'),
        user: customer.user?.companyName || customer.user?.fullName || 'N/A',
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email || 'N/A',
        messageCount: customer._count.messages,
        status: customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif',
        notes: customer.notes || '',
      });
    });

    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    detailSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 8 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Excel Export - Ödemeler
  async exportPaymentsToExcel(filters: ReportFilters): Promise<Buffer> {
    const { payments, stats } = await this.getPaymentsReport(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DOA WhatsApp Manager';
    workbook.created = new Date();

    // Özet
    const summarySheet = workbook.addWorksheet('Özet');
    summarySheet.columns = [
      { header: 'Metrik', key: 'metric', width: 30 },
      { header: 'Değer', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Toplam Ödeme', value: stats.total },
      { metric: 'Toplam Tutar', value: `${stats.totalAmount.toFixed(2)} TRY` },
      { metric: 'Ortalama Tutar', value: `${stats.averageAmount.toFixed(2)} TRY` },
      { metric: 'Rapor Tarihi', value: new Date().toLocaleString('tr-TR') },
    ]);

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Detay
    const detailSheet = workbook.addWorksheet('Ödemeler');
    detailSheet.columns = [
      { header: 'Ödeme Tarihi', key: 'paymentDate', width: 20 },
      { header: 'Kullanıcı', key: 'user', width: 25 },
      { header: 'Tutar', key: 'amount', width: 15 },
      { header: 'Yöntem', key: 'paymentMethod', width: 20 },
      { header: 'İşlem No', key: 'transactionId', width: 30 },
      { header: 'Notlar', key: 'notes', width: 40 },
    ];

    payments.forEach((payment: any) => {
      detailSheet.addRow({
        paymentDate: payment.paymentDate.toLocaleString('tr-TR'),
        user: payment.user?.companyName || payment.user?.fullName || 'N/A',
        amount: `${payment.amount.toFixed(2)} TRY`,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId || 'N/A',
        notes: payment.notes || '',
      });
    });

    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' },
    };
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    detailSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 6 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Excel Export - Abonelikler
  async exportSubscriptionsToExcel(filters: ReportFilters): Promise<Buffer> {
    const { subscriptions, stats } = await this.getSubscriptionsReport(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DOA WhatsApp Manager';
    workbook.created = new Date();

    // Özet
    const summarySheet = workbook.addWorksheet('Özet');
    summarySheet.columns = [
      { header: 'Metrik', key: 'metric', width: 30 },
      { header: 'Değer', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      { metric: 'Toplam Abonelik', value: stats.total },
      { metric: 'Aktif Abonelik', value: stats.active },
      { metric: 'İptal Edilmiş', value: stats.cancelled },
      { metric: 'Süresi Dolmuş', value: stats.expired },
      { metric: 'Yakında Dolacak (7 gün)', value: stats.expiringSoon },
      { metric: 'Toplam Gelir', value: `${stats.totalRevenue.toFixed(2)} TRY` },
      { metric: 'Rapor Tarihi', value: new Date().toLocaleString('tr-TR') },
    ]);

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF59E0B' },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Detay
    const detailSheet = workbook.addWorksheet('Abonelikler');
    detailSheet.columns = [
      { header: 'Başlangıç', key: 'startDate', width: 20 },
      { header: 'Bitiş', key: 'endDate', width: 20 },
      { header: 'Kullanıcı', key: 'user', width: 25 },
      { header: 'Plan', key: 'planName', width: 20 },
      { header: 'Fiyat', key: 'price', width: 15 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Kalan Gün', key: 'daysRemaining', width: 15 },
    ];

    const now = new Date();
    subscriptions.forEach((sub: any) => {
      const daysRemaining = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      detailSheet.addRow({
        startDate: sub.startDate.toLocaleDateString('tr-TR'),
        endDate: sub.endDate.toLocaleDateString('tr-TR'),
        user: sub.user?.companyName || sub.user?.fullName || 'N/A',
        planName: sub.planName,
        price: `${sub.price.toFixed(2)} TRY`,
        status: sub.status === 'ACTIVE' ? 'Aktif' : 'İptal',
        daysRemaining: sub.status === 'ACTIVE' ? daysRemaining : 'N/A',
      });
    });

    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF59E0B' },
    };
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    detailSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // PDF Export - Mesajlar
  async exportMessagesToPDF(filters: ReportFilters): Promise<Buffer> {
    const { messages, stats } = await this.getMessagesReport(filters);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Mesaj Raporu', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`, { align: 'center' });
      doc.moveDown(2);

      // Stats Box
      doc.fontSize(14).font('Helvetica-Bold').text('Özet İstatistikler');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Toplam Mesaj: ${stats.total}`);
      doc.text(`Gelen Mesaj: ${stats.inbound}`);
      doc.text(`Giden Mesaj: ${stats.outbound}`);
      doc.text(`Okundu: ${stats.read}`);
      doc.text(`Okunmadı: ${stats.unread}`);
      doc.moveDown(2);

      // Messages Table Header
      doc.fontSize(12).font('Helvetica-Bold').text('Mesaj Detayları');
      doc.moveDown(0.5);

      // Table
      const tableTop = doc.y;
      let currentY = tableTop;

      messages.slice(0, 30).forEach((msg: any) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.fontSize(8).font('Helvetica');
        doc.text(`${msg.timestamp.toLocaleString('tr-TR')} | ${msg.direction === 'INBOUND' ? 'Gelen' : 'Giden'}`, 50, currentY);
        doc.text(`${msg.customerName} (${msg.customerPhone})`, 50, currentY + 10);
        doc.text(msg.messageContent.substring(0, 80), 50, currentY + 20);
        
        currentY += 40;
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 5;
      });

      if (messages.length > 30) {
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Oblique').text(`... ve ${messages.length - 30} mesaj daha`);
      }

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'DOA WhatsApp Manager - Otomatik Rapor Sistemi',
        50,
        750,
        { align: 'center' }
      );

      doc.end();
    });
  }

  // PDF Export - Ödemeler
  async exportPaymentsToPDF(filters: ReportFilters): Promise<Buffer> {
    const { payments, stats } = await this.getPaymentsReport(filters);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Ödeme Raporu', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`, { align: 'center' });
      doc.moveDown(2);

      // Stats
      doc.fontSize(14).font('Helvetica-Bold').text('Özet İstatistikler');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Toplam Ödeme: ${stats.total}`);
      doc.text(`Toplam Tutar: ${stats.totalAmount.toFixed(2)} TRY`);
      doc.text(`Ortalama Tutar: ${stats.averageAmount.toFixed(2)} TRY`);
      doc.moveDown(2);

      // Payments
      doc.fontSize(12).font('Helvetica-Bold').text('Ödeme Detayları');
      doc.moveDown(0.5);

      let currentY = doc.y;
      payments.forEach((payment: any) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.fontSize(10).font('Helvetica');
        doc.text(`${payment.paymentDate.toLocaleString('tr-TR')} - ${payment.user?.companyName || payment.user?.fullName}`, 50, currentY);
        doc.text(`Tutar: ${payment.amount.toFixed(2)} TRY | Yöntem: ${payment.paymentMethod}`, 50, currentY + 15);
        if (payment.transactionId) {
          doc.fontSize(8).text(`İşlem: ${payment.transactionId}`, 50, currentY + 30);
        }

        currentY += 45;
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 5;
      });

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'DOA WhatsApp Manager - Otomatik Rapor Sistemi',
        50,
        750,
        { align: 'center' }
      );

      doc.end();
    });
  }
}

export const reportsService = new ReportsService();
