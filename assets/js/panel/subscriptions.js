// Admin Subscriptions Management
checkAuth(['ADMIN']);

let currentPage = 1;
let currentFilters = {};
let isEditMode = false;
let editingId = null;

// Load subscriptions
async function loadSubscriptions() {
  try {
    showLoading();
    
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: '20',
      ...currentFilters,
    });

    const data = await apiCall(`/subscriptions?${queryParams}`);
    renderSubscriptionsTable(data.subscriptions);
    renderPagination(data.pagination);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Abonelikler yüklenirken hata oluştu', 'error');
  }
}

// Load stats
async function loadStats() {
  try {
    const data = await apiCall('/subscriptions/stats');
    document.getElementById('statActive').textContent = data.stats.active || 0;
    document.getElementById('statCancelled').textContent = data.stats.cancelled || 0;
    document.getElementById('statExpired').textContent = data.stats.expired || 0;
    document.getElementById('statTotal').textContent = data.stats.total || 0;
  } catch (error) {
    console.error('Stats error:', error);
  }
}

// Load users for dropdown
async function loadUsersForDropdown() {
  try {
    const data = await apiCall('/users?limit=1000');
    const select = document.getElementById('userId');
    select.innerHTML = '<option value="">Seçiniz...</option>';
    data.users.forEach(user => {
      const displayName = user.companyName || user.fullName || user.email;
      select.innerHTML += `<option value="${user.id}">${displayName} (${user.email})</option>`;
    });
  } catch (error) {
    console.error('Users load error:', error);
  }
}

