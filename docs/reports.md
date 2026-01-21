# Excel & PDF Raporlama Sistemi

## 📊 Genel Bakış

DOA WhatsApp Manager artık **ExcelJS** ve **PDFKit** kullanarak otomatik rapor üretebilmektedir:

- ✅ Mesaj raporları (Excel & PDF) - n8n'den gelen mesajlar
- ✅ Müşteri raporları (Excel)
- ✅ Ödeme raporları (Excel & PDF)
- ✅ Abonelik raporları (Excel)
- ✅ Tarih aralığı filtreleme
- ✅ Kullanıcıya özel raporlar
- ✅ Özet istatistikler
- ✅ Tek tıkla indirme

**Not:** Mesaj raporları sadece n8n webhook'undan panele kaydedilen mesajları içerir (görüntüleme amaçlı).

## 🏗️ Mimari

### Reports Service

**Dosya:** `/backend/src/modules/reports/reports.service.ts`

#### Temel Metodlar

```typescript
// JSON Raporları
getMessagesReport(filters): Promise<{messages, stats}>
getCustomersReport(filters): Promise<{customers, stats}>
getPaymentsReport(filters): Promise<{payments, stats}>
getSubscriptionsReport(filters): Promise<{subscriptions, stats}>

// Excel Export
exportMessagesToExcel(filters): Promise<Buffer>
exportCustomersToExcel(filters): Promise<Buffer>
exportPaymentsToExcel(filters): Promise<Buffer>
exportSubscriptionsToExcel(filters): Promise<Buffer>

// PDF Export
exportMessagesToPDF(filters): Promise<Buffer>
exportPaymentsToPDF(filters): Promise<Buffer>
```

#### Filtreler

```typescript
interface ReportFilters {
  userId?: string;         // Kullanıcıya özel
  startDate?: Date;        // Başlangıç tarihi
  endDate?: Date;          // Bitiş tarihi
  status?: string;         // Durum (ACTIVE, CANCELLED, vb.)
  direction?: MessageDirection; // INBOUND/OUTBOUND
  customerPhone?: string;  // Telefon numarası
}
```

### Reports Controller

**Dosya:** `/backend/src/modules/reports/reports.controller.ts`

#### Endpoints

**JSON Raporları:**
- `GET /api/reports/messages` - Mesaj raporu
- `GET /api/reports/customers` - Müşteri raporu
- `GET /api/reports/payments` - Ödeme raporu
- `GET /api/reports/subscriptions` - Abonelik raporu

**Excel Export:**
- `GET /api/reports/messages/excel`
- `GET /api/reports/customers/excel`
- `GET /api/reports/payments/excel`
- `GET /api/reports/subscriptions/excel`

**PDF Export:**
- `GET /api/reports/messages/pdf`
- `GET /api/reports/payments/pdf`

### Reports Routes

**Dosya:** `/backend/src/modules/reports/reports.routes.ts`

Tüm route'lar `authenticate` middleware ile korunmaktadır.

## 📄 Rapor Türleri

### 1. Mesaj Raporları

#### JSON Response
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "direction": "INBOUND",
        "customerName": "Ahmet Yılmaz",
        "customerPhone": "+905551234567",
        "messageContent": "Merhaba",
        "messageType": "text",
        "timestamp": "2026-01-21T10:30:00Z",
        "readStatus": false,
        "user": {
          "companyName": "ABC Ltd.",
          "fullName": "Mehmet Demir",
          "email": "user@example.com"
        }
      }
    ],
    "stats": {
      "total": 150,
      "inbound": 80,
      "outbound": 70,
      "read": 120,
      "unread": 30
    }
  }
}
```

#### Excel Format
- **Özet Sayfası:** İstatistikler (toplam, gelen, giden, okundu, okunmadı)
- **Mesajlar Sayfası:** Tüm mesaj detayları (tarih, kullanıcı, yön, müşteri, telefon, mesaj, tür, durum)
- **Özellikler:** 
  - Mor gradient header (#4F46E5)
  - Auto-filter aktif
  - Tarih formatı: Türkçe (tr-TR)

#### PDF Format
- **Header:** Mesaj Raporu başlığı + rapor tarihi
- **Özet İstatistikler:** Box formatında temel metrikler
- **Mesaj Detayları:** İlk 30 mesaj (sayfa sınırı)
- **Footer:** DOA branding
- **Format:** A4 boyut, 50pt margin

### 2. Müşteri Raporları

#### JSON Response
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid",
        "name": "Ayşe Kaya",
        "phone": "+905559876543",
        "email": "ayse@example.com",
        "status": "ACTIVE",
        "notes": "VIP müşteri",
        "createdAt": "2026-01-15T08:00:00Z",
        "user": {
          "companyName": "XYZ A.Ş."
        },
        "_count": {
          "messages": 45
        }
      }
    ],
    "stats": {
      "total": 200,
      "active": 180,
      "inactive": 20,
      "totalMessages": 3500
    }
  }
}
```

