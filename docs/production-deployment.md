# Production Deployment Guide

DOA WhatsApp Chatbot Management System için production ortama deploy edilmeden önce yapılması gereken kontroller ve adımlar.

## � Quick Start - İlk Admin Girişi

Deploy sonrası sisteme admin olarak giriş yapmak için:

### Otomatik Admin Oluşturma (Önerilen)

Database seed script'i çalıştırıldığında otomatik admin kullanıcısı oluşturulur:

```bash
# Docker deployment
docker-compose -f docker-compose.prod.yml exec backend npm run seed

# Direct server deployment
npm run seed
```

**🔐 Default Admin Bilgileri:**
- **Email:** `admin@autoviseo.com`
- **Password:** `Admin123!`
- **Login URL:** `https://yourdomain.com/login.html`

### İlk Giriş Adımları

1. Tarayıcıda `https://yourdomain.com/login.html` adresine gidin
2. Email: `admin@autoviseo.com` ve Password: `Admin123!` ile giriş yapın
3. **ÖNEMLİ:** Hemen admin panel'den şifrenizi değiştirin:
   - Sol menüden "Settings" veya "Profile" seçeneğine tıklayın
   - "Change Password" butonuna basın
   - Güçlü bir yeni şifre belirleyin

### Manuel Admin Oluşturma (Alternatif)

Eğer seed script çalışmazsa veya farklı bir admin oluşturmak isterseniz:

```bash
# Docker ile
docker-compose -f docker-compose.prod.yml exec backend npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('YourSecurePassword123!', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@yourdomain.com',
      passwordHash: hash,
      role: 'ADMIN',
      fullName: 'System Administrator',
      companyName: 'Your Company',
      language: 'TR',
      isActive: true
    }
  });
  console.log('✅ Admin created:', admin.email);
  await prisma.\$disconnect();
})();
"

# Direkt sunucuda (PM2 deployment)
cd /var/www/DOA/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('YourSecurePassword123!', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@yourdomain.com',
      passwordHash: hash,
      role: 'ADMIN',
      fullName: 'System Administrator',
      companyName: 'Your Company',
      language: 'TR',
      isActive: true
    }
  });
  console.log('✅ Admin created:', admin.email);
  await prisma.\$disconnect();
})();
"
```

### ⚠️ Güvenlik Notları

