# 🔒 Güvenlik Güncellemesi - Projeniz İçin Önemli Bilgiler

## ⚠️ ÖNEMLİ: HEMEN YAPILMASI GEREKENLER

### 1. Environment Variables Güncelleyin

**Backend `.env` dosyanızı oluşturun ve aşağıdaki secret'ları güncelleyin:**

```bash
cd backend

# Güçlü secret'lar oluşturun (her biri farklı olmalı)
openssl rand -base64 64

# .env dosyasını oluşturun
cp .env.example .env

# Ardından .env dosyasında şunları güncelleyin:
JWT_SECRET=<yukarıda-oluşturduğunuz-secret-1>
JWT_REFRESH_SECRET=<yukarıda-oluşturduğunuz-secret-2>
N8N_WEBHOOK_SECRET=<n8n-webhook-secret>
```

### 2. Frontend Sayfalarına Güvenlik Script'ini Ekleyin

**Tüm HTML dosyalarınıza (özellikle panel sayfalarına) aşağıdakileri ekleyin:**

```html
<!-- DOMPurify - XSS koruması -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
<!-- Security utilities -->
<script src="/assets/js/security.js"></script>
```

**Eklenmesi gereken dosyalar:**
- admin.html
- admin-audit.html
- admin-payments.html
- admin-permissions.html
- admin-subscriptions.html
- client.html
- dashboard.html
- analytics.html

**Eklenecek yer:** `</body>` tag'inden hemen önce

### 3. JavaScript Dosyalarını Güncelleme

**innerHTML kullanılan her yerde güvenli alternatifi kullanın:**

```javascript
// ❌ GÜVENSİZ - Yapma
element.innerHTML = userData.name;

// ✅ GÜVENLİ - Yap
element.textContent = userData.name;

// ✅ veya SecurityUtils kullan
const safeDiv = SecurityUtils.createSafeElement('div', userData.name);
```

## 🎯 Yapılan İyileştirmeler

### Backend Güvenliği

#### 1. JWT Token Güvenliği
- ✅ Access ve Refresh token için ayrı secret'lar
- ✅ Production'da fallback secret kullanımı engellendi
- ✅ Token doğrulama iyileştirildi

#### 2. CORS Koruması
- ✅ Sadece izin verilen domain'lerden isteklere izin
- ✅ HTTP metodları kısıtlandı
- ✅ Credential desteği güvenli şekilde eklendi

#### 3. Content Security Policy
- ✅ Helmet ile güçlü CSP politikası
- ✅ Script, style, img kaynakları kısıtlandı
- ✅ Inline script'ler kontrol altında

#### 4. Webhook Güvenliği
- ✅ N8N webhook secret zorunlu hale getirildi
- ✅ IP whitelist kontrolü iyileştirildi
- ✅ X-Forwarded-For header'ı doğru işleniyor

#### 5. Rate Limiting
- ✅ API endpoint'leri için genel rate limiting
- ✅ Login endpoint'i için özel rate limiting (5 deneme / 15 dakika)
- ✅ Nginx seviyesinde ek koruma

### Frontend Güvenliği

#### 1. XSS Koruması
- ✅ Security utilities kütüphanesi eklendi
- ✅ HTML escape fonksiyonları
- ✅ Güvenli DOM manipülasyonu

#### 2. API URL Güvenliği
- ✅ Dinamik API URL belirleme
- ✅ Environment'a göre otomatik yapılandırma

### Infrastructure Güvenliği

#### 1. Nginx Güvenlik Header'ları
- ✅ HSTS (preload ile)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Content-Security-Policy

#### 2. Body Parser Limitleri
- ✅ 10MB request body limiti
- ✅ DoS saldırılarına karşı koruma

## 🚀 Hızlı Başlangıç

### 1. Backend Kurulumu

```bash
cd backend

# Dependencies yükle
npm install

# .env dosyasını oluştur ve düzenle
cp .env.example .env
nano .env  # veya vim, code, vb.

# Secret'ları güncelle
# JWT_SECRET ve JWT_REFRESH_SECRET için:
openssl rand -base64 64

# Database migrate
npm run prisma:migrate

# Test et
npm run dev
```

### 2. Frontend Güncellemeleri

```bash
# Tüm HTML dosyalarına security.js ekleyin
# Örnek: admin.html

# Önce DOMPurify ekleyin (</head> öncesi veya </body> öncesi):
<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>

# Sonra security.js ekleyin:
<script src="/assets/js/security.js"></script>
```

### 3. Nginx Yapılandırması

