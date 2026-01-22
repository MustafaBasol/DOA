# WhatsApp Template Messages

This guide explains how to create, manage, and send WhatsApp template messages via n8n integration.

## Overview

The WhatsApp Template Messages system allows you to:

- Create reusable message templates with variables
- Send personalized bulk messages
- Schedule messages for future delivery
- Track delivery status

## Architecture

```
Frontend → Backend API → Database (Templates)
                      ↓
                   n8n Webhook → WhatsApp Business API
```

## Database Schema

### MessageTemplate Model

```prisma
model MessageTemplate {
  id         String   @id @default(uuid())
  name       String
  content    String   @db.Text
  variables  String[] // ["name", "amount", "date"]
  language   String   @default("TR")
  category   String   // "marketing", "transactional", "support"
  status     TemplateStatus // DRAFT, ACTIVE, INACTIVE, ARCHIVED
  createdById String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### ScheduledMessage Model

```prisma
model ScheduledMessage {
  id         String   @id @default(uuid())
  templateId String
  userId     String
  recipients String[] // Phone numbers
  variables  Json     // Template variables
  scheduledFor DateTime
  status     ScheduledMessageStatus // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
  sentAt     DateTime?
  failedCount Int    @default(0)
  successCount Int   @default(0)
  errorMessage String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## API Endpoints

### Template Management

#### Create Template

```http
POST /api/templates
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Welcome Message",
  "content": "Merhaba {{name}}, hesabınız oluşturuldu. Şifreniz: {{password}}",
  "language": "TR",
  "category": "transactional"
}

Response:
{
  "success": true,
  "template": {
    "id": "uuid",
    "name": "Welcome Message",
    "content": "...",
    "variables": ["name", "password"],
    "language": "TR",
    "category": "transactional",
    "status": "ACTIVE",
    "createdAt": "2026-01-22T10:00:00Z"
  }
}
```

#### Get All Templates

```http
GET /api/templates?category=marketing&language=TR&status=ACTIVE&search=welcome
Authorization: Bearer {token}

Response:
{
  "success": true,
  "templates": [...]
}
```

#### Get Template by ID

```http
GET /api/templates/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "template": {
    "id": "uuid",
    "name": "Welcome Message",
    "content": "...",
    "variables": ["name", "password"],
    "createdBy": {
      "id": "user-id",
      "fullName": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

#### Update Template

```http
PATCH /api/templates/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Updated Welcome Message",
  "content": "Yeni içerik {{name}}",
  "status": "INACTIVE"
}

Response:
{
  "success": true,
  "template": {...}
}
```

#### Delete Template

```http
DELETE /api/templates/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Template deleted successfully"
}
```

#### Preview Template

```http
POST /api/templates/preview
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "Merhaba {{name}}, borcunuz {{amount}} TL",
  "variables": {
    "name": "Ahmet",
    "amount": "150.00"
  }
}

Response:
{
  "success": true,
  "rendered": "Merhaba Ahmet, borcunuz 150.00 TL"
}
```

#### Duplicate Template

```http
POST /api/templates/{id}/duplicate
Authorization: Bearer {token}

Response:
{
  "success": true,
  "template": {
    "id": "new-uuid",
    "name": "Welcome Message (Copy)",
    "status": "DRAFT"
  }
}
```

#### Get Template Statistics

```http
GET /api/templates/stats
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "stats": {
    "total": 25,
    "active": 18,
    "draft": 7,
    "byCategory": [
      { "category": "marketing", "count": 10 },
      { "category": "transactional", "count": 8 },
      { "category": "support", "count": 7 }
    ],
    "byLanguage": [
      { "language": "TR", "count": 20 },
      { "language": "EN", "count": 5 }
    ]
  }
}
```

#### Search Templates

```http
GET /api/templates/search?q=payment
Authorization: Bearer {token}

Response:
{
  "success": true,
  "templates": [...]
}
```

### Sending Messages

#### Send Template Message (Immediate)

```http
POST /api/whatsapp/send-template
Content-Type: application/json
Authorization: Bearer {token}

{
  "templateId": "uuid",
  "recipients": ["+905551234567", "+905559876543"],
  "variables": {
    "name": "Ahmet",
    "amount": "150.00",
    "date": "22.01.2026"
  }
}

Response:
{
  "success": true,
  "message": "Messages sent",
  "result": {
    "success": 2,
    "failed": 0
  }
}
```

#### Schedule Message

```http
POST /api/whatsapp/schedule
Content-Type: application/json
Authorization: Bearer {token}

