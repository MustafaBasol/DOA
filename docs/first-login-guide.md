# İlk Giriş ve Admin Kurulum Rehberi

DOA Panel'e production ortamında ilk kez giriş yapma ve sistem yöneticisi hesabı oluşturma kılavuzu.

## 📋 İçindekiler

1. [Otomatik Admin Oluşturma](#otomatik-admin-oluşturma)
2. [Manuel Admin Oluşturma](#manuel-admin-oluşturma)
3. [İlk Giriş Adımları](#ilk-giriş-adımları)
4. [İlk Yapılandırma](#ilk-yapılandırma)
5. [Güvenlik Ayarları](#güvenlik-ayarları)
6. [Sorun Giderme](#sorun-giderme)

---

## 1. Otomatik Admin Oluşturma

En hızlı ve önerilen yöntem seed script'ini çalıştırmaktır.

### Docker Deployment

```bash
# Backend container'ına bağlan ve seed çalıştır
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### Direct Server Deployment (PM2)

```bash
# Backend dizinine git
cd /var/www/DOA/backend

# Seed script'ini çalıştır
npm run seed
```

### Sonuç

Script başarıyla çalıştığında aşağıdaki çıktıyı görmelisiniz:

```
🌱 Starting database seed...
✅ Admin user created: admin@autoviseo.com
🎉 Database seed completed!
```

### Default Admin Bilgileri

Seed script otomatik olarak şu bilgilerle admin kullanıcısı oluşturur:

| Özellik | Değer |
|---------|-------|
| **Email** | `admin@autoviseo.com` |
| **Password** | `Admin123!` |
| **Role** | `ADMIN` |
| **Full Name** | System Administrator |
| **Company** | Autoviseo |
| **Language** | TR |
| **Status** | Active |

---

## 2. Manuel Admin Oluşturma

Seed script çalışmazsa veya farklı bilgilerle admin oluşturmak isterseniz:

### Yöntem 1: Node.js ile

```bash
# Docker deployment
docker-compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    const hash = await bcrypt.hash('YourSecurePassword123!', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@yourdomain.com',
        passwordHash: hash,
        role: 'ADMIN',
        fullName: 'System Administrator',
        companyName: 'Your Company Name',
        language: 'TR',
        isActive: true
      }
    });
    console.log('✅ Admin created successfully:', admin.email);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
"

# Direct server deployment
cd /var/www/DOA/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    const hash = await bcrypt.hash('YourSecurePassword123!', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@yourdomain.com',
        passwordHash: hash,
        role: 'ADMIN',
        fullName: 'System Administrator',
        companyName: 'Your Company Name',
        language: 'TR',
        isActive: true
      }
    });
    console.log('✅ Admin created successfully:', admin.email);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
"
```

### Yöntem 2: Database Shell

PostgreSQL'e doğrudan bağlanarak:

```bash
# PostgreSQL'e bağlan
docker-compose exec postgres psql -U postgres -d doa

# veya
psql -h localhost -U postgres -d doa
```

```sql
-- Bcrypt hash oluşturulması gerektiğinden bu yöntem önerilmez
-- Bunun yerine Node.js yöntemini kullanın
```

### Yöntem 3: Prisma Studio (Development Only)

```bash
# Prisma Studio'yu başlat
cd /var/www/DOA/backend
npx prisma studio

# Tarayıcıda http://localhost:5555 açılır
# User tablosuna yeni kayıt ekleyin
# NOT: Şifre bcrypt hash olmalı, plain text yazmayın!
```

---

## 3. İlk Giriş Adımları

### Adım 1: Login Sayfasına Git

Tarayıcınızda şu adreslerden birine gidin:

```
https://yourdomain.com/login.html
https://yourdomain.com/admin.html (direkt admin paneline yönlendirir)
```

### Adım 2: Giriş Yap

Default admin bilgilerini girin:
- **Email:** `admin@autoviseo.com`
- **Password:** `Admin123!`

![Login Screen](../assets/images/login-screenshot.png)

### Adım 3: Dashboard'a Yönlendirilme

Başarılı girişten sonra admin dashboard'una yönlendirileceksiniz:

```
https://yourdomain.com/admin.html
```

Dashboard'da görecekleriniz:
- Sistem istatistikleri
- Aktif kullanıcı sayısı
- Mesaj istatistikleri
- Ödeme özeti
- Son aktiviteler

---

## 4. İlk Yapılandırma

### 4.1 Şifre Değiştirme (ÖNEMLİ!)

**İlk ve en önemli adım!**

1. Sağ üst köşede profil ikonuna tıklayın
2. **"Change Password"** seçeneğini seçin
3. Yeni güçlü bir şifre belirleyin:
   - En az 8 karakter
   - En az 1 büyük harf
   - En az 1 küçük harf
   - En az 1 rakam
   - En az 1 özel karakter (!@#$%^&*)

```
Örnek Güçlü Şifre: MyC0mP@ny$ecur3!2026
```

### 4.2 Email Adresini Güncelleme

1. Profil sayfasına gidin
2. Email adresini kendi domain'inizdeki email ile değiştirin:
   ```
   admin@autoviseo.com → admin@yourcompany.com
   ```

### 4.3 Profil Bilgilerini Güncelleme

Aşağıdaki bilgileri kendi bilgilerinizle güncelleyin:
- **Full Name:** Gerçek adınız
- **Company Name:** Şirket adınız
- **Phone:** İletişim numaranız (opsiyonel)
- **Language:** TR, EN veya FR

### 4.4 Sistem Ayarları

Admin panelinden sistem ayarlarını yapılandırın:

#### Email Ayarları
```javascript
// Email SMTP ayarları (backend/.env)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com
```

#### WhatsApp n8n Webhook
```javascript
// n8n webhook URL'i
N8N_WEBHOOK_URL=https://n8n.yourcompany.com/webhook/whatsapp
```

#### Notification Settings
```javascript
// Push notification (FCM)
FCM_SERVER_KEY=your-firebase-server-key
FCM_PROJECT_ID=your-firebase-project-id
```

---

## 5. Güvenlik Ayarları

### 5.1 JWT Secret Değiştirme

Production'da JWT secret'larını değiştirin:

```bash
# Güvenli secret oluştur
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# .env dosyasında güncelle
JWT_SECRET=generated-secret-here
JWT_REFRESH_SECRET=another-generated-secret-here
```

### 5.2 Database Şifresini Değiştirme

```bash
# PostgreSQL şifresini değiştir
docker-compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'new-secure-password';"

# .env dosyasını güncelle
DATABASE_URL="postgresql://postgres:new-secure-password@postgres:5432/doa?schema=public"
```

### 5.3 CORS Yapılandırması

Backend `.env` dosyasında izin verilen origin'leri belirtin:

```bash
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
```

### 5.4 Rate Limiting

Rate limiting ayarlarını ihtiyacınıza göre düzenleyin:

```typescript
// backend/src/middleware/rateLimiter.ts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 15 dakikada max 5 deneme
  message: 'Çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin'
});
```

### 5.5 IP Kısıtlama (Nginx)

Admin panel'e sadece belirli IP'lerden erişim:

```nginx
# /etc/nginx/sites-available/doa
location /admin.html {
    allow 123.456.789.0;      # Office IP
    allow 98.765.432.0/24;    # VPN range
    deny all;
    
    root /var/www/DOA;
    try_files $uri =404;
}
```

### 5.6 SSL/TLS Sertifikası

Let's Encrypt ile ücretsiz SSL:

```bash
# Certbot yükle
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 5.7 Firewall Kuralları

