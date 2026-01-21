// Client payment and subscription functions

// Get active subscription
async function loadActiveSubscription() {
  try {
    const user = window.getUser();
    if (!user || !user.id) return;

    const data = await window.apiCall(`/subscriptions/user/${user.id}/active`);
    renderSubscription(data.subscription);
  } catch (error) {
    console.error('Error loading subscription:', error);
    renderSubscription(null);
  }
}

// Get payment summary
async function loadPaymentSummary() {
  try {
    const user = window.getUser();
    if (!user || !user.id) return;

    const data = await window.apiCall(`/payments/user/${user.id}/summary`);
    renderPaymentSummary(data.summary);
  } catch (error) {
    console.error('Error loading payment summary:', error);
  }
}

// Render subscription card
function renderSubscription(subscription) {
  const container = document.getElementById('subscriptionCard');
  if (!container) return;

  if (!subscription) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>💼 Abonelik Bilgileri</h3>
        </div>
        <div class="card-body">
          <div class="empty-state">
            <p>Aktif aboneliğiniz bulunmuyor</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const statusBadge = getStatusBadge(subscription.status);
  const endDate = new Date(subscription.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>💼 Abonelik Bilgileri</h3>
        ${statusBadge}
      </div>
      <div class="card-body">
        <div class="subscription-info">
          <div class="info-row">
            <span class="label">Plan:</span>
            <span class="value">${escapeHtml(subscription.planName)}</span>
          </div>
          <div class="info-row">
            <span class="label">Ücret:</span>
            <span class="value">${subscription.planPrice} ${subscription.currency || 'TRY'}</span>
          </div>
          <div class="info-row">
            <span class="label">Dönem:</span>
            <span class="value">${getBillingCycleText(subscription.billingCycle)}</span>
          </div>
          <div class="info-row">
            <span class="label">Başlangıç:</span>
            <span class="value">${formatDate(subscription.startDate)}</span>
          </div>
          <div class="info-row">
            <span class="label">Bitiş:</span>
            <span class="value">${formatDate(subscription.endDate)}</span>
          </div>
          ${daysLeft > 0 ? `
            <div class="info-row">
              <span class="label">Kalan Süre:</span>
              <span class="value" style="color: ${daysLeft < 7 ? 'var(--color-danger)' : 'var(--color-success)'};">
                ${daysLeft} gün
              </span>
            </div>
          ` : ''}
          ${subscription.maxMessages ? `
            <div class="info-row">
              <span class="label">Mesaj Limiti:</span>
              <span class="value">${subscription.maxMessages.toLocaleString()}/ay</span>
            </div>
          ` : ''}
          ${subscription.features && subscription.features.length > 0 ? `
            <div class="features-list">
              <strong>Özellikler:</strong>
              <ul>
                ${subscription.features.map(f => `<li>✓ ${escapeHtml(f)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${subscription.autoRenew ? `
            <div class="info-note" style="margin-top: 1rem; padding: 0.75rem; background: #f0f9ff; border-radius: 0.5rem;">
              ℹ️ Aboneliğiniz otomatik olarak yenilenecektir
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Render payment summary
function renderPaymentSummary(summary) {
  const container = document.getElementById('paymentSummary');
  if (!container) return;

  if (!summary || !summary.recentPayments || summary.recentPayments.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>💳 Ödeme Geçmişi</h3>
        </div>
        <div class="card-body">
          <div class="empty-state">
            <p>Henüz ödeme kaydı bulunmuyor</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const stats = summary.stats || {};
  
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>💳 Ödeme Geçmişi</h3>
      </div>
      <div class="card-body">
        <div class="payment-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="mini-stat">
            <div class="mini-stat-label">Toplam</div>
            <div class="mini-stat-value">${stats.total || 0}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">Tamamlanan</div>
            <div class="mini-stat-value" style="color: var(--color-success);">${stats.completed || 0}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-label">Toplam Tutar</div>
            <div class="mini-stat-value">${(stats.totalAmount || 0).toLocaleString()} ₺</div>
          </div>
        </div>
        
        <div class="payment-list">
          <strong style="display: block; margin-bottom: 0.75rem;">Son Ödemeler:</strong>
          ${summary.recentPayments.map(payment => {
            const statusBadge = getPaymentStatusBadge(payment.status);
            return `
              <div class="payment-item" style="padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <div style="font-weight: 600;">${payment.amount} ${payment.currency || 'TRY'}</div>
                    <div style="font-size: 0.875rem; color: var(--color-text-muted);">
                      ${payment.subscription ? escapeHtml(payment.subscription.planName) : 'Ödeme'}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                      ${formatDate(payment.createdAt)}
                    </div>
                  </div>
                  ${statusBadge}
                </div>
                ${payment.description ? `
                  <div style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--color-text-muted);">
                    ${escapeHtml(payment.description)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// Helper: Get status badge
function getStatusBadge(status) {
  const badges = {
    ACTIVE: '<span class="badge badge-success">Aktif</span>',
    CANCELLED: '<span class="badge badge-warning">İptal Edildi</span>',
    EXPIRED: '<span class="badge badge-danger">Süresi Doldu</span>',
    SUSPENDED: '<span class="badge badge-secondary">Askıda</span>',
  };
  return badges[status] || '<span class="badge badge-secondary">Bilinmiyor</span>';
}

// Helper: Get payment status badge
function getPaymentStatusBadge(status) {
  const badges = {
    PENDING: '<span class="badge badge-warning">Bekliyor</span>',
    COMPLETED: '<span class="badge badge-success">Tamamlandı</span>',
    FAILED: '<span class="badge badge-danger">Başarısız</span>',
    REFUNDED: '<span class="badge badge-secondary">İade Edildi</span>',
  };
  return badges[status] || '<span class="badge badge-secondary">Bilinmiyor</span>';
}

// Helper: Get billing cycle text
function getBillingCycleText(cycle) {
  const texts = {
    MONTHLY: 'Aylık',
    QUARTERLY: '3 Aylık',
    YEARLY: 'Yıllık',
  };
  return texts[cycle] || cycle;
}

// Helper: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions
if (typeof window !== 'undefined') {
  window.loadActiveSubscription = loadActiveSubscription;
  window.loadPaymentSummary = loadPaymentSummary;
}
