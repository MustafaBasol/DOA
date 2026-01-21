# DOA - WhatsApp Chatbot Yönetim Sistemi

## 🎉 İlk Aşama Tamamlandı!

### ✅ Tamamlanan İşlemler

**Backend (Node.js + Express + TypeScript)**
- ✅ Proje yapısı oluşturuldu
- ✅ PostgreSQL veritabanı (Docker)
- ✅ Prisma ORM ve migrations
- ✅ JWT kimlik doğrulama sistemi
- ✅ User CRUD API endpoint'leri
- ✅ Role-based access control (Admin/Client)
- ✅ Input validation (Joi)
- ✅ Error handling middleware
- ✅ Rate limiting
- ✅ Database seed (test kullanıcıları)

**Frontend**
- ✅ Login sayfası
- ✅ Admin dashboard
- ✅ Client dashboard
- ✅ Çok dilli destek (TR/EN/FR)
- ✅ Auth sistemi entegrasyonu

### 🚀 Nasıl Çalıştırılır?

#### Backend
```bash
cd backend

# İlk kurulum (sadece bir kez)
npm install
npx prisma migrate dev
npm run seed

# Geliştirme sunucusu
npm run dev
```

Backend http://localhost:5000 adresinde çalışıyor.

#### Frontend
```bash
# Ana dizinde
python3 -m http.server 3000
```

Frontend http://localhost:3000 adresinde çalışıyor.

### 🔐 Test Hesapları

**Admin:**
- Email: admin@autoviseo.com
- Şifre: Admin123!
- Panel: http://localhost:3000/admin.html

**Client:**
- Email: test@example.com
- Şifre: Client123!
- Panel: http://localhost:3000/client.html

### 📡 API Endpoints

**Authentication:**
- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/logout` - Çıkış yap
- `POST /api/auth/refresh` - Token yenile
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

**Users (Admin only):**
- `POST /api/users` - Yeni müşteri oluştur
- `GET /api/users` - Müşterileri listele
- `GET /api/users/:id` - Müşteri detayı
- `PATCH /api/users/:id` - Müşteri güncelle
- `DELETE /api/users/:id` - Müşteri sil

**Profile (Tüm kullanıcılar):**
- `GET /api/users/profile/me` - Profil bilgisi
- `PATCH /api/users/profile/me` - Profil güncelle
- `PATCH /api/users/profile/password` - Şifre değiştir

### 📋 Sıradaki Adımlar

**Faz 2 - Mesajlaşma Modülü:**
1. WhatsApp messages CRUD endpoint'leri
2. n8n webhook receiver
3. Mesaj listesi arayüzü (client panel)
4. Konuşma detayları

**Faz 3 - Ödeme Sistemi:**
1. Payments & Subscriptions API
2. Ödeme geçmişi arayüzü
3. Abonelik yönetimi (admin)

**Faz 4 - n8n Entegrasyonu:**
1. Webhook security (secret token)
2. Message mapping (client_id ↔ whatsapp_number)
3. Real-time updates (opsiyonel: WebSocket)

**Faz 5 - UI İyileştirmeleri:**
1. Dashboard istatistikleri
2. Grafik ve raporlama
3. Responsive design iyileştirmeleri
4. Loading states ve animasyonlar

### 📁 Proje Yapısı

```
DOA/
├── backend/
│   ├── src/
│   │   ├── config/          # Konfigürasyon
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── modules/
│   │   │   ├── auth/       # Login, logout, token refresh
│   │   │   └── users/      # User CRUD
│   │   ├── utils/          # Helper functions
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Test data
│   └── package.json
├── assets/
│   ├── css/
│   │   ├── styles.css      # Mevcut site stilleri
│   │   └── panel.css       # Panel stilleri
│   └── js/
│       ├── main.js         # Mevcut site JS
│       └── panel/
│           ├── i18n.js     # Çeviri sistemi
│           └── auth.js     # Kimlik doğrulama
├── index.html              # Ana sayfa (mevcut)
├── login.html             # Giriş sayfası (YENİ)
├── admin.html             # Admin paneli (YENİ)
├── client.html            # Client paneli (YENİ)
└── docs/
    └── architecture-roadmap.md  # Mimari dokümantasyon
```

### 🔒 Güvenlik Özellikleri

- ✅ JWT tokens (15dk access, 7gün refresh)
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting (100 req/15min, login: 5/15min)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation (Joi)
- ✅ SQL injection koruması (Prisma ORM)

### 🛠️ Teknoloji Stack

**Backend:**
- Node.js 20+
- TypeScript 5+
- Express.js 4
- Prisma ORM
- PostgreSQL 15
- JWT + bcrypt
- Joi validation

**Frontend:**
- Vanilla JavaScript
- HTML5 + CSS3
- Fetch API
- LocalStorage (token)

**DevOps:**
- Docker (PostgreSQL)
- Git

### 🐛 Bilinen Sorunlar / TODO

- [ ] Email gönderimi (şifre sıfırlama)
- [ ] Refresh token rotation
- [ ] API rate limit per user
- [ ] Database connection pooling
- [ ] Logging system (Winston/Pino)
- [ ] Unit tests (Jest)
- [ ] API documentation (Swagger)

### 💡 Geliştirme İpuçları

**Database GUI:**
```bash
cd backend
npm run prisma:studio
```
Prisma Studio http://localhost:5555 adresinde açılır.

**Database Reset:**
```bash
cd backend
npx prisma migrate reset
npm run seed
```

**API Test:**
```bash
cd backend
bash test-api.sh
```

### 📞 Destek

Sorularınız için:
- Mimari dokümantasyon: `docs/architecture-roadmap.md`
- Backend README: `backend/README.md`
- GitHub Issues: [Sorun bildir]

---

**Hazırlayan:** GitHub Copilot  
**Tarih:** 21 Ocak 2026  
**Versiyon:** 1.0.0  
**Durum:** ✅ Faz 1 Tamamlandı
