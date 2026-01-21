// Client panel API functions

// Get conversations
async function loadConversations() {
  try {
    showLoading();
    const data = await window.apiCall('/messages/conversations');
    renderConversations(data.conversations);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error loading conversations:', error);
  }
}

// Get messages for a conversation
async function loadMessages(customerPhone, page = 1) {
  try {
    showLoading();
    const queryParams = new URLSearchParams({
      customerPhone,
      page: page.toString(),
      limit: '50',
    });

    const data = await window.apiCall(`/messages?${queryParams}`);
    renderMessages(data.messages, customerPhone);
    
    // Mark conversation as read
    await markConversationAsRead(customerPhone);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error loading messages:', error);
  }
}

// Mark conversation as read
async function markConversationAsRead(customerPhone) {
  try {
    await window.apiCall('/messages/conversations/mark-read', {
      method: 'POST',
      body: JSON.stringify({ customerPhone }),
    });
    // Refresh conversations to update unread count
    loadConversations();
  } catch (error) {
    console.error('Error marking as read:', error);
  }
}

// Get message stats
async function loadMessageStats() {
  try {
    const data = await window.apiCall('/messages/stats');
    renderStats(data);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Render conversations list
function renderConversations(conversations) {
  const container = document.getElementById('conversationsList');
  if (!container) return;

  if (conversations.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 3rem 1rem;">
        <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">Henüz mesaj yok</p>
        <p style="color: var(--color-text-muted);">WhatsApp'tan mesaj geldiğinde burada görünecek</p>
      </div>
    `;
    return;
  }

  container.innerHTML = conversations.map(conv => {
    const lastMessagePreview = conv.lastMessage 
      ? conv.lastMessage.substring(0, 60) + (conv.lastMessage.length > 60 ? '...' : '')
      : 'Mesaj yok';
    
    const timeAgo = formatTimeAgo(new Date(conv.lastMessageTime));
    
    return `
      <div class="conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}" 
           onclick="selectConversation('${escapeHtml(conv.customerPhone)}')">
        <div class="conversation-avatar">
          ${getInitials(conv.customerName || conv.customerPhone)}
        </div>
        <div class="conversation-content">
          <div class="conversation-header">
            <span class="conversation-name">${escapeHtml(conv.customerName || conv.customerPhone)}</span>
            <span class="conversation-time">${timeAgo}</span>
          </div>
          <div class="conversation-preview">
            <span>${escapeHtml(lastMessagePreview)}</span>
            ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render messages
function renderMessages(messages, customerPhone) {
  const container = document.getElementById('messagesContainer');
  const header = document.getElementById('conversationHeader');
  
  if (!container || !header) return;

  // Store customer phone in container for WebSocket updates
  container.dataset.customerPhone = customerPhone;

  if (messages.length === 0) {
    container.innerHTML = '<div class="empty-state">Bu konuşmada henüz mesaj yok</div>';
    return;
  }

  // Update header
  const customerName = messages[0]?.customerName || customerPhone;
  header.innerHTML = `
    <div>
      <div class="conversation-name" style="font-size: 1.125rem; font-weight: 600;">
        ${escapeHtml(customerName)}
      </div>
      <div style="font-size: 0.875rem; color: var(--color-text-muted);">
        ${escapeHtml(customerPhone)}
      </div>
    </div>
    <button onclick="loadMessages('${escapeHtml(customerPhone)}')" class="btn-secondary btn-sm">
      🔄 Yenile
    </button>
  `;

  // Render messages (reverse order - oldest first)
  const sortedMessages = [...messages].reverse();
  
  container.innerHTML = sortedMessages.map(msg => {
    const isInbound = msg.direction === 'INBOUND';
    const time = new Date(msg.timestamp).toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }); data-message-id="${msg.id}"
    
    return `
      <div class="message-bubble ${isInbound ? 'inbound' : 'outbound'}">
        <div class="message-content">
          ${escapeHtml(msg.messageContent || '(Medya mesajı)')}
        </div>
        <div class="message-time">${time}</div>
      </div>
    `;
  }).join('');

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;

  // Show messages panel
  document.getElementById('messagesPanel').style.display = 'block';
  document.getElementById('emptyMessagesPanel').style.display = 'none';
}

// Render stats
function renderStats(stats) {
  const total = document.getElementById('statTotal');
  const unread = document.getElementById('statUnread');
  const inbound = document.getElementById('statInbound');
  const outbound = document.getElementById('statOutbound');

  if (total) total.textContent = stats.total || 0;
  if (unread) unread.textContent = stats.unread || 0;
  if (inbound) inbound.textContent = stats.inbound || 0;
  if (outbound) outbound.textContent = stats.outbound || 0;
}

// Select conversation
function selectConversation(customerPhone) {
  loadMessages(customerPhone);
}

// Helper: Get initials
function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Helper: Format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Şimdi';
  if (diffMins < 60) return `${diffMins}dk`;
  if (diffHours < 24) return `${diffHours}sa`;
  if (diffDays < 7) return `${diffDays}g`;
  
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// Helper: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Loading helpers
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('conversationsList')) {
    loadConversations();
    loadMessageStats();

    // Refresh every 30 seconds (fallback for browsers without WebSocket)
    setInterval(() => {
      if (!window.socketClient || !window.socketClient.isConnected) {
        loadConversations();
        loadMessageStats();
      }
    }, 30000);

    // Setup WebSocket event handlers
    setupSocketHandlers();
  }
});

// Setup WebSocket real-time event handlers
function setupSocketHandlers() {
  if (!window.socketClient) {
    console.warn('Socket client not available');
    return;
  }

  // Handle new message
  window.socketClient.on('new_message', (message) => {
    console.log('📨 New message received via WebSocket:', message);
    
    // Reload conversations to update list
    loadConversations();
    
    // If the message is for the currently open conversation, reload messages
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer && messagesContainer.dataset.customerPhone === message.customerPhone) {
      loadMessages(message.customerPhone);
    }
    
    // Update stats
    loadMessageStats();
  });

  // Handle message read status
  window.socketClient.on('message_read', (data) => {
    console.log('👁️ Message read:', data);
    
    // Update UI to show message as read
    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageElement) {
      messageElement.classList.add('read');
    }
  });

  // Handle typing indicator
  window.socketClient.on('user_typing', (data) => {
    const header = document.getElementById('conversationHeader');
    if (header) {
      const typingIndicator = header.querySelector('.typing-indicator');
      
      if (data.isTyping) {
        if (!typingIndicator) {
          const indicator = document.createElement('div');
          indicator.className = 'typing-indicator';
          indicator.textContent = 'Yazıyor...';
          header.appendChild(indicator);
        }
      } else {
        if (typingIndicator) {
          typingIndicator.remove();
        }
      }
    }
  });

  // Handle reconnection - reload data
  window.socketClient.on('reconnected', () => {
    console.log('🔄 Reconnected - reloading data...');
    loadConversations();
    loadMessageStats();
  });
}

// Export
if (typeof window !== 'undefined') {
  window.loadConversations = loadConversations;
  window.loadMessages = loadMessages;
  window.selectConversation = selectConversation;
  window.markConversationAsRead = markConversationAsRead;
}
