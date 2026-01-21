// Dashboard Statistics and Charts

// Load dashboard stats for admin
async function loadAdminDashboard() {
  try {
    showLoading();
    
    // Load all stats in parallel
    const [userStats, subStats, paymentStats, messageStats] = await Promise.all([
      apiCall('/users/stats'),
      apiCall('/subscriptions/stats'),
      apiCall('/payments/stats'),
      apiCall('/messages/stats'),
    ]);

    renderAdminStats({
      users: userStats.stats,
      subscriptions: subStats.stats,
      payments: paymentStats.stats,
      messages: messageStats,
    });
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Dashboard load error:', error);
  }
}

// Render admin dashboard stats
function renderAdminStats(data) {
  const container = document.getElementById('dashboardStats');
  if (!container) return;

  const { users, subscriptions, payments, messages } = data;

  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Users Section -->
      <div class="dashboard-section">
        <h3>👥 Kullanıcılar</h3>
        <div class="stats-mini-grid">
          <div class="mini-stat-card">
            <div class="mini-stat-value">${users.total || 0}</div>
            <div class="mini-stat-label">Toplam Kullanıcı</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-success);">${users.clients || 0}</div>
            <div class="mini-stat-label">Müşteri</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-primary);">${users.admins || 0}</div>
            <div class="mini-stat-label">Admin</div>
          </div>
        </div>
      </div>

      <!-- Subscriptions Section -->
      <div class="dashboard-section">
        <h3>💼 Abonelikler</h3>
        <div class="stats-mini-grid">
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-success);">${subscriptions.active || 0}</div>
            <div class="mini-stat-label">Aktif</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-warning);">${subscriptions.cancelled || 0}</div>
            <div class="mini-stat-label">İptal Edildi</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-danger);">${subscriptions.expired || 0}</div>
            <div class="mini-stat-label">Süresi Doldu</div>
          </div>
        </div>
        <div class="progress-bar-container" style="margin-top: 1rem;">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${getPercentage(subscriptions.active, subscriptions.total)}%; background: var(--color-success);"></div>
          </div>
          <small style="color: var(--color-text-muted); margin-top: 0.5rem; display: block;">
            Aktif oran: ${getPercentage(subscriptions.active, subscriptions.total)}%
          </small>
        </div>
      </div>

      <!-- Payments Section -->
      <div class="dashboard-section">
        <h3>💳 Ödemeler</h3>
        <div class="stats-mini-grid">
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-success);">${payments.completed || 0}</div>
            <div class="mini-stat-label">Tamamlandı</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-warning);">${payments.pending || 0}</div>
            <div class="mini-stat-label">Bekliyor</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value">${formatCurrency(payments.totalAmount || 0)}</div>
            <div class="mini-stat-label">Toplam Gelir</div>
          </div>
        </div>
      </div>

      <!-- Messages Section -->
      <div class="dashboard-section">
        <h3>💬 Mesajlar</h3>
        <div class="stats-mini-grid">
          <div class="mini-stat-card">
            <div class="mini-stat-value">${messages.total || 0}</div>
            <div class="mini-stat-label">Toplam Mesaj</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-success);">${messages.inbound || 0}</div>
            <div class="mini-stat-label">Gelen</div>
          </div>
          <div class="mini-stat-card">
            <div class="mini-stat-value" style="color: var(--color-primary);">${messages.outbound || 0}</div>
            <div class="mini-stat-label">Giden</div>
          </div>
        </div>
        <div class="progress-bar-container" style="margin-top: 1rem;">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${getPercentage(messages.inbound, messages.total)}%; background: var(--color-success);"></div>
          </div>
          <small style="color: var(--color-text-muted); margin-top: 0.5rem; display: block;">
            Gelen mesaj oranı: ${getPercentage(messages.inbound, messages.total)}%
          </small>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="dashboard-section" style="grid-column: 1 / -1;">
        <h3>📊 Hızlı Erişim</h3>
        <div class="quick-actions">
          <a href="/admin.html" class="quick-action-btn">
            <span class="quick-action-icon">👥</span>
            <span>Kullanıcılar</span>
          </a>
          <a href="/admin-subscriptions.html" class="quick-action-btn">
            <span class="quick-action-icon">💼</span>
            <span>Abonelikler</span>
          </a>
          <a href="/admin-payments.html" class="quick-action-btn">
            <span class="quick-action-icon">💳</span>
            <span>Ödemeler</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// Load client dashboard stats
