# Advanced Search & Filters Documentation

## Genel Bakış

Advanced Search & Filters, CRM sisteminde tüm varlıklar (mesajlar, müşteriler, ödemeler, abonelikler) üzerinde güçlü filtreleme ve arama yetenekleri sağlar. Kullanıcılar karmaşık sorgular oluşturabilir, aramaları kaydedebilir ve daha sonra yeniden kullanabilir.

## Özellikler

### 🔍 Arama Türleri

1. **Quick Search**: Tek alan veya tüm alanlarda hızlı arama
2. **Advanced Search**: Çok alanl, çok operatörlü karmaşık sorgular
3. **Saved Searches**: Sık kullanılan aramaları kaydetme ve yeniden kullanma

### 📊 Desteklenen Varlıklar

- **MESSAGES**: WhatsApp mesajları
- **CUSTOMERS**: Müşteriler (mesajlardan türetilen)
- **PAYMENTS**: Ödeme kayıtları
- **SUBSCRIPTIONS**: Abonelik planları

### 🔧 Operatörler

| Operatör | Açıklama | Desteklenen Tipler |
|----------|----------|-------------------|
| `equals` | Tam eşleşme | string, number, enum, boolean |
| `contains` | İçerir | string |
| `startsWith` | İle başlar | string |
| `endsWith` | İle biter | string |
| `gt` | Büyüktür | number, date, datetime |
| `gte` | Büyük veya eşit | number, date, datetime |
| `lt` | Küçüktür | number, date, datetime |
| `lte` | Küçük veya eşit | number, date, datetime |
| `in` | İçinde (liste) | string, enum |
| `between` | Arasında | number, date, datetime |

## API Endpoints

### 1. Advanced Search
```
POST /api/search
```

**Request Body:**
```json
{
  "entity": "MESSAGES",
  "filters": [
    {
      "field": "messageContent",
      "operator": "contains",
      "value": "merhaba"
    },
    {
      "field": "timestamp",
      "operator": "between",
      "value": ["2024-01-01", "2024-01-31"]
    }
  ],
  "sortBy": "timestamp",
  "sortOrder": "desc",
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### 2. Quick Search
```
GET /api/search/quick?entity=MESSAGES&q=test&field=all&page=1&limit=20
```

**Query Parameters:**
- `entity`: Arama yapılacak varlık (required)
- `q`: Arama terimi (required)
- `field`: Arama yapılacak alan (default: 'all')
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20)

**Response:** Advanced Search ile aynı format

### 3. Get Search Fields
```
GET /api/search/fields/:entity
```

**Response:**
```json
{
  "entity": "MESSAGES",
  "fields": [
    {
      "name": "messageContent",
      "label": "Mesaj İçeriği",
      "type": "string"
    },
    {
      "name": "timestamp",
      "label": "Tarih",
      "type": "datetime"
    }
  ],
  "operators": [
    {
      "value": "equals",
      "label": "Eşittir",
      "types": ["string", "number", "enum", "boolean"]
    }
  ]
}
```

### 4. Create Saved Search
```
POST /api/search/saved
```

**Request Body:**
```json
{
  "name": "Okunmamış Mesajlar",
  "description": "Son 7 günün okunmamış mesajları",
  "entity": "MESSAGES",
  "filters": [
    {
      "field": "readStatus",
      "operator": "equals",
      "value": false
    },
    {
      "field": "timestamp",
      "operator": "gte",
      "value": "2024-01-15"
    }
  ],
  "isDefault": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Okunmamış Mesajlar",
  "description": "Son 7 günün okunmamış mesajları",
  "entity": "MESSAGES",
  "filters": [...],
  "isDefault": false,
  "createdAt": "2024-01-21T...",
  "updatedAt": "2024-01-21T..."
}
```

### 5. Get Saved Searches
```
GET /api/search/saved?entity=MESSAGES
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Okunmamış Mesajlar",
    "description": "...",
    "entity": "MESSAGES",
    "filters": [...],
    "isDefault": false
  }
]
```

### 6. Get Saved Search by ID
```
GET /api/search/saved/:id
```

### 7. Update Saved Search
```
PATCH /api/search/saved/:id
```

**Request Body:**
```json
{
  "name": "Yeni İsim",
  "isDefault": true
}
```

### 8. Delete Saved Search
```
DELETE /api/search/saved/:id
```

### 9. Execute Saved Search
```
POST /api/search/saved/:id/execute
```

**Request Body:**
```json
{
  "page": 1,
  "limit": 20,
  "sortBy": "timestamp",
  "sortOrder": "desc"
}
```

## Frontend Kullanımı

### Initialization

```javascript
import AdvancedSearch from '/assets/js/panel/search.js';

