/**
 * Socket.io Client for Real-time Communication
 * Handles WebSocket connection, authentication, and event management
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = {};
  }

  /**
   * Initialize and connect to WebSocket server
   */
  async connect() {
    const user = window.getUser();
    
    if (!user) {
      console.warn('⚠️ Cannot connect to socket: User not authenticated');
      return;
    }

    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.warn('⚠️ Cannot connect to socket: No access token found');
      return;
    }

    try {
      // Load Socket.io client library if not loaded
      if (typeof io === 'undefined') {
        await this.loadSocketIOClient();
      }

      const SOCKET_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000'
        : window.location.origin.replace('3000', '5000');

      this.socket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
      });

      this.setupEventListeners();
      
      console.log('🔌 Attempting to connect to WebSocket server...');
      
    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  }

  /**
   * Load Socket.io client library dynamically
   */
  loadSocketIOClient() {
    return new Promise((resolve, reject) => {
      if (typeof io !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script.integrity = 'sha384-mZLF4UVrpi/QTWPA7BjNPEnkIfRFn4ZEO3Qt/HpHPUZj8kaNbY5y3R8Tv7FFVZ3n';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Socket.io client'));
      document.head.appendChild(script);
    });
  }

  /**
   * Setup all socket event listeners
   */
  setupEventListeners() {
    // Connection successful
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ WebSocket connected!');
      this.showNotification('Bağlantı kuruldu', 'success');
      
      // Trigger custom connect handlers
      this.trigger('connected');
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.isConnected = false;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.showNotification('Bağlantı kurulamadı. Lütfen sayfayı yenileyin.', 'error');
      }
      
      this.reconnectAttempts++;
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ WebSocket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        this.socket.connect();
      }
      
      this.trigger('disconnected', reason);
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}...`);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      this.showNotification('Bağlantı yeniden kuruldu', 'success');
      this.reconnectAttempts = 0;
      this.trigger('reconnected');
    });

    // New message received
    this.socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      this.trigger('new_message', data);
      
      // Show notification
      this.showNotification(
        `Yeni mesaj: ${data.customerName || data.customerPhone}`,
        'info',
        data
      );
      
      // Play notification sound
      this.playNotificationSound();
    });

    // Message read status
    this.socket.on('message_read', (data) => {
      console.log('👁️ Message marked as read:', data);
      this.trigger('message_read', data);
    });

    // User typing indicator
    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      this.trigger('user_typing', data);
    });

    // Connection error
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot join conversation: Socket not connected');
      return;
    }

    this.socket.emit('join_conversation', conversationId);
    console.log(`💬 Joined conversation: ${conversationId}`);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId) {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('leave_conversation', conversationId);
    console.log(`🚪 Left conversation: ${conversationId}`);
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId, isTyping) {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('typing', { conversationId, isTyping });
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId) {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('mark_read', { messageId });
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (!this.eventHandlers[event]) return;
    
    if (handler) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    } else {
      delete this.eventHandlers[event];
    }
  }

  /**
   * Trigger custom event handlers
   */
  trigger(event, data) {
    if (!this.eventHandlers[event]) return;
    
    this.eventHandlers[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });
  }

  /**
   * Show browser notification
   */
  showNotification(message, type = 'info', data = null) {
    // Check if notifications are supported
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('DOA WhatsApp Manager', {
        body: message,
        icon: '/assets/images/logo.png',
        badge: '/assets/images/badge.png',
        tag: data?.id || 'doa-notification',
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (data?.id) {
          // Navigate to message
          this.trigger('notification_click', data);
        }
      };
    }

    // Also show in-app notification
    this.showInAppNotification(message, type);
  }

  /**
   * Show in-app notification banner
   */
  showInAppNotification(message, type = 'info') {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGm98OScTgwNU6zn77RiGwU7k9n0yXkpBSd+zPLaizsKFGO77OmiUhEKTKXh87hjHAU2js7x1YU2BxlnuvbklU0MDFCr5vCxYRsFO5PY9Ml5KwUneM3y2Ik3Bxdqv/DilFAMDlSs6O6wYBoEOZTW9Mp5KgYmfczz2os4CBZX');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (e.g., user hasn't interacted with page yet)
      });
    } catch (error) {
      // Silently fail if audio doesn't work
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Disconnect from socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('👋 WebSocket disconnected');
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create global instance
window.socketClient = new SocketClient();

// Auto-connect when user is logged in
document.addEventListener('DOMContentLoaded', async () => {
  const user = window.getUser();
  
  if (user) {
    // Request notification permission
    await window.socketClient.requestNotificationPermission();
    
    // Connect to WebSocket
    await window.socketClient.connect();
  }
});

// Disconnect on logout
window.addEventListener('beforeunload', () => {
  if (window.socketClient) {
    window.socketClient.disconnect();
  }
});
