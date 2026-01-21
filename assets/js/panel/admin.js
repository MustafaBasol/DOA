// Admin API client
const API_URL = 'http://localhost:5000/api';

// API helper with error handling
async function adminApiCall(endpoint, options = {}) {
  try {
    const response = await window.apiCall(endpoint, options);
    return response;
  } catch (error) {
    console.error('Admin API Error:', error);
    showToast(error.message || 'Bir hata oluştu', 'error');
    throw error;
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.className = `toast ${type} active`;
  toast.querySelector('.toast-message').textContent = message;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// Loading overlay
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Modal helper
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Users Management
let currentPage = 1;
let currentSearch = '';

async function loadUsers(page = 1, search = '') {
  try {
    showLoading();
    currentPage = page;
    currentSearch = search;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '10',
    });

    if (search) {
      queryParams.append('search', search);
    }

    const data = await adminApiCall(`/users?${queryParams}`);
    
    renderUsersTable(data.users);
    renderPagination(data.pagination);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error loading users:', error);
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div>
            <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">Kullanıcı bulunamadı</p>
            <p>Yeni müşteri eklemek için yukarıdaki butonu kullanın.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>
        <div style="font-weight: 500;">${escapeHtml(user.fullName || '-')}</div>
        <div style="font-size: 0.8125rem; color: var(--color-text-muted);">${escapeHtml(user.email)}</div>
      </td>
      <td>${escapeHtml(user.companyName || '-')}</td>
      <td>${escapeHtml(user.phone || '-')}</td>
      <td>${escapeHtml(user.whatsappNumber || '-')}</td>
      <td>
        <span class="badge ${user.isActive ? 'badge-success' : 'badge-error'}">
          ${user.isActive ? 'Aktif' : 'Pasif'}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="icon-btn" onclick="editUser('${user.id}')" title="Düzenle">
            ✏️
          </button>
          <button class="icon-btn" onclick="toggleUserStatus('${user.id}', ${!user.isActive})" 
                  title="${user.isActive ? 'Pasif Yap' : 'Aktif Yap'}">
            ${user.isActive ? '⏸️' : '▶️'}
          </button>
          <button class="icon-btn" onclick="deleteUser('${user.id}')" title="Sil">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (!container) return;

  const { page, totalPages, total } = pagination;

  container.innerHTML = `
    <button class="pagination-btn" 
            onclick="loadUsers(${page - 1}, currentSearch)" 
            ${page <= 1 ? 'disabled' : ''}>
      ← Önceki
    </button>
    
    <span class="pagination-info">
      Sayfa ${page} / ${totalPages} (Toplam ${total} müşteri)
    </span>
    
    <button class="pagination-btn" 
            onclick="loadUsers(${page + 1}, currentSearch)" 
            ${page >= totalPages ? 'disabled' : ''}>
      Sonraki →
    </button>
  `;
}

// Search handler
let searchTimeout;
function handleSearch(value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadUsers(1, value);
  }, 500);
}

// Create user
async function createUser(formData) {
  try {
    showLoading();
    await adminApiCall('/users', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    
    showToast('Müşteri başarıyla oluşturuldu!');
    closeModal('createUserModal');
    loadUsers(currentPage, currentSearch);
    document.getElementById('createUserForm').reset();
  } catch (error) {
    hideLoading();
  }
}

// Edit user
async function editUser(userId) {
  try {
    showLoading();
    const user = await adminApiCall(`/users/${userId}`);
    hideLoading();
    
    // Fill form
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editFullName').value = user.fullName || '';
    document.getElementById('editCompanyName').value = user.companyName || '';
    document.getElementById('editPhone').value = user.phone || '';
    document.getElementById('editWhatsappNumber').value = user.whatsappNumber || '';
    document.getElementById('editLanguage').value = user.language;
    
    openModal('editUserModal');
  } catch (error) {
    hideLoading();
  }
}

async function updateUser(formData) {
  try {
    showLoading();
    const userId = document.getElementById('editUserId').value;
    
    await adminApiCall(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(formData),
    });
    
    showToast('Müşteri bilgileri güncellendi!');
    closeModal('editUserModal');
    loadUsers(currentPage, currentSearch);
  } catch (error) {
    hideLoading();
  }
}

// Toggle user status
async function toggleUserStatus(userId, newStatus) {
  const confirmed = confirm(`Müşteriyi ${newStatus ? 'aktif' : 'pasif'} yapmak istediğinize emin misiniz?`);
  if (!confirmed) return;

  try {
    showLoading();
    await adminApiCall(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: newStatus }),
    });
    
    showToast(`Müşteri ${newStatus ? 'aktif' : 'pasif'} yapıldı`);
    loadUsers(currentPage, currentSearch);
  } catch (error) {
    hideLoading();
  }
}

// Delete user
async function deleteUser(userId) {
  const confirmed = confirm('Bu müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.');
  if (!confirmed) return;

  try {
    showLoading();
    await adminApiCall(`/users/${userId}`, {
      method: 'DELETE',
    });
    
    showToast('Müşteri silindi');
    loadUsers(currentPage, currentSearch);
  } catch (error) {
    hideLoading();
  }
}

// Utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if on admin users page
  if (document.getElementById('usersTableBody')) {
    loadUsers();
  }

  // Create user form
  const createForm = document.getElementById('createUserForm');
  if (createForm) {
    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        fullName: document.getElementById('fullName').value,
        companyName: document.getElementById('companyName').value,
        phone: document.getElementById('phone').value,
        whatsappNumber: document.getElementById('whatsappNumber').value,
        language: document.getElementById('language').value,
      };
      createUser(formData);
    });
  }

  // Edit user form
  const editForm = document.getElementById('editUserForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        fullName: document.getElementById('editFullName').value,
        companyName: document.getElementById('editCompanyName').value,
        phone: document.getElementById('editPhone').value,
        whatsappNumber: document.getElementById('editWhatsappNumber').value,
        language: document.getElementById('editLanguage').value,
      };
      updateUser(formData);
    });
  }

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  // Modal close handlers
  document.querySelectorAll('.modal-close, [data-close-modal]').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.classList.remove('active');
    });
  });

  // Click outside modal to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
});

// Export functions
if (typeof window !== 'undefined') {
  window.loadUsers = loadUsers;
  window.createUser = createUser;
  window.editUser = editUser;
  window.updateUser = updateUser;
  window.deleteUser = deleteUser;
  window.toggleUserStatus = toggleUserStatus;
  window.showToast = showToast;
  window.openModal = openModal;
  window.closeModal = closeModal;
}
