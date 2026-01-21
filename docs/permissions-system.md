# Rol ve Yetki Yönetimi Sistemi

## Genel Bakış

DOA platformu, granüler ve esnek bir rol tabanlı erişim kontrol (RBAC) sistemi kullanır. Sistem 4 ana rol ve 37 farklı yetki içerir.

## Roller

### SUPER_ADMIN
- **Açıklama**: Tam sistem erişimi
- **Yetki Sayısı**: 37 (tüm yetkiler)
- **Kullanım Alanı**: Sistem yöneticileri
- **Özellikler**:
  - Tüm sistem kaynaklarına tam erişim
  - Rol yönetimi yetkisi
  - Denetim günlüklerini temizleme
  - Sistem yapılandırması

### ADMIN
- **Açıklama**: Platform yönetimi
- **Yetki Sayısı**: 32
- **Kullanım Alanı**: Platform yöneticileri
- **Kısıtlamalar**:
  - Rol yönetimi yapamaz
  - Denetim günlüklerini silemez
  - Bazı sistem ayarlarına erişemez

### MANAGER
- **Açıklama**: Müşteri ve içerik yönetimi
- **Yetki Sayısı**: 19
- **Kullanım Alanı**: İçerik ve müşteri yöneticileri
- **Odak Alanları**:
  - Kullanıcı yönetimi
  - Mesaj yönetimi
  - Rapor oluşturma
  - Analitik görüntüleme

### CLIENT
- **Açıklama**: Sınırlı erişim
- **Yetki Sayısı**: 12
- **Kullanım Alanı**: Standart müşteriler
- **Kısıtlamalar**:
  - Sadece kendi verilerine erişim
  - Yönetim fonksiyonları yok
  - Sadece okuma ve güncelleme

## Yetkiler (Permissions)

### Yetki Formatı
Her yetki `resource:action` formatındadır.

Örnek: `users:create`, `messages:read`, `payments:delete`

### Kaynak Tipleri

#### 1. users
- `create`: Kullanıcı oluşturma
- `read`: Kullanıcı bilgilerini görüntüleme
- `update`: Kullanıcı bilgilerini güncelleme
- `delete`: Kullanıcı silme
- `list`: Kullanıcı listesini görüntüleme

#### 2. messages
- `create`: Mesaj oluşturma
- `read`: Mesaj görüntüleme
- `update`: Mesaj güncelleme
- `delete`: Mesaj silme
- `list`: Mesaj listesini görüntüleme

#### 3. payments
- `create`: Ödeme kaydı oluşturma
- `read`: Ödeme bilgilerini görüntüleme
- `update`: Ödeme bilgilerini güncelleme
- `delete`: Ödeme kaydı silme
- `list`: Ödeme listesini görüntüleme

#### 4. subscriptions
- `create`: Abonelik oluşturma
- `read`: Abonelik görüntüleme
- `update`: Abonelik güncelleme
- `delete`: Abonelik silme
- `list`: Abonelik listesini görüntüleme
- `cancel`: Abonelik iptali

#### 5. analytics
- `read`: Analitik verileri görüntüleme
- `export`: Analitik verileri dışa aktarma

#### 6. reports
- `read`: Rapor görüntüleme
- `generate`: Rapor oluşturma
- `export`: Rapor dışa aktarma

#### 7. search
- `read`: Arama yapma
- `save`: Arama kaydetme
- `export`: Arama sonuçlarını dışa aktarma

#### 8. settings
- `read`: Ayarları görüntüleme
- `update`: Ayarları güncelleme

#### 9. audit
- `read`: Denetim kayıtlarını görüntüleme
- `delete`: Denetim kayıtlarını silme

#### 10. roles
- `read`: Rol ve yetkileri görüntüleme
- `assign`: Rol yetkilerini yönetme

## API Kullanımı

### Yetki Kontrolü

#### Middleware Kullanımı

```typescript
import { checkPermission } from '../middleware/permission';

// Tek yetki kontrolü
router.get('/users', checkPermission('users', 'list'), controller.getUsers);

// Birden fazla yetki (OR mantığı)
import { checkAnyPermission } from '../middleware/permission';
router.get('/data', 
  checkAnyPermission(['users', 'read'], ['analytics', 'read']), 
  controller.getData
);

// Tüm yetkiler (AND mantığı)
import { checkAllPermissions } from '../middleware/permission';
router.post('/advanced', 
  checkAllPermissions(['users', 'create'], ['audit', 'read']), 
  controller.createAdvanced
);
```

#### Rol Kontrolü

