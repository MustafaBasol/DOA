// Permissions Management JavaScript

const API_URL = 'http://localhost:3000/api';
let rolesData = [];
let allPermissions = [];
let permissionsByResource = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAllData();
    
    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadAllData);
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

// Load all data
async function loadAllData() {
    try {
        showLoading();
        await Promise.all([
            loadRoles(),
            loadPermissions()
        ]);
        updateStatistics();
        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Veriler yüklenirken hata oluştu', 'danger');
        hideLoading();
    }
}

// Load roles
async function loadRoles() {
    try {
        const response = await fetch(`${API_URL}/permissions/roles`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load roles');
        }

        rolesData = await response.json();
        displayRoles();
        displayMatrix();
    } catch (error) {
        console.error('Error loading roles:', error);
        throw error;
    }
}

// Load permissions
async function loadPermissions() {
    try {
        const [allPerms, byResource] = await Promise.all([
            fetch(`${API_URL}/permissions/permissions`, {
                headers: getAuthHeaders()
            }).then(r => r.json()),
            fetch(`${API_URL}/permissions/permissions/by-resource`, {
                headers: getAuthHeaders()
            }).then(r => r.json())
        ]);

        allPermissions = allPerms;
        permissionsByResource = byResource;
        displayAllPermissions();
    } catch (error) {
        console.error('Error loading permissions:', error);
        throw error;
    }
}

