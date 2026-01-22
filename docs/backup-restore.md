# Backup & Restore System

## Genel Bakış

DOA WhatsApp Management Panel için otomatik ve manuel database backup/restore sistemi.

## Özellikler

✅ **Manuel Backup**
- Full database backup
- Specific table backup
- On-demand backup creation

✅ **Otomatik Backup**
- Günlük scheduled backup (2:00 AM)
- Haftalık eski backup temizleme
- Configurable schedule

✅ **Restore**
- Backup'tan database restore
- Güvenli drop/recreate işlemi

✅ **Yönetim**
- Backup listeleme
- Backup silme
- Backup istatistikleri
- Eski backup temizleme

## Teknolojiler

- **PostgreSQL pg_dump**: Native backup tool
- **node-cron**: Scheduled tasks
- **Node.js child_process**: Command execution

## Kurulum

### 1. Gereksinimler

PostgreSQL araçlarının yüklü olması gerekir:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Docker (already included in postgres image)
```

### 2. Environment Variables

`.env` dosyasına ekle:

```env
# Backup Configuration
BACKUP_DIR=/path/to/backups
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_CLEANUP_SCHEDULE=0 3 * * 0
BACKUP_KEEP_LAST=30
```

**Açıklamalar:**
- `BACKUP_DIR`: Backup dosyalarının saklanacağı klasör (default: `backend/backups`)
- `AUTO_BACKUP_ENABLED`: Otomatik backup açık/kapalı (default: `true`)
- `BACKUP_SCHEDULE`: Cron expression (default: Her gün 02:00)
- `BACKUP_CLEANUP_SCHEDULE`: Cleanup cron (default: Her Pazar 03:00)
- `BACKUP_KEEP_LAST`: Kaç backup saklanacak (default: 30)

### 3. Cron Schedule Örnekleri

```bash
# Her gün 02:00
0 2 * * *

# Her 6 saatte bir
0 */6 * * *

# Her Pazartesi 03:00
0 3 * * 1

# Her ayın 1'i 04:00
0 4 1 * *
```

## API Endpoints

### Health Check

```bash
GET /api/backup/health
```

pg_dump'ın kullanılabilir olduğunu kontrol eder.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "version": "pg_dump (PostgreSQL) 15.3"
  }
}
```

### Create Backup

```bash
POST /api/backup
Authorization: Bearer <admin-token>
```

**Full Backup:**
```json
{}
```

**Specific Tables:**
```json
{
  "tables": ["User", "WhatsappMessage", "Subscription"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup created successfully",
  "data": {
    "id": "2026-01-22T16-30-00-000Z",
    "filename": "backup-2026-01-22T16-30-00-000Z.sql",
    "size": 5242880,
    "createdAt": "2026-01-22T16:30:00.000Z",
    "type": "manual",
    "status": "completed"
  }
}
```

### List Backups

```bash
GET /api/backup
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "2026-01-22T16-30-00-000Z",
      "filename": "backup-2026-01-22T16-30-00-000Z.sql",
      "size": 5242880,
      "createdAt": "2026-01-22T16:30:00.000Z",
      "type": "manual",
      "status": "completed"
    }
  ]
}
```

### Backup Statistics

```bash
GET /api/backup/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBackups": 15,
    "totalSize": 78643200,
    "oldestBackup": "2026-01-01T02:00:00.000Z",
    "newestBackup": "2026-01-22T02:00:00.000Z"
  }
}
```

### Restore Backup

⚠️ **DANGEROUS OPERATION** - Bu işlem mevcut database'i tamamen siler!

```bash
POST /api/backup/{backupId}/restore
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Database restored successfully"
}
```

### Delete Backup

```bash
DELETE /api/backup/{backupId}
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

### Clean Old Backups

```bash
POST /api/backup/clean?keepLast=7
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaned 8 old backups",
  "data": {
    "deletedCount": 8,
    "keptLast": 7
  }
}
```

## Kullanım Örnekleri

### 1. Manuel Backup Oluşturma

```bash
# Login ve token al
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autoviseo.com","password":"Admin123!"}' \
  | jq -r '.accessToken')

# Full backup
curl -X POST http://localhost:5000/api/backup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Specific tables backup
curl -X POST http://localhost:5000/api/backup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tables": ["User", "WhatsappMessage"]}'
```

### 2. Backup Listeleme

```bash
curl -X GET http://localhost:5000/api/backup \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Restore İşlemi