1. **Şifre Değiştirme:** İlk girişten sonra mutlaka default şifreyi değiştirin
2. **Email Güncelleme:** `admin@autoviseo.com` yerine kendi domain'inizdeki email'i kullanın
3. **2FA Aktivasyonu:** Mümkünse iki faktörlü doğrulama etkinleştirin (gelecek versiyonda)
4. **IP Kısıtlama:** Nginx/firewall ile admin panel'e sadece belirli IP'lerden erişim verin
5. **HTTPS:** Mutlaka SSL/TLS sertifikası kullanın (Let's Encrypt ücretsiz)

---

## �📋 Pre-Production Checklist

### 1. Güvenlik Kontrolleri

#### Environment Variables
- [ ] Tüm production secret'ları ayarlandı mı?
- [ ] `.env` dosyası `.gitignore`'da mı?
- [ ] Default parolalar değiştirildi mi?
- [ ] JWT secret'ları production için yeniden oluşturuldu mu?

```bash
# Güvenli secret oluşturma
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Database
- [ ] PostgreSQL production instance hazır mı?
- [ ] Database backup stratejisi kuruldu mu?
- [ ] Connection pooling ayarlandı mı?
- [ ] SSL/TLS bağlantı aktif mi?

#### API Security
- [ ] Rate limiting aktif mi?
- [ ] CORS doğru yapılandırılmış mı?
- [ ] Helmet middleware aktif mi?
- [ ] Input validation çalışıyor mu?
- [ ] SQL injection koruması var mı?
- [ ] XSS koruması var mı?

### 2. Performans Optimizasyonları

#### Backend
- [ ] Production build oluşturuldu mu? (`npm run build`)
- [ ] Node.js production mode'da mı? (`NODE_ENV=production`)
- [ ] Gzip compression aktif mi?
- [ ] Static file caching yapılandırıldı mı?
- [ ] Database index'leri oluşturuldu mu?

#### Monitoring
- [ ] Health check endpoint çalışıyor mu? (`/api/health`)
- [ ] Log rotation ayarlandı mı?
- [ ] Error tracking servisi entegre edildi mi? (Sentry vb.)
- [ ] Uptime monitoring kuruldu mu?

### 3. Infrastructure

#### Server Requirements
- [ ] Node.js 20.x yüklü
- [ ] PostgreSQL 15.x yüklü
- [ ] Yeterli disk alanı (min 20GB)
- [ ] Yeterli RAM (min 2GB)
- [ ] SSL certificate kuruldu

#### Docker (Önerilir)
- [ ] Docker ve Docker Compose yüklü
- [ ] Docker images build edildi
- [ ] Volume'ler yapılandırıldı
- [ ] Network ayarları yapıldı

### 4. Testing

- [ ] Tüm unit testler geçti mi? (116 test)
- [ ] Integration testler geçti mi? (100 test)
- [ ] E2E testler geçti mi? (43 test)
- [ ] Load testler çalıştırıldı mı?
- [ ] Security testler yapıldı mı?

### 5. Documentation

- [ ] API dokümantasyonu güncel mi?
- [ ] Deployment prosedürü belgelendi mi?
- [ ] Rollback prosedürü hazır mı?
- [ ] Troubleshooting guide var mı?

## 🚀 Deployment Steps

### Option 1: Docker Deployment (Önerilen)

#### 1. Environment Hazırlığı

```bash
# Production .env dosyası oluştur
cp .env.example .env.production

# Environment variables'ları düzenle
nano .env.production
```

**Önemli değişkenler:**
```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@host:5432/doa_production?schema=public"

# JWT
JWT_SECRET=your-production-secret-here
JWT_REFRESH_SECRET=your-production-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-email-password

# Backup
BACKUP_DIR=/backups
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_KEEP_LAST=30
```

#### 2. Docker Build

```bash
# Images'ları build et
docker-compose -f docker-compose.prod.yml build

# Container'ları başlat
docker-compose -f docker-compose.prod.yml up -d
```

#### 3. Database Migration & Admin Setup

```bash
# Migration'ları çalıştır
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed data - Admin kullanıcısı oluştur
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

**🔐 İlk Admin Girişi:**
Seed script otomatik olarak admin kullanıcısı oluşturur:
- **Email:** `admin@autoviseo.com`
- **Password:** `Admin123!`
- **Login URL:** `https://yourdomain.com/login.html`

⚠️ **GÜVENLİK UYARISI:** İlk girişten hemen sonra admin şifresini değiştirin!

```bash
# Alternatif: Manuel admin oluşturma
docker-compose -f docker-compose.prod.yml exec backend npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('YourSecurePassword123!', 12);
  await prisma.user.create({
    data: {
      email: 'admin@yourdomain.com',
      passwordHash: hash,
      role: 'ADMIN',
      fullName: 'System Admin',
      companyName: 'Your Company',
      language: 'TR',
      isActive: true
    }
  });
  console.log('✅ Admin created');
  await prisma.\$disconnect();
})();
"
```

#### 4. Verification

```bash
# Health check
curl https://yourdomain.com/api/health

# Logs kontrol
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Option 2: Direct Server Deployment

#### 1. Sunucuya Bağlan

```bash
ssh user@your-server-ip
```

#### 2. Repository'yi Clone Et

```bash
cd /var/www
git clone https://github.com/yourusername/DOA.git
cd DOA
```

#### 3. Dependencies Yükle

```bash
cd backend
npm ci --production
```

#### 4. Environment Ayarla

```bash
cp .env.example .env
nano .env
# Production values'ları gir
```

#### 5. Build

```bash
npm run build
```

#### 6. Database Setup

```bash
# Production migrations
npx prisma migrate deploy

# Seed database (creates admin user)
npm run seed
```

**🔐 İlk Admin Girişi:**
Seed script otomatik olarak admin kullanıcısı oluşturur:
- **Email:** `admin@autoviseo.com`
- **Password:** `Admin123!`

⚠️ **ÖNEMLİ:** İlk girişten sonra mutlaka admin şifresini değiştirin!

#### 7. PM2 ile Başlat

```bash
# PM2 yükle
npm install -g pm2

# Uygulamayı başlat
pm2 start dist/server.js --name doa-backend

# Startup script oluştur
pm2 startup
pm2 save
```

#### 8. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/doa
server {
    listen 80;
    server_name yourdomain.com;

    # SSL redirect
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

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

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        root /var/www/DOA;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Nginx config'i aktif et
sudo ln -s /etc/nginx/sites-available/doa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 SSL/TLS Setup

### Let's Encrypt (Ücretsiz)

```bash
# Certbot yükle
sudo apt install certbot python3-certbot-nginx

# SSL certificate al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## 📊 Monitoring Setup

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 web dashboard
pm2 install pm2-server-monit
```

### 2. Log Management

```bash
# PM2 logs
pm2 logs doa-backend

# Log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. Database Monitoring

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Database size
SELECT pg_size_pretty(pg_database_size('doa_production'));
```

## 🔄 Backup Strategy

### Automatic Backups

Sistem otomatik backup almak üzere yapılandırılmıştır:

```env
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *        # Her gün 02:00
BACKUP_CLEANUP_SCHEDULE=0 3 * * 0  # Her Pazar 03:00
BACKUP_KEEP_LAST=30              # Son 30 backup'ı sakla
```

### Manual Backup

```bash
# Database backup
curl -X POST https://yourdomain.com/api/backup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Or via docker
docker-compose exec backend npm run backup
```

### Restore Procedure

```bash
# List backups
curl https://yourdomain.com/api/backup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Restore specific backup
curl -X POST https://yourdomain.com/api/backup/restore \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup_20240121_020000.sql"}'
```

## 🚨 Rollback Procedure

### Docker Deployment

```bash
# 1. Stop current deployment
docker-compose -f docker-compose.prod.yml down

# 2. Checkout previous version
git checkout <previous-tag>

# 3. Rebuild and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Restore database if needed
docker-compose -f docker-compose.prod.yml exec backend npm run restore
```

### PM2 Deployment

```bash
# 1. Stop application
pm2 stop doa-backend

# 2. Checkout previous version
cd /var/www/DOA
git checkout <previous-tag>

# 3. Reinstall dependencies
cd backend
npm ci --production

# 4. Rebuild
npm run build

# 5. Start application
pm2 restart doa-backend
```

## 🔧 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs doa-backend --lines 100

# Or docker
docker-compose logs -f backend

# Check port
netstat -tlnp | grep 5000

# Check environment
printenv | grep NODE_ENV
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### High Memory Usage

```bash
# Check memory
free -h

# Check Node.js process
ps aux | grep node

# Restart PM2
pm2 restart all

# Or docker
docker-compose restart backend
```

### Performance Issues

```bash
# Run load tests
npm run test:load

# Check database queries
npm run prisma:studio

# Profile application
node --inspect dist/server.js
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: doa-backend
    deploy:
      replicas: 3  # 3 instance çalıştır
    environment:
      - NODE_ENV=production
```

### Load Balancer (Nginx)

```nginx
upstream backend {
    least_conn;
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://backend;
    }
}
```

## 🎯 Performance Targets

### Response Times
- Health check: < 50ms
- Authentication: < 300ms
- API requests: < 500ms (p95)
- Database queries: < 100ms (p95)

### Availability
- Uptime: > 99.5%
- Error rate: < 1%

### Capacity
- Concurrent users: 500+
- Requests/second: 100+
- Database connections: 100

## 📞 Support Contacts

- **Technical Lead:** [email]
- **DevOps:** [email]
- **Database Admin:** [email]
- **On-Call:** [phone]

## 🔗 Useful Links

- [API Documentation](https://yourdomain.com/api-docs)
- [Status Page](https://status.yourdomain.com)
- [Monitoring Dashboard](https://monitoring.yourdomain.com)
- [Error Tracking](https://sentry.io)

## 📝 Post-Deployment Tasks

### Immediately After Deploy
- [ ] Verify health check
- [ ] Test authentication
- [ ] Check WebSocket connection
- [ ] Verify database connection
- [ ] Test critical API endpoints
- [ ] Check logs for errors

### Within 24 Hours
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backup ran successfully
- [ ] Review user feedback
- [ ] Check system resources

### Within 1 Week
- [ ] Run load tests
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Team training

## ✅ Production Readiness Checklist

### Security
- [x] Environment variables secured
- [x] Rate limiting enabled
- [x] Input validation active
- [x] CORS configured
- [x] Helmet middleware active
- [x] SQL injection protection
- [x] XSS protection

### Performance
- [x] Production build created
- [x] Compression enabled
- [x] Database indexed
- [x] Connection pooling
- [x] Caching strategy

### Reliability
- [x] Health checks
- [x] Error handling
- [x] Logging
- [x] Monitoring
- [x] Backup system
- [x] Rollback procedure

### Testing
- [x] 116 Unit tests
- [x] 100 Integration tests
- [x] 43 E2E tests
- [x] Load tests ready
- [x] Security tests

### Documentation
- [x] API documentation
- [x] Deployment guide
- [x] Architecture docs
- [x] Troubleshooting guide
- [x] Backup/restore guide

## 🎉 Ready for Production!

Tüm checklist'ler tamamlandıysa, sistem production'a deploy edilmeye hazır!

```bash
# Final check
npm run test && npm run test:e2e && npm run build

# Deploy!
docker-compose -f docker-compose.prod.yml up -d
```

**🚀 Başarılar!**