```typescript
import { checkRole, requireAdmin, requireManager } from '../middleware/permission';

// Belirli roller
router.get('/admin-only', checkRole('ADMIN', 'SUPER_ADMIN'), controller.admin);

// Admin gerekli
router.post('/settings', requireAdmin, controller.updateSettings);

// Manager ve üzeri
router.get('/reports', requireManager, controller.getReports);
```

### Denetim Kaydı (Audit Logging)

#### Otomatik Kayıt

```typescript
import { auditLog } from '../middleware/auditLog';

router.post('/users',
  authenticate,
  checkPermission('users', 'create'),
  auditLog('create_user', 'users'),
  controller.createUser
);
```

#### Manuel Kayıt

```typescript
import { auditService } from '../services/audit.service';

// Controller içinde
async createUser(req, res) {
  const user = await userService.create(req.body);
  
  await auditService.logFromRequest(req, {
    userId: req.user.id,
    action: 'create_user',
    resource: 'users',
    resourceId: user.id,
    changes: {
      email: user.email,
      role: user.role
    }
  });
  
  res.json(user);
}
```

## API Endpoints

### Yetki Yönetimi

#### Tüm Yetkileri Listele
```
GET /api/permissions/permissions
Authorization: Bearer {token}
```

#### Kaynağa Göre Yetkileri Listele
```
GET /api/permissions/permissions/by-resource
Authorization: Bearer {token}
```

#### Tüm Rolleri Listele
```
GET /api/permissions/roles
Authorization: Bearer {token}

Response:
[
  {
    "role": "ADMIN",
    "permissionCount": 32,
    "permissions": [...]
  }
]
```

#### Rol Yetkilerini Görüntüle
```
GET /api/permissions/roles/:role/permissions
Authorization: Bearer {token}

Response:
{
  "role": "ADMIN",
  "permissionCount": 32,
  "permissions": [
    {
      "id": "...",
      "resource": "users",
      "action": "create",
      "description": "Create new users",
      "grantedAt": "2024-01-21T10:00:00Z"
    }
  ]
}
```

#### Role Yetki Ekle
```
POST /api/permissions/roles/:role/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissionId": "permission-uuid"
}
```

#### Rolden Yetki Kaldır
```
DELETE /api/permissions/roles/:role/permissions/:permissionId
Authorization: Bearer {token}
```

#### Rol Yetkilerini Senkronize Et
```
PUT /api/permissions/roles/:role/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissionIds": ["perm-1", "perm-2", "perm-3"]
}
```

#### Kullanıcı Yetkilerini Görüntüle
```
GET /api/permissions/users/:userId/permissions
Authorization: Bearer {token}
```

#### Kullanıcı Yetki Kontrolü
```
POST /api/permissions/users/:userId/check-permission
Authorization: Bearer {token}
Content-Type: application/json

{
  "resource": "users",
  "action": "create"
}

Response:
{
  "userId": "user-uuid",
  "role": "ADMIN",
  "resource": "users",
  "action": "create",
  "hasPermission": true
}
```

### Denetim Kayıtları

#### Denetim Kayıtlarını Listele
```
GET /api/audit?page=1&limit=50&resource=users&action=create
Authorization: Bearer {token}

Query Parameters:
- page: Sayfa numarası (default: 1)
- limit: Sayfa başına kayıt (default: 50)
- userId: Kullanıcıya göre filtrele
- action: Eyleme göre filtrele
- resource: Kaynağa göre filtrele
- resourceId: Kaynak ID'sine göre filtrele
- startDate: Başlangıç tarihi (ISO 8601)
- endDate: Bitiş tarihi (ISO 8601)
```

#### Kullanıcı Aktivitesi
```
GET /api/audit/users/:userId?limit=20
Authorization: Bearer {token}
```

#### Kaynak Geçmişi
```
GET /api/audit/resources/:resource/:resourceId
Authorization: Bearer {token}

Example: GET /api/audit/resources/users/user-uuid
```

#### Aktivite İstatistikleri
```
GET /api/audit/stats?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}

Response:
{
  "totalActions": 1234,
  "actionBreakdown": {
    "create_user": 45,
    "update_user": 123,
    ...
  },
  "resourceBreakdown": {
    "users": 234,
    "messages": 567,
    ...
  },
  "activeUsers": 12,
  "topUsers": [
    { "userId": "...", "count": 89 }
  ]
}
```

#### Eski Kayıtları Temizle
```
POST /api/audit/clean
Authorization: Bearer {token}
Content-Type: application/json

{
  "daysToKeep": 90
}
```

## Veritabanı Modelleri

