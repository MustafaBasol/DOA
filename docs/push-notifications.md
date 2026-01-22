# Push Notifications Setup (Firebase Cloud Messaging)

This guide explains how to set up push notifications for mobile and web clients using Firebase Cloud Messaging (FCM).

## Prerequisites

- Firebase Project
- Firebase Admin SDK Service Account
- Mobile app (iOS/Android) or Web app configured with FCM

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Cloud Messaging** in project settings

### 2. Generate Service Account Key

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. Save it as `backend/config/firebase-service-account.json`

### 3. Environment Variables

Add to `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Backend Implementation

The push notification system includes:

### Services

- **FirebaseService** (`src/services/firebase.service.ts`):
  - Initialize Firebase Admin SDK
  - Send push to single device
  - Send multicast (bulk) notifications
  - Topic subscription/unsubscription
  - Token validation

- **PushNotificationService** (`src/services/push-notification.service.ts`):
  - Send to specific user (all devices)
  - Send to multiple users
  - Send to role (all admins, all clients, etc.)
  - Device token management
  - Cleanup invalid tokens

### API Endpoints

#### Device Management

```http
POST /api/devices/register
Content-Type: application/json
Authorization: Bearer {token}

{
  "token": "fcm_device_token",
  "platform": "IOS|ANDROID|WEB",
  "deviceId": "unique-device-id",
  "deviceName": "iPhone 14 Pro",
  "appVersion": "1.0.0"
}
```

```http
POST /api/devices/unregister
Content-Type: application/json
Authorization: Bearer {token}

{
  "token": "fcm_device_token"
}
```

```http
GET /api/devices/my-devices
Authorization: Bearer {token}

Response:
{
  "success": true,
  "devices": [
    {
      "id": "uuid",
      "platform": "IOS",
      "deviceName": "iPhone 14 Pro",
      "appVersion": "1.0.0",
      "isActive": true,
      "lastUsedAt": "2026-01-22T10:00:00Z",
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

#### Test Notification

```http
POST /api/devices/test-notification
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Test notification sent",
  "result": {
    "success": 2,
    "failed": 0
  }
}
```

#### Admin: Send to Users (ADMIN only)

```http
POST /api/devices/send-to-users
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "userIds": ["user-id-1", "user-id-2"],
  "title": "Important Update",
  "body": "Your subscription has been renewed",
  "imageUrl": "https://example.com/image.jpg",
  "data": {
    "type": "subscription",
    "action": "renewed"
  }
}
```

#### Admin: Send to Role (ADMIN only)

```http
POST /api/devices/send-to-role
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "role": "CLIENT|MANAGER|ADMIN|SUPER_ADMIN",
  "title": "System Maintenance",
  "body": "The system will be down for maintenance tomorrow",
  "data": {
    "type": "system",
    "scheduled": "2026-01-23T02:00:00Z"
  }
}
```

#### Topic Subscription (ADMIN only)

```http
POST /api/devices/subscribe-topic
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "topic": "payment-alerts"
}
```

```http
POST /api/devices/unsubscribe-topic
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "topic": "payment-alerts"
}
```

## Client Implementation

### iOS (Swift)

```swift
import FirebaseMessaging

// Get FCM token
Messaging.messaging().token { token, error in
    if let error = error {
        print("Error fetching FCM token: \(error)")
    } else if let token = token {
        // Register with backend
        registerDevice(token: token, platform: "IOS")
    }
}

// Handle token refresh
Messaging.messaging().delegate = self

func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    if let token = fcmToken {
        registerDevice(token: token, platform: "IOS")
    }
}
```

### Android (Kotlin)

```kotlin
import com.google.firebase.messaging.FirebaseMessaging

// Get FCM token
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        // Register with backend
        registerDevice(token, "ANDROID")
    }
}
```

### Web (JavaScript)

```javascript
import { getMessaging, getToken } from "firebase/messaging";

const messaging = getMessaging();

// Request permission and get token
Notification.requestPermission().then((permission) => {
  if (permission === 'granted') {
    getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' }).then((token) => {
      // Register with backend
      registerDevice(token, 'WEB');
    });
  }
});
```

## Integration with Notification System

The push notification service is automatically integrated with the existing notification system:

```typescript
// In notification.service.ts
await notificationService.sendNotification({
  userId: user.id,
  type: 'PAYMENT_RECEIVED',
  title: 'Payment Received',
  message: 'Your payment has been processed',
  priority: 'high',
});

// This will:
// 1. Store notification in database
// 2. Send via WebSocket (real-time)
// 3. Send via Email (if enabled)
// 4. Send via Push Notification (if enabled) ✨ NEW!
```

## User Notification Preferences

Users can control notification channels:

```json
{
  "notificationPreferences": {
    "email": true,
    "push": true,
    "inApp": true
  }
}
```

## Database Schema

### DeviceToken Model

```prisma
model DeviceToken {
  id         String   @id @default(uuid())
  userId     String
  token      String   @unique
  platform   DevicePlatform // IOS, ANDROID, WEB
  deviceId   String?
  deviceName String?
  appVersion String?
  isActive   Boolean  @default(true)
  lastUsedAt DateTime @default(now())
  createdAt  DateTime @default(now())
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Error Handling

The service automatically handles:

- **Invalid tokens**: Marked as inactive
- **Expired tokens**: Removed during cleanup
- **Rate limiting**: Batch sends with delays
- **Failed sends**: Logged but don't break flow

## Cleanup Tasks

### Manual Cleanup

```http
POST /api/devices/cleanup-invalid
Authorization: Bearer {admin_token}

# Validates all tokens and marks invalid ones as inactive
```

### Automated Cleanup (Cron)

Add to your cron job:

```typescript
import { pushNotificationService } from './services/push-notification.service';

// Run daily
setInterval(async () => {
  await pushNotificationService.cleanupInvalidTokens();
  await pushNotificationService.deleteOldTokens(); // Delete inactive tokens older than 90 days
}, 24 * 60 * 60 * 1000);
```

## Testing

### Test with cURL

```bash
# Register device
curl -X POST http://localhost:5000/api/devices/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_fcm_token",
    "platform": "WEB",
    "deviceName": "Chrome Browser"
  }'

# Send test notification
curl -X POST http://localhost:5000/api/devices/test-notification \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Considerations

1. **Service Account**: Keep `firebase-service-account.json` secure, never commit to git
2. **Token Validation**: Tokens are validated before registration
3. **User Authorization**: Users can only manage their own devices
4. **Admin Only**: Bulk sends restricted to admins
5. **Rate Limiting**: Applied to all endpoints

## Production Checklist

- [ ] Firebase project created
- [ ] Service account JSON downloaded and secured
- [ ] Environment variables configured
- [ ] Mobile apps configured with FCM
- [ ] Web app configured with VAPID key
- [ ] Notification preferences UI implemented
- [ ] Cleanup cron jobs scheduled
- [ ] Rate limiting configured
- [ ] Error monitoring enabled
- [ ] Service account file excluded from git

## Troubleshooting

### Notifications not received

1. Check if device token is registered: `GET /api/devices/my-devices`
2. Verify user notification preferences
3. Check Firebase console for errors
4. Validate FCM token: Test with Firebase Console

### Invalid token errors

- Token might be expired (tokens expire after inactivity)
- Re-register device to get fresh token
- Check platform compatibility (iOS vs Android vs Web)

### Service account errors

- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` is correct
- Check JSON file has correct permissions
- Ensure Firebase Admin SDK is initialized

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [iOS Push Notification Setup](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Android Push Notification Setup](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Web Push Notification Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
