// =============================================================
// BPVN PORTAL ADMIN DASHBOARD - CLIENT SCRIPT
// =============================================================

const API_BASE = '/api/v1';
let authToken = localStorage.getItem('bpvn_admin_token') || '';
let currentUser = JSON.parse(localStorage.getItem('bpvn_admin_user') || 'null');

let allApps = [];
let allUsers = [];
let allLogs = [];
let activeCategory = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initAuth();
  initEventListeners();
});

// -------------------------------------------------------------
// CLOCK
// -------------------------------------------------------------
function initClock() {
  const clockEl = document.getElementById('liveClock');
  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    clockEl.textContent = `${dateStr} • ${timeStr}`;
  }
  update();
  setInterval(update, 1000);
}

// -------------------------------------------------------------
// AUTH & SESSION
// -------------------------------------------------------------
function initAuth() {
  if (authToken && currentUser) {
    showAppLayout();
  } else {
    showLoginLayout();
  }
}

function showLoginLayout() {
  document.getElementById('loginSection').style.display = 'flex';
  document.getElementById('appSection').style.display = 'none';
  lucide.createIcons();
}

function showAppLayout() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('appSection').style.display = 'flex';

  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.full_name || currentUser.username;
    document.getElementById('userRole').textContent = currentUser.role || 'ADMIN';
    document.getElementById('userAvatar').textContent = (currentUser.full_name || currentUser.username).substring(0, 2).toUpperCase();
  }

  loadDashboardStats();
  loadApps();
  loadUsers();
  loadAuditLogs();
  loadSystemConfig();
  loadSimulatorData();

  lucide.createIcons();
}

function logout() {
  localStorage.removeItem('bpvn_admin_token');
  localStorage.removeItem('bpvn_admin_user');
  authToken = '';
  currentUser = null;
  showToast('Đã đăng xuất khỏi hệ thống', 'info');
  showLoginLayout();
}

// -------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------
function initEventListeners() {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Đăng nhập thất bại', 'error');
        return;
      }

      if (data.data.user.role !== 'SUPER_ADMIN' && data.data.user.role !== 'IT_ADMIN') {
        showToast('Tài khoản của bạn không có quyền truy cập trang Quản trị', 'error');
        return;
      }

      authToken = data.data.token;
      currentUser = data.data.user;
      localStorage.setItem('bpvn_admin_token', authToken);
      localStorage.setItem('bpvn_admin_user', JSON.stringify(currentUser));

      showToast(`Xin chào ${currentUser.full_name || currentUser.username}!`, 'success');
      showAppLayout();
    } catch (err) {
      showToast('Lỗi kết nối máy chủ API', 'error');
    }
  });

  // Password toggle
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  togglePassBtn.addEventListener('click', () => {
    const input = document.getElementById('loginPassword');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Sidebar Tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // App Search Input
  document.getElementById('appSearchInput').addEventListener('input', (e) => {
    renderAppsTable(e.target.value.toLowerCase());
  });

  // Category Filter Chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-cat');
      renderAppsTable(document.getElementById('appSearchInput').value.toLowerCase());
    });
  });

  // Forms
  document.getElementById('appForm').addEventListener('submit', handleSaveApp);
  document.getElementById('userForm').addEventListener('submit', handleSaveUser);
  document.getElementById('configForm').addEventListener('submit', handleSaveConfig);

  // Maintenance switch toggle msg
  document.getElementById('cfg_maintenance_mode').addEventListener('change', (e) => {
    document.getElementById('maintenanceMsgGroup').style.display = e.target.checked ? 'block' : 'none';
  });
}