{
  "templateId": "uuid",
  "recipients": ["+905551234567"],
  "variables": {
    "name": "Mehmet",
    "date": "23.01.2026"
  },
  "scheduledFor": "2026-01-23T09:00:00Z"
}

Response:
{
  "success": true,
  "message": "Message scheduled successfully",
  "scheduled": {
    "id": "uuid",
    "scheduledFor": "2026-01-23T09:00:00Z",
    "status": "PENDING"
  }
}
```

#### Get Scheduled Messages

```http
GET /api/whatsapp/scheduled
Authorization: Bearer {token}

Response:
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "template": {
        "id": "template-id",
        "name": "Payment Reminder",
        "content": "..."
      },
      "recipients": ["+905551234567"],
      "scheduledFor": "2026-01-23T09:00:00Z",
      "status": "PENDING",
      "createdAt": "2026-01-22T10:00:00Z"
    }
  ]
}
```

#### Cancel Scheduled Message

```http
DELETE /api/whatsapp/scheduled/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Scheduled message cancelled"
}
```

#### Get Scheduled Message Statistics

```http
GET /api/whatsapp/scheduled/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "stats": {
    "total": 50,
    "pending": 10,
    "completed": 35,
    "failed": 3,
    "cancelled": 2
  }
}
```

## Template Variables

Variables are defined using double curly braces: `{{variableName}}`

### Example Templates

#### Welcome Message
```
Merhaba {{name}}! 🎉

Hesabınız başarıyla oluşturuldu.
Geçici şifreniz: {{password}}

Panel: {{panelUrl}}
```

#### Payment Reminder
```
Sayın {{name}},

{{amount}} TL tutarındaki {{plan}} paket ödemenizin {{date}} tarihinde sona ereceğini hatırlatmak isteriz.

Kesintisiz hizmet için lütfen ödemenizi zamanında yapınız.
```

#### Subscription Expiring
```
⚠️ Dikkat {{name}}!

{{plan}} aboneliğiniz {{daysLeft}} gün içinde sona erecek.

Son geçerlilik: {{endDate}}
Yenileme: {{renewalUrl}}
```

#### New Message Notification
```
💬 Yeni mesajınız var!

Gönderen: {{customerName}}
Telefon: {{phone}}
Mesaj: {{message}}

Yanıtla: {{replyUrl}}
```

## n8n Integration

### n8n Workflow Setup

1. Create a new webhook node in n8n
2. Set webhook URL to `https://your-n8n.com/webhook/whatsapp`
3. Add WhatsApp Business API node
4. Configure message sending

### Webhook Payload

The backend sends this payload to n8n:

```json
{
  "to": "+905551234567",
  "message": "Rendered template content",
  "mediaUrl": null,
  "timestamp": "2026-01-22T10:00:00.000Z"
}
```

### n8n Configuration

```javascript
// n8n HTTP Request Node
{
  "method": "POST",
  "url": "{{ $json.whatsappApiUrl }}",
  "authentication": "headerAuth",
  "headers": {
    "Authorization": "Bearer {{ $credentials.whatsappToken }}"
  },
  "body": {
    "to": "{{ $json.to }}",
    "type": "text",
    "text": {
      "body": "{{ $json.message }}"
    }
  }
}
```

## Environment Variables

Add to `.env`:

```env
N8N_WHATSAPP_WEBHOOK_URL=https://your-n8n-instance.com/webhook/whatsapp
```

## Scheduled Message Processing

### Automatic Processing (Cron Job)

Create a cron job to process pending scheduled messages:

```typescript
import { whatsAppService } from './services/whatsapp.service';

// Run every 5 minutes
setInterval(async () => {
  await whatsAppService.processPendingMessages();
}, 5 * 60 * 1000);
```

### Manual Trigger (Admin Only)

```http
POST /api/whatsapp/process-pending
Authorization: Bearer {super_admin_token}

Response:
{
  "success": true,
  "message": "Processed 5 scheduled messages",
  "processed": 5
}
```

## Usage Examples

### Send Welcome Message to New User

```typescript
import { whatsAppService } from './services/whatsapp.service';

// Send immediately
await whatsAppService.sendTemplateMessage(
  user.whatsappNumber,
  welcomeTemplateId,
  {
    name: user.fullName,
    password: tempPassword,
    panelUrl: process.env.FRONTEND_URL
  }
);
```

### Schedule Payment Reminder