async function loadClientDashboard() {
  try {
    showLoading();
    
    const user = window.getUser();
    if (!user || !user.id) return;

    // Load client-specific stats
    const [messageStats, subscription, paymentSummary] = await Promise.all([
      apiCall('/messages/stats'),
      apiCall(`/subscriptions/user/${user.id}/active`).catch(() => ({ subscription: null })),
      apiCall(`/payments/user/${user.id}/summary`).catch(() => ({ summary: null })),
    ]);

    renderClientStats({
      messages: messageStats,
      subscription: subscription.subscription,
      payments: paymentSummary.summary,
    });
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Dashboard load error:', error);
  }
}

// Render client dashboard stats
function renderClientStats(data) {
  const container = document.getElementById('clientDashboardStats');
  if (!container) return;

  const { messages, subscription, payments } = data;
  const hasActiveSubscription = subscription && subscription.status === 'ACTIVE';
  const daysLeft = subscription ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  container.innerHTML = `
    <div class="client-dashboard-grid">
      <!-- Subscription Status -->
      <div class="dashboard-card ${hasActiveSubscription ? 'card-success' : 'card-warning'}">
        <div class="card-icon">💼</div>
        <div class="card-content">
          <h4>${hasActiveSubscription ? 'Abonelik Aktif' : 'Abonelik Yok'}</h4>
          ${subscription ? `
            <p>${subscription.planName}</p>
            <small>${daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süresi doldu'}</small>
          ` : '<p>Aktif abonelik bulunmuyor</p>'}
        </div>
      </div>

      <!-- Messages Summary -->
      <div class="dashboard-card">
        <div class="card-icon">💬</div>
        <div class="card-content">
          <h4>WhatsApp Mesajları</h4>
          <p>${messages.total || 0} toplam mesaj</p>
          <small>${messages.unread || 0} okunmamış</small>
        </div>
      </div>

      <!-- Payments Summary -->
      <div class="dashboard-card">
        <div class="card-icon">💳</div>
        <div class="card-content">
          <h4>Ödemeler</h4>
          ${payments && payments.stats ? `
            <p>${formatCurrency(payments.stats.totalAmount || 0)} toplam</p>
            <small>${payments.stats.completed || 0} tamamlanan ödeme</small>
          ` : '<p>Ödeme kaydı yok</p>'}
        </div>
      </div>

      <!-- Message Activity -->
      <div class="dashboard-card" style="grid-column: 1 / -1;">
        <h4 style="margin-bottom: 1rem;">📊 Mesaj Dağılımı</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="activity-stat">
            <div class="activity-value" style="color: var(--color-success);">${messages.inbound || 0}</div>
            <div class="activity-label">Gelen Mesajlar</div>
          </div>
          <div class="activity-stat">
            <div class="activity-value" style="color: var(--color-primary);">${messages.outbound || 0}</div>
            <div class="activity-label">Giden Mesajlar</div>
          </div>
        </div>
        ${subscription && subscription.maxMessages ? `
          <div style="margin-top: 1rem;">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${getPercentage(messages.total, subscription.maxMessages)}%; background: var(--color-primary);"></div>
            </div>
            <small style="color: var(--color-text-muted); margin-top: 0.5rem; display: block;">
              ${messages.total || 0} / ${subscription.maxMessages} mesaj kullanıldı (${getPercentage(messages.total, subscription.maxMessages)}%)
            </small>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Helper functions
function getPercentage(value, total) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Export functions
if (typeof window !== 'undefined') {
  window.loadAdminDashboard = loadAdminDashboard;
  window.loadClientDashboard = loadClientDashboard;
}
