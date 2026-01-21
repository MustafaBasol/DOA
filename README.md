# DOA - WhatsApp Chatbot Yönetim Sistemi

## 📋 Proje Özeti

WhatsApp chatbot'larını işletmelere satan bir firma için geliştirilmiş, müşterilerin WhatsApp konuşmalarını görüntüleyebildiği, abonelik ve ödeme bilgilerini yönetebildiği tam kapsamlı bir yönetim sistemi.

## 🚀 Özellikler

### Güvenlik ve Kimlik Doğrulama
- ✅ JWT tabanlı kimlik doğrulama (Access + Refresh tokens)
- ✅ Rol tabanlı yetkilendirme (ADMIN/CLIENT)
- ✅ Şifre güvenliği (bcrypt, 12 rounds)
- ✅ Rate limiting (IP bazlı)
- ✅ CORS ve Helmet güvenlik başlıkları

### Kullanıcı Yönetimi
- ✅ Kullanıcı CRUD işlemleri (Admin)
- ✅ Profil yönetimi
- ✅ Şifre değiştirme
- ✅ Arama ve filtreleme
- ✅ Sayfalama desteği

### WhatsApp Mesaj Yönetimi
- ✅ n8n webhook entegrasyonu
- ✅ Konuşma listesi ve mesaj görüntüleme
- ✅ Gelen/giden mesaj ayrımı
- ✅ Okundu işaretleme
- ✅ Mesaj istatistikleri
- ✅ Otomatik yenileme (30 saniye)

### Abonelik ve Ödeme Sistemi
- ✅ Abonelik yönetimi (CRUD)
- ✅ Ödeme takibi ve raporlama
- ✅ Otomatik yenileme desteği
- ✅ Faturalama dönemleri (Aylık/3 Aylık/Yıllık)
- ✅ Mesaj ve kullanıcı limitleri
- ✅ İstatistikler ve raporlar

### Dashboard ve Raporlama
- ✅ Admin dashboard (genel istatistikler)
- ✅ Client dashboard (kişisel istatistikler)
- ✅ Grafik ve progress barlar
- ✅ Real-time güncellemeler
- ✅ Hızlı erişim linkleri

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

### Frontend
- **Vanilla JavaScript** (ES6+)
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
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── users/         # User management
│   │   │   ├── messages/      # WhatsApp messages
│   │   │   ├── subscriptions/ # Subscriptions
│   │   │   ├── payments/      # Payments
│   │   │   └── webhooks/      # n8n webhooks
│   │   ├── utils/             # Utilities
│   │   ├── app.ts             # Express app
│   │   └── server.ts          # Server entry
│   └── package.json
├── assets/
│   ├── css/                   # Stylesheets
│   ├── js/panel/              # Panel JavaScript
│   └── images/
├── docs/
│   └── architecture-roadmap.md
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
POST   /payments             # Oluştur (admin)
PATCH  /payments/:id         # Güncelle (admin)
DELETE /payments/:id         # Sil (admin)
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
