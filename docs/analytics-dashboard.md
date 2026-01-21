# Analytics Dashboard Documentation

## Genel Bakış

Analytics Dashboard, CRM sistemindeki mesajlaşma, müşteri ve gelir verilerini görselleştiren kapsamlı bir analiz platformudur. Real-time metrikler, grafikler ve karşılaştırmalı analizler sunar.

## Özellikler

### 📊 Genel İstatistikler
- Toplam mesaj sayısı (gelen/giden)
- Müşteri metrikleri (toplam, yeni, aktif)
- Gelir analizi (toplam, işlem sayısı, ortalama)

### 📈 Grafikler
1. **Mesaj Trendleri**: Gelen ve giden mesajların zaman içindeki değişimi
2. **Müşteri Büyümesi**: Yeni müşteri kazanımı ve kümülatif artış
3. **Gelir Analizi**: Günlük gelir ve işlem sayısı
4. **En Aktif Müşteriler**: Mesaj sayısına göre sıralama
5. **Yoğun Saatler**: 24 saatlik mesajlaşma dağılımı

## API Endpoints

### 1. Genel İstatistikler
```
GET /api/analytics/overview
```

**Query Parameters:**
- `period`: Preset zaman aralığı (today, yesterday, last7days, last30days, thisMonth, lastMonth, thisYear)
- `startDate`: Özel başlangıç tarihi (YYYY-MM-DD)
- `endDate`: Özel bitiş tarihi (YYYY-MM-DD)
- `userId`: (Opsiyonel) Belirli müşteri için filtreleme

**Response:**
```json
{
  "totalMessages": 150,
  "inboundMessages": 90,
  "outboundMessages": 60,
  "totalCustomers": 45,
  "newCustomers": 5,
  "activeCustomers": 12,
  "totalRevenue": 15000,
  "totalPayments": 30,
  "averagePayment": 500
}
```

### 2. Mesaj Trendleri
```
GET /api/analytics/message-trends
```

**Query Parameters:** Yukarıdaki ile aynı

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "inbound": 45,
    "outbound": 32,
    "total": 77
  }
]
```

### 3. Müşteri Büyümesi
```
GET /api/analytics/customer-growth
```

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "new": 3,
    "cumulative": 48
  }
]
```

### 4. Gelir Analizi
```
GET /api/analytics/revenue
```

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "amount": 2500,
    "count": 5
  }
]
```

### 5. En Aktif Müşteriler
```
GET /api/analytics/top-customers
```

**Query Parameters:**
- `limit`: Kaç müşteri gösterileceği (default: 10)
- Diğer parametreler yukarıdaki ile aynı

**Response:**
```json
[
  {
    "userId": 123,
    "name": "Ahmet Yılmaz",
    "phoneNumber": "+905551234567",
    "messageCount": 87,
    "lastActivity": "2024-01-15T14:30:00Z"
  }
]
```

### 6. Yoğun Saatler
```
GET /api/analytics/peak-hours
```

**Response:**
```json
[
  {
    "hour": 14,
    "count": 25
  },
  {
    "hour": 15,
    "count": 32
  }
]
```

### 7. Karşılaştırmalı Analiz
```
GET /api/analytics/comparative
```

**Response:**
```json
{
  "current": {
    "totalMessages": 150,
    "totalRevenue": 15000,
    "newCustomers": 5
  },
  "previous": {
    "totalMessages": 120,
    "totalRevenue": 12000,
    "newCustomers": 3
  },
  "changes": {
    "messages": 25.0,
    "revenue": 25.0,
    "customers": 66.67
  }
}
```

## Frontend Kullanımı

### Chart.js Entegrasyonu

```javascript
import AnalyticsDashboard from '/assets/js/panel/analytics.js';

// Initialize dashboard
const dashboard = new AnalyticsDashboard();
await dashboard.init();

// Refresh data
dashboard.loadDashboard();