// Render subscriptions table
function renderSubscriptionsTable(subscriptions) {
  const tbody = document.getElementById('subscriptionsTableBody');
  
  if (subscriptions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">Abonelik bulunamadı</td></tr>';
    return;
  }

  tbody.innerHTML = subscriptions.map(sub => {
    const userName = sub.user.companyName || sub.user.fullName || sub.user.email;
    const statusBadge = getStatusBadge(sub.status);
    const billingCycle = getBillingCycleText(sub.billingCycle);
    
    return `
      <tr>
        <td><strong>${escapeHtml(userName)}</strong><br><small>${escapeHtml(sub.user.email)}</small></td>
        <td>${escapeHtml(sub.planName)}</td>
        <td>${sub.planPrice} ₺</td>
        <td>${billingCycle}</td>
        <td>${statusBadge}</td>
        <td>${formatDate(sub.startDate)}</td>
        <td>${formatDate(sub.endDate)}</td>
        <td class="actions-cell">
          <button onclick="editSubscription(${sub.id})" class="btn-icon" title="Düzenle">✏️</button>
          ${sub.status === 'ACTIVE' ? `<button onclick="cancelSubscription(${sub.id})" class="btn-icon" title="İptal Et">🚫</button>` : ''}
          <button onclick="deleteSubscription(${sub.id})" class="btn-icon" title="Sil">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open create modal
async function openCreateModal() {
  isEditMode = false;
  editingId = null;
  
  document.getElementById('modalTitle').textContent = 'Yeni Abonelik';
  document.getElementById('subscriptionForm').reset();
  document.getElementById('statusGroup').style.display = 'none';
  
  // Set default dates
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 1);
  
  document.getElementById('startDate').valueAsDate = today;
  document.getElementById('endDate').valueAsDate = endDate;
  
  await loadUsersForDropdown();
  document.getElementById('subscriptionModal').style.display = 'flex';
}

// Edit subscription
async function editSubscription(id) {
  try {
    showLoading();
    const data = await apiCall(`/subscriptions/${id}`);
    const sub = data.subscription;
    
    isEditMode = true;
    editingId = id;
    
    document.getElementById('modalTitle').textContent = 'Abonelik Düzenle';
    document.getElementById('statusGroup').style.display = 'block';
    
    await loadUsersForDropdown();
    
    // Fill form
    document.getElementById('userId').value = sub.userId;
    document.getElementById('planName').value = sub.planName;
    document.getElementById('planPrice').value = sub.planPrice;
    document.getElementById('billingCycle').value = sub.billingCycle;
    document.getElementById('startDate').valueAsDate = new Date(sub.startDate);
    document.getElementById('endDate').valueAsDate = new Date(sub.endDate);
    document.getElementById('maxMessages').value = sub.maxMessages || '';
    document.getElementById('maxUsers').value = sub.maxUsers || '';
    document.getElementById('autoRenew').checked = sub.autoRenew;
    document.getElementById('status').value = sub.status;
    
    document.getElementById('subscriptionModal').style.display = 'flex';
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Abonelik yüklenirken hata oluştu', 'error');
  }
}

// Cancel subscription
async function cancelSubscription(id) {
  if (!confirm('Bu aboneliği iptal etmek istediğinizden emin misiniz?')) return;
  
  try {
    showLoading();
    await apiCall(`/subscriptions/${id}/cancel`, { method: 'POST' });
    hideLoading();
    showToast('Abonelik iptal edildi', 'success');
    loadSubscriptions();
    loadStats();
  } catch (error) {
    hideLoading();
    showToast('Abonelik iptal edilirken hata oluştu', 'error');
  }
}

// Delete subscription
async function deleteSubscription(id) {
  if (!confirm('Bu aboneliği kalıcı olarak silmek istediğinizden emin misiniz?')) return;
  
  try {
    showLoading();
    await apiCall(`/subscriptions/${id}`, { method: 'DELETE' });
    hideLoading();
    showToast('Abonelik silindi', 'success');
    loadSubscriptions();
    loadStats();
  } catch (error) {
    hideLoading();
    showToast('Abonelik silinirken hata oluştu', 'error');
  }
}

// Form submit
document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    userId: parseInt(document.getElementById('userId').value),
    planName: document.getElementById('planName').value,
    planPrice: parseFloat(document.getElementById('planPrice').value),
    billingCycle: document.getElementById('billingCycle').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    maxMessages: document.getElementById('maxMessages').value ? parseInt(document.getElementById('maxMessages').value) : null,
    maxUsers: document.getElementById('maxUsers').value ? parseInt(document.getElementById('maxUsers').value) : null,
    autoRenew: document.getElementById('autoRenew').checked,
  };
  
  if (isEditMode) {
    formData.status = document.getElementById('status').value;
  }
  
  try {
    showLoading();
    
    if (isEditMode) {
      await apiCall(`/subscriptions/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      showToast('Abonelik güncellendi', 'success');
    } else {
      await apiCall('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      showToast('Abonelik oluşturuldu', 'success');
    }
    
    closeModal();
    loadSubscriptions();
    loadStats();
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast(error.message || 'İşlem başarısız', 'error');
  }
});

// Close modal
function closeModal() {
  document.getElementById('subscriptionModal').style.display = 'none';
  document.getElementById('subscriptionForm').reset();
}

// Filters
document.getElementById('searchInput').addEventListener('input', (e) => {
  // Search will be client-side for now
  currentPage = 1;
  loadSubscriptions();
});

document.getElementById('statusFilter').addEventListener('change', (e) => {
  currentFilters.status = e.target.value;
  currentPage = 1;
  loadSubscriptions();
});

// Render pagination
function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  loadSubscriptions();
}

// Helper functions
function getStatusBadge(status) {
  const badges = {
    ACTIVE: '<span class="badge badge-success">Aktif</span>',
    CANCELLED: '<span class="badge badge-warning">İptal Edildi</span>',
    EXPIRED: '<span class="badge badge-danger">Süresi Doldu</span>',
    SUSPENDED: '<span class="badge badge-secondary">Askıda</span>',
  };
  return badges[status] || status;
}

function getBillingCycleText(cycle) {
  const texts = {
    MONTHLY: 'Aylık',
    QUARTERLY: '3 Aylık',
    YEARLY: 'Yıllık',
  };
  return texts[cycle] || cycle;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('tr-TR');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

function showToast(message, type = 'info') {
  alert(message); // Simplified for now
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSubscriptions();
  loadStats();
});
