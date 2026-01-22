# Backend Hızlı Kurulum Rehberi

Deploy sonrası backend'i ayağa kaldırmak için adım adım kılavuz.

## 📋 Ön Gereksinimler

### Sunucuda Yüklü Olması Gerekenler:
- ✅ **Node.js** (v20.x veya üzeri)
- ✅ **PostgreSQL** (v15.x veya üzeri)
- ✅ **npm** veya **yarn**
- ✅ **Git**

**Alternatif:** Docker kullanıyorsanız sadece Docker ve Docker Compose yeterli.

---

## 🚀 Yöntem 1: Docker ile Kurulum (ÖNERİLEN)

### 1. Repository'yi Klonla

```bash
cd /var/www
git clone https://github.com/MustafaBasol/DOA.git
cd DOA
```

### 2. Environment Dosyasını Oluştur

```bash
# .env dosyası oluştur
cp backend/.env.example .env

# Düzenle
nano .env
```

**Önemli değişkenler:**
```env
# Database
POSTGRES_USER=doa_user
POSTGRES_PASSWORD=GüçlüŞifre123!
POSTGRES_DB=doa_db

# JWT Secrets (yeni oluştur)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email (opsiyonel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. JWT Secrets Oluştur

```bash
# Terminal'de çalıştır
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> .env
```

### 4. Docker Container'ları Başlat

```bash
# Container'ları build et ve başlat
docker-compose up -d --build

# Logları kontrol et
docker-compose logs -f backend
```

### 5. Database Migration ve Seed

```bash
# Migration'ları çalıştır
docker-compose exec backend npx prisma migrate deploy

# Admin kullanıcısı oluştur
docker-compose exec backend npm run seed
```

### 6. Kontrol Et

```bash
# Health check
curl http://localhost:3000/api/health

# Container'ların durumunu kontrol et
docker-compose ps
```

**✅ Backend hazır!** 
- API: http://localhost:3000
- Admin: admin@autoviseo.com / Admin123!

---

## 🔧 Yöntem 2: Manuel Kurulum (PM2)

### 1. Repository'yi Klonla

```bash
cd /var/www
git clone https://github.com/MustafaBasol/DOA.git
cd DOA/backend
```

### 2. Dependencies Yükle

```bash
# Production dependencies
npm ci --production

# Dev dependencies (TypeScript build için)
npm install --save-dev typescript @types/node prisma
```

### 3. Environment Dosyasını Oluştur

```bash
# .env dosyası oluştur
cp .env.example .env

# Düzenle
nano .env
```

**Minimum gerekli ayarlar:**
```env
NODE_ENV=production
PORT=5000

# Database (PostgreSQL'in çalıştığından emin ol)
DATABASE_URL="postgresql://doa_user:GüçlüŞifre123!@localhost:5432/doa_db?schema=public"

# JWT Secrets
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. PostgreSQL Database Oluştur

```bash
# PostgreSQL'e bağlan
sudo -u postgres psql

# Database ve kullanıcı oluştur
CREATE DATABASE doa_db;
CREATE USER doa_user WITH ENCRYPTED PASSWORD 'GüçlüŞifre123!';
GRANT ALL PRIVILEGES ON DATABASE doa_db TO doa_user;
\q
```

### 5. Prisma Setup

```bash
# Prisma client oluştur
npx prisma generate

# Migration'ları çalıştır
npx prisma migrate deploy

# Veya development migration
npx prisma migrate dev
```

### 6. TypeScript Build

```bash
# TypeScript'i compile et
npm run build

# dist/ klasörü oluşmalı
ls -la dist/
```

### 7. Seed Database (Admin oluştur)

```bash
# Seed script'ini çalıştır
npm run seed

# Başarılı olursa göreceksiniz:
# ✅ Admin user created: admin@autoviseo.com
```

### 8. PM2 ile Başlat

```bash
# PM2 kur (global)
npm install -g pm2

# Backend'i başlat
pm2 start dist/server.js --name doa-backend

# Startup script oluştur (server reboot'ta otomatik başlasın)
pm2 startup
pm2 save

# Durumu kontrol et
pm2 status
pm2 logs doa-backend
```

### 9. Nginx Reverse Proxy

```bash
# Nginx config oluştur
sudo nano /etc/nginx/sites-available/doa
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (static files)
    location / {
        root /var/www/DOA;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (Socket.IO)
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Nginx'i aktive et:**
```bash
# Symlink oluştur
sudo ln -s /etc/nginx/sites-available/doa /etc/nginx/sites-enabled/

# Test et
sudo nginx -t

# Reload et
sudo systemctl reload nginx
```

### 10. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

**✅ Backend hazır!**
- API: https://yourdomain.com/api
- Admin: admin@autoviseo.com / Admin123!

---

## 🔍 Kontrol ve Test

### 1. Health Check

```bash
# Backend çalışıyor mu?
curl http://localhost:5000/api/health

