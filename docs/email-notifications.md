# Email Notifications Documentation

## 📧 Genel Bakış

DOA WhatsApp Manager artık **Nodemailer** ve **Handlebars** tabanlı email bildirimleri desteği sunmaktadır. Bu özellik sayesinde:

- ✅ Yeni WhatsApp mesajı bildirimleri (n8n'den gelen mesajlar için)
- ✅ Abonelik süre uyarıları (7, 3, 1 gün kala)
- ✅ Ödeme onay bildirimleri
- ✅ Hoş geldiniz email'leri (yeni kullanıcılar)
- ✅ Şifre sıfırlama email'leri
- ✅ Otomatik planlı bildirimler (hourly scheduler)

**Not:** Sistem n8n webhook'undan gelen mesajları izler ve bildirim gönderir. Panel'den WhatsApp mesaj gönderimi olmadığı için, sadece "gelen mesaj" bildirimleri vardır.

## 🏗️ Mimari

### Email Service

**Dosya:** `/backend/src/modules/notifications/email.service.ts`

```typescript
class EmailService {
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
  }

  // Template-based email
  async sendTemplateEmail(options) { ... }

  // Plain email
  async sendEmail(options) { ... }

  // Specific notifications
  async sendNewMessageNotification(options) { ... }
  async sendSubscriptionExpiryWarning(options) { ... }
  async sendPaymentSuccessNotification(options) { ... }
  async sendWelcomeEmail(options) { ... }
  async sendPasswordResetEmail(options) { ... }
}
```

### Email Templates

**Lokasyon:** `/backend/src/modules/notifications/templates/`

- `new-message.hbs` - Yeni WhatsApp mesajı bildirimi
- `subscription-expiry.hbs` - Abonelik süre uyarısı
- `payment-success.hbs` - Ödeme başarılı bildirimi
- `welcome.hbs` - Hoş geldiniz email'i
- `password-reset.hbs` - Şifre sıfırlama

### Subscription Scheduler

**Dosya:** `/backend/src/modules/notifications/subscription-notification.service.ts`

```typescript
class SubscriptionNotificationService {
  // Check subscriptions expiring in 7, 3, 1 days
  async checkExpiringSubscriptions() { ... }

  // Update expired subscriptions
  async updateExpiredSubscriptions() { ... }

  // Start hourly scheduler
  startScheduler() { ... }
}
```

## ⚙️ Configuration

### Environment Variables

**`.env` dosyasına ekleyin:**

```bash
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=DOA WhatsApp Manager
EMAIL_FROM_EMAIL=noreply@autoviseo.com
```

### Gmail App Password Oluşturma

1. Google hesabınızda **2-Step Verification** aktif olmalı
2. https://myaccount.google.com/apppasswords adresine gidin
3. "Select app" → "Mail", "Select device" → "Other"
4. İsim verin (örn: "DOA Backend") ve "Generate" tıklayın
5. Oluşturulan 16 haneli şifreyi `SMTP_PASS` olarak kullanın

### Diğer SMTP Providers

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## 📧 Email Türleri

### 1. Yeni Mesaj Bildirimi

**Trigger:** n8n webhook'undan yeni INBOUND mesaj geldiğinde

**Gönderilen Bilgiler:**
- Müşteri adı
- Müşteri telefonu
- Mesaj içeriği
- Panele git linki

**Kod:**
```typescript
await emailService.sendNewMessageNotification({
  to: 'user@example.com',
  customerName: 'Ahmet Yılmaz',
  customerPhone: '+905551234567',
  messageContent: 'Merhaba, sipariş durumu nedir?',
  panelUrl: 'http://localhost:3000/client.html',
});
```

**Template Özellikleri:**
- Gradient mor header
- Mesaj kartı formatı
- "Panele Git" CTA button
- Responsive tasarım

### 2. Abonelik Süre Uyarısı

**Trigger:** Otomatik scheduler (saatlik kontrol)

**Uyarı Periyotları:**
- 7 gün kala
- 3 gün kala
- 1 gün kala

**Kod:**
```typescript
await emailService.sendSubscriptionExpiryWarning({
  to: 'user@example.com',
  userName: 'Mehmet Demir',
  planName: 'Premium Plan',
  expiryDate: new Date('2026-01-28'),
  daysRemaining: 7,
  renewUrl: 'http://localhost:3000/client.html',
});
```

**Template Özellikleri:**
- Turuncu/kırmızı gradient (warning)
- Kalan gün vurgusu
- "Aboneliği Yenile" CTA
- Süre bitiminde olacaklar listesi

### 3. Ödeme Başarılı Bildirimi

**Trigger:** Ödeme kaydı oluşturulduğunda (manuel veya otomatik)

**Kod:**
```typescript
await emailService.sendPaymentSuccessNotification({
  to: 'user@example.com',
  userName: 'Ayşe Kaya',
  amount: 299.99,
  currency: 'TRY',
  planName: 'Premium Plan',
  transactionId: 'TRX123456',
});
```

**Template Özellikleri:**
- Yeşil gradient (success)
- Büyük tutar gösterimi
- İşlem detayları tablosu
- Fatura indirme bilgisi

### 4. Hoş Geldiniz Email'i

**Trigger:** Yeni kullanıcı oluşturulduğunda (admin tarafından)

**Kod:**
```typescript
await emailService.sendWelcomeEmail({
  to: 'newuser@example.com',
  userName: 'Yeni Kullanıcı',
  panelUrl: 'http://localhost:3000/client.html',
});
```

**Template Özellikleri:**
- Mor gradient
- Hoş geldin mesajı
- Özellikler listesi (checkmark icons)
- "Panele Giriş Yap" CTA
- İlk adım ipucu kutusu

### 5. Şifre Sıfırlama Email'i

**Trigger:** Şifre sıfırlama talebi (henüz implement edilmedi)

**Kod:**
```typescript
await emailService.sendPasswordResetEmail({
  to: 'user@example.com',
  userName: 'Kullanıcı',
  resetToken: 'ABC123',
  resetUrl: 'http://localhost:3000/reset-password?token=xyz',
});
```

**Template Özellikleri:**
- Mavi gradient
- Büyük reset token gösterimi
- "Şifremi Sıfırla" CTA
- Güvenlik uyarı kutusu
- 1 saat geçerlilik süresi

## 🔄 Otomatik Scheduler

### Çalışma Mekanizması

```typescript
// Server başlatıldığında otomatik başlar
subscriptionNotificationService.startScheduler();

// Her saat başı çalışır
setInterval(() => {
  checkExpiringSubscriptions();
}, 60 * 60 * 1000);
```

### Kontrol Edilen Durumlar

1. **7 gün kala:** İlk uyarı, erken aksiyon için
2. **3 gün kala:** Orta uyarı, hatırlatma
3. **1 gün kala:** Final uyarı, acil aksiyon

### Süre Bitimi Kontrolü

```typescript
// Süresi biten abonelikleri otomatik güncelle
await prisma.subscription.updateMany({
  where: {
    status: 'ACTIVE',
    endDate: { lt: now },
  },
  data: {
    status: 'CANCELLED',
  },
});
```

## 🔗 Entegrasyonlar

### Webhook Integration

**Dosya:** `/backend/src/modules/webhooks/webhooks.controller.ts`

```typescript
// Yeni mesaj geldiğinde email gönder
if (direction === 'INBOUND') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.email) {
    await emailService.sendNewMessageNotification({
      to: user.email,
      customerName: customer_name,
      customerPhone: customer_phone,
      messageContent: message_content,
      panelUrl: `${serverConfig.frontendUrl}/client.html`,
    });
  }
}
```

### User Creation Integration

**Dosya:** `/backend/src/modules/users/users.service.ts`

```typescript
// Yeni kullanıcı oluşturulduğunda hoş geldin email'i
const user = await prisma.user.create({ data: {...} });

if (user.email) {
  emailService.sendWelcomeEmail({
    to: user.email,
    userName: user.fullName || user.companyName,
    panelUrl: `${serverConfig.frontendUrl}/client.html`,
  }).catch(error => console.error('Welcome email error:', error));
}
```

## 📊 Monitoring & Logging

### Console Logs

```typescript
console.log('📧 Email sent:', info.messageId);
console.log('📅 Found 3 subscriptions expiring in 7 days');
console.log('⏰ Updated 2 expired subscriptions');
console.error('❌ Email send error:', error);
```

### Email Delivery Status

Nodemailer `messageId` döner:
```typescript
const info = await transporter.sendMail({...});
console.log('Message sent: %s', info.messageId);
// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
```

## 🧪 Testing

### Manuel Test

```typescript
// Test email gönder
import { emailService } from './modules/notifications/email.service';

emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test Email</h1><p>Bu bir test email\'idir.</p>',
});
```

### Template Test

```bash
# Backend klasöründe
npm run dev

# Logs'ta email service ready mesajını görmeli:
# 📧 Email service ready
```

### Scheduler Test

```typescript
// Scheduler'ı manuel çalıştır
import { subscriptionNotificationService } from './modules/notifications/subscription-notification.service';

subscriptionNotificationService.checkExpiringSubscriptions();
```

## 🎨 Template Customization

### Handlebars Değişkenleri

Tüm template'ler şu değişkenleri kullanır:

```handlebars
{{userName}} - Kullanıcı adı
{{year}} - Mevcut yıl (footer için)
{{panelUrl}} - Panel URL'i
```

Template-specific değişkenler:

**new-message.hbs:**
```handlebars
{{customerName}}
{{customerPhone}}
{{messageContent}}
```

**subscription-expiry.hbs:**
```handlebars
{{planName}}
{{expiryDate}}
{{daysRemaining}}
{{renewUrl}}
```

**payment-success.hbs:**
```handlebars
{{amount}}
{{currency}}
{{transactionId}}
{{planName}}
```

### Styling Guidelines

Tüm template'ler:
- **Font:** System fonts (Apple, Segoe UI, Roboto)
- **Max Width:** 600px
- **Colors:** Gradient backgrounds
- **Responsive:** Mobile-friendly
- **Dark Mode:** Yok (çoğu email client desteklemez)

### Yeni Template Ekleme

1. `.hbs` dosyası oluştur: `templates/my-template.hbs`
2. Email service'e method ekle:
```typescript
async sendMyNotification(options: {...}): Promise<boolean> {
  return this.sendTemplateEmail({
    to: options.to,
    subject: 'My Subject',
    template: 'my-template',
    context: {...},
  });
}
```

## 🔒 Security

### SMTP Credentials

```bash
# ASLA commit etmeyin!
.env
.env.local
.env.production
```

### App Passwords

- Gmail için 2FA gerekli
- App-specific passwords kullanın
- Gerçek şifreyi ASLA kullanmayın

### Rate Limiting

Email spam önleme:
```typescript
// TODO: Implement rate limiting
// Kullanıcı başına günlük email limiti
// IP başına saatlik limit
```

## 📈 Future Enhancements

### Planned Features

- [ ] **Email Queue** - Bull + Redis ile async processing
- [ ] **Email Templates Admin Panel** - UI'dan template düzenleme
- [ ] **Email Analytics** - Açılma, tıklanma oranları
- [ ] **Unsubscribe Links** - Email tercihlerini yönetme
- [ ] **Email Logs Database** - Gönderilen emailler tablosu
- [ ] **Retry Mechanism** - Başarısız emailler için otomatik retry
- [ ] **Multi-language Support** - Template'lerde dil seçimi
- [ ] **Attachment Support** - Fatura PDF'leri ekleme
- [ ] **HTML/Plain Text Dual** - Plain text fallback

### Email Queue Implementation

```typescript
import Bull from 'bull';

const emailQueue = new Bull('emails', {
  redis: { host: 'localhost', port: 6379 }
});

emailQueue.process(async (job) => {
  const { type, data } = job.data;
  await emailService[type](data);
});

// Usage
emailQueue.add('sendWelcomeEmail', {
  to: 'user@example.com',
  userName: 'User',
  panelUrl: 'http://...',
});
```

## 🐛 Troubleshooting

### Issue: Emails not sending

**Solutions:**
1. Check SMTP credentials: `SMTP_USER`, `SMTP_PASS`
2. Verify Gmail app password: https://myaccount.google.com/apppasswords
3. Check 2FA enabled for Gmail
4. Test SMTP connection:
```bash
telnet smtp.gmail.com 587
```

### Issue: Templates not found

**Solutions:**
1. Verify template path: `/backend/src/modules/notifications/templates/`
2. Check file extension: `.hbs` (not `.html`)
3. Template name matches method call
4. Restart server after adding templates

### Issue: Emails in spam

**Solutions:**
1. Use proper `EMAIL_FROM_NAME` and `EMAIL_FROM_EMAIL`
2. Add SPF, DKIM, DMARC records to domain
3. Avoid spam keywords
4. Include unsubscribe link
5. Use verified sending domain (SendGrid/SES)

### Issue: Scheduler not running

**Solutions:**
1. Check server logs: `⏱️ Subscription notification scheduler started`
2. Verify server is running (not restarting)
3. Check interval: 60 minutes
4. Test manually: `checkExpiringSubscriptions()`

## 📞 Support

Email sistemi ile ilgili sorularınız için:
- GitHub Issues: https://github.com/MustafaBasol/DOA/issues
- Email: dev@autoviseo.com

---

**Son Güncelleme:** 21 Ocak 2026  
**Versiyon:** 2.0.0  
**Durum:** ✅ Production Ready
