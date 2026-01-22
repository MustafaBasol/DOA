# API Dokümantasyonu

## Genel Bakış

DOA WhatsApp Management Panel API'si için Swagger/OpenAPI 3.0 tabanlı interaktif dokümantasyon sistemi.

## Erişim

### Swagger UI (İnteraktif)
```
http://localhost:5000/api-docs
```
- Tüm endpoint'leri görüntüleme
- Try-it-out ile canlı test
- Authentication test etme
- Request/Response örnekleri

### JSON Spesifikasyonu
```
http://localhost:5000/api-docs.json
```
- OpenAPI 3.0 JSON formatında spec
- Code generation için kullanılabilir
- Postman/Insomnia import için uygun

## Teknolojiler

- **swagger-ui-express**: İnteraktif UI
- **swagger-jsdoc**: JSDoc'tan otomatik spec oluşturma
- **OpenAPI 3.0**: Standart API spesifikasyonu

## Konfigürasyon

### Dosya: `backend/src/config/swagger.ts`

```typescript
{
  openapi: '3.0.0',
  info: {
    title: 'DOA WhatsApp Management Panel API',
    version: '2.0.0',
    description: 'Comprehensive API documentation'
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Development' },
    { url: 'https://api.autoviseo.com', description: 'Production' }
  ]
}
```

## Authentication

### Bearer JWT

Tüm korumalı endpoint'ler JWT token gerektirir:

```
Authorization: Bearer <your-token>
```

**Token Alma:**
```bash
POST /api/auth/login
{
  "email": "admin@autoviseo.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@autoviseo.com",
    "role": "SUPER_ADMIN"
  }
}
```

## Dokümante Edilen Modüller

### 1. Authentication (`/api/auth`)
- ✅ POST `/login` - Kullanıcı girişi
- ✅ POST `/logout` - Çıkış
- ✅ POST `/refresh` - Token yenileme
- ✅ GET `/me` - Mevcut kullanıcı bilgisi

**Örnek JSDoc:**
```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 */
```

### 2. Messages (`/api/messages`)
- ✅ GET `/` - Mesaj listesi (filtreli)
- ✅ GET `/conversations` - Konuşmalar
- ✅ GET `/stats` - İstatistikler
- ✅ GET `/:id` - Tekil mesaj
- ✅ PATCH `/:id/read` - Okundu işaretle
- ✅ POST `/conversations/mark-read` - Konuşmayı okundu işaretle

### 3. Devices (`/api/devices`)
- ✅ POST `/register` - Cihaz kaydı (FCM token)
- ✅ POST `/unregister` - Cihaz silme
- ✅ GET `/my-devices` - Kullanıcı cihazları
- ✅ POST `/test-notification` - Test bildirimi
- ✅ POST `/subscribe-topic` - Topic aboneliği
- ✅ POST `/unsubscribe-topic` - Topic aboneliği iptal
- ✅ POST `/send-to-users` - Kullanıcılara push (Admin)
- ✅ POST `/send-to-role` - Role'e push (Admin)

### 4. Templates (`/api/templates`)
- ✅ POST `/` - Şablon oluştur
- ✅ GET `/` - Şablon listesi
- ✅ GET `/search` - Şablon ara
- ✅ GET `/stats` - İstatistikler
- ✅ GET `/:id` - Tekil şablon
- ✅ PATCH `/:id` - Şablon güncelle
- ✅ DELETE `/:id` - Şablon sil
- ✅ POST `/preview` - Önizleme
- ✅ POST `/:id/duplicate` - Şablon çoğalt

### 5. Diğer Modüller (Yapılacak)
- ⏳ Users (`/api/users`)
- ⏳ Subscriptions (`/api/subscriptions`)
- ⏳ Payments (`/api/payments`)
- ⏳ Reports (`/api/reports`)
- ⏳ Analytics (`/api/analytics`)
- ⏳ Search (`/api/search`)
- ⏳ Notifications (`/api/notifications`)
- ⏳ WhatsApp (`/api/whatsapp`)
- ⏳ Permissions (`/api/permissions`)
- ⏳ Audit (`/api/audit`)
- ⏳ Webhooks (`/api/webhooks`)

## Schemas

### Tanımlı Modeller

