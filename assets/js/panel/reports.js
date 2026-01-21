// Reports functionality
const API_BASE_URL = 'http://localhost:3001/api';

// Toggle dropdown menu
document.addEventListener('DOMContentLoaded', () => {
  const dropdownBtn = document.getElementById('reportsDropdownBtn');
  const dropdownMenu = document.getElementById('reportsDropdownMenu');

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });
  }
});

// Export report function
async function exportReport(type, format) {
  try {
    showLoading();

    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      window.location.href = '/login.html';
      return;
    }

    // Get date filters if exists
    const startDate = localStorage.getItem('reportStartDate');
    const endDate = localStorage.getItem('reportEndDate');

    // Build query params
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    // Construct URL
    const endpoint = `/reports/${type}/${format}?${params.toString()}`;
    const url = `${API_BASE_URL}${endpoint}`;

    // Fetch report
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Rapor oluşturulamadı');
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `rapor-${type}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Download file
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

    hideLoading();

    // Close dropdown
    const dropdownMenu = document.getElementById('reportsDropdownMenu');
    if (dropdownMenu) {
      dropdownMenu.style.display = 'none';
    }

    // Show success message
    showNotification(`✅ ${getReportName(type, format)} başarıyla indirildi!`, 'success');
  } catch (error) {
    console.error('Export error:', error);
    hideLoading();
    showNotification(`❌ Hata: ${error.message}`, 'error');
  }
}

// Get report display name
function getReportName(type, format) {
  const names = {
    messages: 'Mesaj Raporu',
    customers: 'Müşteri Raporu',
    payments: 'Ödeme Raporu',
    subscriptions: 'Abonelik Raporu',
  };

  const formatName = format === 'excel' ? 'Excel' : 'PDF';
  return `${names[type] || 'Rapor'} (${formatName})`;
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    word-wrap: break-word;
  `;

  // Add to body
  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Loading overlay helpers
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    min-width: 220px;
    z-index: 1000;
    overflow: hidden;
  }

  .dropdown-menu a {
    display: block;
    padding: 0.75rem 1rem;
    color: #1f2937;
    text-decoration: none;
    transition: background 0.2s;
    font-size: 0.875rem;
  }

  .dropdown-menu a:hover {
    background: #f3f4f6;
  }

  .dropdown-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0.25rem 0;
  }

  .btn-secondary {
    background: white;
    color: #4f46e5;
    border: 2px solid #4f46e5;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: #4f46e5;
    color: white;
  }
`;
document.head.appendChild(style);