⚠️ **Dikkatli Kullan!**

```bash
# Önce backup listesini al
BACKUPS=$(curl -s -X GET http://localhost:5000/api/backup \
  -H "Authorization: Bearer $TOKEN")

echo $BACKUPS | jq '.data[0]'

# Restore et (ilk backup'ı kullan)
BACKUP_ID=$(echo $BACKUPS | jq -r '.data[0].id')

curl -X POST "http://localhost:5000/api/backup/$BACKUP_ID/restore" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Eski Backupları Temizle

```bash
# Son 10 backup'ı sakla, diğerlerini sil
curl -X POST "http://localhost:5000/api/backup/clean?keepLast=10" \
  -H "Authorization: Bearer $TOKEN"
```

## Otomatik Backup

### Scheduler Başlatma

Server başladığında otomatik olarak başlar:

```typescript
// src/server.ts
import { backupScheduler } from './services/backup-scheduler.service';

// Server başlatıldığında
backupScheduler.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  backupScheduler.stop();
  process.exit(0);
});
```

### Scheduler Konfigürasyonu

**Default Schedule:**
- **Daily Backup**: Her gün 02:00 (cron: `0 2 * * *`)
- **Weekly Cleanup**: Her Pazar 03:00 (cron: `0 3 * * 0`)
- **Keep Last**: 30 backup

**Özelleştirme:**

```env
# Her 12 saatte bir backup
BACKUP_SCHEDULE=0 */12 * * *

# Her gün cleanup, son 7 backup sakla
BACKUP_CLEANUP_SCHEDULE=0 4 * * *
BACKUP_KEEP_LAST=7
```

### Loglar

```bash
# Server başladığında
⏰ Backup scheduler started
📅 Daily backup: 0 2 * * *
🧹 Weekly cleanup: 0 3 * * 0 (keep last 30)

# Scheduled backup çalıştığında
🕐 Running scheduled backup...
✅ Scheduled backup completed: backup-2026-01-22T02-00-00-000Z.sql

# Cleanup çalıştığında
🧹 Running backup cleanup...
✅ Cleanup completed: 3 old backups deleted
```

## File Structure

```
backend/
├── backups/                           # Backup klasörü
│   ├── backup-2026-01-22T02-00-00-000Z.sql
│   ├── backup-2026-01-21T02-00-00-000Z.sql
│   └── backup-tables-2026-01-22T10-30-00-000Z.sql
├── src/
│   ├── services/
│   │   ├── backup.service.ts          # Backup logic
│   │   └── backup-scheduler.service.ts # Cron scheduler
│   ├── controllers/
│   │   └── backup.controller.ts       # API handlers
│   └── routes/
│       └── backup.routes.ts           # API routes
```

## Güvenlik

### 1. Authentication

Tüm backup endpoint'leri authentication gerektirir:

```typescript
router.use(authenticate);
router.use(checkPermission('backup', 'manage'));
```

Sadece **SUPER_ADMIN** rolü backup işlemlerini yapabilir.

### 2. Backup Dosyaları

Backup dosyaları **hassas veri** içerir:

- Kullanıcı bilgileri (şifreler hash'li)
- Ödeme kayıtları
- Mesajlaşma geçmişi
- Abonelik bilgileri

**Öneriler:**
- Backup klasörünü public erişime kapalı tut
- Backup'ları encrypt et
- Cloud storage kullan (S3, Google Cloud Storage)
- Regular backup kontrolü yap

### 3. Restore İşlemi

Restore **çok tehlikeli** bir işlemdir:

```typescript
// ⚠️ Mevcut database'i siler!
await execAsync(`dropdb ${dbName}`);
await execAsync(`createdb ${dbName}`);
await execAsync(`psql -f backup.sql`);
```

**Öneriler:**
- Production'da restore işlemini disable et
- Restore öncesi mevcut DB'den backup al
- Restore sonrası data integrity check yap
- Test environment'da önce test et

## Production Deployment

### 1. External Storage

Backup'ları cloud storage'da sakla:

```typescript
// AWS S3 örneği
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