UFW ile port kontrolü:

```bash
# Sadece gerekli portları aç
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# PostgreSQL'i sadece localhost'tan erişilebilir yap
sudo ufw deny 5432/tcp
```

---

## 6. Sorun Giderme

### Problem: Seed script çalışmıyor

**Hata:** `PrismaClient is not defined`

**Çözüm:**
```bash
# Prisma client'ı yeniden oluştur
docker-compose exec backend npx prisma generate

# Tekrar seed'i dene
docker-compose exec backend npm run seed
```

---

### Problem: "User already exists" hatası

**Hata:** `Unique constraint failed on the fields: email`

**Çözüm 1:** Mevcut admin'i sil ve yeniden oluştur
```bash
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  await prisma.user.delete({ where: { email: 'admin@autoviseo.com' } });
  console.log('✅ Admin deleted');
  await prisma.\$disconnect();
})();
"

# Şimdi seed'i tekrar çalıştır
docker-compose exec backend npm run seed
```

**Çözüm 2:** Farklı email ile yeni admin oluştur
```bash
# Manuel oluşturma yöntemini kullan (bkz. Bölüm 2)
```

---

### Problem: Giriş yapamıyorum - "Invalid credentials"

**Olası Nedenler:**
1. Şifre yanlış (büyük/küçük harf duyarlı)
2. Email yanlış yazılmış
3. Kullanıcı aktif değil