# Response beklenen:
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00.000Z",
  "uptime": 3600
}
```

### 2. Database Connection

```bash
# Prisma Studio ile kontrol (development only)
npx prisma studio

# Veya psql ile
psql -h localhost -U doa_user -d doa_db -c "SELECT * FROM \"User\";"
```

### 3. Admin Kullanıcısı Kontrol

```bash
# Admin var mı?
psql -h localhost -U doa_user -d doa_db -c "SELECT email, role FROM \"User\" WHERE role='ADMIN';"

# Çıktı:
#         email          | role  
# -----------------------+-------
#  admin@autoviseo.com   | ADMIN
```

### 4. Login Test

```bash
# Login endpoint'e istek at
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@autoviseo.com",
    "password": "Admin123!"
  }'

# Başarılı olursa JWT token dönecek
```

### 5. Log Kontrolü

**Docker:**
```bash
# Backend logs
docker-compose logs -f backend

# Son 100 satır
docker-compose logs --tail=100 backend
```

**PM2:**
```bash
# Real-time logs
pm2 logs doa-backend

# Son 100 satır
pm2 logs doa-backend --lines 100

# Error logs
pm2 logs doa-backend --err
```

---

## 🛠️ Sorun Giderme

### Problem: "Cannot connect to database"

**Çözüm:**
```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Docker ile
docker-compose ps postgres

# Connection string doğru mu?
echo $DATABASE_URL

# Manuel test
psql -h localhost -U doa_user -d doa_db
```

---

### Problem: "Prisma Client not found"

**Çözüm:**
```bash
# Prisma client'ı yeniden oluştur
npx prisma generate

# node_modules'u temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

---

### Problem: "Port already in use"

**Çözüm:**
```bash
# 5000 portunu kim kullanıyor?
sudo lsof -i :5000

# Süreci öldür
sudo kill -9 <PID>

# Veya farklı port kullan (.env'de PORT değiştir)
```

---

### Problem: "JWT Secret missing"

**Çözüm:**
```bash
# .env dosyasına ekle
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> backend/.env
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" >> backend/.env

# Backend'i yeniden başlat
pm2 restart doa-backend
# veya
docker-compose restart backend
```

---

### Problem: "Migration failed"

**Çözüm:**
```bash
# Database'i resetle (UYARI: Tüm data silinir!)
npx prisma migrate reset

# Veya manuel migration
npx prisma migrate deploy

# Son çare: Database'i sil ve yeniden oluştur
dropdb doa_db
createdb doa_db
npx prisma migrate deploy
npm run seed
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# PM2 dashboard
pm2 monit

# CPU ve Memory kullanımı
pm2 show doa-backend

# Restart istatistikleri
pm2 list
```

### Docker Monitoring

```bash
# Container durumu
docker-compose ps

# Resource kullanımı
docker stats

# Logs
docker-compose logs -f --tail=50 backend
```

---

## 🔄 Güncelleme

### Backend Güncelleme Adımları

```bash
# 1. Son kodu çek
cd /var/www/DOA
git pull origin main

# 2. Dependencies güncelle
cd backend
npm install

# 3. Build et
npm run build

# 4. Migration varsa çalıştır
npx prisma migrate deploy

# 5. PM2 ile restart
pm2 restart doa-backend

# Veya Docker ile
cd ..
docker-compose down
docker-compose up -d --build backend
```

---

## 🔐 Güvenlik Checklist

- [ ] ✅ JWT secrets güçlü ve unique
- [ ] ✅ Database şifresi değiştirildi
- [ ] ✅ Admin şifresi değiştirildi
- [ ] ✅ CORS doğru domain'e ayarlandı
- [ ] ✅ Rate limiting aktif
- [ ] ✅ Helmet middleware aktif
- [ ] ✅ SSL sertifikası kuruldu
- [ ] ✅ Firewall kuralları ayarlandı
- [ ] ✅ `.env` dosyası güvenli (chmod 600)

```bash
# .env güvenliğini sağla
chmod 600 backend/.env
```

---

## 📚 Ek Kaynaklar

- [Production Deployment Guide](./production-deployment.md)
- [First Login Guide](./first-login-guide.md)
- [Load Testing Guide](./load-testing.md)
- [Backup & Restore](./backup-restore.md)
- [API Documentation](./postman-collection.json)

---

## 🆘 Destek

Sorun yaşıyorsanız:

1. **Logları kontrol edin:**
   ```bash
   pm2 logs doa-backend --lines 200
   # veya
   docker-compose logs backend --tail=200
   ```

2. **Health check yapın:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Database connection test:**
   ```bash
   psql -h localhost -U doa_user -d doa_db -c "SELECT 1;"
   ```

4. **Issue açın:** https://github.com/MustafaBasol/DOA/issues

---

**Son Güncelleme:** 22 Ocak 2026  
**Versiyon:** 2.0  
**Yazar:** DOA Development Team
