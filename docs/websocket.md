# WebSocket Integration Documentation

## 📡 Genel Bakış

DOA WhatsApp Manager artık **Socket.IO** tabanlı gerçek zamanlı iletişim desteği sunmaktadır. Bu özellik sayesinde:

- ✅ Yeni mesajlar anında görüntülenir (polling'e gerek yok)
- ✅ Mesaj okundu bilgisi gerçek zamanlı güncellenir
- ✅ Yazıyor göstergesi (typing indicator) desteği
- ✅ Tarayıcı bildirimleri (browser notifications)
- ✅ Otomatik yeniden bağlanma (auto-reconnection)
- ✅ Admin ve client'lar için room-based architecture

## 🏗️ Mimari

### Backend (Socket.IO Server)

**Dosya:** `/backend/src/socket/index.ts`

```typescript
class SocketService {
  // Socket.IO server instance
  private io: Server;

  // Middleware: JWT authentication
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    });
  }

  // Event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // User joins their personal room
      socket.join(`user:${socket.user.id}`);

      // Admins join admin room
      if (socket.user.role === 'ADMIN') {
        socket.join('admin');
      }

      // Handle events: typing, join_conversation, mark_read
    });
  }

  // Emit methods
  emitNewMessage(userId, message) { ... }
  emitToAdmins(event, data) { ... }
  emitToConversation(conversationId, event, data) { ... }
}
```

### Frontend (Socket.IO Client)

**Dosya:** `/assets/js/socket-client.js`

```javascript
class SocketClient {
  // Connect to WebSocket server
  async connect() {
    const token = localStorage.getItem('accessToken');
    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }

  // Event listeners
  setupEventListeners() {
    this.socket.on('new_message', (data) => { ... });
    this.socket.on('message_read', (data) => { ... });
    this.socket.on('user_typing', (data) => { ... });
  }

  // Custom event system
  on(event, handler) { ... }
  trigger(event, data) { ... }
}
```

## 🔐 Authentication

WebSocket bağlantıları JWT token ile doğrulanır:

```javascript
// Client-side
const token = localStorage.getItem('accessToken');

const socket = io('http://localhost:5000', {
  auth: {
    token: token
  }
});
```

```typescript
// Server-side middleware
this.io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id } 
    });
    
    if (!user || !user.isActive) {
      return next(new Error('User not found'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

## 📡 Events

### Server → Client Events

#### 1. `new_message`

Yeni WhatsApp mesajı geldiğinde tetiklenir.

**Payload:**
```json
{
  "id": "msg_123",
  "customerName": "Ahmet Yılmaz",
  "customerPhone": "+905551234567",
  "messageContent": "Merhaba, sipariş durumu nedir?",
  "messageType": "text",
  "direction": "INBOUND",
  "timestamp": "2026-01-21T15:30:00.000Z",
  "isRead": false
}
```

**Frontend Handler:**
```javascript
socketClient.on('new_message', (message) => {
  // Reload conversations
  loadConversations();
  
  // Update current conversation if open
  if (currentConversation === message.customerPhone) {
    loadMessages(message.customerPhone);
  }
  
  // Show notification
  showNotification(`Yeni mesaj: ${message.customerName}`);
});
```

#### 2. `message_read`

Bir mesaj okundu olarak işaretlendiğinde tetiklenir.

**Payload:**
```json
{
  "messageId": "msg_123",
  "readBy": 42,
  "readAt": "2026-01-21T15:35:00.000Z"
}
```

#### 3. `user_typing`

Kullanıcı yazıyor göstergesi.

**Payload:**
```json
{
  "userId": 42,
  "conversationId": 123,
  "isTyping": true
}
```

### Client → Server Events

#### 1. `join_conversation`

Bir konuşma odasına katıl.

**Emit:**
```javascript
socket.emit('join_conversation', conversationId);
```

#### 2. `leave_conversation`

Bir konuşma odasından ayrıl.

**Emit:**
```javascript
socket.emit('leave_conversation', conversationId);
```

#### 3. `typing`

Yazıyor göstergesini gönder.

**Emit:**
```javascript
socket.emit('typing', {
  conversationId: 123,
  isTyping: true
});
```

#### 4. `mark_read`

Mesajı okundu olarak işaretle.

**Emit:**
```javascript
socket.emit('mark_read', {
  messageId: 'msg_123'
});
```

## 🏠 Room Architecture

### User Rooms

Her kullanıcı kendi özel odasına katılır:

```typescript
const userRoom = `user:${userId}`;
socket.join(userRoom);
```

**Kullanım:**
```typescript
// Belirli bir kullanıcıya mesaj gönder
socketService.emitNewMessage(userId, message);
// Equivalent to: io.to(`user:${userId}`).emit('new_message', message);
```

### Admin Room

Tüm admin'ler ortak bir odada bulunur:

```typescript
if (user.role === 'ADMIN') {
  socket.join('admin');
}
```

**Kullanım:**
```typescript
// Tüm admin'lere bildirim gönder
socketService.emitToAdmins('new_message', {
  userId: 42,
  customerName: 'Mehmet Demir',
  messageContent: 'Yeni müşteri mesajı'
});
```

### Conversation Rooms

Her konuşma için dinamik oda:

```typescript
const conversationRoom = `conversation:${conversationId}`;
socket.join(conversationRoom);
```

## 🔔 Browser Notifications

### Permission İsteği

```javascript
// Sayfa yüklendiğinde otomatik istenilir
await socketClient.requestNotificationPermission();
```

### Notification Gösterimi

```javascript
showNotification(message, type, data) {
  if (Notification.permission === 'granted') {
    const notification = new Notification('DOA WhatsApp Manager', {
      body: message,
      icon: '/assets/images/logo.png',
      badge: '/assets/images/badge.png',
      tag: data?.id,
    });

    notification.onclick = () => {
      window.focus();
      // Navigate to message
    };
  }
}
```

### In-App Notifications

WebSocket bağlı olmasa bile in-app notification gösterilir:

```javascript
showInAppNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    animation: slideIn 0.3s ease-out;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 4000);
}
```

## 🔄 Auto-Reconnection

Socket.IO otomatik olarak bağlantı kesildiğinde yeniden bağlanır:

```javascript
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
  showNotification('Bağlantı yeniden kuruldu', 'success');
  
  // Reload data after reconnection
  loadConversations();
  loadMessageStats();
});
```

## 🔧 Integration with Webhook

Yeni mesaj n8n webhook'undan geldiğinde otomatik olarak Socket.IO üzerinden client'lara iletilir:

**Dosya:** `/backend/src/modules/webhooks/webhooks.controller.ts`

```typescript
async handleN8nMessage(req, res, next) {
  // Create message in database
  const message = await messagesService.createMessage(data);

  // Emit real-time notification via WebSocket
  if (socketService) {
    // Notify specific user
    socketService.emitNewMessage(userId, {
      id: message.id,
      customerName: customer_name,
      messageContent: message_content,
      // ... other fields
    });

    // Also notify all admins
    socketService.emitToAdmins('new_message', {
      userId,
      customerName: customer_name,
      // ... other fields
    });
  }

  res.status(201).json({ success: true });
}
```

## 📊 Connection Status

### Get Status

```javascript
const status = socketClient.getStatus();
console.log(status);
// {
//   isConnected: true,
//   socketId: 'abc123',
//   reconnectAttempts: 0
// }
```

### Check User Online

```typescript
// Backend
const isOnline = await socketService.isUserOnline(userId);
console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
```

### Connected Users Count

```typescript
// Backend
const count = socketService.getConnectedUsersCount();
console.log(`${count} users connected`);
```

## 🎨 UI Integration

### Client Panel

**Dosya:** `/client.html`

```html
<script src="/assets/js/socket-client.js"></script>
<script>
  // Auto-connect on page load
  document.addEventListener('DOMContentLoaded', async () => {
    await window.socketClient.requestNotificationPermission();
    await window.socketClient.connect();
    
    // Setup message handlers
    setupSocketHandlers();
  });