#### Excel Format
- **Özet:** Toplam müşteri, aktif, pasif, toplam mesaj sayısı
- **Detay:** Kayıt tarihi, kullanıcı, müşteri adı, telefon, email, mesaj sayısı, durum, notlar
- **Header Rengi:** Yeşil (#10B981)

### 3. Ödeme Raporları

#### JSON Response
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "amount": 299.99,
        "paymentDate": "2026-01-20T12:00:00Z",
        "paymentMethod": "Kredi Kartı",
        "transactionId": "TRX123456",
        "notes": "Premium plan yenileme",
        "user": {
          "companyName": "Tech Corp",
          "email": "admin@techcorp.com"
        }
      }
    ],
    "stats": {
      "total": 50,
      "totalAmount": 14999.50,
      "averageAmount": 299.99,
      "byMethod": {
        "Kredi Kartı": 35,
        "Havale": 15
      }
    }
  }
}
```

#### Excel Format
- **Özet:** Toplam ödeme, toplam tutar, ortalama tutar
- **Detay:** Ödeme tarihi, kullanıcı, tutar, yöntem, işlem no, notlar
- **Header Rengi:** Kırmızı (#EF4444)
- **Para Formatı:** `299.99 TRY`

#### PDF Format
- **Özet:** Toplam, toplam tutar, ortalama
- **Detay:** Her ödeme kartı formatında (tarih, kullanıcı, tutar, yöntem, işlem no)

### 4. Abonelik Raporları

#### JSON Response
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "uuid",
        "planName": "Premium Plan",
        "price": 299.99,
        "startDate": "2026-01-01T00:00:00Z",
        "endDate": "2026-02-01T00:00:00Z",
        "status": "ACTIVE",
        "user": {
          "companyName": "StartupX"
        }
      }
    ],
    "stats": {
      "total": 100,
      "active": 85,
      "cancelled": 15,
      "expired": 0,
      "expiringSoon": 5,
      "totalRevenue": 25499.15
    }
  }
}
```