```bash
# nginx.conf'u güncelle
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# SSL sertifikası ekle (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# Nginx'i test et ve yeniden yükle
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Güvenlik Kontrol Listesi

### Hemen Yapılacaklar (Kritik)
- [ ] Backend `.env` dosyasını oluştur ve secret'ları güncelle
- [ ] N8N_WEBHOOK_SECRET ayarla
- [ ] SSL sertifikası kur (Let's Encrypt)
- [ ] Frontend HTML sayfalarına security.js ekle
- [ ] Production database URL'ini güncelle

### Bu Hafta Yapılacaklar (Yüksek Öncelik)
- [ ] Tüm JavaScript dosyalarında innerHTML kullanımını kontrol et
- [ ] API endpoint'lerinde input validation kontrol et
- [ ] Rate limiting test et
- [ ] Error handling kontrol et (sensitive data leak)
- [ ] CORS yapılandırmasını test et

### Bu Ay Yapılacaklar (Orta Öncelik)
- [ ] HttpOnly cookies implementasyonu
- [ ] CSRF token ekle
- [ ] Audit logging genişlet
- [ ] Monitoring ekle (Sentry, LogRocket)
- [ ] Automated backup sistemi kur

### İleriye Yönelik (Düşük Öncelik)
- [ ] 2FA implementasyonu (admin için)
- [ ] API versioning ekle
- [ ] GraphQL rate limiting (eğer kullanılıyorsa)
- [ ] Penetrasyon testi yap

## 🔍 Test Etme

### 1. JWT Güvenliği Test

```bash
# Backend'de test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Response'da accessToken ve refreshToken olmalı
```

### 2. Rate Limiting Test

```bash
# 6 kez hızlıca istek at (5 limit)
for i in {1..6}; do
  curl http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 6. istekte 429 Too Many Requests dönmeli
```

### 3. CORS Test

```bash
# Farklı origin'den istek
curl -X POST http://localhost:5000/api/users \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json"

# CORS hatası dönmeli
```

### 4. XSS Test

```javascript
// Browser console'da test
const maliciousInput = '<script>alert("XSS")</script>';

// Eski yöntem (güvensiz)
element.innerHTML = maliciousInput; // ❌ Script çalışır

// Yeni yöntem (güvenli)
element.textContent = maliciousInput; // ✅ Sadece text olarak görünür
```

## 📚 Daha Fazla Bilgi

Detaylı güvenlik dokümantasyonu için:
- [docs/SECURITY.md](./SECURITY.md) - Kapsamlı güvenlik rehberi
- [backend/.env.example](../backend/.env.example) - Environment variable şablonu
- [assets/js/security.js](../assets/js/security.js) - Frontend güvenlik utilities

## 🆘 Sorun Giderme

### "JWT_SECRET must be set in production" hatası
```bash
# .env dosyanızda JWT_SECRET ve JWT_REFRESH_SECRET ayarlı olmalı
echo "JWT_SECRET=$(openssl rand -base64 64)" >> backend/.env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64)" >> backend/.env
```

### CORS hatası alıyorum
```bash
# backend/.env dosyasında FRONTEND_URL doğru ayarlı mı kontrol edin
FRONTEND_URL=https://yourdomain.com
# veya multiple domains için:
FRONTEND_URL=https://yourdomain.com,https://admin.yourdomain.com
```

### Rate limiting çalışmıyor
```bash
# Nginx ve backend'de de rate limiting var
# Backend rate limiting için:
# backend/src/middleware/rateLimiter.ts kontrol edin

# Nginx için:
# nginx/nginx.conf kontrol edin
```

## 💡 İpuçları

1. **Development vs Production**: Development'ta bazı güvenlik kontrolleri esnetilebilir, ama production'da asla!

2. **Secret Rotation**: JWT secret'larını düzenli olarak (3-6 ayda bir) değiştirin.

3. **Monitoring**: Güvenlik olaylarını izlemek için monitoring sistemi kurun.

4. **Backup**: Düzenli backup alın ve restore test edin.

5. **Updates**: Dependencies'i düzenli olarak güncelleyin:
   ```bash
   npm audit
   npm audit fix
   ```

6. **Logging**: Şüpheli aktiviteleri loglayın:
   - Başarısız login denemeleri
   - Rate limit aşımları
   - Geçersiz token kullanımları

## 🔗 Yararlı Komutlar

```bash
# Güçlü secret oluştur
openssl rand -base64 64

# npm güvenlik denetimi
npm audit

# Güvenlik açıklarını otomatik düzelt
npm audit fix

# Docker container'ları güvenli başlat
docker-compose up -d

# Nginx yapılandırma testi
nginx -t

# SSL sertifikası yenile
certbot renew
```

---

**Son Güncelleme:** $(date +%Y-%m-%d)
**Güvenlik Seviyesi:** 🟢 Yüksek (yapılan iyileştirmeler sonrası)