### Permission Model
```prisma
model Permission {
  id          String   @id @default(uuid())
  resource    String   // e.g., "users", "messages"
  action      String   // e.g., "create", "read", "update"
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### RolePermission Model
```prisma
model RolePermission {
  id           String     @id @default(uuid())
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId])
  grantedById  String?
  grantedBy    User?      @relation(fields: [grantedById])
  createdAt    DateTime   @default(now())
}
```

### AuditLog Model
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId])
  action     String   // e.g., "create_user", "update_payment"
  resource   String   // e.g., "users", "payments"
  resourceId String?  // ID of affected resource
  changes    Json     @default("{}")
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}
```

## Frontend Kullanımı

### Yetki Kontrolü (Client-side)

```javascript
// Kullanıcının yetkisini kontrol et
async function checkUserPermission(resource, action) {
  const response = await fetch(`${API_URL}/permissions/users/${userId}/check-permission`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resource, action })
  });
  
  const result = await response.json();
  return result.hasPermission;
}

// Kullanım
if (await checkUserPermission('users', 'create')) {
  showCreateButton();
}
```

### UI Sayfaları

#### Yetki Yönetimi Sayfası
- URL: `/permissions.html`
- Özellikler:
  - Rol listesi ve yetki sayıları
  - Yetki matrisi görünümü
  - Kaynak bazlı yetki listesi
  - Rol detay görüntüleme

#### Denetim Kayıtları Sayfası
- URL: `/audit.html`
- Özellikler:
  - Filtrelenebilir denetim kayıtları
  - Zaman çizelgesi görünümü
  - Aktivite istatistikleri
  - Detaylı kayıt görüntüleme

## Güvenlik Notları

1. **Yetki Önbelleği**: Yetkiler 5 dakika boyunca önbellekte tutulur
2. **SUPER_ADMIN**: Her zaman tüm yetkilere sahiptir, veritabanı kontrolü yapılmaz
3. **Denetim Kaydı**: Tüm hassas işlemler otomatik olarak kaydedilir
4. **IP ve User Agent**: Her işlem için IP adresi ve kullanıcı aracı kaydedilir
5. **Veri Saklama**: Denetim kayıtları varsayılan olarak 90 gün saklanır

## Örnek Senaryolar

### Senaryo 1: Yeni Rol Yetkisi Ekleme

```typescript
// 1. Permission service kullanarak
await permissionService.assignPermissionToRole(
  'MANAGER',
  'permission-uuid',
  'admin-user-id'
);

// 2. API endpoint üzerinden
POST /api/permissions/roles/MANAGER/permissions
{
  "permissionId": "permission-uuid"
}
```

### Senaryo 2: Kullanıcı Aktivitesini İzleme

```typescript
// Son 20 aktiviteyi getir
const activity = await auditService.getUserActivity('user-id', 20);

// Belirli bir kaynağın geçmişini getir
const history = await auditService.getResourceHistory('users', 'user-id');
```

### Senaryo 3: Özel Yetki Kontrolü

```typescript
// Controller'da özel kontrol
async myController(req, res) {
  const canCreate = await permissionService.hasPermission(
    req.user.role,
    'users',
    'create'
  );
  
  const canUpdate = await permissionService.hasPermission(
    req.user.role,
    'users',
    'update'
  );
  
  if (!canCreate && !canUpdate) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // İşleme devam et
}
```

## Sorun Giderme

### Yetki Kontrolü Çalışmıyor

1. Token'ın geçerli olduğundan emin olun
2. Kullanıcının doğru role sahip olduğunu kontrol edin
3. Permission cache'i temizleyin: `POST /api/permissions/cache/clear`

### Denetim Kayıtları Görünmüyor

1. Kullanıcının `audit:read` yetkisi olduğunu kontrol edin
2. Tarih filtrelerini kontrol edin
3. Database bağlantısını kontrol edin

### Yetki Önbelleği Güncellenmiyor

```typescript
// Belirli bir rol için cache temizle
permissionService.clearRoleCache('ADMIN');

// Tüm cache'i temizle
permissionService.clearCache();
```

## Performans İpuçları

1. **Cache Kullanımı**: Yetki kontrollerinde cache kullanılır, gereksiz database sorguları olmaz
2. **Batch Operations**: Birden fazla yetki kontrolü için `hasAnyPermission` veya `hasAllPermissions` kullanın
3. **Audit Log Temizliği**: Periyodik olarak eski kayıtları temizleyin
4. **Index'ler**: Database'de resource, action, createdAt alanları index'lidir

## Gelecek Geliştirmeler

- [ ] Dinamik yetki oluşturma UI
- [ ] Yetki gruplaması (permission sets)
- [ ] Koşullu yetkiler (conditional permissions)
- [ ] Zaman bazlı yetkiler (temporal permissions)
- [ ] Yetki devretme (delegation)
- [ ] Real-time yetki değişikliği bildirimleri
