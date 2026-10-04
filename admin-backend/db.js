const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bpvn_portal.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name_vn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_vn TEXT NOT NULL,
      category_key TEXT NOT NULL,
      url TEXT NOT NULL,
      icon_name TEXT NOT NULL DEFAULT 'globe',
      description TEXT,
      color_hex TEXT DEFAULT '#0085FF',
      required_role TEXT DEFAULT 'ALL',
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_key) REFERENCES categories(key)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'USER',
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      is_vpn_verified INTEGER DEFAULT 1,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check and seed initial data
  seedInitialData();
}

function seedInitialData() {
  // 1. Seed Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (key, name_vn, name_en, icon_name, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    const defaultCats = [
      ['all', 'Tất cả', 'All', 'layout-grid', 1],
      ['hr', 'Nhân sự & Chấm công', 'Human Resources', 'users', 2],
      ['production', 'Sản xuất & Kho', 'Production & MES', 'factory', 3],
      ['it', 'Công nghệ thông tin', 'IT & Helpdesk', 'shield-check', 4],
      ['finance', 'Tài chính & Kế toán', 'Finance', 'receipt', 5],
      ['general', 'Tiện ích chung', 'General Portal', 'compass', 6],
    ];

    const insertManyCats = db.transaction((cats) => {
      for (const cat of cats) insertCat.run(...cat);
    });
    insertManyCats(defaultCats);
  }

  // 2. Seed Default Apps
  const appCount = db.prepare('SELECT COUNT(*) as count FROM apps').get().count;
  if (appCount === 0) {
    const insertApp = db.prepare(`
      INSERT INTO apps (name, name_vn, category_key, url, icon_name, description, color_hex, required_role, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultApps = [
      [
        'HR Portal & E-Leave',
        'Cổng Nhân sự & Nghỉ phép',
        'hr',
        'https://hr.bestpacific.vn',
        'user-check',
        'Đăng ký nghỉ phép, xem bảng chấm công và phiếu lương điện tử',
        '#0085FF',
        'ALL',
        1,
        1
      ],
      [
        'Production MES Web',
        'Hệ thống Điều hành Sản xuất MES',
        'production',
        'https://mes.bestpacific.vn',
        'factory',
        'Quản lý tiến độ sản xuất, trạng thái dệt nhuộm và chuyền may',
        '#00E5FF',
        'ALL',
        1,
        2
      ],
      [
        'ERP Web System',
        'Cổng Quản trị Doanh nghiệp ERP',
        'production',
        'https://erp.bestpacific.vn',
        'database',
        'Quản lý đơn hàng, vật tư và kế hoạch sản xuất',
        '#6366F1',
        'ALL',
        1,
        3
      ],
      [
        'Warehouse & Logistics WMS',
        'Quản lý Kho & Logistics WMS',
        'production',
        'https://wms.bestpacific.vn',
        'box',
        'Kiểm kê kho bãi, quét mã QR xuất nhập nguyên phụ liệu',
        '#10B981',
        'ALL',
        1,
        4
      ],
      [
        'IT Helpdesk & Ticket',
        'Yêu cầu Hỗ trợ Kỹ thuật IT',
        'it',
        'https://it-support.bestpacific.vn',
        'headset',
        'Gửi ticket hỗ trợ phần cứng, mạng, email và phần mềm',
        '#F59E0B',
        'ALL',
        1,
        5
      ],
      [
        'Cisco Network Monitor',
        'Giám sát Hạ tầng Mạng Cisco',
        'it',
        'https://monitor.bestpacific.vn',
        'activity',
        'Theo dõi trạng thái Switch, Wi-Fi và băng thông VPN',
        '#EC4899',
        'IT_ADMIN',
        1,
        6
      ],
      [
        'E-Office & Trình ký',
        'Văn phòng Số & Trình ký Văn bản',
        'general',
        'https://office.bestpacific.vn',
        'file-signature',
        'Trình ký tờ trình, phê duyệt đề xuất và văn bản nội bộ',
        '#8B5CF6',
        'ALL',
        1,
        7
      ]
    ];

    const insertManyApps = db.transaction((apps) => {
      for (const app of apps) insertApp.run(...app);
    });
    insertManyApps(defaultApps);
  }

  // 3. Seed Default Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const initialAdminPass = process.env.INITIAL_ADMIN_PASSWORD || 'ChangeMeImmediately@2026';
    const adminPassHash = bcrypt.hashSync(initialAdminPass, salt);
    const initialUserPass = process.env.INITIAL_USER_PASSWORD || 'ChangeMeImmediately@2026';
    const userPassHash = bcrypt.hashSync(initialUserPass, salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, department, email, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultUsers = [
      ['admin', adminPassHash, 'Super Administrator', 'IT System', 'admin@bestpacific.vn', 'SUPER_ADMIN', 1],
      ['it_admin', userPassHash, 'IT Administrator', 'IT Infrastructure', 'it_admin@bestpacific.vn', 'IT_ADMIN', 1],
      ['hr_user', userPassHash, 'HR Officer', 'Human Resources', 'hr_user@bestpacific.vn', 'USER', 1],
      ['prod_user', userPassHash, 'Production Supervisor', 'Production Dept', 'prod_user@bestpacific.vn', 'USER', 1],
    ];

    const insertManyUsers = db.transaction((users) => {
      for (const u of users) insertUser.run(...u);
    });
    insertManyUsers(defaultUsers);
  }

  // 4. Seed System Config
  const configCount = db.prepare('SELECT COUNT(*) as count FROM system_config').get().count;
  if (configCount === 0) {
    const insertConfig = db.prepare(`
      INSERT INTO system_config (key, value, description)
      VALUES (?, ?, ?)
    `);

    const defaultConfigs = [
      ['app_name', 'BPVN Portal', 'Tên ứng dụng hiển thị'],
      ['company_name', 'Best Pacific Vietnam', 'Tên công ty'],
      ['min_app_version', '1.0.0', 'Phiên bản APK tối thiểu yêu cầu'],
      ['latest_app_version', '1.0.0+1', 'Phiên bản APK mới nhất hiện có'],
      ['apk_download_url', '/downloads/app-release.apk', 'Link tải APK mới nhất'],
      ['force_update', '0', 'Bắt buộc cập nhật phiên bản mới (1: Có, 0: Không)'],
      ['maintenance_mode', '0', 'Chế độ bảo trì hệ thống (1: Bật, 0: Tắt)'],
      ['maintenance_message', 'Hệ thống Cổng thông tin BPVN đang được nâng cấp định kỳ.', 'Thông báo bảo trì'],
      ['vpn_required', '1', 'Bắt buộc kết nối VPN khi dùng ngoài công ty'],
      ['announcement', 'Chào mừng toàn thể CBNV sử dụng Cổng tiện ích BPVN Portal!', 'Thông báo chạy trên Dashboard'],
    ];

    const insertManyConfigs = db.transaction((configs) => {
      for (const cfg of configs) insertConfig.run(...cfg);
    });
    insertManyConfigs(defaultConfigs);
  }
}

// Initialize on require
initSchema();

module.exports = db;
