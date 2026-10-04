const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8088;
const JWT_SECRET = process.env.JWT_SECRET || 'bpvn_portal_jwt_secret_key_2026_production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Downloads directory for APK
const downloadsDir = path.join(__dirname, 'public', 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Log audit helper
function logAudit(username, action, details, req, isVpn = 1) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown';
    const stmt = db.prepare(`
      INSERT INTO audit_logs (username, action, details, ip_address, user_agent, is_vpn_verified)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(username, action, details, String(ip), String(ua), isVpn ? 1 : 0);
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Thiếu mã xác thực (Token required)' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token hết hạn hoặc không hợp lệ' });
    }
    req.user = user;
    next();
  });
}

// Require Admin Role
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'IT_ADMIN')) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền quản trị (Admin privilege required)' });
  }
  next();
}

// ==========================================
// 📱 PUBLIC & MOBILE APP APIs
// ==========================================

// 1. Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'BPVN Portal Backend & Admin API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. Get Public Apps List (For Mobile App & Web Portal)
app.get('/api/v1/apps', (req, res) => {
  try {
    const category = req.query.category;
    let query = `
      SELECT a.id, a.name, a.name_vn, a.category_key, c.name_vn as category_name, 
             a.url, a.icon_name, a.description, a.color_hex, a.required_role, a.display_order
      FROM apps a
      LEFT JOIN categories c ON a.category_key = c.key
      WHERE a.is_active = 1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND a.category_key = ?`;
      params.push(category);
    }

    query += ` ORDER BY a.display_order ASC, a.id ASC`;
    const apps = db.prepare(query).all(...params);

    res.json({
      success: true,
      total: apps.length,
      data: apps
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Get Categories
app.get('/api/v1/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. User / Admin Login API
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

    if (!user) {
      logAudit(username, 'LOGIN_FAILED', 'Tài khoản không tồn tại', req, 1);
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    if (!user.is_active) {
      logAudit(username, 'LOGIN_BLOCKED', 'Tài khoản đã bị khóa', req, 1);
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ IT!' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      logAudit(username, 'LOGIN_FAILED', 'Sai mật khẩu', req, 1);
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    logAudit(user.username, 'LOGIN_SUCCESS', `Đăng nhập thành công (${user.role})`, req, 1);

    // Create JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        department: user.department,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          department: user.department,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Change Password API
app.post('/api/v1/auth/change-password', authenticateToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const username = req.user.username;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ mật khẩu cũ và mới' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }

    const isMatch = bcrypt.compareSync(oldPassword, user.password_hash);
    if (!isMatch) {
      logAudit(username, 'PASSWORD_CHANGE_FAILED', 'Sai mật khẩu hiện tại', req, 1);
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
    logAudit(username, 'PASSWORD_CHANGE_SUCCESS', 'Đổi mật khẩu thành công', req, 1);

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. System Version & Status Check
app.get('/api/v1/system/version', (req, res) => {
  try {
    const configs = db.prepare('SELECT key, value FROM system_config').all();
    const configMap = {};
    for (const c of configs) configMap[c.key] = c.value;

    res.json({
      success: true,
      data: {
        appName: configMap.app_name || 'BPVN Portal',
        minVersion: configMap.min_app_version || '1.0.0',
        latestVersion: configMap.latest_app_version || '1.0.0+1',
        downloadUrl: configMap.apk_download_url || '',
        forceUpdate: configMap.force_update === '1',
        maintenanceMode: configMap.maintenance_mode === '1',
        maintenanceMessage: configMap.maintenance_message || '',
        announcement: configMap.announcement || '',
        vpnRequired: configMap.vpn_required === '1'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 🛡️ ADMIN MANAGEMENT APIs (JWT Protected)
// ==========================================

// Stats Overview
app.get('/api/v1/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalApps = db.prepare('SELECT COUNT(*) as c FROM apps WHERE is_active = 1').get().c;
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const todayLogins = db.prepare(`
      SELECT COUNT(*) as c FROM audit_logs 
      WHERE action = 'LOGIN_SUCCESS' AND date(timestamp) = date('now')
    `).get().c;
    const totalCategories = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
    const recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 8').all();

    res.json({
      success: true,
      data: {
        totalApps,
        totalUsers,
        todayLogins,
        totalCategories,
        recentLogs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get All Apps (Admin)
app.get('/api/v1/admin/apps', authenticateToken, requireAdmin, (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.*, c.name_vn as category_name 
      FROM apps a
      LEFT JOIN categories c ON a.category_key = c.key
      ORDER BY a.display_order ASC, a.id ASC
    `).all();
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create New App
app.post('/api/v1/admin/apps', authenticateToken, requireAdmin, (req, res) => {
  const { name, name_vn, category_key, url, icon_name, description, color_hex, required_role, display_order } = req.body;

  if (!name || !url || !category_key) {
    return res.status(400).json({ success: false, message: 'Tên ứng dụng, Danh mục và URL là bắt buộc' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO apps (name, name_vn, category_key, url, icon_name, description, color_hex, required_role, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      name,
      name_vn || name,
      category_key,
      url,
      icon_name || 'globe',
      description || '',
      color_hex || '#0085FF',
      required_role || 'ALL',
      Number(display_order) || 0
    );

    logAudit(req.user.username, 'CREATE_APP', `Thêm ứng dụng mới: ${name} (${url})`, req);
    res.json({ success: true, message: 'Thêm ứng dụng thành công!', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update App
app.put('/api/v1/admin/apps/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, name_vn, category_key, url, icon_name, description, color_hex, required_role, display_order, is_active } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE apps 
      SET name = ?, name_vn = ?, category_key = ?, url = ?, icon_name = ?, description = ?, 
          color_hex = ?, required_role = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      name,
      name_vn || name,
      category_key,
      url,
      icon_name,
      description,
      color_hex,
      required_role,
      Number(display_order) || 0,
      is_active !== undefined ? Number(is_active) : 1,
      id
    );

    logAudit(req.user.username, 'UPDATE_APP', `Cập nhật ứng dụng ID: ${id} (${name})`, req);
    res.json({ success: true, message: 'Cập nhật ứng dụng thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete App
app.delete('/api/v1/admin/apps/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const app = db.prepare('SELECT name FROM apps WHERE id = ?').get(id);
    db.prepare('DELETE FROM apps WHERE id = ?').run(id);
    logAudit(req.user.username, 'DELETE_APP', `Xóa ứng dụng: ${app ? app.name : id}`, req);
    res.json({ success: true, message: 'Đã xóa ứng dụng!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Users (Admin)
app.get('/api/v1/admin/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, full_name, department, email, role, is_active, last_login, created_at 
      FROM users ORDER BY id ASC
    `).all();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create User (Admin)
app.post('/api/v1/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const { username, password, full_name, department, email, role } = req.body;

  if (!username || !password || !full_name) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ Tên đăng nhập, Mật khẩu và Họ tên' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, department, email, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(username.trim(), hash, full_name.trim(), department || 'General', email || '', role || 'USER');

    logAudit(req.user.username, 'CREATE_USER', `Tạo tài khoản người dùng: ${username}`, req);
    res.json({ success: true, message: 'Tạo tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message.includes('UNIQUE') ? 'Tên đăng nhập đã tồn tại' : err.message });
  }
});

// Update User (Admin)
app.put('/api/v1/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { full_name, department, email, role, is_active, new_password } = req.body;

  try {
    if (new_password && new_password.trim() !== '') {
      const hash = bcrypt.hashSync(new_password.trim(), 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
      logAudit(req.user.username, 'RESET_PASSWORD', `Đặt lại mật khẩu cho user ID: ${id}`, req);
    }

    db.prepare(`
      UPDATE users 
      SET full_name = ?, department = ?, email = ?, role = ?, is_active = ?
      WHERE id = ?
    `).run(full_name, department, email, role, Number(is_active), id);

    logAudit(req.user.username, 'UPDATE_USER', `Cập nhật thông tin user ID: ${id}`, req);
    res.json({ success: true, message: 'Cập nhật tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete User (Admin)
app.delete('/api/v1/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
    if (user && user.username === 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản Quản trị viên tối cao (admin)' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    logAudit(req.user.username, 'DELETE_USER', `Xóa tài khoản: ${user ? user.username : id}`, req);
    res.json({ success: true, message: 'Đã xóa tài khoản!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Audit Logs (Admin)
app.get('/api/v1/admin/logs', authenticateToken, requireAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// System Configs (Admin)
app.get('/api/v1/admin/config', authenticateToken, requireAdmin, (req, res) => {
  try {
    const configs = db.prepare('SELECT * FROM system_config').all();
    res.json({ success: true, data: configs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save System Configs (Admin)
app.post('/api/v1/admin/config', authenticateToken, requireAdmin, (req, res) => {
  const configs = req.body;
  try {
    const updateStmt = db.prepare(`
      INSERT INTO system_config (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const updateMany = db.transaction((obj) => {
      for (const [key, value] of Object.entries(obj)) {
        updateStmt.run(key, String(value));
      }
    });
    updateMany(configs);

    logAudit(req.user.username, 'UPDATE_CONFIG', 'Cập nhật cấu hình hệ thống', req);
    res.json({ success: true, message: 'Lưu cấu hình hệ thống thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fallback to Index for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 BPVN Portal Web Admin & API Server is running!`);
  console.log(`📡 URL: http://0.0.0.0:${PORT}`);
  console.log(`🔒 Port: ${PORT}`);
  console.log(`====================================================`);
});
