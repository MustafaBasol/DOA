// Admin Payments Management
checkAuth(['ADMIN']);

let currentPage = 1;
let currentFilters = {};
let isEditMode = false;
let editingId = null;

// Load payments
async function loadPayments() {
  try {
    showLoading();
    
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: '20',
      ...currentFilters,
    });

    const data = await apiCall(`/payments?${queryParams}`);
    renderPaymentsTable(data.payments);
    renderPagination(data.pagination);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Ödemeler yüklenirken hata oluştu', 'error');
  }
}

// Load stats
async function loadStats() {
  try {
    const data = await apiCall('/payments/stats');
    document.getElementById('statCompleted').textContent = data.stats.completed || 0;
    document.getElementById('statPending').textContent = data.stats.pending || 0;
    document.getElementById('statTotalAmount').textContent = (data.stats.totalAmount || 0).toLocaleString() + ' ₺';
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

// Render payments table
function renderPaymentsTable(payments) {
  const tbody = document.getElementById('paymentsTableBody');
  
  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">Ödeme bulunamadı</td></tr>';
    return;
  }

  tbody.innerHTML = payments.map(payment => {
    const userName = payment.user.companyName || payment.user.fullName || payment.user.email;
    const statusBadge = getStatusBadge(payment.status);
    const methodText = getPaymentMethodText(payment.paymentMethod);
    
    return `
      <tr>
        <td><strong>${escapeHtml(userName)}</strong><br><small>${escapeHtml(payment.user.email)}</small></td>
        <td><strong>${payment.amount} ${payment.currency}</strong></td>
        <td>${methodText}</td>
        <td>${statusBadge}</td>
        <td>${escapeHtml(payment.description || '-')}</td>
        <td>${formatDateTime(payment.createdAt)}</td>
        <td class="actions-cell">
          <button onclick="editPayment(${payment.id})" class="btn-icon" title="Düzenle">✏️</button>
          <button onclick="deletePayment(${payment.id})" class="btn-icon" title="Sil">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open create modal
async function openCreateModal() {
  isEditMode = false;
  editingId = null;
  
  document.getElementById('modalTitle').textContent = 'Yeni Ödeme';
  document.getElementById('paymentForm').reset();
  document.getElementById('statusGroup').style.display = 'none';
  document.getElementById('currency').value = 'TRY';
  
  await loadUsersForDropdown();
  document.getElementById('paymentModal').style.display = 'flex';
}

// Edit payment
async function editPayment(id) {
  try {
    showLoading();
    const data = await apiCall(`/payments/${id}`);
    const payment = data.payment;
    
    isEditMode = true;
    editingId = id;
    
    document.getElementById('modalTitle').textContent = 'Ödeme Düzenle';
    document.getElementById('statusGroup').style.display = 'block';
    
    await loadUsersForDropdown();
    
    // Fill form
    document.getElementById('userId').value = payment.userId;
    document.getElementById('amount').value = payment.amount;
    document.getElementById('currency').value = payment.currency;
    document.getElementById('paymentMethod').value = payment.paymentMethod;
    document.getElementById('transactionId').value = payment.transactionId || '';
    document.getElementById('description').value = payment.description || '';
    document.getElementById('status').value = payment.status;
    
    document.getElementById('paymentModal').style.display = 'flex';
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Ödeme yüklenirken hata oluştu', 'error');
  }
}

// Delete payment
async function deletePayment(id) {
  if (!confirm('Bu ödemeyi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
  
  try {
    showLoading();
    await apiCall(`/payments/${id}`, { method: 'DELETE' });
    hideLoading();
    showToast('Ödeme silindi', 'success');
    loadPayments();
    loadStats();
  } catch (error) {
    hideLoading();
    showToast('Ödeme silinirken hata oluştu', 'error');
  }
}

// Form submit
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    userId: parseInt(document.getElementById('userId').value),
    amount: parseFloat(document.getElementById('amount').value),
    currency: document.getElementById('currency').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    transactionId: document.getElementById('transactionId').value || undefined,
    description: document.getElementById('description').value || undefined,
  };
  
  if (isEditMode) {
    formData.status = document.getElementById('status').value;
  }
  
  try {
    showLoading();
    
    if (isEditMode) {
      await apiCall(`/payments/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      showToast('Ödeme güncellendi', 'success');
    } else {
      await apiCall('/payments', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      showToast('Ödeme oluşturuldu', 'success');
    }
    
    closeModal();
    loadPayments();
    loadStats();
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast(error.message || 'İşlem başarısız', 'error');
  }
});

// Close modal
function closeModal() {
  document.getElementById('paymentModal').style.display = 'none';
  document.getElementById('paymentForm').reset();
}

// Filters
document.getElementById('searchInput').addEventListener('input', (e) => {
  currentPage = 1;
  loadPayments();
});

document.getElementById('statusFilter').addEventListener('change', (e) => {
  currentFilters.status = e.target.value;
  currentPage = 1;
  loadPayments();
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
  loadPayments();
}

// Helper functions
function getStatusBadge(status) {
  const badges = {
    PENDING: '<span class="badge badge-warning">Bekliyor</span>',
    COMPLETED: '<span class="badge badge-success">Tamamlandı</span>',
    FAILED: '<span class="badge badge-danger">Başarısız</span>',
    REFUNDED: '<span class="badge badge-secondary">İade Edildi</span>',
  };
  return badges[status] || status;
}

function getPaymentMethodText(method) {
  const methods = {
    CREDIT_CARD: 'Kredi Kartı',
    BANK_TRANSFER: 'Banka Transferi',
    PAYPAL: 'PayPal',
    OTHER: 'Diğer',
  };
  return methods[method] || method;
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('tr-TR');
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
  loadPayments();
  loadStats();
});