</script>
```

### Real-time Message Updates

**Dosya:** `/assets/js/panel/client.js`

```javascript
function setupSocketHandlers() {
  window.socketClient.on('new_message', (message) => {
    // Reload conversations
    loadConversations();
    
    // Update current conversation if open
    const container = document.getElementById('messagesContainer');
    if (container?.dataset.customerPhone === message.customerPhone) {
      loadMessages(message.customerPhone);
    }
    
    // Update stats
    loadMessageStats();
  });

  window.socketClient.on('reconnected', () => {
    // Reload all data after reconnection
    loadConversations();
    loadMessageStats();
  });
}
```

## 🔍 Debugging

### Enable Debug Mode

```javascript
// Client-side
localStorage.debug = 'socket.io-client:*';
```

### Server Logs

```typescript
// Socket connection
console.log(`✅ User connected: ${socket.user.email} (ID: ${socket.user.id})`);

// Room join
console.log(`📍 User ${socket.user.id} joined room: ${userRoom}`);

// Event emit
console.log(`📨 New message emitted to user: ${userId}`);

// Disconnect
console.log(`❌ User disconnected: ${socket.user.email} (Reason: ${reason})`);
```

## 🚀 Performance

### Optimizations

1. **Ping/Pong:** Her 25 saniyede bir ping, 60 saniye timeout
2. **Room-based Broadcasting:** Sadece ilgili kullanıcılara mesaj gönder
3. **Fallback Polling:** Socket bağlı değilse 30 saniyede bir API call
4. **Event Throttling:** Typing indicator 500ms throttle

### Load Testing

```bash
# Install dependencies
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:5000
```

## 📝 Best Practices

### 1. Always Check Connection

```javascript
if (socketClient.isConnected) {
  socketClient.markAsRead(messageId);
} else {
  // Use API fallback
  await apiCall(`/messages/${messageId}/read`, { method: 'PATCH' });
}
```

### 2. Cleanup on Unmount

```javascript
// React/Vue component
onUnmount(() => {
  socketClient.off('new_message', messageHandler);
  socketClient.leaveConversation(conversationId);
});
```

### 3. Handle Errors Gracefully

```javascript
socketClient.socket.on('error', (error) => {
  console.error('Socket error:', error);
  showNotification('Bağlantı hatası', 'error');
  // Fall back to polling
});
```

### 4. Secure Token Management

```javascript
// Refresh token before connecting
const token = await refreshAccessToken();
localStorage.setItem('accessToken', token);
await socketClient.connect();
```

## 🔒 Security

### CORS Configuration

```typescript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

