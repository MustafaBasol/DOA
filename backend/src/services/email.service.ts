import nodemailer from 'nodemailer';
import { emailTemplateService } from './email-template.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service ready');
    } catch (error) {
      console.error('❌ Email service error:', error);
    }
  }

  /**
   * Send email with custom HTML
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"DOA - Autoviseo" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send welcome email with credentials
   */
  async sendWelcomeEmail(
    to: string,
    fullName: string,
    tempPassword: string,
    lang: string = 'tr'
  ): Promise<boolean> {
    const html = emailTemplateService.renderWelcomeEmail({
      lang,
      fullName,
      email: to,
      tempPassword,
      panelUrl: process.env.FRONTEND_URL || 'https://yourdomain.com',
    });

    const subject = emailTemplateService.getSubject('welcome', lang);

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    to: string,
    customerName: string,
    customerPhone: string,
    messageContent: string,
    lang: string = 'tr',
    unreadCount?: number,
    totalMessages?: number
  ): Promise<boolean> {
    const html = emailTemplateService.renderNewMessageEmail({
      lang,
      customerName,
      customerPhone,
      messageContent: messageContent.length > 200 ? messageContent.substring(0, 200) + '...' : messageContent,
      messageType: 'text',
      timestamp: new Date().toLocaleString(lang === 'tr' ? 'tr-TR' : lang === 'fr' ? 'fr-FR' : 'en-US'),
      panelUrl: process.env.FRONTEND_URL || 'https://yourdomain.com',
      unreadCount,
      totalMessages,
    });

    const subject = emailTemplateService.getSubject('new-message', lang, { customerName });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send payment received confirmation
   */
  async sendPaymentReceivedEmail(
    to: string,
    fullName: string,
    amount: number,
    currency: string,
    transactionId: string,
    paymentMethod: string,
    lang: string = 'tr',
    subscriptionPlan?: string,
    validUntil?: string,
    invoiceUrl?: string
  ): Promise<boolean> {
    const html = emailTemplateService.renderPaymentReceivedEmail({
      lang,
      fullName,
      amount: amount.toFixed(2),
      currency,
      transactionId,
      paymentDate: new Date().toLocaleString(lang === 'tr' ? 'tr-TR' : lang === 'fr' ? 'fr-FR' : 'en-US'),
      paymentMethod,
      subscriptionPlan,
      validUntil,
      invoiceUrl,
    });

    const subject = emailTemplateService.getSubject('payment-received', lang);

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send subscription expiring warning
   */
  async sendSubscriptionExpiringEmail(
    to: string,
    fullName: string,
    planName: string,
    monthlyPrice: number,
    currency: string,
    expiryDate: Date,
    daysLeft: number,
    autoRenew: boolean,
    lang: string = 'tr'
  ): Promise<boolean> {
    const html = emailTemplateService.renderSubscriptionExpiringEmail({
      lang,
      fullName,
      planName,
      monthlyPrice: monthlyPrice.toFixed(2),
      currency,
      expiryDate: expiryDate.toLocaleDateString(lang === 'tr' ? 'tr-TR' : lang === 'fr' ? 'fr-FR' : 'en-US'),
      daysLeft,
      autoRenew,
      panelUrl: process.env.FRONTEND_URL || 'https://yourdomain.com',
    });

    const subject = emailTemplateService.getSubject('subscription-expiring', lang, { daysLeft });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetToken: string,
    lang: string = 'tr'
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = emailTemplateService.renderPasswordResetEmail({
      lang,
      fullName,
      resetToken,
      resetUrl,
      expiresIn: 60, // 60 minutes
    });

    const subject = emailTemplateService.getSubject('password-reset', lang);

    return this.sendEmail({ to, subject, html });
  }
}

export const emailService = new EmailService();
