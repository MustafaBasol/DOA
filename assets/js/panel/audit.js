// Audit Logs JavaScript - Enhanced UI Version

const API_URL = 'http://localhost:3000/api';
let currentPage = 1;
let totalPages = 1;
let filters = {};
let allLogs = [];
let currentView = 'table'; // 'table' or 'timeline'

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAuditLogs();
    loadUsersList();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const filterDate = document.getElementById('filterDate');
    if (filterDate) {
        filterDate.addEventListener('change', (e) => {
            const customRange = document.getElementById('customDateRange');
            if (customRange) {
                customRange.style.display = e.target.value === 'custom' ? 'grid' : 'none';
            }
        });
    }
}

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Unauthorized');
        }

        const { data } = await response.json();
        
        // Only SUPER_ADMIN and ADMIN can access audit logs
        if (!['SUPER_ADMIN', 'ADMIN'].includes(data.role)) {
            alert('Bu sayfaya erişim yetkiniz yok.');
            window.location.href = '/dashboard.html';
            return;
        }

        // Initialize Socket.IO
        if (typeof io !== 'undefined') {
            initializeSocket();
        }
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// Initialize Socket.IO for real-time updates
function initializeSocket() {
    const token = localStorage.getItem('token');
    const socket = io('/', {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
        console.log('Socket connected');
    });

    socket.on('audit:new', (data) => {
        console.log('New audit log:', data);
        loadAuditLogs(); // Reload logs
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
}

// Get auth headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// Load audit logs
async function loadAuditLogs(page = 1) {
    const token = localStorage.getItem('token');
    const loading = document.getElementById('logsLoading');
    const error = document.getElementById('logsError');
    const tableView = document.getElementById('tableView');
    const timelineView = document.getElementById('timelineView');
    const empty = document.getElementById('logsEmpty');

    try {
        // Show loading
        loading.style.display = 'block';
        error.style.display = 'none';
        tableView.style.display = 'none';
        timelineView.style.display = 'none';
        empty.style.display = 'none';

        currentPage = page;
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            ...filters
        });

        const response = await fetch(`${API_URL}/audit?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load audit logs');
        }

        const result = await response.json();
        allLogs = result.data;

        // Hide loading
        loading.style.display = 'none';

        if (allLogs.length === 0) {
            empty.style.display = 'block';
            updateStats({ total: 0, data: [] });
            return;
        }

        // Show appropriate view
        if (currentView === 'table') {
            tableView.style.display = 'block';
            displayLogsTable(allLogs);
        } else {
            timelineView.style.display = 'block';
            displayTimeline(allLogs);
        }

        updatePagination(result);
        updateStats(result);

    } catch (error) {
        console.error('Error loading audit logs:', error);
        loading.style.display = 'none';
        error.style.display = 'block';
        document.getElementById('errorMessage').textContent = 
            'Denetim kayıtları yüklenirken hata oluştu: ' + error.message;
    }
}

// Display logs table
function displayLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '';

    const actionColors = {
        'create': 'success',
        'update': 'warning',
        'delete': 'danger',
        'read': 'info',
        'login': 'success',
        'logout': 'secondary',
        'export': 'primary'
    };

    logs.forEach(log => {
        const actionType = log.action.split('_')[0] || 'read';
        const badgeColor = actionColors[actionType] || 'secondary';
        const date = new Date(log.createdAt);
        const formattedDate = date.toLocaleString('tr-TR');
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistem';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <small>${formattedDate}</small>
            </td>
            <td>
                <strong>${userName}</strong>
                <br><small style="color: #6b7280;">${log.user?.email || '-'}</small>
            </td>
            <td>
                <span class="badge badge-${badgeColor}">
                    ${formatAction(log.action)}
                </span>
            </td>
            <td>
                ${formatResource(log.resource)}
            </td>
            <td>
                <small>${log.details || '-'}</small>
            </td>
            <td>
                <small>${log.ipAddress || '-'}</small>
            </td>
        `;
        tbody.appendChild(row);
    });
}

        return `
            <tr class="audit-row">
                <td>
                    <small>${date.toLocaleDateString('tr-TR')}</small><br>
                    <small class="text-muted">${date.toLocaleTimeString('tr-TR')}</small>
                </td>
                <td>
                    ${log.user ? `
                        <strong>${log.user.fullName || log.user.email}</strong><br>
                        <small class="text-muted">${log.user.role}</small>
                    ` : '<span class="text-muted">System</span>'}
                </td>
                <td>
                    <span class="badge bg-${badgeColor} action-badge">
                        ${log.action}
                    </span>
                </td>
                <td>
                    <span class="badge bg-secondary">${log.resource}</span>
                    ${log.resourceId ? `<br><small class="text-muted">${log.resourceId.substring(0, 8)}</small>` : ''}
                </td>
                <td>
                    <small>${log.ipAddress || '-'}</small>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showLogDetails('${log.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Display timeline
function displayTimeline(logs) {
    const container = document.getElementById('timelineContainer');
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-clock-history" style="font-size: 3rem;"></i>
                <p class="mt-2">Kayıt bulunamadı</p>
            </div>
        `;
        return;
    }

    // Group by date
    const grouped = {};
    logs.forEach(log => {
        const date = new Date(log.createdAt).toLocaleDateString('tr-TR');
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(log);
    });

    const actionIcons = {
        'create': 'bi-plus-circle',
        'update': 'bi-pencil',
        'delete': 'bi-trash',
        'read': 'bi-eye',
        'login': 'bi-box-arrow-in-right',
        'logout': 'bi-box-arrow-right'
    };

    const actionColors = {
        'create': 'success',
        'update': 'primary',
        'delete': 'danger',
        'read': 'info',
        'login': 'success',
        'logout': 'secondary'
    };

    container.innerHTML = Object.entries(grouped).map(([date, items]) => `
        <div class="mb-4">
            <h5 class="mb-3"><i class="bi bi-calendar3"></i> ${date}</h5>
            ${items.map(log => {
                const actionType = log.action.split('_')[0] || 'read';
                const icon = actionIcons[actionType] || 'bi-circle';
                const color = actionColors[actionType] || 'secondary';
                const time = new Date(log.createdAt).toLocaleTimeString('tr-TR');

                return `
                    <div class="timeline-item">
                        <div class="timeline-icon bg-${color} text-white">
                            <i class="bi ${icon}"></i>
                        </div>
                        <div class="card">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>${log.user?.fullName || 'System'}</strong>
                                        <span class="badge bg-${color} mx-2">${log.action}</span>
                                        <span class="badge bg-secondary">${log.resource}</span>
                                    </div>
                                    <small class="text-muted">${time}</small>
                                </div>
                                ${log.changes && Object.keys(log.changes).length > 0 ? `
                                    <div class="changes-preview mt-2">
                                        <small class="text-muted">
                                            ${Object.keys(log.changes).slice(0, 3).join(', ')}
                                            ${Object.keys(log.changes).length > 3 ? '...' : ''}
                                        </small>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `).join('');
}

