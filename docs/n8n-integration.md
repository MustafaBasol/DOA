# n8n WhatsApp Entegrasyonu - Kullanım Kılavuzu

## 📡 Genel Bakış

DOA WhatsApp Manager **direkt WhatsApp API bağlantısı kullanmaz**. Tüm WhatsApp iletişimi **n8n workflow** üzerinden yönetilir ve panel sadece mesajları görüntüler.

### Veri Akış Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                  WhatsApp (Müşteri)                         │
│           ↓ Mesaj Gönderir                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     n8n Workflow                            │
│  • WhatsApp Trigger Node (mesaj alır)                      │
│  • Chatbot Logic (otomatik yanıt)                          │
│  • HTTP Request Node (webhook → Panel)                     │
│  • WhatsApp Send Node (müşteriye yanıt)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Webhook - Tek Yönlü)
┌─────────────────────────────────────────────────────────────┐
│                  DOA Panel Backend                          │
│  • Webhook receiver (/api/webhooks/n8n/message)            │
│  • Mesajı veritabanına kaydet                               │
│  • Socket.IO ile frontend'i güncelle                        │
│  • Email bildirimi gönder (opsiyonel)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               DOA Panel Frontend (Client)                   │
│  • Mesajları listele (READ-ONLY)                            │
│  • Konuşma geçmişi görüntüle                                │
│  • Müşteri bilgilerini gör                                  │
│  ❌ MESAJ GÖNDERİMİ YOKTUR                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚫 Önemli Kısıtlamalar

### Panel'den Yapılamayan İşlemler
1. ❌ WhatsApp mesaj gönderimi
2. ❌ WhatsApp durumu güncelleme
3. ❌ WhatsApp medya yükleme
4. ❌ WhatsApp grubu yönetimi
5. ❌ WhatsApp iletişim ekleme/silme

### Panel'in Yapabilecekleri
1. ✅ n8n'den gelen mesajları görüntüleme
2. ✅ Müşteri konuşma geçmişini izleme
3. ✅ Mesaj istatistiklerini görme
4. ✅ Okundu işareti koyma (sadece panel içinde)
5. ✅ Excel/PDF rapor indirme

## 🔧 n8n Workflow Kurulumu

### 1. WhatsApp Trigger Node

n8n workflow'unuzda WhatsApp mesaj tetikleyicisi ekleyin:

```json
{
  "nodes": [
    {
      "name": "WhatsApp Trigger",
      "type": "n8n-nodes-base.whatsAppTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "whatsapp-webhook-id"
    }
  ]
}
```

### 2. Chatbot Logic Node

Gelen mesajı işleyin ve otomatik yanıt hazırlayın:

```javascript
// Function Node
const incomingMessage = $input.item.json.body;
const customerPhone = $input.item.json.from;
const customerName = $input.item.json.contact?.name || 'Müşteri';

// Basit bot logic
let response = 'Merhaba! Size nasıl yardımcı olabilirim?';

if (incomingMessage.toLowerCase().includes('fiyat')) {
  response = 'Fiyat bilgisi için: https://autoviseo.com/pricing';
} else if (incomingMessage.toLowerCase().includes('destek')) {
  response = 'Destek ekibimiz en kısa sürede size dönüş yapacaktır.';
}

return {
  response: response,
  customerPhone: customerPhone,
  customerName: customerName,
  originalMessage: incomingMessage
};
```

### 3. HTTP Request Node (Panel Webhook)

Mesajı DOA Panel'e gönderin:

```json
{
  "name": "Send to DOA Panel",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4,
  "position": [650, 300],
  "parameters": {
    "method": "POST",
    "url": "https://your-panel-domain.com/api/webhooks/n8n/message",
    "authentication": "none",
    "options": {},
    "headerParameters": {
      "parameters": [
        {
          "name": "X-N8N-Secret",
          "value": "={{ $env.N8N_WEBHOOK_SECRET }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "bodyParameters": {
      "parameters": [
        {
          "name": "user_id",
          "value": "={{ $json.user_id }}"
        },
        {
          "name": "n8n_message_id",
          "value": "={{ $json.messageId }}"
        },
        {
          "name": "direction",
          "value": "INBOUND"
        },
        {
          "name": "from_number",
          "value": "={{ $json.from }}"
        },
        {
          "name": "to_number",
          "value": "={{ $json.to }}"
        },
        {
          "name": "customer_name",
          "value": "={{ $json.contact.name }}"
        },
        {
          "name": "customer_phone",
          "value": "={{ $json.from }}"
        },
        {
          "name": "message_content",
          "value": "={{ $json.body }}"
        },
        {
          "name": "message_type",
          "value": "text"
        },
        {
          "name": "timestamp",
          "value": "={{ $json.timestamp }}"
        }
      ]
    }
  }
}
```

### 4. WhatsApp Send Node (Otomatik Yanıt)

Bot yanıtını müşteriye gönderin:

```json
{
  "name": "Send WhatsApp Reply",
  "type": "n8n-nodes-base.whatsApp",
  "typeVersion": 1,
  "position": [950, 300],
  "parameters": {
    "operation": "sendMessage",
    "to": "={{ $json.customerPhone }}",
    "message": "={{ $json.response }}"
  }
}
```

## 🔐 Güvenlik Yapılandırması

### Environment Variables

n8n workflow'unuzda şu environment variable'ları tanımlayın:

```bash
# n8n Environment Variables
N8N_WEBHOOK_SECRET=super-secret-token-12345
PANEL_API_URL=https://your-panel-domain.com
USER_ID_MAPPING={"phone1":"uuid1","phone2":"uuid2"}
```

### Secret Token Doğrulama

DOA Panel backend'inde webhook güvenliği:

```typescript
// backend/src/middleware/webhookAuth.ts
export const verifyN8nWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const secret = req.headers['x-n8n-secret'];
  
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Invalid webhook secret' 
    });
  }
  
  next();
};
```

## 📞 User ID Mapping

Her müşterinin WhatsApp numarası ile panel user_id'sini eşleştirmeniz gerekir.

### Çözüm 1: Database Column

```sql
-- users tablosuna whatsapp_number kolonu ekle
ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(50) UNIQUE;

-- Kullanıcı oluştururken WhatsApp numarasını kaydet
INSERT INTO users (id, email, whatsapp_number, ...)
VALUES ('uuid-123', 'client@example.com', '+905551234567', ...);
```

Backend'de eşleştirme:

```typescript
// webhook controller
const user = await prisma.user.findUnique({
  where: { whatsapp_number: req.body.to_number }
});

if (!user) {
  return res.status(404).json({ 
    error: 'User not found for this WhatsApp number' 
  });
}
```

### Çözüm 2: Lookup Table

```sql
-- Ayrı mapping tablosu
CREATE TABLE whatsapp_user_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  whatsapp_number VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mapping ekle
INSERT INTO whatsapp_user_mapping (user_id, whatsapp_number)
VALUES ('uuid-123', '+905551234567');
```

### Çözüm 3: n8n Environment Variable

Küçük müşteri sayısı için n8n'de mapping:

```javascript
// n8n Function Node
const phoneToUserMapping = {
  '+905551234567': 'uuid-user-1',
  '+905559876543': 'uuid-user-2',
  '+905551112233': 'uuid-user-3'
};

const userId = phoneToUserMapping[$json.to];

if (!userId) {
  throw new Error('User not found for this number');
}

return { ...($json), user_id: userId };
```

## 🧪 Test ve Debug

### 1. Webhook Test

n8n'den test webhook gönder:

```bash
curl -X POST https://your-panel.com/api/webhooks/n8n/message \
  -H "Content-Type: application/json" \
  -H "X-N8N-Secret: your-secret-token" \
  -d '{
    "user_id": "test-user-uuid",
    "n8n_message_id": "test-msg-123",
    "direction": "INBOUND",
    "from_number": "+905551234567",
    "to_number": "+905559876543",
    "customer_name": "Test User",
    "customer_phone": "+905551234567",
    "message_content": "Test mesajı",
    "message_type": "text",
    "timestamp": "2026-01-21T10:00:00Z"
  }'
```

### 2. n8n Workflow Test