// -------------------------------------------------------------
// NAVIGATION
// -------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) targetPane.classList.add('active');

  const titles = {
    dashboard: 'Tổng quan hệ thống',
    apps: 'Quản lý Web Apps Nội bộ',
    users: 'Quản lý Người dùng & Phân quyền',
    logs: 'Nhật ký Truy cập & Bảo mật',
    config: 'Cấu hình Hệ thống & Cập nhật APK',
    simulator: 'Trình Giả lập Giao diện Mobile App'
  };
  document.getElementById('pageTitle').textContent = titles[tabId] || 'Quản trị';

  if (tabId === 'dashboard') loadDashboardStats();
  if (tabId === 'apps') loadApps();
  if (tabId === 'users') loadUsers();
  if (tabId === 'logs') loadAuditLogs();
  if (tabId === 'config') loadSystemConfig();
  if (tabId === 'simulator') loadSimulatorData();

  lucide.createIcons();
}

// -------------------------------------------------------------
// API HELPER
// -------------------------------------------------------------
async function fetchWithAuth(url, options = {}) {
  options.headers = options.headers || {};
  options.headers['Authorization'] = `Bearer ${authToken}`;
  options.headers['Content-Type'] = 'application/json';

  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    if (res.status === 401) logout();
  }
  return res.json();
}

// -------------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------------
async function loadDashboardStats() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/stats`);
    if (res.success) {
      document.getElementById('statTotalApps').textContent = res.data.totalApps;
      document.getElementById('statTotalUsers').textContent = res.data.totalUsers;
      document.getElementById('statTodayLogins').textContent = res.data.todayLogins;
      document.getElementById('navAppsCount').textContent = res.data.totalApps;

      // Render recent logs
      const tbody = document.getElementById('recentLogsTableBody');
      if (res.data.recentLogs && res.data.recentLogs.length > 0) {
        tbody.innerHTML = res.data.recentLogs.map(log => `
          <tr>
            <td><span class="text-dim">${formatTime(log.timestamp)}</span></td>
            <td><b>${escapeHtml(log.username)}</b></td>
            <td><span class="badge-pill ${getActionBadge(log.action)}">${log.action}</span></td>
            <td>${escapeHtml(log.details || '-')}</td>
            <td><code>${escapeHtml(log.ip_address)}</code></td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có nhật ký ghi nhận</td></tr>';
      }
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// -------------------------------------------------------------
// APPS MANAGEMENT
// -------------------------------------------------------------
async function loadApps() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/apps`);
    if (res.success) {
      allApps = res.data;
      document.getElementById('navAppsCount').textContent = allApps.length;
      renderAppsTable();
    }
  } catch (err) {
    showToast('Lỗi khi tải danh sách Web Apps', 'error');
  }
}

function renderAppsTable(search = '') {
  const tbody = document.getElementById('appsTableBody');
  let filtered = allApps;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(a => a.category_key === activeCategory);
  }

  if (search) {
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(search) || 
      a.name_vn.toLowerCase().includes(search) ||
      a.url.toLowerCase().includes(search) ||
      (a.description && a.description.toLowerCase().includes(search))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không tìm thấy ứng dụng nào</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((app, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <div class="app-row-title">
          <div class="app-icon-circle" style="background: ${app.color_hex || '#0085FF'}">
            <i data-lucide="${app.icon_name || 'globe'}"></i>
          </div>
          <div>
            <b>${escapeHtml(app.name_vn)}</b>
            <div class="text-dim" style="font-size: 11px;">${escapeHtml(app.name)}</div>
          </div>
        </div>
      </td>
      <td><span class="badge-pill badge-cat">${escapeHtml(app.category_name || app.category_key)}</span></td>
      <td><a href="${escapeHtml(app.url)}" target="_blank" class="text-cyan">${escapeHtml(app.url)}</a></td>
      <td><span class="badge-pill badge-role">${escapeHtml(app.required_role || 'ALL')}</span></td>
      <td>
        <label class="switch">
          <input type="checkbox" ${app.is_active ? 'checked' : ''} onchange="toggleAppActive(${app.id}, this.checked)">
          <span class="slider round"></span>
        </label>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-table-icon" title="Chỉnh sửa" onclick="editApp(${app.id})">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-table-icon btn-delete" title="Xóa" onclick="deleteApp(${app.id})">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

async function toggleAppActive(id, isActive) {
  const app = allApps.find(a => a.id === id);
  if (!app) return;

  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...app, is_active: isActive ? 1 : 0 })
    });
    if (res.success) {
      app.is_active = isActive ? 1 : 0;
      showToast(`Đã ${isActive ? 'bật' : 'tắt'} ứng dụng: ${app.name_vn}`, 'info');
      loadSimulatorData();
    }
  } catch (err) {
    showToast('Lỗi cập nhật trạng thái', 'error');
  }
}

function openAppModal(editData = null) {
  document.getElementById('appModalTitle').textContent = editData ? 'Chỉnh Sửa Web App' : 'Thêm Web App Mới';
  document.getElementById('appFormId').value = editData ? editData.id : '';
  document.getElementById('appFormNameVn').value = editData ? editData.name_vn : '';
  document.getElementById('appFormName').value = editData ? editData.name : '';
  document.getElementById('appFormCategory').value = editData ? editData.category_key : 'hr';
  document.getElementById('appFormColor').value = editData ? editData.color_hex : '#0085FF';
  document.getElementById('appFormUrl').value = editData ? editData.url : '';
  document.getElementById('appFormIcon').value = editData ? editData.icon_name : 'globe';
  document.getElementById('appFormOrder').value = editData ? editData.display_order : (allApps.length + 1);
  document.getElementById('appFormDesc').value = editData ? (editData.description || '') : '';

  document.getElementById('appModal').style.display = 'flex';
  lucide.createIcons();
}

function closeAppModal() {
  document.getElementById('appModal').style.display = 'none';
}

function editApp(id) {
  const app = allApps.find(a => a.id === id);
  if (app) openAppModal(app);
}

async function handleSaveApp(e) {
  e.preventDefault();
  const id = document.getElementById('appFormId').value;
  const payload = {
    name_vn: document.getElementById('appFormNameVn').value.trim(),
    name: document.getElementById('appFormName').value.trim() || document.getElementById('appFormNameVn').value.trim(),
    category_key: document.getElementById('appFormCategory').value,
    color_hex: document.getElementById('appFormColor').value,
    url: document.getElementById('appFormUrl').value.trim(),
    icon_name: document.getElementById('appFormIcon').value,
    display_order: parseInt(document.getElementById('appFormOrder').value) || 1,
    description: document.getElementById('appFormDesc').value.trim()
  };

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/admin/apps/${id}` : `${API_BASE}/admin/apps`;

    const res = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast(res.message, 'success');
      closeAppModal();
      loadApps();
      loadSimulatorData();
    } else {
      showToast(res.message || 'Lỗi lưu ứng dụng', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

async function deleteApp(id) {
  const app = allApps.find(a => a.id === id);
  if (!confirm(`Bạn có chắc chắn muốn xóa ứng dụng "${app ? app.name_vn : id}" không?`)) return;

  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/apps/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Đã xóa ứng dụng thành công!', 'success');
      loadApps();
      loadSimulatorData();
    }
  } catch (err) {
    showToast('Lỗi khi xóa ứng dụng', 'error');
  }
}