```typescript
// User
{
  id: string (uuid)
  email: string (email)
  role: SUPER_ADMIN | ADMIN | MANAGER | CLIENT
  fullName: string
  language: TR | EN | FR
  isActive: boolean
  createdAt: datetime
}

// Message
{
  id: string (uuid)
  direction: INBOUND | OUTBOUND
  fromNumber: string
  toNumber: string
  customerName: string
  messageContent: string
  readStatus: boolean
  timestamp: datetime
}

// Notification
{
  id: string (uuid)
  type: NEW_MESSAGE | PAYMENT_RECEIVED | ...
  title: string
  message: string
  priority: LOW | MEDIUM | HIGH | URGENT
  isRead: boolean
  createdAt: datetime
}

// MessageTemplate
{
  id: string (uuid)
  name: string
  content: string (with {{variables}})
  variables: string[]
  language: TR | EN | FR
  status: DRAFT | ACTIVE | INACTIVE | ARCHIVED
}
```

## Kullanım Örnekleri

### Swagger UI'da Test Etme

1. **Login:**
   - `/api/docs` adresine git
   - `Authentication` kategorisini aç
   - `POST /api/auth/login` endpoint'ini seç
   - "Try it out" butonuna tıkla
   - Credentials gir:
     ```json
     {
       "email": "admin@autoviseo.com",
       "password": "Admin123!"
     }
     ```
   - "Execute" butonuna bas
   - Response'dan `accessToken` kopyala

2. **Authenticate:**
   - Sayfanın üstündeki "Authorize" butonuna tıkla
   - Bearer token formatında token'ı yapıştır:
     ```
     Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - "Authorize" butonuna bas
   - Artık tüm korumalı endpoint'leri test edebilirsin

3. **Endpoint Test:**
   - İstediğin endpoint'i seç
   - "Try it out" tıkla
   - Parametreleri doldur
   - "Execute" bas
   - Response'u gör

### cURL ile API Test

```bash
# 1. Login ve token al
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autoviseo.com","password":"Admin123!"}'

# 2. Token ile mesajları getir
TOKEN="your-access-token"
curl -X GET http://localhost:5000/api/messages \
  -H "Authorization: Bearer $TOKEN"

# 3. Cihaz kaydı
curl -X POST http://localhost:5000/api/devices/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "fcm-device-token",
    "platform": "WEB",
    "deviceName": "Chrome Browser"
  }'

# 4. Şablon oluştur
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Message",
    "content": "Merhaba {{name}}, hoş geldiniz!",
    "category": "GREETING",
    "language": "TR"
  }'
```

## Yeni Endpoint Ekleme

### 1. JSDoc Yorumu Ekle

Route dosyasına Swagger JSDoc ekle:

```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, getUserById);
```

### 2. Schema Tanımı

Eğer yeni bir model varsa, `swagger.ts`'ye ekle:

```typescript
schemas: {
  NewModel: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      // ...
    }
  }
}
```

### 3. Otomatik Güncelleme

Swagger JSDoc, dosyaları otomatik tara:

```typescript
apis: [
  './src/modules/**/*.routes.ts',
  './src/routes/*.routes.ts',
]
```

## Production Kullanımı

### 1. Environment Variables

```env
NODE_ENV=production
API_URL=https://api.autoviseo.com
```

### 2. Swagger Güvenliği

Production'da Swagger'ı kapatmak isterseniz:

```typescript
if (serverConfig.nodeEnv === 'development') {
  setupSwagger(app);
}
```

### 3. CORS Ayarları

Production URL'lerini beyaz listeye ekle:

```typescript
app.use(cors({
  origin: ['https://autoviseo.com', 'https://panel.autoviseo.com'],
  credentials: true
}));
```

## Code Generation

Swagger spec'ten client kodu oluşturma:

### 1. TypeScript Client

```bash
# swagger-typescript-api ile
npx swagger-typescript-api \
  --path http://localhost:5000/api-docs.json \
  --output ./src/api \
  --name api-client.ts
```

### 2. Postman Collection

1. Postman aç
2. Import > Link
3. `http://localhost:5000/api-docs.json` yapıştır
4. Import

### 3. OpenAPI Generator

```bash
# JavaScript/TypeScript client
openapi-generator-cli generate \
  -i http://localhost:5000/api-docs.json \
  -g typescript-axios \
  -o ./generated/api-client

# Python client
openapi-generator-cli generate \
  -i http://localhost:5000/api-docs.json \
  -g python \
  -o ./generated/python-client
```

## Swagger Tags

Endpoint'ler kategorilere ayrılmış:

1. **Authentication** - Login, logout, token
2. **Users** - Kullanıcı yönetimi
3. **Messages** - WhatsApp mesajları
4. **Payments** - Ödeme takibi
5. **Subscriptions** - Abonelik yönetimi
6. **Reports** - Rapor oluşturma
7. **Analytics** - İstatistikler
8. **Search** - Gelişmiş arama
9. **Notifications** - Bildirimler
10. **Devices** - Push notification cihazları
11. **Templates** - Mesaj şablonları
12. **WhatsApp** - WhatsApp operasyonları
13. **Permissions** - Yetkilendirme
14. **Audit** - Denetim logları
15. **Webhooks** - n8n entegrasyonu

## Best Practices

### 1. Açıklayıcı Descriptions

```typescript
/**
 * @swagger
 * ...
 *     description: |
 *       Get filtered list of WhatsApp messages.
 *       Supports pagination, search, and status filtering.
 *       Requires authentication.
 */
```

### 2. Örnek Değerler

```typescript
properties:
  email:
    type: string
    format: email
    example: admin@autoviseo.com
```

### 3. Hata Responses

```typescript
responses:
  400:
    description: Bad request - Invalid input
  401:
    description: Unauthorized - Invalid or missing token
  403:
    description: Forbidden - Insufficient permissions
  404:
    description: Not found
  500:
    description: Internal server error
```

### 4. Request Body Examples

```typescript
requestBody:
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateUserDto'
      examples:
        admin:
          value:
            email: "admin@autoviseo.com"
            role: "ADMIN"
        client:
          value:
            email: "client@example.com"
            role: "CLIENT"
```

## Troubleshooting

### Swagger UI Görünmüyor

```bash
# Sunucunun çalıştığını kontrol et
curl http://localhost:5000/api/health

# Swagger endpoint'ini kontrol et
curl http://localhost:5000/api-docs.json

# Package kurulumunu kontrol et
cd backend
npm list swagger-ui-express swagger-jsdoc
```

### JSDoc Yorumları Görünmüyor

1. `swagger.ts`'deki `apis` yollarını kontrol et
2. JSDoc formatını kontrol et (@swagger tag'i olmalı)
3. Sunucuyu yeniden başlat

### Authentication Çalışmıyor

1. Swagger UI'da "Authorize" butonuna tıkla
2. Bearer token formatını kullan: `Bearer <token>`
3. Token'ın geçerli olduğundan emin ol

## Katkıda Bulunma

Yeni endpoint eklediğinde:
1. JSDoc yorumlarını ekle
2. Schema tanımlarını güncelle
3. Bu dokümantasyonu güncelle
4. Test et ve commit et

## İstatistikler

- **Toplam Endpoint**: 60+
- **Dokümante Edilmiş**: 20+ (Auth, Messages, Devices, Templates)
- **Kalan**: ~40 (Users, Payments, Subscriptions, Reports, vb.)
- **Swagger Version**: OpenAPI 3.0.0
- **Toplam Schemas**: 7 (User, Message, Notification, etc.)
- **Toplam Tags**: 15

## Roadmap

- [x] Swagger konfigürasyonu
- [x] Auth endpoint'leri
- [x] Messages endpoint'leri
- [x] Devices endpoint'leri
- [x] Templates endpoint'leri
- [ ] Users endpoint'leri
- [ ] Subscriptions endpoint'leri
- [ ] Payments endpoint'leri
- [ ] Reports endpoint'leri
- [ ] Analytics endpoint'leri
- [ ] Search endpoint'leri
- [ ] Notifications endpoint'leri
- [ ] WhatsApp endpoint'leri
- [ ] Permissions endpoint'leri
- [ ] Audit endpoint'leri
- [ ] Webhooks endpoint'leri

## Sonuç

✅ **Swagger/OpenAPI dokümantasyonu başarıyla kuruldu!**

**Erişim:**
- UI: http://localhost:5000/api-docs
- JSON: http://localhost:5000/api-docs.json

**Özellikler:**
- ✅ İnteraktif API testi
- ✅ JWT authentication desteği
- ✅ 20+ endpoint dokümante edildi
- ✅ Otomatik schema generation
- ✅ OpenAPI 3.0 standardı

**Sonraki Adımlar:**
1. Kalan endpoint'leri dokümante et
2. Postman collection oluştur
3. Frontend client kodu generate et
4. Production'a deploy et
