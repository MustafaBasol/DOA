# DOA - WhatsApp Chatbot Yönetim Sistemi

## 📋 Proje Özeti

WhatsApp chatbot'larını işletmelere satan bir firma için geliştirilmiş, müşterilerin WhatsApp konuşmalarını görüntüleyebildiği, abonelik ve ödeme bilgilerini yönetebildiği tam kapsamlı bir yönetim sistemi.

**Durum:** v1.5 - Production'a hazır (UI polishing devam ediyor)  
**Son Güncelleme:** 21 Ocak 2026

## 🚀 Özellikler

### Güvenlik ve Kimlik Doğrulama
- ✅ JWT tabanlı kimlik doğrulama (Access + Refresh tokens)
- ✅ Rol tabanlı yetkilendirme (ADMIN/CLIENT)
- ✅ **Permission sistemi (RBAC) - Detaylı yetki kontrolü**
- ✅ **Audit logging - Tüm işlemler loglanıyor**
- ✅ Şifre güvenliği (bcrypt, 12 rounds)
- ✅ Rate limiting (IP bazlı)
- ✅ CORS ve Helmet güvenlik başlıkları

### Kullanıcı Yönetimi
- ✅ Kullanıcı CRUD işlemleri (Admin)
- ✅ Profil yönetimi
- ✅ Şifre değiştirme
- ✅ Arama ve filtreleme
- ✅ Sayfalama desteği
- ✅ **Permission-based access control**
- ✅ **Audit trail tracking**

### WhatsApp Mesaj Yönetimi
- ✅ n8n webhook entegrasyonu (tek yönlü: n8n → Panel)
- ✅ n8n chatbot mesajlarını görüntüleme (sadece okuma)
- ✅ Konuşma listesi ve mesaj geçmişi
- ✅ Gelen mesaj bildirimleri
- ✅ Okundu işaretleme
- ✅ Mesaj istatistikleri ve filtreleme
- ✅ **Real-time mesaj güncellemeleri (Socket.IO)**
- ✅ **Email notification (yeni mesaj geldiğinde)**

**Not:** Panel'den WhatsApp mesaj gönderimi YOKTUR. Tüm mesajlaşma n8n workflow'unda yönetilir.

### Abonelik ve Ödeme Sistemi
- ✅ Abonelik yönetimi (CRUD)
- ✅ Ödeme takibi ve raporlama
- ✅ Otomatik yenileme desteği
- ✅ Faturalama dönemleri (Aylık/3 Aylık/Yıllık)
- ✅ Mesaj ve kullanıcı limitleri
- ✅ İstatistikler ve raporlar
- ✅ **Abonelik sona erme bildirimleri (email)**

### Dashboard ve Raporlama
- ✅ Admin dashboard (genel istatistikler)
- ✅ Client dashboard (kişisel istatistikler)
- ✅ **Gelişmiş Analytics API**
  - Mesaj trend analizi
  - Müşteri büyüme grafiği
  - Gelir analizi
  - En aktif müşteriler
  - Peak hours analizi
- ✅ **Advanced Reports (Excel & PDF export)**
- ✅ Grafik ve progress barlar (Chart.js)
- ✅ Real-time güncellemeler

### Advanced Search
- ✅ **Gelişmiş arama API**
- ✅ **Kayıtlı aramalar**
- ✅ **Kompleks filtreleme**
- ✅ **Multi-entity search (mesajlar, müşteriler, ödemeler, abonelikler)**
- ✅ Frontend search UI

### Email Notification System
- ✅ **Nodemailer email servisi**
- ✅ **HTML email template'leri**
  - Hoş geldin mesajı
  - Yeni mesaj bildirimi
  - Abonelik sona erme uyarısı
  - Ödeme başarılı/başarısız
  - Şifre sıfırlama
- ✅ **Webhook entegrasyonu (otomatik email)**
- ✅ **Subscription notification service**

### Real-time Features
- ✅ **Socket.IO server**
- ✅ **WebSocket authentication**
- ✅ **User-specific rooms**
- ✅ **Admin broadcast**
- ✅ **Typing indicators**
- ✅ **Reconnection logic**
- ✅ **Frontend socket client**

### Permission & Audit System
- ✅ **Permission middleware**
- ✅ **Audit log middleware**
- ✅ **Permission CRUD API**
- ✅ **Audit log API (listeleme, filtreleme)**
- ✅ **Critical route entegrasyonları**
- 🟡 **UI (backend tamam, frontend geliştiriliyor)**

### Çok Dilli Destek
- ✅ Türkçe (TR)
- ✅ İngilizce (EN)
- ✅ Fransızca (FR)

## 🛠 Teknoloji Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15 (Docker)
- **ORM:** Prisma v5.20.0
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi v17.x
- **Security:** Helmet, CORS, express-rate-limit
- **Real-time:** Socket.IO v4.7.2
- **Email:** Nodemailer
- **Template Engine:** Handlebars (email templates)
- **Reports:** ExcelJS, PDFKit

