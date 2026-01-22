import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Register Handlebars helpers
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

export class EmailTemplateService {
  private templatesPath: string;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate>;

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/email');
    this.compiledTemplates = new Map();
    this.precompileTemplates();
  }

  /**
   * Precompile all templates on service initialization
   */
  private precompileTemplates() {
    const templates = [
      'welcome',
      'new-message',
      'payment-received',
      'subscription-expiring',
      'password-reset',
    ];

    templates.forEach((templateName) => {
      try {
        const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const compiled = Handlebars.compile(templateSource);
        this.compiledTemplates.set(templateName, compiled);
        console.log(`✅ Email template compiled: ${templateName}`);
      } catch (error) {
        console.error(`❌ Failed to compile template ${templateName}:`, error);
      }
    });
  }

  /**
   * Render welcome email
   */
  renderWelcomeEmail(data: {
    lang: string;
    fullName: string;
    email: string;
    tempPassword: string;
    panelUrl: string;
    year?: number;
  }): string {
    const template = this.compiledTemplates.get('welcome');
    if (!template) throw new Error('Welcome template not found');

    return template({
      ...data,
      year: data.year || new Date().getFullYear(),
    });
  }

  /**
   * Render new message notification email
   */
  renderNewMessageEmail(data: {
    lang: string;
    customerName: string;
    customerPhone: string;
    messageContent: string;
    messageType: string;
    timestamp: string;
    panelUrl: string;
    unreadCount?: number;
    totalMessages?: number;
    year?: number;
  }): string {
    const template = this.compiledTemplates.get('new-message');
    if (!template) throw new Error('New message template not found');

    return template({
      ...data,
      year: data.year || new Date().getFullYear(),
    });
  }

  /**
   * Render payment received email
   */
  renderPaymentReceivedEmail(data: {
    lang: string;
    fullName: string;
    amount: string;
    currency: string;
    transactionId: string;
    paymentDate: string;
    paymentMethod: string;
    subscriptionPlan?: string;
    validUntil?: string;
    invoiceUrl?: string;
    year?: number;
  }): string {
    const template = this.compiledTemplates.get('payment-received');
    if (!template) throw new Error('Payment received template not found');

    return template({
      ...data,
      year: data.year || new Date().getFullYear(),
    });
  }

  /**
   * Render subscription expiring email
   */
  renderSubscriptionExpiringEmail(data: {
    lang: string;
    fullName: string;
    planName: string;
    monthlyPrice: string;
    currency: string;
    expiryDate: string;
    daysLeft: number;
    autoRenew: boolean;
    panelUrl: string;
    year?: number;
  }): string {
    const template = this.compiledTemplates.get('subscription-expiring');
    if (!template) throw new Error('Subscription expiring template not found');

    return template({
      ...data,
      year: data.year || new Date().getFullYear(),
    });
  }

  /**
   * Render password reset email
   */
  renderPasswordResetEmail(data: {
    lang: string;
    fullName: string;
    resetToken: string;
    resetUrl: string;
    expiresIn: number;
    year?: number;
  }): string {
    const template = this.compiledTemplates.get('password-reset');
    if (!template) throw new Error('Password reset template not found');

    return template({
      ...data,
      year: data.year || new Date().getFullYear(),
    });
  }

  /**
   * Get subject line for email based on type and language
   */
  getSubject(type: string, lang: string, data?: any): string {
    const subjects: Record<string, Record<string, string>> = {
      welcome: {
        tr: 'DOA Hesabınıza Hoş Geldiniz! 🎉',
        en: 'Welcome to Your DOA Account! 🎉',
        fr: 'Bienvenue sur votre compte DOA! 🎉',
      },
      'new-message': {
        tr: `💬 Yeni WhatsApp Mesajı${data?.customerName ? ` - ${data.customerName}` : ''}`,
        en: `💬 New WhatsApp Message${data?.customerName ? ` - ${data.customerName}` : ''}`,
        fr: `💬 Nouveau message WhatsApp${data?.customerName ? ` - ${data.customerName}` : ''}`,
      },
      'payment-received': {
        tr: '✅ Ödemeniz Alındı - DOA',
        en: '✅ Payment Received - DOA',
        fr: '✅ Paiement Reçu - DOA',
      },
      'subscription-expiring': {
        tr: `⚠️ Aboneliğiniz ${data?.daysLeft} Gün Sonra Sona Eriyor`,
        en: `⚠️ Your Subscription Expires in ${data?.daysLeft} Days`,
        fr: `⚠️ Votre abonnement expire dans ${data?.daysLeft} jours`,
      },
      'password-reset': {
        tr: '🔑 Şifre Sıfırlama Talebi - DOA',
        en: '🔑 Password Reset Request - DOA',
        fr: '🔑 Demande de réinitialisation du mot de passe - DOA',
      },
    };

    return subjects[type]?.[lang] || subjects[type]?.['en'] || 'DOA Notification';
  }
}

export const emailTemplateService = new EmailTemplateService();