const search = new AdvancedSearch('MESSAGES');
await search.init();
```

### Quick Search

```javascript
// HTML
<input id="quickSearchInput" type="text">
<select id="quickSearchField">
  <option value="all">Tüm Alanlar</option>
</select>
<button id="quickSearchBtn">Ara</button>

// JavaScript
search.quickSearch();
```

### Filter Builder

```javascript
// Add filter
search.addFilter();

// Remove filter
search.removeFilter(index);

// Clear all filters
search.clearFilters();

// Execute search
search.executeSearch();
```

### Saved Searches

```javascript
// Save current filters
search.saveSavedSearch({
  name: 'My Search',
  description: 'Description',
  isDefault: false,
  filters: search.filters
});

// Load saved search
search.loadSavedSearch(searchId);

// Execute saved search
search.executeSavedSearch(searchId);

// Delete saved search
search.deleteSavedSearch(searchId);
```

## Varlık Field Tanımları

### MESSAGES Fields

```javascript
{
  messageContent: { type: 'string', label: 'Mesaj İçeriği' },
  customerName: { type: 'string', label: 'Müşteri Adı' },
  customerPhone: { type: 'string', label: 'Telefon' },
  direction: { type: 'enum', options: ['INBOUND', 'OUTBOUND'] },
  messageType: { type: 'string', label: 'Tip' },
  readStatus: { type: 'boolean', label: 'Okundu' },
  timestamp: { type: 'datetime', label: 'Tarih' }
}
```

### CUSTOMERS Fields

```javascript
{
  name: { type: 'string', label: 'Ad' },
  phone: { type: 'string', label: 'Telefon' },
  messageCount: { type: 'number', label: 'Mesaj Sayısı' },
  lastActivity: { type: 'datetime', label: 'Son Aktivite' }
}
```

### PAYMENTS Fields

```javascript
{
  amount: { type: 'number', label: 'Tutar' },
  status: { type: 'enum', options: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
  paymentMethod: { type: 'string', label: 'Ödeme Yöntemi' },
  paymentDate: { type: 'date', label: 'Ödeme Tarihi' },
  currency: { type: 'string', label: 'Para Birimi' }
}
```

### SUBSCRIPTIONS Fields

```javascript
{
  planName: { type: 'string', label: 'Plan' },
  status: { type: 'enum', options: ['ACTIVE', 'SUSPENDED', 'CANCELLED'] },
  monthlyPrice: { type: 'number', label: 'Aylık Fiyat' },
  startDate: { type: 'date', label: 'Başlangıç' },
  endDate: { type: 'date', label: 'Bitiş' },
  autoRenew: { type: 'boolean', label: 'Otomatik Yenileme' }
}
```

## Örnek Kullanım Senaryoları

### 1. Belirli Tarih Aralığındaki Mesajlar

```json
{
  "entity": "MESSAGES",
  "filters": [
    {
      "field": "timestamp",
      "operator": "between",
      "value": ["2024-01-01T00:00:00", "2024-01-31T23:59:59"]
    }
  ]
}
```

### 2. 1000 TL Üzeri Ödemeler

```json
{
  "entity": "PAYMENTS",
  "filters": [
    {
      "field": "amount",
      "operator": "gte",
      "value": 1000
    },
    {
      "field": "status",
      "operator": "equals",
      "value": "COMPLETED"
    }
  ]
}
```

### 3. Aktif Müşteriler (Son 7 Gün)

```json
{
  "entity": "CUSTOMERS",
  "filters": [
    {
      "field": "lastActivity",
      "operator": "gte",
      "value": "2024-01-14"
    }
  ],
  "sortBy": "messageCount",
  "sortOrder": "desc"
}
```

### 4. İptal Edilmiş Abonelikler

```json
{
  "entity": "SUBSCRIPTIONS",
  "filters": [
    {
      "field": "status",
      "operator": "equals",
      "value": "CANCELLED"
    }
  ]
}
```

### 5. Belirli Kelime İçeren Mesajlar

```json
{
  "entity": "MESSAGES",
  "filters": [
    {
      "field": "messageContent",
      "operator": "contains",
      "value": "fiyat"
    },
    {
      "field": "direction",
      "operator": "equals",
      "value": "INBOUND"
    }
  ]
}
```

## Rol Bazlı Erişim

### CLIENT Rolü
- Sadece kendi verilerine erişebilir
- `userId` parametresi otomatik olarak eklenir
- Saved searches sadece kendi kayıtlarını gösterir

### ADMIN Rolü
- Tüm müşteri verilerine erişebilir
- `userId` filtresi kullanarak spesifik müşteri seçebilir
- Tüm kullanıcıların saved searches'lerini görebilir (kendi kayıtları)

## Performance İpuçları

### Backend Optimization
1. **Index Kullanımı**: Sık aranan alanlarda index
2. **Pagination**: Büyük sonuç setlerinde sayfalama kullan
3. **Field Selection**: Sadece gerekli alanları getir
4. **Query Caching**: Benzer sorguları cache'le

### Frontend Optimization
1. **Debounce**: Quick search'te kullanıcı yazmayı bitirene kadar bekle
2. **Virtual Scrolling**: Büyük liste için
3. **Result Caching**: Sayfa değişimlerinde cache kullan
4. **Lazy Loading**: Detayları talep üzerine yükle

## Troubleshooting

### Sonuç Bulunamıyor
1. Filter değerlerini kontrol edin
2. Operatörlerin alan tiplerine uygunluğunu doğrulayın
3. Between operatöründe array formatını kontrol edin
4. Case-sensitivity: contains/startsWith/endsWith case-insensitive

### Performans Sorunları
1. Limit değerini düşürün (default: 20)
2. Daha spesifik filtreler kullanın
3. Sayfalama kullanın
4. Index'leri kontrol edin

### Authorization Errors
1. Token'in geçerli olduğunu doğrulayın
2. CLIENT kullanıcısı başka kullanıcı verisine erişemez
3. Saved search sahibi ile giriş yapan kullanıcı aynı olmalı

## Gelecek Geliştirmeler

### v2.1 Planları
- [ ] Full-text search (PostgreSQL ts_vector)
- [ ] Regex pattern support
- [ ] Bulk operations on search results
- [ ] Export search results (Excel/PDF)
- [ ] Search result highlighting
- [ ] Advanced aggregations

### v2.2 Planları
- [ ] Search history tracking
- [ ] Collaborative searches (shared)
- [ ] Scheduled searches with notifications
- [ ] AI-powered search suggestions
- [ ] Natural language queries
- [ ] Visual query builder

## Katkıda Bulunma

Yeni search field eklemek için:

1. **Backend**: `search.controller.ts` içinde `getEntityFields()` metodunu güncelle
2. **Service**: Field için uygun mapping ekle
3. **Frontend**: Field selector'da göster
4. **Dokümante et**: Bu dosyayı güncelle

## Lisans

Bu proje DOA CRM sisteminin bir parçasıdır.