```typescript
import { whatsAppService } from './services/whatsapp.service';

// Schedule for 3 days before expiry
const reminderDate = new Date(subscription.endDate);
reminderDate.setDate(reminderDate.getDate() - 3);

await whatsAppService.scheduleMessage(userId, {
  templateId: paymentReminderTemplateId,
  recipients: [user.whatsappNumber],
  variables: {
    name: user.fullName,
    amount: subscription.monthlyPrice,
    plan: subscription.planName,
    date: subscription.endDate
  },
  scheduledFor: reminderDate
});
```

### Bulk Send to All Clients

```typescript
import { PrismaClient } from '@prisma/client';
import { whatsAppService } from './services/whatsapp.service';

const prisma = new PrismaClient();

// Get all active clients
const clients = await prisma.user.findMany({
  where: { 
    role: 'CLIENT',
    isActive: true,
    whatsappNumber: { not: null }
  }
});

const recipients = clients.map(c => c.whatsappNumber!);

// Send announcement
await whatsAppService.sendBulkTemplateMessage(
  recipients,
  announcementTemplateId,
  {
    message: 'System update scheduled for tomorrow'
  }
);
```

## Best Practices

### Template Design

1. **Keep it short**: WhatsApp messages should be concise
2. **Clear CTA**: Include clear call-to-action
3. **Personalization**: Use variables for personalization
4. **Language**: Match user's language preference
5. **Emojis**: Use sparingly for emphasis

### Variable Naming

- Use descriptive names: `customerName` instead of `n`
- camelCase format: `firstName`, `totalAmount`
- Avoid spaces: `full_name` or `fullName`, not `full name`

### Categories

- **transactional**: Passwords, confirmations, receipts
- **marketing**: Promotions, announcements, offers
- **support**: Help messages, FAQs, updates
- **notification**: Reminders, alerts, warnings

### Rate Limiting

- Add 1 second delay between messages
- Use scheduled messages for large batches
- Monitor n8n webhook response times
- Implement retry logic for failed sends

### Error Handling

- Log all failed sends
- Retry failed messages (max 3 attempts)
- Mark invalid numbers
- Alert admins of high failure rates

## Testing

### Test Template Rendering

```bash
curl -X POST http://localhost:5000/api/templates/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Merhaba {{name}}, borcunuz {{amount}} TL",
    "variables": {
      "name": "Test User",
      "amount": "100.00"
    }
  }'
```

### Test Send Message

```bash
curl -X POST http://localhost:5000/api/whatsapp/send-template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "your-template-id",
    "recipients": ["+905551234567"],
    "variables": {
      "name": "Test",
      "amount": "100"
    }
  }'
```

## Monitoring

### Key Metrics

- Total templates: `GET /api/templates/stats`
- Scheduled messages: `GET /api/whatsapp/scheduled/stats`
- Success rate: `successCount / (successCount + failedCount)`
- Average processing time

### Cleanup

Old completed/cancelled messages are automatically deleted after 90 days:

```typescript
// Run weekly
setInterval(async () => {
  await whatsAppService.cleanupOldMessages();
}, 7 * 24 * 60 * 60 * 1000);
```

## Security

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only ADMIN/MANAGER can create/send templates
3. **Rate Limiting**: Applied to all endpoints
4. **Webhook Security**: Validate n8n webhook responses
5. **Phone Number Validation**: Validate before sending

## Production Checklist

- [ ] n8n webhook configured and tested
- [ ] WhatsApp Business API connected
- [ ] Templates created and tested
- [ ] Cron job for scheduled messages
- [ ] Cleanup job scheduled
- [ ] Error monitoring enabled
- [ ] Rate limiting configured
- [ ] Phone number validation added
- [ ] Webhook URL secured (HTTPS)
- [ ] Response timeout handled

## Troubleshooting

### Messages not sending

1. Check n8n webhook URL in `.env`
2. Verify n8n workflow is active
3. Test n8n webhook manually
4. Check WhatsApp Business API credentials
5. Validate phone number format

### Template variables not replacing

- Check variable names match exactly
- Variables are case-sensitive
- Use `{{variable}}` format (no spaces inside braces)
- Test with preview endpoint first

### Scheduled messages not processing

- Verify cron job is running
- Check `scheduledFor` is in the past
- Ensure status is `PENDING`
- Check error logs in database

## References

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [n8n Documentation](https://docs.n8n.io/)
- [Message Template Best Practices](https://developers.facebook.com/docs/whatsapp/message-templates)