#### Excel Format
- **Özet:** Toplam, aktif, iptal, dolmuş, yakında dolacak (7 gün), toplam gelir
- **Detay:** Başlangıç, bitiş, kullanıcı, plan, fiyat, durum, kalan gün
- **Header Rengi:** Turuncu (#F59E0B)
- **Kalan Gün Hesabı:** Otomatik (bugüne göre)

## 🔗 API Kullanımı

### Temel Kullanım

```bash
# Tüm mesajları JSON olarak al
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/reports/messages

# Son 7 günün mesajlarını Excel olarak indir
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/reports/messages/excel?startDate=2026-01-14&endDate=2026-01-21" \
  -o mesaj-raporu.xlsx

# Belirli kullanıcının ödeme raporunu PDF olarak indir
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/reports/payments/pdf?userId=user-uuid" \
  -o odeme-raporu.pdf
```

### Query Parameters

**Tarih Filtreleri:**
```
?startDate=2026-01-01&endDate=2026-01-31
```

**Kullanıcı Filtresi:**
```
?userId=uuid-here
```

**Yön Filtresi (Mesajlar):**
```
?direction=INBOUND
```

**Durum Filtresi (Abonelikler):**
```
?status=ACTIVE
```

**Telefon Filtresi (Mesajlar):**
```
?customerPhone=+905551234567
```

**Kombine:**
```
?userId=uuid&startDate=2026-01-01&endDate=2026-01-31&direction=INBOUND
```

## 🎨 Frontend Entegrasyonu

### Raporlar Dropdown

**Lokasyon:** [client.html](client.html) header'da

```html
<div class="dropdown">
  <button class="btn-secondary" id="reportsDropdownBtn">
    📊 Raporlar ▼
  </button>
  <div class="dropdown-menu" id="reportsDropdownMenu">
    <a href="#" onclick="exportReport('messages', 'excel')">📄 Mesajlar (Excel)</a>
    <a href="#" onclick="exportReport('messages', 'pdf')">📑 Mesajlar (PDF)</a>
    <a href="#" onclick="exportReport('customers', 'excel')">👥 Müşteriler (Excel)</a>
    <a href="#" onclick="exportReport('payments', 'excel')">💳 Ödemeler (Excel)</a>
    <a href="#" onclick="exportReport('payments', 'pdf')">💳 Ödemeler (PDF)</a>
    <a href="#" onclick="exportReport('subscriptions', 'excel')">📅 Abonelikler (Excel)</a>
  </div>
</div>
```

### JavaScript API

**Dosya:** [assets/js/panel/reports.js](assets/js/panel/reports.js)

```javascript
// Rapor export fonksiyonu
async function exportReport(type, format) {
  // type: 'messages', 'customers', 'payments', 'subscriptions'
  // format: 'excel', 'pdf'
  
  // Fetch report with auth token
  // Download as file
  // Show success notification
}
```

**Kullanım:**
```javascript
exportReport('messages', 'excel');  // Mesaj Excel indir
exportReport('payments', 'pdf');    // Ödeme PDF indir
```

## 📊 Excel Özellikleri

### Workbook Properties
```typescript
workbook.creator = 'DOA WhatsApp Manager';
workbook.created = new Date();
```

### Sheet Yapısı
- **Özet Sayfası:** İstatistikler tablosu
- **Detay Sayfası:** Tam veri seti

### Styling
- **Header Row:** Bold, beyaz yazı, renkli arka plan
- **Auto-filter:** Aktif (tüm kolonlar)
- **Column Width:** Otomatik ayarlı (içeriğe göre)

### Color Scheme
- Mesajlar: Mor (#4F46E5)
- Müşteriler: Yeşil (#10B981)
- Ödemeler: Kırmızı (#EF4444)
- Abonelikler: Turuncu (#F59E0B)

## 📑 PDF Özellikleri

### Document Settings
```typescript
new PDFDocument({
  margin: 50,
  size: 'A4'
})
```

### Layout
- **Header:** 20pt, Bold, Center aligned
- **Sub-header:** 10pt, Center aligned (rapor tarihi)
- **Stats Section:** 14pt başlık, 10pt değerler
- **Details Section:** 12pt başlık, 8-10pt içerik
- **Footer:** 8pt, Center aligned

### Page Management
- Otomatik sayfa ekleme (currentY > 700)
- Her kayıt arası çizgi separatör
- İlk 30 kayıt (PDF boyut limiti)

## 🔒 Security

### Authentication
Tüm endpoints `authenticate` middleware ile korunmuştur:
```typescript
router.use(authenticate);
```

### Authorization
- Kullanıcılar sadece kendi verilerini görebilir
- Admin rolü tüm verilere erişebilir (gelecek özellik)

### Data Privacy
- Dosya adları tarih içerir (unique)
- Bearer token required
- CORS korumalı

## 🧪 Testing

### Manuel Test

#### 1. JSON Rapor Test
```bash
# Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.data.token')

# Mesaj raporu al
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/reports/messages | jq
```

#### 2. Excel Export Test
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/reports/messages/excel \
  -o test-mesaj-raporu.xlsx

# Dosyayı aç ve kontrol et
open test-mesaj-raporu.xlsx
```

#### 3. PDF Export Test
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/reports/payments/pdf \
  -o test-odeme-raporu.pdf

# Dosyayı aç ve kontrol et
open test-odeme-raporu.pdf
```

### Frontend Test

1. Login yap: http://localhost:5500/login.html
2. Client paneline git
3. Sağ üst köşede "📊 Raporlar" butonuna tıkla
4. İstediğin raporu seç
5. Dosya otomatik indirilmeli
6. Bildirim görünmeli: "✅ [Rapor Adı] başarıyla indirildi!"

## 🐛 Troubleshooting

### Issue: Excel dosyası açılmıyor

**Solutions:**
1. Buffer'ın doğru döndüğünden emin ol
2. Content-Type header'ı kontrol et: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
3. ExcelJS sürümünü kontrol et: `npm ls exceljs`
4. Dosya boyutunu kontrol et (büyük raporlar için limit artır)

### Issue: PDF bozuk görünüyor

**Solutions:**
1. PDFKit font yüklemesini kontrol et
2. Buffer chunks'ın doğru birleştirildiğinden emin ol
3. currentY sayfa sınırlarını aşmasın (700pt)
4. Türkçe karakterler için font embedding ekle

### Issue: "Unauthorized" hatası

**Solutions:**
1. Token'ın geçerli olduğunu kontrol et
2. Authorization header formatı: `Bearer TOKEN`
3. Token expire kontrolü yap
4. `authenticate` middleware'in route'da olduğunu doğrula

### Issue: Rapor boş geliyor

**Solutions:**
1. Database'de veri olduğunu kontrol et
2. Filter parametrelerini kontrol et
3. userId filter'ı doğru kullanıcı ID'si olmalı
4. Tarih formatını kontrol et: ISO 8601

## 📈 Performance

### Excel Generation
- **Küçük rapor** (<1000 satır): ~500ms
- **Orta rapor** (1000-5000 satır): ~2s
- **Büyük rapor** (>5000 satır): ~5-10s

### PDF Generation
- **Küçük rapor** (<50 kayıt): ~300ms
- **Orta rapor** (50-100 kayıt): ~800ms
- **Not:** PDF'de sayfa limiti var (ilk 30 mesaj)

### Optimization Tips
1. Pagination ekle (limit/offset)
2. Date range zorunlu yap (max 90 gün)
3. Background job sistemi (Bull + Redis)
4. Cache mekanizması (aynı filtreler için)

## 🚀 Future Enhancements

### Planned Features

- [ ] **Scheduled Reports** - Otomatik günlük/haftalık raporlar
- [ ] **Email Reports** - Raporu email ile gönder
- [ ] **Custom Templates** - Kullanıcı özel rapor şablonları
- [ ] **Charts & Graphs** - Excel/PDF'de grafik desteği
- [ ] **Report History** - Oluşturulan raporları kaydet
- [ ] **Async Generation** - Büyük raporlar için background processing
- [ ] **CSV Export** - Basit CSV formatı
- [ ] **Report Builder UI** - Drag & drop rapor oluşturucu
- [ ] **Multi-language** - Rapor dili seçimi
- [ ] **Custom Branding** - Logo, renk özelleştirme

### Scheduled Reports Implementation

```typescript
// Cron job ile otomatik rapor gönderimi
import cron from 'node-cron';

// Her Pazartesi 09:00'da haftalık rapor
cron.schedule('0 9 * * 1', async () => {
  const users = await prisma.user.findMany({ where: { role: 'admin' } });
  
  for (const user of users) {
    const report = await reportsService.exportMessagesToExcel({
      userId: user.id,
      startDate: getLastWeekStart(),
      endDate: getLastWeekEnd(),
    });
    
    await emailService.sendReportEmail({
      to: user.email,
      subject: 'Haftalık Mesaj Raporu',
      attachment: report,
    });
  }
});
```

## 📞 Support

Raporlama sistemi ile ilgili sorularınız için:
- GitHub Issues: https://github.com/MustafaBasol/DOA/issues
- Email: dev@autoviseo.com

---

**Son Güncelleme:** 21 Ocak 2026  
**Versiyon:** 2.0.0  
**Durum:** ✅ Production Ready