// Show log details
async function showLogDetails(logId) {
    try {
        const response = await fetch(`${API_URL}/audit?page=1&limit=100`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load log details');
        }

        const result = await response.json();
        const log = result.data.find(l => l.id === logId);

        if (!log) {
            showAlert('Kayıt bulunamadı', 'warning');
            return;
        }

        document.getElementById('logDetailsContent').innerHTML = `
            <table class="table table-bordered">
                <tr>
                    <th style="width: 30%;">ID</th>
                    <td><code>${log.id}</code></td>
                </tr>
                <tr>
                    <th>Zaman</th>
                    <td>${new Date(log.createdAt).toLocaleString('tr-TR')}</td>
                </tr>
                <tr>
                    <th>Kullanıcı</th>
                    <td>
                        ${log.user ? `
                            ${log.user.fullName || log.user.email} 
                            <span class="badge bg-secondary">${log.user.role}</span>
                        ` : 'System'}
                    </td>
                </tr>
                <tr>
                    <th>Eylem</th>
                    <td><span class="badge bg-primary">${log.action}</span></td>
                </tr>
                <tr>
                    <th>Kaynak</th>
                    <td>
                        <span class="badge bg-secondary">${log.resource}</span>
                        ${log.resourceId ? `<br><small>ID: ${log.resourceId}</small>` : ''}
                    </td>
                </tr>
                <tr>
                    <th>IP Adresi</th>
                    <td>${log.ipAddress || '-'}</td>
                </tr>
                <tr>
                    <th>User Agent</th>
                    <td><small>${log.userAgent || '-'}</small></td>
                </tr>
                ${log.changes && Object.keys(log.changes).length > 0 ? `
                    <tr>
                        <th>Değişiklikler</th>
                        <td>
                            <pre class="bg-light p-2 rounded"><code>${JSON.stringify(log.changes, null, 2)}</code></pre>
                        </td>
                    </tr>
                ` : ''}
            </table>
        `;

        const modal = new bootstrap.Modal(document.getElementById('logModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading log details:', error);
        showAlert('Kayıt detayları yüklenirken hata oluştu', 'danger');
    }
}

// Toggle filters
function toggleFilters() {
    const card = document.getElementById('filtersCard');
    card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

// Apply filters
function applyFilters() {
    filters = {};
    
    const resource = document.getElementById('filterResource').value;
    const action = document.getElementById('filterAction').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    if (resource) filters.resource = resource;
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate).toISOString();
    if (endDate) filters.endDate = new Date(endDate).toISOString();

    loadAuditLogs(1);
}

// Clear filters
function clearFilters() {
    filters = {};
    document.getElementById('filterResource').value = '';
    document.getElementById('filterAction').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    loadAuditLogs(1);
}

// Update pagination
function updatePagination(result) {
    totalPages = result.totalPages;
    const pagination = document.getElementById('pagination');
    const info = document.getElementById('paginationInfo');

    info.textContent = `${result.total} kayıttan ${(result.page - 1) * result.limit + 1}-${Math.min(result.page * result.limit, result.total)} arası gösteriliyor`;

    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${result.page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadAuditLogs(${result.page - 1}); return false;">Önceki</a>
        </li>
    `;

    // Page numbers
    for (let i = Math.max(1, result.page - 2); i <= Math.min(result.totalPages, result.page + 2); i++) {
        html += `
            <li class="page-item ${i === result.page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadAuditLogs(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Next button
    html += `
        <li class="page-item ${result.page === result.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadAuditLogs(${result.page + 1}); return false;">Sonraki</a>
        </li>
    `;

    pagination.innerHTML = html;
}

// Update stats
function updateStats(result) {
    document.getElementById('totalLogs').textContent = result.total;
    
    // Calculate today's logs
    const today = new Date().toDateString();
    const todayCount = result.data.filter(log => 
        new Date(log.createdAt).toDateString() === today
    ).length;
    document.getElementById('todayLogs').textContent = todayCount;

    // Active users
    const uniqueUsers = new Set(result.data.map(log => log.userId).filter(Boolean));
    document.getElementById('activeUsers').textContent = uniqueUsers.size;

    // Top action
    const actionCounts = {};
    result.data.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    const topAction = Object.entries(actionCounts).sort(([,a], [,b]) => b - a)[0];
    document.getElementById('topAction').textContent = topAction ? topAction[0] : '-';
}

// Show loading
function showLoading() {
    // Could add a loading spinner
}

// Hide loading
function hideLoading() {
    // Could remove loading spinner
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login.html';
}

// Load users list for filter
async function loadUsersList() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) return;

        const { data } = await response.json();
        const userSelect = document.getElementById('filterUser');
        
        if (!userSelect) return;

        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.firstName} ${user.lastName}`;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Toggle view (table/timeline)
function toggleView(view) {
    currentView = view;
    
    // Update button states
    document.getElementById('viewTable').style.color = view === 'table' ? '#3b82f6' : '#6b7280';
    document.getElementById('viewTimeline').style.color = view === 'timeline' ? '#3b82f6' : '#6b7280';
    
    // Show/hide views
    document.getElementById('tableView').style.display = view === 'table' ? 'block' : 'none';
    document.getElementById('timelineView').style.display = view === 'timeline' ? 'block' : 'none';
    
    // Render appropriate view
    if (view === 'timeline') {
        displayTimeline(allLogs);
    } else {
        displayLogsTable(allLogs);
    }
}

// Apply custom date range
function applyCustomDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Lütfen başlangıç ve bitiş tarihlerini seçin.');
        return;
    }
    
    filters.startDate = startDate;
    filters.endDate = endDate;
    loadAuditLogs();
}

// Export audit logs
async function exportAuditLogs() {
    const token = localStorage.getItem('token');
    
    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_URL}/audit/export?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Denetim kayıtları başarıyla dışa aktarıldı', 'success');
    } catch (error) {
        console.error('Error exporting audit logs:', error);
        showToast('Dışa aktarma sırasında hata oluştu: ' + error.message, 'error');
    }
}

// Format resource name
function formatResource(resource) {
    const names = {
        users: 'Kullanıcılar',
        clients: 'Müşteriler',
        messages: 'Mesajlar',
        subscriptions: 'Abonelikler',
        payments: 'Ödemeler',
        reports: 'Raporlar',
        analytics: 'Analitik',
        search: 'Arama',
        audit: 'Denetim',
        permissions: 'Yetkiler',
        settings: 'Ayarlar',
        webhooks: 'Webhook\'lar',
        notifications: 'Bildirimler'
    };
    return names[resource] || resource;
}

// Format action name
function formatAction(action) {
    const names = {
        create: 'Oluştur',
        update: 'Güncelle',
        delete: 'Sil',
        read: 'Görüntüle',
        login: 'Giriş',
        logout: 'Çıkış',
        export: 'Dışa Aktar',
        import: 'İçe Aktar',
        create_payment: 'Ödeme Oluştur',
        update_payment: 'Ödeme Güncelle',
        delete_payment: 'Ödeme Sil',
        create_subscription: 'Abonelik Oluştur',
        update_subscription: 'Abonelik Güncelle',
        cancel_subscription: 'Abonelik İptal',
        delete_subscription: 'Abonelik Sil'
    };
    return names[action] || action.replace(/_/g, ' ');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add CSS for timeline view
const style = document.createElement('style');
style.textContent = `
    .timeline {
        position: relative;
        padding: 2rem 0;
    }
    
    .timeline::before {
        content: '';
        position: absolute;
        left: 20px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e5e7eb;
    }
    
    .timeline-item {
        position: relative;
        padding-left: 60px;
        margin-bottom: 2rem;
    }
    
    .timeline-dot {
        position: absolute;
        left: 12px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        background: #3b82f6;
        box-shadow: 0 0 0 3px #e5e7eb;
    }
    
    .timeline-content {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
    }
    
    .timeline-content-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 0.5rem;
    }
    
    .timeline-content-body {
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .spinner {
        border: 3px solid #f3f4f6;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .btn-icon {
        padding: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .btn-icon:hover {
        color: #3b82f6;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6b7280;
    }
    
    .empty-state svg {
        margin: 0 auto 1rem;
        color: #cbd5e1;
    }
    
    .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: #374151;
    }
`;
document.head.appendChild(style);
