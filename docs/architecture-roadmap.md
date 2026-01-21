# WhatsApp Chatbot Yönetim Paneli - Mimari & Yol Haritası

**Proje:** DOA WhatsApp Chatbot Yönetim Sistemi  
**Tarih:** 21 Ocak 2026  
**Durum:** Planlama Aşaması

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Önerilen Mimari](#önerilen-mimari)
3. [Teknoloji Yığını](#teknoloji-yığını)
4. [Veritabanı Şeması](#veritabanı-şeması)
5. [Güvenlik Yapısı](#güvenlik-yapısı)
6. [API Endpoint'leri](#api-endpointleri)
7. [Uygulama Yol Haritası](#uygulama-yol-haritası)
8. [Dosya Yapısı](#dosya-yapısı)
9. [n8n Entegrasyonu](#n8n-entegrasyonu)

---

## 🎯 Genel Bakış

### İş Gereksinimleri

**Müşteri Paneli (Client Panel):**
- n8n WhatsApp chatbot mesajlarını görüntüleme (sadece okuma)
- Ödeme durumu ve geçmişi görüntüleme
- Profil yönetimi (kullanıcı adı, şifre değiştirme)
- Çok dilli arayüz (TR, EN, FR)

**Not:** WhatsApp'a direkt bağlantı yoktur. Tüm mesajlaşma n8n workflow üzerinden gelir. Panelden mesaj gönderimi yapılmaz, sadece gelen mesajlar görüntülenir.

**Admin Paneli:**
- Müşteri (client) oluşturma ve yönetimi
- Email + şifre atama
- Aktif müşterileri listeleme
- Ödeme bilgilerini görüntüleme ve güncelleme
- Sistem geneli istatistikler

**Teknik Gereksinimler:**
- Email tabanlı, unique kullanıcı adı
- Güvenli kimlik doğrulama
- Role-based access control (RBAC)
- n8n webhook entegrasyonu
- Çok dilli destek

---

## 🏗️ Önerilen Mimari

### Mimari Yaklaşım: **Modern Full-Stack SPA**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Landing Page │  │ Client Panel │  │ Admin Panel  │     │
│  │ (Mevcut Site)│  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│           Vanilla JS / Vue.js (hafif)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTPS / REST API (JWT)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Node.js + Express                        │  │
│  │  • Authentication (JWT + bcrypt)                      │  │
│  │  • Authorization (RBAC)                               │  │
│  │  • User Management                                    │  │
│  │  • Payment Tracking                                   │  │
│  │  • n8n Webhook Receiver                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
┌───────────────▼────────┐   ┌──────────────▼────────────┐
│   PostgreSQL Database  │   │   n8n (Mevcut Sistem)     │
│  • Users (admin/client)│   │  • WhatsApp Chatbot       │
│  • Messages (READ-ONLY)│   │  • Webhook → Panel        │
│  • Payments            │   │  • Mesaj Gönderimi n8n'de │
│  • Subscriptions       │   │    (Panel dışında)        │
└────────────────────────┘   └───────────────────────────┘
```

---

## 💻 Teknoloji Yığını

### Backend
- **Runtime:** Node.js 20+ LTS
- **Framework:** Express.js 4.x
- **Veritabanı:** PostgreSQL 15+ (güvenli, ölçeklenebilir)
- **ORM:** Prisma (tip güvenli, migration desteği)
- **Kimlik Doğrulama:** 
  - JWT (jsonwebtoken)
  - bcrypt (şifre hashleme)
  - express-rate-limit (brute-force koruması)
- **Validation:** Joi / Zod
- **Email:** Nodemailer (şifre sıfırlama için)

### Frontend
- **Mevcut:** Vanilla JavaScript (korunacak)
- **Panel:** Vue 3 (composition API, hafif) VEYA Vanilla JS (tutarlılık için)
- **Styling:** Mevcut CSS + Tailwind CSS (opsiyonel)
- **HTTP Client:** Axios / Fetch API
- **State:** LocalStorage (JWT token) + Context

### DevOps & Güvenlik
- **Hosting:** 
  - Backend: Railway, Render, DigitalOcean App Platform
  - Frontend: Vercel, Netlify (statik kısım)
- **SSL/TLS:** Let's Encrypt (HTTPS zorunlu)
- **Environment:** dotenv
- **CORS:** cors middleware (kontrollü)
- **Helmet:** Güvenlik header'ları

### n8n Entegrasyonu
- **Webhook:** n8n → Backend API
- **Payload:** JSON (message_id, client_id, content, timestamp, from, to)

---

## 🗄️ Veritabanı Şeması

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'client')),
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  language VARCHAR(5) DEFAULT 'tr' CHECK (language IN ('tr', 'en', 'fr')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  created_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'suspended', 'cancelled')),
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  invoice_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_status ON payments(status);
```

### whatsapp_messages
```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  n8n_message_id VARCHAR(255),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  message_content TEXT,
  message_type VARCHAR(20) DEFAULT 'text',
  media_url VARCHAR(500),
  timestamp TIMESTAMP NOT NULL,
  read_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX idx_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX idx_messages_customer ON whatsapp_messages(customer_phone);
CREATE INDEX idx_messages_read ON whatsapp_messages(read_status);
```

### refresh_tokens (JWT refresh için)
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

---

## 🔐 Güvenlik Yapısı

### Kimlik Doğrulama Akışı

```
1. GİRİŞ (Login)
   Client → POST /api/auth/login {email, password}
   Server → Validate → bcrypt.compare()
   Server → Generate JWT (access + refresh tokens)
   Response → {accessToken, refreshToken, user}

2. TOKEN YAPISI
   Access Token (15 dakika):
   {
     "sub": "user_id",
     "email": "user@example.com",
     "role": "client",
     "iat": 1234567890,
     "exp": 1234568790
   }
   
   Refresh Token (7 gün): DB'de saklanır

3. PROTECTED ROUTE
   Client → GET /api/messages (Header: Authorization: Bearer <token>)
   Middleware → verifyToken() → req.user = decoded
   Controller → Check role → Return data

4. TOKEN YENİLEME
   Client → POST /api/auth/refresh {refreshToken}
   Server → Validate → Generate new accessToken
   Response → {accessToken}
```

### Güvenlik Önlemleri

✅ **Şifre Güvenliği**
- bcrypt (12 rounds minimum)
- Şifre karmaşıklık kuralları (min 8 karakter, büyük/küçük harf, rakam)
- Şifre değişim geçmişi (aynı şifre tekrarı önleme)

✅ **Token Güvenliği**
- JWT secret: 256-bit rastgele anahtar (.env)
- Access token: 15 dakika
- Refresh token: 7 gün (DB'de, iptal edilebilir)
- HttpOnly cookies (XSS koruması)

✅ **API Güvenliği**
- Rate limiting (IP bazlı): 100 istek/15 dakika
- CORS (sadece belirlenen domain'ler)
- Helmet.js (güvenlik header'ları)
- Input validation (Joi/Zod)
- SQL injection koruması (Prisma ORM)

✅ **Veri Güvenliği**
- HTTPS zorunlu (TLS 1.3)
- Sensitive data masking (loglarda şifre yok)
- GDPR compliant (veri silme hakkı)
- Database encryption at rest

✅ **Erişim Kontrolü (RBAC)**
```javascript
const roles = {
  admin: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'payments:read', 'payments:update',
    'messages:read:all',
    'stats:read'
  ],
  client: [
    'profile:read', 'profile:update',
    'messages:read:own',
    'payments:read:own'
  ]
};
```

---

## 🔌 API Endpoint'leri

### Authentication
```
POST   /api/auth/login              # Giriş yap
POST   /api/auth/logout             # Çıkış yap
POST   /api/auth/refresh            # Token yenile
POST   /api/auth/forgot-password    # Şifre sıfırlama isteği (email)
POST   /api/auth/reset-password     # Şifre sıfırlama (token ile)
```

### Users (Admin only)
```
POST   /api/users                   # Yeni müşteri oluştur
GET    /api/users                   # Tüm müşterileri listele (paginated)
GET    /api/users/:id               # Belirli müşteri detayı
PATCH  /api/users/:id               # Müşteri güncelle
DELETE /api/users/:id               # Müşteri sil (soft delete)
PATCH  /api/users/:id/status        # Müşteriyi aktif/pasif et
```

### Profile (Client + Admin)
```
GET    /api/profile                 # Kendi profilini getir
PATCH  /api/profile                 # Profil güncelle (isim, telefon, dil)
PATCH  /api/profile/email           # Email değiştir (doğrulama gerekli)
PATCH  /api/profile/password        # Şifre değiştir (eski şifre gerekli)
```

### Messages
```
GET    /api/messages                # Kendi mesajları (client) / Tümü (admin)
GET    /api/messages/:id            # Belirli mesaj detayı
GET    /api/messages/conversations  # Konuşma listesi (gruplu)
PATCH  /api/messages/:id/read       # Mesajı okundu olarak işaretle
POST   /api/webhooks/n8n/message    # n8n'den mesaj al (webhook)
```

### Payments (Admin: all, Client: own)
```
GET    /api/payments                # Ödeme geçmişi
GET    /api/payments/:id            # Ödeme detayı
POST   /api/payments                # Yeni ödeme kaydı (admin)
PATCH  /api/payments/:id            # Ödeme güncelle (admin)
```

### Subscriptions
```
GET    /api/subscriptions           # Abonelik bilgisi
POST   /api/subscriptions           # Yeni abonelik (admin)
PATCH  /api/subscriptions/:id       # Abonelik güncelle
```

### Statistics (Admin)
```
GET    /api/stats/overview          # Genel istatistikler
GET    /api/stats/revenue           # Gelir raporu
GET    /api/stats/active-users      # Aktif kullanıcı sayısı
GET    /api/stats/messages          # Mesaj istatistikleri
```

### Health Check
```
GET    /api/health                  # API sağlık kontrolü
GET    /api/health/db               # Database bağlantı kontrolü
```

---

## 🛣️ Uygulama Yol Haritası

### Faz 1: Temel Altyapı (2-3 hafta) ✅ TAMAMLANDI

**Hafta 1: Backend Kurulumu**
- [x] Proje yapısını oluştur (Express + TypeScript)
- [x] PostgreSQL veritabanı kur
- [x] Prisma ORM konfigürasyonu ve migration'lar
- [x] User model ve CRUD işlemleri
- [x] JWT authentication middleware
- [x] .env ve güvenlik konfigürasyonu
- [x] Error handling middleware

**Hafta 2: Auth ve User Management**
- [x] Login/logout endpoint'leri
- [x] Token refresh mekanizması
- [ ] Şifre sıfırlama (email gönderimi) - İleri aşamaya ertelendi
- [x] User CRUD endpoint'leri (admin)
- [x] Profile endpoint'leri (client)
- [x] Role-based access control (RBAC)
- [x] Input validation (Joi/Zod)

**Hafta 3: Test ve Dokümantasyon**
- [ ] API unit testleri (Jest) - İlerleyen aşamada
- [ ] Postman/Insomnia collection - İlerleyen aşamada
- [ ] API dokümantasyonu (Swagger/OpenAPI) - İlerleyen aşamada
- [x] Rate limiting ve güvenlik testleri

---

### Faz 2: Admin Paneli (2 hafta) 🔄 DEVAM EDİYOR

**Hafta 4: Admin UI - Kullanıcı Yönetimi**
- [x] Login sayfası
- [x] Dashboard (temel yapı)
- [ ] Müşteri listesi (tablo, arama, filtreleme) - ŞİMDİ
- [ ] Müşteri oluşturma formu
- [ ] Müşteri düzenleme/silme
- [ ] Aktif/pasif durumu değiştirme

**Hafta 5: Admin UI - Ödeme ve Raporlama**
- [ ] Ödeme geçmişi tablosu
- [ ] Ödeme ekleme/düzenleme formu
- [ ] Abonelik yönetimi
- [ ] Gelir grafikları (Chart.js/ApexCharts)
- [ ] Export özelliği (CSV/PDF)
- [x] Çok dilli destek entegrasyonu

---

### Faz 3: Client Paneli (2 hafta) 🔄 KISMEN TAMAMLANDI

**Hafta 6: Client UI - Temel Özellikler**
- [x] Client login sayfası
- [x] Dashboard (temel yapı)
- [ ] Profil görüntüleme/düzenleme - SONRAKI
- [ ] Şifre değiştirme - SONRAKI
- [ ] Email değiştirme (doğrulama ile)
- [x] Dil seçimi

**Hafta 7: Client UI - Mesajlaşma**
- [ ] Mesaj listesi (konuşmalar) - ŞİMDİ
- [ ] Mesaj detay görünümü
- [ ] Arama ve filtreleme
- [ ] Okundu/okunmadı durumu
- [ ] Ödeme geçmişi görüntüleme
- [ ] Fatura indirme (eğer varsa)

---

### Faz 4: n8n Entegrasyonu (1 hafta)

**Hafta 8: Webhook ve Gerçek Zamanlı Veri**
- [ ] n8n webhook endpoint'i (/api/webhooks/n8n/message)
- [ ] Mesaj kaydetme logic'i
- [ ] Webhook güvenliği (secret token)
- [ ] Message model ve database insert
- [ ] n8n akışını güncelleme (webhook'u çağır)
- [ ] Test mesajları gönderme

---

### Faz 5: İyileştirmeler ve Deployment (1-2 hafta)

**Hafta 9: Optimizasyon**
- [ ] Frontend performans optimizasyonu
- [ ] API response caching (Redis - opsiyonel)
- [ ] Database query optimizasyonu
- [ ] Image/media upload (eğer gerekli)
- [ ] Bildirim sistemi (email/push)

**Hafta 10: Deployment ve Güvenlik**
- [ ] Production environment setup
- [ ] SSL/TLS sertifikası
- [ ] Database backup stratejisi
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Final güvenlik denetimi
- [ ] Load testing
- [ ] Kullanıcı dokümantasyonu

---

### Faz 6: Test ve Go-Live (1 hafta)

**Hafta 11: UAT ve Launch**
- [ ] User acceptance testing (UAT)
- [ ] Bug fixing
- [ ] İlk müşterileri sisteme ekleme
- [ ] Eğitim ve onboarding materyalleri
- [ ] Go-live! 🚀
- [ ] Post-launch monitoring

---

## 📁 Dosya Yapısı

### Backend Yapısı

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── email.ts
│   ├── middleware/
│   │   ├── auth.ts              # JWT doğrulama
│   │   ├── rbac.ts              # Role-based access
│   │   ├── validation.ts         # Input validation
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.validation.ts
│   │   ├── messages/
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   └── messages.routes.ts
│   │   ├── payments/
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   └── payments.routes.ts
│   │   ├── subscriptions/
│   │   │   └── ...
│   │   └── webhooks/
│   │       ├── n8n.controller.ts
│   │       └── n8n.routes.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── password.ts           # bcrypt helpers
│   │   └── email.ts              # Email sender
│   ├── types/
│   │   └── express.d.ts          # TypeScript types
│   ├── app.ts                    # Express app
│   └── server.ts                 # Entry point
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

### Frontend Yapısı (Panel'ler için)

```
frontend/
├── public/
│   └── assets/
├── src/
│   ├── api/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── messages.js
│   │   └── client.js             # Axios instance
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Modal.js
│   │   │   └── Table.js
│   │   ├── admin/
│   │   │   ├── UserList.js
│   │   │   ├── UserForm.js
│   │   │   ├── PaymentList.js
│   │   │   └── Dashboard.js
│   │   └── client/
│   │       ├── MessageList.js
│   │       ├── Profile.js
│   │       └── PaymentHistory.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── admin/
│   │   │   ├── AdminDashboard.js
│   │   │   ├── Users.js
│   │   │   └── Payments.js
│   │   └── client/
│   │       ├── ClientDashboard.js
│   │       ├── Messages.js
│   │       └── Profile.js
│   ├── utils/
│   │   ├── auth.js               # Token management
│   │   ├── i18n.js               # Çeviri sistemi
│   │   └── validators.js
│   ├── styles/
│   │   └── panel.css
│   ├── router.js                 # Client-side routing
│   └── main.js                   # Entry point
├── admin.html
├── client.html
└── package.json
```

### Mevcut Site Entegrasyonu

```
/workspaces/DOA/  (Mevcut yapı korunacak)
├── index.html
├── legal.html
├── privacy.html
├── cookies.html
├── login.html           # YENİ: Giriş sayfası
├── admin.html           # YENİ: Admin panel
├── client.html          # YENİ: Client panel
├── assets/
│   ├── css/
│   │   ├── styles.css   # Mevcut
│   │   └── panel.css    # YENİ: Panel stilleri
│   ├── js/
│   │   ├── main.js      # Mevcut (landing)
│   │   └── panel/       # YENİ: Panel JS'leri
│   │       ├── api.js
│   │       ├── admin.js
│   │       ├── client.js
│   │       └── auth.js
└── backend/             # YENİ: Backend API
```

---

## 🔄 n8n Entegrasyonu

### Entegrasyon Mimarisi

**ÖNEMLİ:** Bu sistem WhatsApp'a direkt bağlanmaz. Tüm WhatsApp iletişimi n8n üzerinden yönetilir.

**Veri Akışı (Tek Yönlü - n8n → Panel):**
```
WhatsApp Mesaj Gelir (n8n'de)
  ↓
n8n Chatbot İşler (otomatik yanıt)
  ↓
HTTP Request Node
  ├─ URL: https://yourdomain.com/api/webhooks/n8n/message
  ├─ Method: POST
  ├─ Headers:
  │   └─ X-N8N-Secret: <your-secret-token>
  └─ Body:
      {
        "user_id": "user_uuid",
        "n8n_message_id": "{{ $json.messageId }}",
        "direction": "INBOUND",
        "from_number": "{{ $json.from }}",
        "to_number": "{{ $json.to }}",
        "customer_name": "{{ $json.contact.name }}",
        "customer_phone": "{{ $json.contact.phone }}",
        "message_content": "{{ $json.body }}",
        "message_type": "text",
        "timestamp": "{{ $json.timestamp }}"
      }
  ↓
Panel Veritabanına Kaydedilir (READ-ONLY)
  ↓
Müşteri Panelinde Görüntülenir
```

**Panel'den n8n'e mesaj gönderimi YOKTUR:**
- Panelden WhatsApp mesajı gönderilemez
- Tüm mesaj gönderimi n8n workflow'unda yapılır
- Panel sadece mesajları görüntüler (monitoring/dashboard)

### Backend Webhook Endpoint

**Amaç:** n8n'den gelen mesajları panele kaydetmek (tek yönlü)

**URL:** `POST /api/webhooks/n8n/message`

**Headers:**
```
X-N8N-Secret: <secret-token-from-env>
Content-Type: application/json
```

**Request Body (n8n'den gelir):**
```json
{
  "user_id": "uuid",
  "n8n_message_id": "msg_123",
  "direction": "INBOUND",
  "from_number": "+905551234567",
  "to_number": "+905559876543",
  "customer_name": "Ahmet Yılmaz",
  "customer_phone": "+905551234567",
  "message_content": "Merhaba, fiyat almak istiyorum",
  "message_type": "text",
  "media_url": null,
  "timestamp": "2026-01-21T10:30:00Z"
}
```

**Not:** 
- `direction` her zaman "INBOUND" olacak (n8n'den panel'e)
- Panel'den n8n'e OUTBOUND mesaj gönderimi YOK
- Giden mesajlar da n8n'de loglanıp buraya gönderilebilir (opsiyonel)

**Response:**
```json
{
  "success": true,
  "message_id": "uuid",
  "stored_at": "2026-01-21T10:30:01Z"
}
```

### Güvenlik

1. **Secret Token Doğrulama:**
```javascript
// backend/src/middleware/webhookAuth.ts
export const verifyN8nWebhook = (req, res, next) => {
  const secret = req.headers['x-n8n-secret'];
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

2. **IP Whitelist (Opsiyonel):**
```javascript
const allowedIPs = process.env.N8N_IP_WHITELIST.split(',');
if (!allowedIPs.includes(req.ip)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Client ID Eşleştirme

Her müşterinin n8n'deki WhatsApp numarası ile sistemdeki user_id'sini eşleştirmeniz gerekir:

**Çözüm 1: Phone Number Mapping**
```sql
ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(50) UNIQUE;
```

**Çözüm 2: Lookup Table**
```sql
CREATE TABLE client_phone_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  whatsapp_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

n8n'den gelen `to_number` (işletmenin WhatsApp numarası) ile `user_id` eşleştirilir:
```javascript
const user = await prisma.user.findUnique({
  where: { whatsapp_number: req.body.to_number }
});
```

---

## 🌐 Çok Dilli Destek

### Mevcut Yapı (Landing Page)

Sitenizde zaten `translations` objesi var (TR, EN, FR). Aynı yapıyı panel'lere de entegre edebiliriz:

```javascript
// assets/js/panel/i18n.js
const panelTranslations = {
  tr: {
    'login.title': 'Giriş Yap',
    'login.email': 'E-posta',
    'login.password': 'Şifre',
    'login.submit': 'Giriş',
    'admin.dashboard': 'Yönetici Paneli',
    'admin.users': 'Müşteriler',
    'admin.payments': 'Ödemeler',
    'client.messages': 'Mesajlar',
    'client.profile': 'Profil',
    // ... daha fazla çeviri
  },
  en: {
    'login.title': 'Login',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Login',
    // ...
  },
  fr: {
    'login.title': 'Connexion',
    'login.email': 'E-mail',
    'login.password': 'Mot de passe',
    'login.submit': 'Connexion',
    // ...
  }
};

// Kullanım (mevcut yapıyla aynı)
applyTranslations(activeLang);
```

### Backend Dil Desteği

User tablosunda `language` alanı var. API response'larında (özellikle email'lerde) kullanıcının dilini dikkate alın:

```javascript
// Email şablonu seçimi
const emailTemplate = user.language === 'en' 
  ? templates.en.passwordReset 
  : templates.tr.passwordReset;
```

---

## 📊 Dashboard Metrikleri

### Admin Dashboard

```
┌──────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                       │
├──────────────────────────────────────────────────────────┤
│  📊 Genel Bakış                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Aktif   │ │  Toplam  │ │  Aylık   │ │ Mesaj    │   │
│  │ Müşteri  │ │  Gelir   │ │  Gelir   │ │ Sayısı   │   │
│  │    42    │ │ ₺125,500 │ │ ₺18,750  │ │  1,234   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  📈 Gelir Grafiği (Son 6 Ay)                            │
│  [████████████████████████████░░░░░░]                   │
│                                                          │
│  👥 Son Eklenen Müşteriler                              │
│  • Acme Corp (acme@example.com) - 2 gün önce            │
│  • XYZ Ltd (xyz@example.com) - 5 gün önce               │
│                                                          │
│  ⚠️ Ödeme Bekleyenler                                   │
│  • Beta Inc - ₺750 - 3 gün gecikmiş                     │
└──────────────────────────────────────────────────────────┘
```

### Client Dashboard

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT DASHBOARD                       │
├──────────────────────────────────────────────────────────┤
│  👋 Hoş geldiniz, Acme Corp!                             │
│                                                          │
│  💬 Bu Ay Mesajlar                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │  Toplam  │ │  Gelen   │ │  Giden   │                │
│  │   156    │ │    98    │ │    58    │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                          │
│  💳 Abonelik Durumu                                      │
│  Plan: Premium | ₺750/ay | Ödeme: 25 Ocak               │
│  Durum: ✅ Aktif                                         │
│                                                          │
│  📩 Son Konuşmalar                                       │
│  • Ahmet Yılmaz (+905551234567) - 5 dk önce             │
│  • Zeynep Kaya (+905559876543) - 2 saat önce            │
│  • Mehmet Demir (+905551111111) - dün                   │
└──────────────────────────────────────────────────────────┘
```

---

## ⚙️ Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=5000
API_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=<256-bit-random-key>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# n8n Webhook
N8N_WEBHOOK_SECRET=<strong-secret-token>
N8N_IP_WHITELIST=<n8n-server-ip>

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Frontend URL (CORS)
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 min
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
SENTRY_DSN=<sentry-dsn>

# Encryption (optional)
ENCRYPTION_KEY=<32-byte-key>
```

---

## 🧪 Testing Stratejisi

### Unit Tests (Jest)

```javascript
// tests/unit/auth.service.test.ts
describe('AuthService', () => {
  test('should hash password correctly', async () => {
    const password = 'Test123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  test('should generate valid JWT', () => {
    const token = generateAccessToken({ id: '123', role: 'client' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.sub).toBe('123');
  });
});
```

### Integration Tests

```javascript
// tests/integration/auth.routes.test.ts
describe('POST /api/auth/login', () => {
  test('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  test('should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    
    expect(res.status).toBe(401);
  });
});
```

### E2E Tests (Playwright/Cypress)

```javascript
// tests/e2e/admin-flow.spec.ts
test('Admin can create a new client', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/admin/dashboard');
  await page.click('text=Yeni Müşteri');
  
  await page.fill('[name="email"]', 'client@example.com');
  await page.fill('[name="fullName"]', 'Test Client');
  await page.fill('[name="password"]', 'Client123!');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Müşteri başarıyla oluşturuldu')).toBeVisible();
});
```

---

## 🚀 Deployment Senaryoları

### Seçenek 1: Railway (Önerilen - Kolay)

**Avantajlar:**
- Tek komutla deploy
- Otomatik PostgreSQL provision
- GitHub entegrasyonu
- Ücretsiz plan (başlangıç için)

**Adımlar:**
1. Railway hesabı oluştur
2. GitHub repo'yu bağla
3. PostgreSQL service ekle
4. Environment variables ayarla
5. Deploy!

**Maliyet:** ~$5-20/ay (küçük-orta trafik)

### Seçenek 2: DigitalOcean App Platform

**Avantajlar:**
- Güçlü altyapı
- Managed PostgreSQL
- Kolay ölçeklenebilir

**Adımlar:**
1. DO hesabı oluştur
2. Managed Database oluştur
3. App Platform'dan deploy
4. Domain bağla

**Maliyet:** ~$12-25/ay

### Seçenek 3: Self-hosted VPS (En Ucuz, Daha Teknik)

**Avantajlar:**
- Tam kontrol
- En düşük maliyet

**Stack:**
- DigitalOcean/Hetzner/Linode VPS ($5-10/ay)
- Nginx reverse proxy
- PM2 (process manager)
- Certbot (SSL)
- PostgreSQL

**Adımlar:**
```bash
# VPS'e bağlan
ssh root@your-vps-ip

# Node.js, PostgreSQL, Nginx kur
apt update && apt install -y nodejs npm postgresql nginx certbot

# Backend deploy
cd /var/www
git clone <your-repo>
cd backend
npm install --production
npm run build

# PM2 ile başlat
npm install -g pm2
pm2 start dist/server.js --name "doa-api"
pm2 startup
pm2 save

# Nginx config
nano /etc/nginx/sites-available/doa
# [Config dosyası - aşağıda]

# SSL sertifikası
certbot --nginx -d api.yourdomain.com
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 📝 İlk Adımlar (Hemen Başlamak İçin)

### 1. Backend Skeleton Oluştur

```bash
cd /workspaces/DOA
mkdir backend
cd backend

# Node.js projesi başlat
npm init -y

# Temel dependency'ler
npm install express cors helmet dotenv bcryptjs jsonwebtoken
npm install @prisma/client
npm install -D prisma typescript @types/node @types/express ts-node-dev

# TypeScript config
npx tsc --init

# Prisma init
npx prisma init
```

### 2. İlk Database Schema

```bash
# backend/prisma/schema.prisma düzenle (yukarıdaki schema'yı kopyala)

# Migration oluştur
npx prisma migrate dev --name init

# Prisma Client generate et
npx prisma generate
```

### 3. İlk Admin Kullanıcı Oluştur (Seed)

```javascript
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@autoviseo.com',
      password_hash: passwordHash,
      role: 'admin',
      full_name: 'System Admin',
      language: 'tr',
      is_active: true
    }
  });
  
  console.log('Admin created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
npx ts-node prisma/seed.ts
```

### 4. İlk API Endpoint (Test)

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

```bash
npm run dev
# Tarayıcıda: http://localhost:5000/api/health
```

---

## 🎯 Sonuç ve Tavsiyeler

### Kritik Başarı Faktörleri

✅ **Güvenlik her şeyden önce**
- JWT secret güçlü olmalı
- HTTPS zorunlu
- Input validation her yerde
- Rate limiting aktif

✅ **n8n entegrasyonu kritik**
- Webhook'u erken test edin
- Client ID mapping'i net olsun
- Fallback mekanizması düşünün

✅ **UX basit olmalı**
- Admin paneli minimal (tablo, form, CRUD)
- Client paneli sade (mesajlar, profil, ödemeler)
- Responsive design

✅ **Ölçeklenebilirlik**
- PostgreSQL indexler doğru olsun
- API pagination kullanın
- İlerisi için Redis cache düşünün

### Alternatif Yaklaşımlar

**Eğer hızlı MVP istiyorsanız:**
- Supabase kullanın (backend + DB + auth hazır)
- n8n direkt Supabase'e yazsın
- Frontend'i Vercel'e deploy edin
- 1-2 haftada bitirin

**Eğer sıfır maliyet istiyorsanız:**
- Backend: Railway free tier
- DB: Supabase free tier
- Frontend: Vercel/Netlify free tier
- Email: SendGrid free tier (100/day)

### Sıradaki Adımlar

1. **Karar Verin:** Mimari onaylanıyor mu?
2. **Prototip:** İlk hafta backend + 1 endpoint
3. **MVP:** İlk 4 haftada core özellikler
4. **Beta:** İlk müşteriyle test
5. **Production:** Go-live!

---

## 📞 Destek ve Dokümantasyon

### Yararlı Kaynaklar

- **Prisma Docs:** https://www.prisma.io/docs
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725
- **OWASP Security:** https://cheatsheetseries.owasp.org/
- **n8n Webhooks:** https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/

### Kod Örnekleri

Tam kod örnekleri ve boilerplate'ler için:
```bash
# Backend starter
git clone https://github.com/your-template/express-prisma-jwt-starter

# Frontend starter
git clone https://github.com/your-template/vanilla-spa-starter
```

---

**Hazırlayan:** GitHub Copilot  
**Tarih:** 21 Ocak 2026  
**Versiyon:** 2.0  
**Durum:** ✅ v1.0 Tamamlandı, v2.0 Geliştirme Devam Ediyor

---

## 🚀 v2.0 Gelişmiş Özellikler Roadmap

### ✅ Tamamlanan v2.0 Özellikler

#### 1. Real-time Updates (WebSocket/Socket.IO) ✅
- **Tamamlanma:** 21 Ocak 2026
- **Süre:** 2 gün
- **Özellikler:**
  - Socket.IO server entegrasyonu
  - Real-time mesaj bildirimleri
  - Client-side Socket.IO bağlantısı
  - Otomatik yeniden bağlanma
  - Connection status göstergesi

#### 2. Email Notifications (Nodemailer + Handlebars) ✅
- **Tamamlanma:** 21 Ocak 2026
- **Süre:** 2 gün
- **Özellikler:**
  - Yeni mesaj email bildirimleri
  - Abonelik süre uyarıları (7/3/1 gün)
  - Ödeme onay emailler
  - Hoş geldiniz emaili
  - Şifre sıfırlama emaili
  - 5 adet Handlebars template
  - Otomatik scheduler (saatlik)

#### 3. Excel & PDF Raporlama (ExcelJS + PDFKit) ✅
- **Tamamlanma:** 21 Ocak 2026
- **Süre:** 2 gün
- **Özellikler:**
  - Mesaj raporları (Excel & PDF)
  - Müşteri raporları (Excel)
  - Ödeme raporları (Excel & PDF)
  - Abonelik raporları (Excel)
  - Tarih aralığı filtreleme
  - Özet istatistikler
  - Frontend dropdown menü
  - Tek tıkla indirme

#### 4. Analytics Dashboard ✅ TAMAMLANDI
- **Başlangıç:** 21 Ocak 2026
- **Tamamlanma:** 21 Ocak 2026
- **Backend Özellikleri:**
  - ✅ 7 Analytics API endpoint oluşturuldu
  - ✅ Mesaj trend analizi (gelen/giden split)
  - ✅ Müşteri büyüme metrikleri (günlük yeni + kümülatif)
  - ✅ Gelir analizi (günlük amount + count)
  - ✅ Top customers ranking (mesaj sayısına göre)
  - ✅ Peak hours heatmap (24 saatlik dağılım)
  - ✅ Genel istatistikler (paralel query optimizasyonu)
  - ✅ Karşılaştırmalı analiz (current vs previous period)
  - ✅ Zaman aralığı desteği (preset + custom dates)
  - ✅ Role-based filtering (CLIENT/ADMIN)
- **Frontend Özellikleri:**
  - ✅ Chart.js entegrasyonu
  - ✅ 9 KPI card (mesaj, müşteri, gelir metrikleri)
  - ✅ 5 interaktif grafik (line, bar, horizontal bar)
  - ✅ Period selector (today, yesterday, last7days, last30days, thisMonth, lastMonth, thisYear, custom)
  - ✅ Custom date range picker
  - ✅ Responsive tasarım
  - ✅ Loading states ve error handling
- **Dokümantasyon:**
  - ✅ `/docs/analytics-dashboard.md` oluşturuldu
  - ✅ API endpoint detayları
  - ✅ Frontend kullanım örnekleri
  - ✅ Troubleshooting rehberi

#### 5. Advanced Search & Filters ✅ TAMAMLANDI
- **Başlangıç:** 21 Ocak 2026
- **Tamamlanma:** 21 Ocak 2026
- **Backend Özellikleri:**
  - ✅ SavedSearch database modeli oluşturuldu
  - ✅ Multi-field search service (10+ operatör desteği)
  - ✅ 4 varlık desteği (MESSAGES, CUSTOMERS, PAYMENTS, SUBSCRIPTIONS)
  - ✅ Quick search endpoint (GET with query params)
  - ✅ Advanced search endpoint (POST with complex filters)
  - ✅ Saved searches CRUD operations
  - ✅ Execute saved search endpoint
  - ✅ Get search fields & operators endpoint
  - ✅ Role-based filtering (CLIENT/ADMIN)
  - ✅ Pagination support
- **Operatörler:**
  - ✅ equals, contains, startsWith, endsWith
  - ✅ gt, gte, lt, lte (numeric & date)
  - ✅ in (array values)
  - ✅ between (range queries)
- **Frontend Özellikleri:**
  - ✅ Entity selector (4 entity type)
  - ✅ Quick search interface
  - ✅ Dynamic filter builder
  - ✅ Field type-aware input (text, number, date, boolean, enum)
  - ✅ Operator selector (type-based filtering)
  - ✅ Add/remove filters
  - ✅ Saved searches manager
  - ✅ Set default search
  - ✅ Execute/load/delete saved searches
  - ✅ Results table with pagination
  - ✅ Responsive design
- **Dokümantasyon:**
  - ✅ `/docs/advanced-search.md` oluşturuldu
  - ✅ API endpoint detayları
  - ✅ Frontend kullanım kılavuzu
  - ✅ Örnek kullanım senaryoları

### 🔄 Devam Eden Özellikler

*Şu anda aktif geliştirme yok*

### 📋 Planlanan v2.0 Özellikler

#### 6. User Roles & Permissions ✅ TAMAMLANDI
- **Başlangıç:** 21 Ocak 2026
- **Tamamlanma:** 21 Ocak 2026
- **Backend Özellikleri:**
  - ✅ Permission, RolePermission, AuditLog modelleri oluşturuldu
  - ✅ 4 rol tanımlandı (SUPER_ADMIN, ADMIN, MANAGER, CLIENT)
  - ✅ 37 granüler yetki oluşturuldu (10 kaynak tipi)
  - ✅ Permission service (cache ile 5dk TTL)
  - ✅ Audit service (otomatik kayıt, istatistikler, temizleme)
  - ✅ Permission middleware (checkPermission, checkAnyPermission, checkAllPermissions, checkRole)
  - ✅ Audit logging middleware (otomatik ve değişiklik takibi)
  - ✅ Role management API (9 endpoint)
  - ✅ Audit log API (5 endpoint)
  - ✅ Users routes'a permission kontrolü eklendi
  - ✅ Migration uygulandı ve permissions seed edildi
- **Frontend Özellikleri:**
  - ✅ `/permissions.html` - Rol ve yetki yönetim sayfası
  - ✅ `/audit.html` - Denetim kayıtları sayfası
  - ✅ 3 tab görünüm (Roller, Matris, Tüm Yetkiler)
  - ✅ Yetki matrisi (resource-action grid)
  - ✅ Rol detay modal
  - ✅ İstatistik kartları (4 KPI)
  - ✅ Audit log filtreleme (kaynak, eylem, tarih)
  - ✅ Timeline görünümü (tarih bazlı gruplama)
  - ✅ Log detay modal (JSON değişiklikler)
  - ✅ Pagination desteği
- **Dokümantasyon:**
  - ✅ `/docs/permissions-system.md` oluşturuldu
  - ✅ Tüm 37 yetki dokümante edildi
  - ✅ Rol hiyerarşisi açıklandı
  - ✅ API kullanım örnekleri
  - ✅ Frontend entegrasyon rehberi
  - ✅ Güvenlik notları ve best practices
  - ✅ Troubleshooting kılavuzu

#### 7. Backup & Restore System (2-3 gün)
- **Hedef Başlangıç:** 1 Şubat 2026
- **Özellikler:**
  - [ ] Otomatik database backup (günlük)
  - [ ] Manual backup endpoint
  - [ ] Backup storage (S3/Local)
  - [ ] Restore functionality
  - [ ] Backup history ve management
  - [ ] Email backup notifications
  - [ ] Backup health monitoring

#### 8. Multi-tenant Support (4-5 gün)
- **Hedef Başlangıç:** 4 Şubat 2026
- **Özellikler:**
  - [ ] Tenant isolation (schema/database)
  - [ ] Tenant yönetimi
  - [ ] Custom branding per tenant
  - [ ] Tenant-specific configurations
  - [ ] Billing per tenant
  - [ ] Tenant metrics dashboard

### 🔮 v3.0 Future Ideas**Analytics Dashboard**, **Advanced Search & Filters** ve **User Roles & Permissions** özellikleri tamamlandı! 🎉

Sıradaki özellik: **Backup & Restore System** (2-3 gün)

- **AI-Powered Features:**
  - Otomatik mesaj kategorilendirme
  - Sentiment analysis
  - Smart reply önerileri
  - Chatbot performance analytics

- **Mobile App:**
  - React Native app
  - Push notifications
  - Offline mode
  - Mobile-optimized UI

- **API Marketplace:**
  - Public API documentation
  - API key yönetimi
  - Rate limiting per key
  - API usage analytics

---

## Sonraki Adım

v2.0 geliştirmeleri devam ediyor. Şu anda **Analytics Dashboard** özelliği üzerinde çalışılıyor.

Hazır mısınız? 🚀