n8n workflow'unda "Test Workflow" butonuna tıklayın ve gerçek WhatsApp numaranızdan test mesajı gönderin.

### 3. Panel'de Kontrol

- Client paneline giriş yapın
- Mesajlar sekmesine gidin
- Test mesajının görünüp görünmediğini kontrol edin

## 📊 İstatistikler ve Monitoring

### Panelde Görülen Metrikler

1. **Toplam Mesaj:** n8n'den gelen tüm mesajlar
2. **Gelen Mesaj:** INBOUND mesajlar (müşteriden)
3. **Okunmamış:** Panel'de okunmamış mesajlar
4. **Son 24 Saat:** Son 24 saatte gelen mesaj sayısı

### Backend Logging

```typescript
// backend/src/modules/webhooks/webhooks.controller.ts
console.log('📨 Webhook received from n8n:', {
  userId: data.user_id,
  messageId: data.n8n_message_id,
  direction: data.direction,
  customerPhone: data.customer_phone,
  timestamp: data.timestamp
});
```

## 🔄 Giden Mesajları Panele Kaydetme (Opsiyonel)

Eğer n8n'den gönderilen mesajları da panelde görmek isterseniz:

### n8n Workflow'a İkinci Webhook Ekle

WhatsApp Send Node'dan sonra:

```json
{
  "name": "Log Outbound Message to Panel",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4,
  "position": [1150, 300],
  "parameters": {
    "method": "POST",
    "url": "https://your-panel.com/api/webhooks/n8n/message",
    "headerParameters": {
      "parameters": [
        {
          "name": "X-N8N-Secret",
          "value": "={{ $env.N8N_WEBHOOK_SECRET }}"
        }
      ]
    },
    "bodyParameters": {
      "parameters": [
        {
          "name": "user_id",
          "value": "={{ $json.user_id }}"
        },
        {
          "name": "direction",
          "value": "OUTBOUND"
        },
        {
          "name": "from_number",
          "value": "={{ $json.to }}"
        },
        {
          "name": "to_number",
          "value": "={{ $json.from }}"
        },
        {
          "name": "customer_name",
          "value": "Bot"
        },
        {
          "name": "customer_phone",
          "value": "={{ $json.from }}"
        },
        {
          "name": "message_content",
          "value": "={{ $json.response }}"
        },
        {
          "name": "message_type",
          "value": "text"
        },
        {
          "name": "timestamp",
          "value": "={{ $now }}"
        }
      ]
    }
  }
}
```

## 🚨 Sorun Giderme

### Problem: Mesajlar panelde görünmüyor

**Kontrol Listesi:**
1. ✅ n8n webhook URL'i doğru mu?
2. ✅ X-N8N-Secret header gönderiliyor mu?
3. ✅ user_id eşleştirmesi doğru mu?
4. ✅ Backend çalışıyor mu? (health check: /api/health)
5. ✅ Database bağlantısı var mı?

**Debug:**
```bash
# Backend logs'u izle
npm run dev

# n8n execution logs'u kontrol et
# n8n workflow'unda "Executions" sekmesi
```

### Problem: "Unauthorized" hatası

**Çözüm:**
```bash
# .env dosyasında secret'ı kontrol et
N8N_WEBHOOK_SECRET=same-secret-in-n8n-and-backend

# n8n'de environment variable'ı kontrol et
echo $N8N_WEBHOOK_SECRET
```

### Problem: "User not found" hatası

**Çözüm:**
```sql
-- WhatsApp numarası kayıtlı mı kontrol et
SELECT id, email, whatsapp_number FROM users WHERE whatsapp_number = '+905551234567';

-- Yoksa ekle
UPDATE users SET whatsapp_number = '+905551234567' WHERE id = 'user-uuid';
```

## 📚 İlgili Dokümantasyon

- [Architecture & Roadmap](/docs/architecture-roadmap.md)
- [Email Notifications](/docs/email-notifications.md)
- [Reports System](/docs/reports.md)
- [n8n Official Docs](https://docs.n8n.io/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

**Son Güncelleme:** 21 Ocak 2026  
**Versiyon:** 1.0.0  
**Durum:** ✅ Production Ready