// Display roles
function displayRoles() {
    const container = document.getElementById('rolesContainer');
    
    const roleColors = {
        'SUPER_ADMIN': 'danger',
        'ADMIN': 'primary',
        'MANAGER': 'success',
        'CLIENT': 'info'
    };

    const roleIcons = {
        'SUPER_ADMIN': 'bi-star-fill',
        'ADMIN': 'bi-shield-fill-check',
        'MANAGER': 'bi-person-badge',
        'CLIENT': 'bi-person'
    };

    const roleDescriptions = {
        'SUPER_ADMIN': 'Tüm sistem yetkilerine sahip',
        'ADMIN': 'Sistem yönetimi ve yapılandırma',
        'MANAGER': 'Müşteri ve rapor yönetimi',
        'CLIENT': 'Sınırlı erişim yetkisi'
    };

    container.innerHTML = rolesData.map(role => `
        <div class="col-md-6 mb-3">
            <div class="card permission-card border-${roleColors[role.role]}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 class="card-title mb-1">
                                <i class="bi ${roleIcons[role.role]} text-${roleColors[role.role]}"></i>
                                ${role.role}
                            </h5>
                            <small class="text-muted">${roleDescriptions[role.role]}</small>
                        </div>
                        <span class="badge bg-${roleColors[role.role]} rounded-pill">
                            ${role.permissionCount} Yetki
                        </span>
                    </div>
                    
                    <div class="mb-3">
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-${roleColors[role.role]}" 
                                 role="progressbar" 
                                 style="width: ${(role.permissionCount / allPermissions.length) * 100}%">
                                ${Math.round((role.permissionCount / allPermissions.length) * 100)}%
                            </div>
                        </div>
                    </div>

                    <div class="d-flex flex-wrap gap-1 mb-3" style="max-height: 150px; overflow-y: auto;">
                        ${role.permissions.slice(0, 10).map(p => `
                            <span class="badge bg-secondary permission-badge">
                                ${p.resource}:${p.action}
                            </span>
                        `).join('')}
                        ${role.permissions.length > 10 ? `
                            <span class="badge bg-light text-dark permission-badge">
                                +${role.permissions.length - 10} daha
                            </span>
                        ` : ''}
                    </div>

                    <button class="btn btn-outline-${roleColors[role.role]} btn-sm w-100" 
                            onclick="showRoleDetails('${role.role}')">
                        <i class="bi bi-eye"></i> Detayları Görüntüle
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Display permission matrix
function displayMatrix() {
    const tbody = document.getElementById('matrixBody');
    
    // Create a map of role permissions
    const rolePerms = {};
    rolesData.forEach(role => {
        rolePerms[role.role] = new Set(
            role.permissions.map(p => `${p.resource}:${p.action}`)
        );
    });

    // Group permissions by resource
    const grouped = {};
    allPermissions.forEach(perm => {
        if (!grouped[perm.resource]) {
            grouped[perm.resource] = [];
        }
        grouped[perm.resource].push(perm);
    });

    tbody.innerHTML = Object.entries(grouped).map(([resource, perms]) => {
        return perms.map((perm, index) => {
            const key = `${perm.resource}:${perm.action}`;
            return `
                <tr class="resource-row">
                    ${index === 0 ? `
                        <td rowspan="${perms.length}" class="align-middle">
                            <strong>${resource}</strong>
                        </td>
                    ` : ''}
                    <td>${perm.action}</td>
                    <td class="text-center">
                        ${rolePerms.SUPER_ADMIN?.has(key) ? 
                            '<i class="bi bi-check-circle-fill text-success"></i>' : 
                            '<i class="bi bi-x-circle text-muted"></i>'}
                    </td>
                    <td class="text-center">
                        ${rolePerms.ADMIN?.has(key) ? 
                            '<i class="bi bi-check-circle-fill text-success"></i>' : 
                            '<i class="bi bi-x-circle text-muted"></i>'}
                    </td>
                    <td class="text-center">
                        ${rolePerms.MANAGER?.has(key) ? 
                            '<i class="bi bi-check-circle-fill text-success"></i>' : 
                            '<i class="bi bi-x-circle text-muted"></i>'}
                    </td>
                    <td class="text-center">
                        ${rolePerms.CLIENT?.has(key) ? 
                            '<i class="bi bi-check-circle-fill text-success"></i>' : 
                            '<i class="bi bi-x-circle text-muted"></i>'}
                    </td>
                </tr>
            `;
        }).join('');
    }).join('');
}

// Display all permissions
function displayAllPermissions() {
    const container = document.getElementById('permissionsContainer');
    
    container.innerHTML = Object.entries(permissionsByResource).map(([resource, permissions]) => `
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <i class="bi bi-folder"></i> ${resource}
                    <span class="badge bg-light text-dark float-end">${permissions.length}</span>
                </div>
                <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                    <ul class="list-group list-group-flush">
                        ${permissions.map(perm => `
                            <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                <div>
                                    <strong>${perm.action}</strong>
                                    ${perm.description ? `<br><small class="text-muted">${perm.description}</small>` : ''}
                                </div>
                                <span class="badge bg-secondary">${perm.id.substring(0, 8)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
}

// Show role details
function showRoleDetails(roleName) {
    const role = rolesData.find(r => r.role === roleName);
    if (!role) return;

    const roleColors = {
        'SUPER_ADMIN': 'danger',
        'ADMIN': 'primary',
        'MANAGER': 'success',
        'CLIENT': 'info'
    };

    document.getElementById('roleModalTitle').innerHTML = `
        <i class="bi bi-shield-lock text-${roleColors[roleName]}"></i> ${roleName}
    `;

    // Group permissions by resource
    const grouped = {};
    role.permissions.forEach(perm => {
        if (!grouped[perm.resource]) {
            grouped[perm.resource] = [];
        }
        grouped[perm.resource].push(perm);
    });

    document.getElementById('roleDetailsContent').innerHTML = `
        <div class="mb-3">
            <div class="alert alert-${roleColors[roleName]}">
                <strong>${role.permissionCount} Yetki</strong> - 
                ${Object.keys(grouped).length} farklı kaynak tipi
            </div>
        </div>

        ${Object.entries(grouped).map(([resource, perms]) => `
            <div class="card mb-2">
                <div class="card-header">
                    <i class="bi bi-folder"></i> ${resource}
                    <span class="badge bg-secondary float-end">${perms.length}</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${perms.map(p => `
                            <div class="col-md-6 mb-2">
                                <span class="badge bg-${roleColors[roleName]} me-1">
                                    ${p.action}
                                </span>
                                ${p.description ? `<small class="text-muted">${p.description}</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('')}
    `;

    const modal = new bootstrap.Modal(document.getElementById('roleModal'));
    modal.show();
}

// Update statistics
function updateStatistics() {
    document.getElementById('totalRoles').textContent = rolesData.length;
    document.getElementById('totalPermissions').textContent = allPermissions.length;
    document.getElementById('totalResources').textContent = Object.keys(permissionsByResource).length;
    
    const avgPerms = rolesData.length > 0 
        ? Math.round(rolesData.reduce((sum, r) => sum + r.permissionCount, 0) / rolesData.length)
        : 0;
    document.getElementById('avgPermissions').textContent = avgPerms;
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
