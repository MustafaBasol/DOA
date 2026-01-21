import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig } from '../../config';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.user,
        pass: emailConfig.smtp.pass,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        console.error('📧 Email service error:', error);
      } else {
        console.log('📧 Email service ready');
      }
    });
  }

  /**
   * Send email using a template
   */
  async sendTemplateEmail(options: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }): Promise<boolean> {
    try {
      const { to, subject, template, context } = options;

      // Load and compile template
      const templatePath = path.join(__dirname, 'templates', `${template}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateSource);
      const html = compiledTemplate(context);

      // Send email
      const info = await this.transporter.sendMail({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to,
        subject,
        html,
      });

      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email send error:', error);
      return false;
    }
  }

  /**
   * Send plain text email
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    try {
      const { to, subject, text, html } = options;

      const info = await this.transporter.sendMail({
        from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
        to,
        subject,
        text,
        html,
      });

      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email send error:', error);
      return false;
    }
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(options: {
    to: string;
    customerName: string;
    customerPhone: string;
    messageContent: string;
    panelUrl: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: '📱 Yeni WhatsApp Mesajı',
      template: 'new-message',
      context: {
        customerName: options.customerName,
        customerPhone: options.customerPhone,
        messageContent: options.messageContent,
        panelUrl: options.panelUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send subscription expiry warning
   */
  async sendSubscriptionExpiryWarning(options: {
    to: string;
    userName: string;
    planName: string;
    expiryDate: Date;
    daysRemaining: number;
    renewUrl: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: `⚠️ Aboneliğiniz ${options.daysRemaining} Gün İçinde Sona Eriyor`,
      template: 'subscription-expiry',
      context: {
        userName: options.userName,
        planName: options.planName,
        expiryDate: options.expiryDate.toLocaleDateString('tr-TR'),
        daysRemaining: options.daysRemaining,
        renewUrl: options.renewUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccessNotification(options: {
    to: string;
    userName: string;
    amount: number;
    currency: string;
    planName: string;
    transactionId?: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: '✅ Ödemeniz Başarıyla Alındı',
      template: 'payment-success',
      context: {
        userName: options.userName,
        amount: options.amount.toFixed(2),
        currency: options.currency,
        planName: options.planName,
        transactionId: options.transactionId || 'N/A',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send welcome email for new users
   */
  async sendWelcomeEmail(options: {
    to: string;
    userName: string;
    panelUrl: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: '🎉 Hoş Geldiniz! DOA WhatsApp Manager',
      template: 'welcome',
      context: {
        userName: options.userName,
        panelUrl: options.panelUrl,
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(options: {
    to: string;
    userName: string;
    resetToken: string;
    resetUrl: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: options.to,
      subject: '🔑 Şifre Sıfırlama Talebi',
      template: 'password-reset',
      context: {
        userName: options.userName,
        resetToken: options.resetToken,
        resetUrl: options.resetUrl,
        year: new Date().getFullYear(),
      },
    });
  }
}

export const emailService = new EmailService();