// -------------------------------------------------------------
// USERS MANAGEMENT
// -------------------------------------------------------------
async function loadUsers() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/users`);
    if (res.success) {
      allUsers = res.data;
      renderUsersTable();
    }
  } catch (err) {
    showToast('Lỗi khi tải danh sách người dùng', 'error');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Chưa có người dùng nào</td></tr>';
    return;
  }

  tbody.innerHTML = allUsers.map(user => `
    <tr>
      <td>${user.id}</td>
      <td><b>${escapeHtml(user.username)}</b></td>
      <td>${escapeHtml(user.full_name)}</td>
      <td>${escapeHtml(user.department || '-')}</td>
      <td><span class="badge-pill badge-role">${escapeHtml(user.role)}</span></td>
      <td><span class="text-dim">${user.last_login ? formatTime(user.last_login) : 'Chưa đăng nhập'}</span></td>
      <td>
        <span class="badge-pill ${user.is_active ? 'badge-active' : 'badge-inactive'}">
          ${user.is_active ? 'Hoạt động' : 'Đã khóa'}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-table-icon" title="Sửa thông tin" onclick="editUser(${user.id})">
            <i data-lucide="edit-3"></i>
          </button>
          ${user.username !== 'admin' ? `
            <button class="btn-table-icon btn-delete" title="Xóa" onclick="deleteUser(${user.id})">
              <i data-lucide="trash-2"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function openUserModal(editData = null) {
  document.getElementById('userModalTitle').textContent = editData ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Người Dùng Mới';
  document.getElementById('userFormId').value = editData ? editData.id : '';
  document.getElementById('userFormUsername').value = editData ? editData.username : '';
  document.getElementById('userFormUsername').disabled = !!editData;
  document.getElementById('userFormPassword').value = '';
  document.getElementById('userFormPassword').required = !editData;
  document.getElementById('userFormPasswordLabel').textContent = editData ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu *';
  document.getElementById('userFormFullName').value = editData ? editData.full_name : '';
  document.getElementById('userFormDepartment').value = editData ? (editData.department || '') : '';
  document.getElementById('userFormRole').value = editData ? editData.role : 'USER';
  document.getElementById('userFormEmail').value = editData ? (editData.email || '') : '';

  document.getElementById('userModal').style.display = 'flex';
  lucide.createIcons();
}

function closeUserModal() {
  document.getElementById('userModal').style.display = 'none';
}

function editUser(id) {
  const user = allUsers.find(u => u.id === id);
  if (user) openUserModal(user);
}

async function handleSaveUser(e) {
  e.preventDefault();
  const id = document.getElementById('userFormId').value;
  const payload = {
    username: document.getElementById('userFormUsername').value.trim(),
    full_name: document.getElementById('userFormFullName').value.trim(),
    department: document.getElementById('userFormDepartment').value.trim(),
    role: document.getElementById('userFormRole').value,
    email: document.getElementById('userFormEmail').value.trim(),
    is_active: 1
  };

  const pass = document.getElementById('userFormPassword').value;
  if (!id) {
    payload.password = pass;
  } else if (pass) {
    payload.new_password = pass;
  }

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/admin/users/${id}` : `${API_BASE}/admin/users`;

    const res = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast(res.message, 'success');
      closeUserModal();
      loadUsers();
    } else {
      showToast(res.message || 'Lỗi lưu tài khoản', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

async function deleteUser(id) {
  const user = allUsers.find(u => u.id === id);
  if (!confirm(`Bạn có chắc muốn xóa tài khoản "${user ? user.username : id}" không?`)) return;

  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Đã xóa tài khoản!', 'success');
      loadUsers();
    } else {
      showToast(res.message || 'Không thể xóa', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi xóa người dùng', 'error');
  }
}

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
async function loadAuditLogs() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/logs?limit=150`);
    if (res.success) {
      allLogs = res.data;
      const tbody = document.getElementById('auditLogsTableBody');
      if (allLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có nhật ký</td></tr>';
        return;
      }

      tbody.innerHTML = allLogs.map(log => `
        <tr>
          <td><span class="text-dim">${formatTime(log.timestamp)}</span></td>
          <td><b>${escapeHtml(log.username)}</b></td>
          <td><span class="badge-pill ${getActionBadge(log.action)}">${log.action}</span></td>
          <td>${escapeHtml(log.details || '-')}</td>
          <td><code>${escapeHtml(log.ip_address)}</code></td>
          <td title="${escapeHtml(log.user_agent)}"><span class="text-dim" style="font-size: 11px;">${escapeHtml(log.user_agent ? log.user_agent.substring(0, 45) + '...' : '-')}</span></td>
        </tr>
      `).join('');
      lucide.createIcons();
    }
  } catch (err) {
    showToast('Lỗi tải nhật ký bảo mật', 'error');
  }
}

// -------------------------------------------------------------
// SYSTEM CONFIG
// -------------------------------------------------------------
async function loadSystemConfig() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/config`);
    if (res.success) {
      const cfg = {};
      res.data.forEach(c => cfg[c.key] = c.value);

      document.getElementById('cfg_app_name').value = cfg.app_name || '';
      document.getElementById('cfg_company_name').value = cfg.company_name || '';
      document.getElementById('cfg_latest_app_version').value = cfg.latest_app_version || '';
      document.getElementById('cfg_min_app_version').value = cfg.min_app_version || '';
      document.getElementById('cfg_apk_download_url').value = cfg.apk_download_url || '';
      document.getElementById('cfg_announcement').value = cfg.announcement || '';
      document.getElementById('cfg_vpn_required').checked = cfg.vpn_required === '1';
      document.getElementById('cfg_maintenance_mode').checked = cfg.maintenance_mode === '1';
      document.getElementById('cfg_maintenance_message').value = cfg.maintenance_message || '';

      document.getElementById('maintenanceMsgGroup').style.display = cfg.maintenance_mode === '1' ? 'block' : 'none';
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

async function handleSaveConfig(e) {
  e.preventDefault();
  const payload = {
    app_name: document.getElementById('cfg_app_name').value.trim(),
    company_name: document.getElementById('cfg_company_name').value.trim(),
    latest_app_version: document.getElementById('cfg_latest_app_version').value.trim(),
    min_app_version: document.getElementById('cfg_min_app_version').value.trim(),
    apk_download_url: document.getElementById('cfg_apk_download_url').value.trim(),
    announcement: document.getElementById('cfg_announcement').value.trim(),
    vpn_required: document.getElementById('cfg_vpn_required').checked ? '1' : '0',
    maintenance_mode: document.getElementById('cfg_maintenance_mode').checked ? '1' : '0',
    maintenance_message: document.getElementById('cfg_maintenance_message').value.trim()
  };

  try {
    const res = await fetchWithAuth(`${API_BASE}/admin/config`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      showToast('Đã lưu cấu hình hệ thống thành công!', 'success');
      loadSimulatorData();
    } else {
      showToast(res.message || 'Lỗi lưu cấu hình', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

// -------------------------------------------------------------
// MOBILE SIMULATOR
// -------------------------------------------------------------
async function loadSimulatorData() {
  try {
    const [appsRes, verRes] = await Promise.all([
      fetch(`${API_BASE}/apps`),
      fetch(`${API_BASE}/system/version`)
    ]);

    const appsData = await appsRes.json();
    const verData = await verRes.json();

    if (verData.success && verData.data.announcement) {
      document.getElementById('simBannerText').textContent = verData.data.announcement;
    }

    const grid = document.getElementById('simAppGrid');
    if (appsData.success && appsData.data.length > 0) {
      grid.innerHTML = appsData.data.map(app => `
        <div class="phone-app-card" onclick="window.open('${escapeHtml(app.url)}', '_blank')">
          <div class="phone-app-icon" style="background: ${app.color_hex || '#0085FF'}">
            <i data-lucide="${app.icon_name || 'globe'}"></i>
          </div>
          <div class="phone-app-title">${escapeHtml(app.name_vn)}</div>
          <div class="phone-app-desc">${escapeHtml(app.description || app.url)}</div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '<div class="text-center text-muted" style="grid-column: span 2;">Chưa có ứng dụng nào được kích hoạt</div>';
    }

    lucide.createIcons();
  } catch (err) {
    console.error('Simulator load failed:', err);
  }
}

// -------------------------------------------------------------
// UTILITIES
// -------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'check-circle',
    error: 'alert-triangle',
    info: 'info'
  };

  toast.innerHTML = `
    <i data-lucide="${iconMap[type] || 'info'}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr.replace(' ', 'T') + (isoStr.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function getActionBadge(action) {
  if (action.includes('SUCCESS') || action.includes('CREATE')) return 'badge-active';
  if (action.includes('FAILED') || action.includes('DELETE') || action.includes('BLOCK')) return 'badge-inactive';
  if (action.includes('UPDATE') || action.includes('RESET')) return 'badge-cat';
  return 'badge-role';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