async uploadBackupToS3(filepath: string) {
  const fileContent = await fs.readFile(filepath);
  
  await s3.upload({
    Bucket: 'doa-backups',
    Key: path.basename(filepath),
    Body: fileContent,
    ServerSideEncryption: 'AES256',
  }).promise();
}
```

### 2. Email Notifications

Backup başarı/hata durumunda email gönder:

```typescript
import { emailService } from './email.service';

async createBackup() {
  try {
    const backup = await this.performBackup();
    
    await emailService.sendBackupSuccessEmail({
      to: 'admin@autoviseo.com',
      filename: backup.filename,
      size: backup.size,
    });
  } catch (error) {
    await emailService.sendBackupFailureEmail({
      to: 'admin@autoviseo.com',
      error: error.message,
    });
  }
}
```

### 3. Monitoring

Backup health monitoring:

```typescript
// Health check endpoint
router.get('/health', async (req, res) => {
  const health = await backupService.healthCheck();
  const stats = await backupService.getBackupStats();
  
  const healthy = 
    health.available &&
    stats.totalBackups > 0 &&
    stats.newestBackup &&
    (Date.now() - stats.newestBackup.getTime()) < 86400000; // 24h
  
  res.json({
    status: healthy ? 'ok' : 'warning',
    details: { health, stats },
  });
});
```

### 4. Docker Volume

Docker kullanıyorsan backup klasörünü volume olarak mount et:

```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./backups:/app/backend/backups
      - backup-data:/var/backups
volumes:
  backup-data:
```

## Troubleshooting

### pg_dump not found

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Docker - postgres image zaten içerir
```

### Permission Denied

```bash
# Backup klasörüne yazma izni ver
chmod 755 backend/backups

# PostgreSQL kullanıcı yetkisi kontrol et
psql -U postgres -c "SELECT * FROM pg_roles WHERE rolname = 'your_user';"
```

### Backup Too Large

```bash
# Compression kullan (gzip)
pg_dump -Fc database_name > backup.dump  # Custom format (compressed)

# Veya manuel gzip
gzip backup.sql
```

### Restore Fails

```bash
# Önce syntax kontrol et
psql -f backup.sql --dry-run

# Log dosyasına yaz
psql -f backup.sql 2> restore_errors.log

# Verbose mode
psql -f backup.sql -v ON_ERROR_STOP=1
```

## Best Practices

### 1. 3-2-1 Backup Rule

- **3** kopya tut (production + 2 backup)
- **2** farklı storage medium (local + cloud)
- **1** off-site backup (cloud)

### 2. Test Restores

Düzenli olarak backup'lardan restore test et:

```bash
# Test database'e restore et
createdb doa_test
psql -d doa_test -f backup.sql

# Data integrity kontrol
psql -d doa_test -c "SELECT COUNT(*) FROM \"User\";"
```

### 3. Retention Policy

- **Daily**: Son 7 gün
- **Weekly**: Son 4 hafta
- **Monthly**: Son 12 ay
- **Yearly**: Son 5 yıl

### 4. Monitoring

- Backup success rate tracking
- Alert on backup failures
- Disk space monitoring
- Backup file integrity checks

## Roadmap

- [ ] S3/Cloud storage integration
- [ ] Email notifications
- [ ] Encrypted backups
- [ ] Point-in-time recovery (PITR)
- [ ] Incremental backups
- [ ] Backup verification
- [ ] Multi-region backups
- [ ] Backup retention policies UI

## İstatistikler

- **Kod**: 400+ satır (service, controller, routes, scheduler)
- **Endpoints**: 7 API endpoint
- **Features**: 11 özellik
- **Dependencies**: node-cron
- **Security**: SUPER_ADMIN only

## Sonuç

✅ **Backup & Restore System tamamlandı!**

**Özellikler:**
- ✅ Manuel ve otomatik backup
- ✅ Full ve table-specific backup
- ✅ Restore functionality
- ✅ Scheduled daily backups
- ✅ Automatic cleanup
- ✅ Health monitoring
- ✅ Statistics & management

**Güvenlik:**
- ✅ Authentication required
- ✅ SUPER_ADMIN only
- ✅ Secure pg_dump usage

**Production Ready:**
- ✅ Configurable schedules
- ✅ Error handling
- ✅ Logging
- ✅ Graceful shutdown

**Next Steps:**
1. Cloud storage integration
2. Email notifications
3. Backup encryption
4. UI for backup management