### Frontend
- **Vanilla JavaScript** (ES6+)
- **Socket.IO Client** v4.7.2
- **Chart.js** (analytics graphs)
- **HTML5 & CSS3**
- **Fetch API** (async/await)
- **LocalStorage** (token management)

## 📁 Proje Yapısı

```
DOA/
├── backend/                    # Node.js Backend
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Database migrations
│   │   └── seed.ts            # Test data
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.ts        # JWT authentication
│   │   │   ├── permission.ts  # Permission checks ✨
│   │   │   ├── auditLog.ts    # Audit logging ✨
│   │   │   └── ...
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── users/         # User management
│   │   │   ├── messages/      # WhatsApp messages
│   │   │   ├── subscriptions/ # Subscriptions
│   │   │   ├── payments/      # Payments
│   │   │   ├── analytics/     # Advanced analytics ✨
│   │   │   ├── reports/       # Report generation ✨
│   │   │   ├── search/        # Advanced search ✨
│   │   │   ├── notifications/ # Email service ✨
│   │   │   └── webhooks/      # n8n webhooks
│   │   ├── socket/            # Socket.IO server ✨
│   │   ├── services/          # Business logic
│   │   │   ├── permission.service.ts ✨
│   │   │   └── audit.service.ts ✨
│   │   ├── routes/            # Additional routes
│   │   ├── utils/             # Utilities
│   │   ├── app.ts             # Express app
│   │   └── server.ts          # Server entry
│   └── package.json
├── assets/
│   ├── css/                   # Stylesheets
│   ├── js/
│   │   ├── socket-client.js   # Socket.IO client ✨
│   │   └── panel/             # Panel JavaScript
│   │       ├── analytics.js   # Analytics UI ✨
│   │       ├── search.js      # Advanced search UI ✨
│   │       ├── reports.js     # Reports UI ✨
│   │       └── ...
│   └── images/
├── docs/
│   ├── architecture-roadmap.md
│   ├── v2-roadmap.md
│   ├── IMPLEMENTATION_STATUS.md ✨
│   ├── advanced-search.md
│   ├── analytics-dashboard.md
│   ├── email-notifications.md
│   ├── permissions-system.md
│   ├── websocket.md
│   └── ...
├── *.html                     # HTML pages
└── README.md
├── index.html                 # Landing page
├── login.html                 # Login page
├── dashboard.html             # Admin dashboard
├── admin.html                 # User management
├── admin-subscriptions.html   # Subscription management
├── admin-payments.html        # Payment management
└── client.html                # Client panel
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 20+
- Docker (PostgreSQL için)
- Python 3 (frontend server için)

### 1. PostgreSQL Kurulumu
```bash
docker run --name doa-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=doa_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 2. Backend Kurulumu
```bash
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cat > .env << EOL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/doa_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:3000"
N8N_WEBHOOK_SECRET="your-n8n-webhook-secret"
EOL

# Database migration
npx prisma migrate dev

# Test verileri ekle
npm run seed

# Development server başlat
npm run dev
```

Backend **http://localhost:5000** adresinde çalışacak.

### 3. Frontend Çalıştırma
```bash
# Ana dizinde
python3 -m http.server 3000
```

Frontend **http://localhost:3000** adresinde çalışacak.

## 🔐 Test Hesapları

### Admin Hesabı
- **Email:** admin@autoviseo.com
- **Şifre:** Admin123!
- **Panel:** http://localhost:3000/dashboard.html

### Client Hesabı
- **Email:** test@example.com
- **Şifre:** Client123!
- **Panel:** http://localhost:3000/client.html

## 📚 API Dokümantasyonu

### Authentication (`/api/auth`)
```bash
POST   /auth/login           # Giriş yap
POST   /auth/logout          # Çıkış yap
POST   /auth/refresh         # Token yenile
GET    /auth/me              # Profil bilgisi
```

### Users (`/api/users`)
```bash
# Admin only
POST   /users                # Kullanıcı oluştur
GET    /users                # Kullanıcı listesi
GET    /users/stats          # İstatistikler
GET    /users/:id            # Detay
PATCH  /users/:id            # Güncelle
DELETE /users/:id            # Sil

# Authenticated
GET    /users/profile/me     # Profil
PATCH  /users/profile/me     # Profil güncelle
PATCH  /users/profile/password # Şifre değiştir
```

### Messages (`/api/messages`)
```bash
GET    /messages             # Liste
GET    /messages/conversations # Konuşmalar
GET    /messages/stats       # İstatistikler
GET    /messages/:id         # Detay
PATCH  /messages/:id/read    # Okundu işaretle
POST   /messages/conversations/mark-read
```

### Webhooks (`/api/webhooks`)
```bash
POST   /webhooks/n8n/message # n8n mesaj
GET    /webhooks/n8n/health  # Sağlık kontrolü
```

