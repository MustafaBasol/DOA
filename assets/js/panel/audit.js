// Audit Logs JavaScript

const API_URL = 'http://localhost:3000/api';
let currentPage = 1;
let totalPages = 1;
let filters = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAuditLogs();
    
    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', () => loadAuditLogs());
    document.getElementById('filterBtn').addEventListener('click', toggleFilters);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
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
    try {
        showLoading();
        currentPage = page;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            ...filters
        });

        const response = await fetch(`${API_URL}/audit?${params}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load audit logs');
        }

        const result = await response.json();
        displayLogs(result.data);
        displayTimeline(result.data);
        updatePagination(result);
        updateStats(result);
        hideLoading();
    } catch (error) {
        console.error('Error loading audit logs:', error);
        showAlert('Denetim kayıtları yüklenirken hata oluştu', 'danger');
        hideLoading();
    }
}

// Display logs table
function displayLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    
    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-2">Kayıt bulunamadı</p>
                </td>
            </tr>
        `;
        return;
    }

    const actionColors = {
        'create': 'success',
        'update': 'primary',
        'delete': 'danger',
        'read': 'info',
        'login': 'success',
        'logout': 'secondary'
    };

    tbody.innerHTML = logs.map(log => {
        const actionType = log.action.split('_')[0] || 'read';
        const badgeColor = actionColors[actionType] || 'secondary';
        const date = new Date(log.createdAt);

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
    window.location.href = 'index.html';
}