**Kontrol:**
```bash
# Kullanıcı bilgilerini kontrol et
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@autoviseo.com' }
  });
  if (user) {
    console.log('User found:');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
  } else {
    console.log('❌ User not found');
  }
  await prisma.\$disconnect();
})();
"
```

**Şifre resetle:**
```bash
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('NewPassword123!', 12);
  await prisma.user.update({
    where: { email: 'admin@autoviseo.com' },
    data: { passwordHash: hash }
  });
  console.log('✅ Password reset to: NewPassword123!');
  await prisma.\$disconnect();
})();
"
```

---

### Problem: Login sayfası yüklenmiyor

**Kontrol Listesi:**

1. **Nginx çalışıyor mu?**
```bash
sudo systemctl status nginx
sudo nginx -t  # Config test
```

2. **Backend API çalışıyor mu?**
```bash
curl http://localhost:5000/api/health

# Docker ile
docker-compose ps
```

3. **DNS ayarları doğru mu?**
```bash
nslookup yourdomain.com
ping yourdomain.com
```

4. **SSL sertifikası geçerli mi?**
```bash
curl -I https://yourdomain.com
openssl s_client -connect yourdomain.com:443
```

---

### Problem: CORS hatası alıyorum

**Hata:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Çözüm:**
```bash
# backend/.env dosyasını kontrol et
CORS_ORIGIN=https://yourdomain.com

# Container'ı yeniden başlat
docker-compose restart backend
```

---

### Problem: Database connection hatası

**Hata:** `Can't reach database server`

**Kontrol:**
```bash
# PostgreSQL container'ı çalışıyor mu?
docker-compose ps postgres

# Connection test
docker-compose exec postgres pg_isready -U postgres

# Database var mı?
docker-compose exec postgres psql -U postgres -l
```

**Migration çalıştır:**
```bash
docker-compose exec backend npx prisma migrate deploy
```

---

## 7. İlk Kullanıcıları Ekleme

Admin olarak giriş yaptıktan sonra ilk müşterileri eklemek için:

### 7.1 Manuel Ekleme (UI)

1. Admin panelde **"Users"** menüsüne git
2. **"Add New User"** butonuna tıkla
3. Formu doldur:
   - Email (zorunlu)
   - Password (zorunlu)
   - Full Name
   - Company Name
   - Role: CLIENT
   - Language: TR/EN/FR
4. **"Create User"** butonuna tıkla

### 7.2 Toplu Ekleme (CSV Import)

```csv
email,fullName,companyName,phone,role,language
client1@example.com,John Doe,Example Corp,+905551234567,CLIENT,TR
client2@example.com,Jane Smith,Another Corp,+905559876543,CLIENT,EN
```

API endpoint:
```bash
POST /api/users/import
Content-Type: multipart/form-data
Body: CSV file
```

### 7.3 API ile Ekleme

```bash
curl -X POST https://yourdomain.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "newclient@example.com",
    "password": "Client123!",
    "fullName": "New Client",
    "companyName": "Client Company",
    "role": "CLIENT",
    "language": "TR"
  }'
```

---

## 8. Sonraki Adımlar

İlk giriş ve güvenlik ayarlarını tamamladıktan sonra:

1. ✅ **Backup stratejisi kurun** - [Backup Guide](./backup-restore.md)
2. ✅ **Monitoring ekleyin** - [Monitoring Guide](./post-launch-monitoring.md)
3. ✅ **Email bildirimlerini test edin** - [Email Guide](./email-notifications.md)
4. ✅ **n8n webhook'u yapılandırın** - [n8n Integration](./n8n-integration.md)
5. ✅ **Load testing yapın** - [Load Testing Guide](./load-testing.md)
6. ✅ **Kullanıcı eğitimi verin** - [Onboarding Guide](./onboarding-guide.md)

---

## 9. Yardım ve Destek

### Dokümantasyon
- [Production Deployment](./production-deployment.md)
- [Architecture & Roadmap](./architecture-roadmap.md)
- [API Documentation](./postman-collection.json)

### Loglar
```bash
# Backend logs
docker-compose logs -f backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL logs
docker-compose logs -f postgres
```

### Health Check
```bash
# API health
curl https://yourdomain.com/api/health

# Response beklenen:
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00.000Z",
  "uptime": 3600
}
```

---

**Son Güncelleme:** 22 Ocak 2026  
**Versiyon:** 2.0  
**Yazar:** DOA Development Team