### Subscriptions (`/api/subscriptions`)
```bash
GET    /subscriptions        # Liste
GET    /subscriptions/stats  # İstatistikler
GET    /subscriptions/:id    # Detay
GET    /subscriptions/user/:userId/active
POST   /subscriptions        # Oluştur (admin)
PATCH  /subscriptions/:id    # Güncelle (admin)
POST   /subscriptions/:id/cancel # İptal
DELETE /subscriptions/:id    # Sil (admin)
```

### Payments (`/api/payments`)
```bash
GET    /payments             # Liste
GET    /payments/stats       # İstatistikler
GET    /payments/:id         # Detay
GET    /payments/user/:userId/summary
POST   /payments             # Oluştur (admin, permission required)
PATCH  /payments/:id         # Güncelle (admin, permission required)
DELETE /payments/:id         # Sil (admin, permission required)
```

### Analytics (`/api/analytics`) ✨
```bash
GET    /analytics/overview   # Genel bakış
GET    /analytics/message-trends # Mesaj trend analizi
GET    /analytics/customer-growth # Müşteri büyümesi
GET    /analytics/revenue    # Gelir analizi
GET    /analytics/top-customers # En aktif müşteriler
GET    /analytics/peak-hours # Yoğun saatler
```

### Reports (`/api/reports`) ✨
```bash
POST   /reports/messages/export # Mesaj raporu (Excel/PDF)
POST   /reports/customers/export # Müşteri raporu
POST   /reports/payments/export # Ödeme raporu
POST   /reports/subscriptions/export # Abonelik raporu
GET    /reports/messages     # Mesaj istatistikleri
GET    /reports/customers    # Müşteri istatistikleri
GET    /reports/revenue      # Gelir raporu
```

### Search (`/api/search`) ✨
```bash
POST   /search               # Gelişmiş arama
GET    /search/fields/:entity # Alan bilgileri
GET    /search/saved         # Kayıtlı aramalar
POST   /search/saved         # Arama kaydet
PATCH  /search/saved/:id     # Arama güncelle
DELETE /search/saved/:id     # Arama sil
```

### Permissions (`/api/permissions`) ✨
```bash
GET    /permissions          # Tüm izinler
GET    /permissions/role/:role # Role göre izinler
POST   /permissions          # İzin oluştur (admin)
PATCH  /permissions/:id      # İzin güncelle (admin)
DELETE /permissions/:id      # İzin sil (admin)
```

### Audit (`/api/audit`) ✨
```bash
GET    /audit                # Audit log listesi
GET    /audit/:id            # Log detayı
GET    /audit/user/:userId   # Kullanıcı logları
GET    /audit/resource/:resource # Kaynak logları
```

## 🔧 n8n Webhook Entegrasyonu

### Webhook URL
```
POST http://localhost:5000/api/webhooks/n8n/message
```

### Headers
```json
{
  "Content-Type": "application/json",
  "X-N8N-Webhook-Secret": "your-n8n-webhook-secret"
}
```

### Request Body
```json
{
  "from_number": "+905551234567",
  "to_number": "+905559876543",
  "message_content": "Merhaba, test mesajı",
  "timestamp": "2026-01-21T14:30:00Z",
  "direction": "INBOUND",
  "customer_name": "Ahmet Yılmaz",
  "customer_phone": "+905551234567",
  "client_id": 2
}
```

## 📊 Database Schema

### Users
- id, email, passwordHash, role
- fullName, companyName, phone, whatsappNumber
- language, isActive, lastLogin

### Subscriptions
- id, userId, planName, planPrice, billingCycle
- startDate, endDate, status, autoRenew
- maxMessages, maxUsers, features

### Payments
- id, userId, subscriptionId
- amount, currency, paymentMethod, status
- transactionId, description

### WhatsappMessages
- id, userId, fromNumber, toNumber
- messageContent, timestamp, direction
- customerName, customerPhone, isRead

## 📈 Geliştirme Roadmap

### Tamamlanan (v1.0) ✅
- Backend altyapısı ve API'ler
- Kimlik doğrulama sistemi
- Kullanıcı yönetimi
- WhatsApp mesaj entegrasyonu
- Abonelik ve ödeme sistemi
- Dashboard ve raporlama

### Sıradaki Özellikler (v2.0) 🔜
- WebSocket ile gerçek zamanlı mesajlaşma
- Email bildirimleri
- Gelişmiş raporlama (Excel/PDF)
- WhatsApp şablon mesaj gönderme
- Chatbot flow builder
- Analytics ve metrikler
- Multi-tenant architecture

## 📝 Lisans

Bu proje özel bir projedir ve telif hakları saklıdır.

---

**Versiyon:** 1.0.0
**Durum:** Production Ready ✅
**Geliştirme:** Ocak 2026