// Cleanup
dashboard.destroy();
```

### Zaman Aralığı Seçimi

HTML select element ile:
```html
<select id="periodSelector">
  <option value="today">Bugün</option>
  <option value="yesterday">Dün</option>
  <option value="last7days">Son 7 Gün</option>
  <option value="last30days">Son 30 Gün</option>
  <option value="thisMonth">Bu Ay</option>
  <option value="lastMonth">Geçen Ay</option>
  <option value="thisYear">Bu Yıl</option>
  <option value="custom">Özel Tarih</option>
</select>
```

### Özel Tarih Aralığı

```html
<input type="date" id="startDate">
<input type="date" id="endDate">
<button id="applyDateRange">Uygula</button>
```

## Rol Bazlı Erişim

### CLIENT Rolü
- Sadece kendi verilerine erişebilir
- `userId` parametresi otomatik olarak kendi ID'si ile filtrelenir

### ADMIN Rolü
- Tüm müşteri verilerine erişebilir
- `userId` parametresi ile spesifik müşteri seçebilir
- `userId` belirtilmezse tüm veriler döner

## Performans Optimizasyonu

### Backend
- Paralel sorgular: `Promise.all()` ile çoklu aggregation
- Index'ler: `createdAt`, `userId` kolonlarında
- Pagination: Top customers için limit kullanımı

### Frontend
- Chart.js canvas rendering
- Lazy loading: Sadece görünür sayfada yükleme
- Chart destroy: Memory leak önleme

## Örnek Kullanım Senaryoları

### 1. Günlük Performans Takibi
```javascript
// Bugünün verilerini çek
const params = new URLSearchParams({ period: 'today' });
const response = await fetch(`/api/analytics/overview?${params}`);
const data = await response.json();
console.log(`Bugün ${data.totalMessages} mesaj gönderildi`);
```

### 2. Aylık Gelir Raporu
```javascript
// Bu ayın gelir analizi
const params = new URLSearchParams({ period: 'thisMonth' });
const response = await fetch(`/api/analytics/revenue?${params}`);
const data = await response.json();
const total = data.reduce((sum, d) => sum + d.amount, 0);
console.log(`Bu ay toplam gelir: ${total} ₺`);
```

### 3. Müşteri Aktivitesi
```javascript
// Son 7 günde en aktif müşteriler
const params = new URLSearchParams({ 
  period: 'last7days',
  limit: 5
});
const response = await fetch(`/api/analytics/top-customers?${params}`);
const data = await response.json();
data.forEach(customer => {
  console.log(`${customer.name}: ${customer.messageCount} mesaj`);
});
```

## Troubleshooting

### Grafikler Yüklenmiyor
1. Chart.js CDN linkinin çalıştığını kontrol edin
2. Browser console'da hata mesajları olup olmadığına bakın
3. API endpoint'lerinin 200 OK döndüğünü verify edin

### Veri Görünmüyor
1. Token'in geçerli olduğundan emin olun
2. Rol izinlerini kontrol edin (CLIENT vs ADMIN)
3. Seçilen tarih aralığında gerçekten veri olup olmadığını kontrol edin

### Performance Sorunları
1. Tarih aralığını daraltın (örn: last30days yerine last7days)
2. Top customers limit değerini azaltın
3. Network tab'de API response sürelerini kontrol edin

## Gelecek Geliştirmeler

### v2.1 Planları
- [ ] Export to PDF/Excel
- [ ] Custom dashboard layouts
- [ ] Real-time updates via WebSocket
- [ ] Alert/notification system
- [ ] Goal tracking
- [ ] Predictive analytics

### v2.2 Planları
- [ ] Multi-metric comparison
- [ ] Heat maps
- [ ] Funnel analysis
- [ ] Cohort analysis
- [ ] A/B testing insights

## Katkıda Bulunma

Analytics özelliği eklemek için:

1. Service metodunu ekle: `analytics.service.ts`
2. Controller handler'ı ekle: `analytics.controller.ts`
3. Route tanımla: `analytics.routes.ts`
4. Frontend chart komponenti yaz: `analytics.js`
5. HTML'e canvas ekle: `analytics.html`
6. Dokümante et: bu dosya

## Lisans

Bu proje DOA CRM sisteminin bir parçasıdır.