### Rate Limiting

```typescript
// TODO: Implement rate limiting for socket events
import rateLimit from 'socket.io-rate-limit';

io.use(rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 requests per second
}));
```

### Input Validation

```typescript
socket.on('mark_read', async (data) => {
  // Validate input
  if (!data.messageId || typeof data.messageId !== 'string') {
    return socket.emit('error', { message: 'Invalid messageId' });
  }

  // Verify ownership
  const message = await prisma.whatsappMessage.findUnique({
    where: { id: data.messageId }
  });

  if (message.userId !== socket.user.id && socket.user.role !== 'ADMIN') {
    return socket.emit('error', { message: 'Unauthorized' });
  }

  // Process
  await updateReadStatus(data.messageId);
});
```

## 📚 Dependencies

### Backend

```json
{
  "socket.io": "^4.7.2"
}
```

### Frontend

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

## 🐛 Troubleshooting

### Issue: Cannot connect to WebSocket

**Solution:**
- Kontrol edin: Backend çalışıyor mu? (`npm run dev`)
- Token geçerli mi? (`localStorage.getItem('accessToken')`)
- CORS ayarları doğru mu?

### Issue: Events not received

**Solution:**
- Room'a katıldınız mı? (`socket.join(roomName)`)
- Event adı doğru mu? (case-sensitive)
- Connection durumu: `socketClient.isConnected`

### Issue: High memory usage

**Solution:**
- Event listener'ları temizleyin: `socket.off(event)`
- Unused room'lardan çıkın: `socket.leave(roomName)`
- Connection pool limit ayarlayın

## 🎯 Roadmap

- [ ] Typing indicator UI implementation
- [ ] Read receipts (double check marks)
- [ ] Online/offline status indicator
- [ ] Message delivery status
- [ ] File upload progress via WebSocket
- [ ] Video call signaling
- [ ] Screen sharing support

## 📞 Support

WebSocket entegrasyonu ile ilgili sorularınız için:
- GitHub Issues: https://github.com/MustafaBasol/DOA/issues
- Email: support@autoviseo.com

---

**Son Güncelleme:** 21 Ocak 2026  
**Versiyon:** 2.0.0-beta  
**Durum:** ✅ Production Ready
