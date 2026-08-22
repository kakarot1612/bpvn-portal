import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'BPVN Portal';
  static const String companyName = 'Best Pacific Vietnam';
  static const String adDomain = 'bestpacific.com';
  
  // Backend Gateway URL chạy trên máy chủ nội bộ
  static const String apiBaseUrl = 'http://10.0.60.56:3001/api';
  
  // Endpoint kiểm tra kết nối mạng nội bộ
  static const String healthCheckUrl = 'https://e-form.bestpacific.vn/DonXetDuyet/DangNhap';
  
  // FortiClient VPN Gateway Info
  static const String vpnGatewayHost = 'vn-vpn.bestpacific.vn';
  static const int vpnGatewayPort = 20443;
  static const String vpnSubnet = '10.0.51.240/28';
  static const String forticlientPackageName = 'com.fortinet.forticlient_vpn';

  // Best Pacific Brand Colors
  static const Color primaryNavy = Color(0xFF0A3871);
  static const Color primaryBlue = Color(0xFF0056B3);
  static const Color accentCyan = Color(0xFF06B6D4);
  static const Color accentEmerald = Color(0xFF10B981);
  static const Color accentAmber = Color(0xFFF59E0B);
  static const Color accentRose = Color(0xFFEF4444);
  static const Color bgDark = Color(0xFF0B111E);
  static const Color surfaceDark = Color(0xFF141D2D);
  static const Color surfaceElevated = Color(0xFF1E2B42);

  // Danh mục 4 ứng dụng Web Nội bộ Production của Best Pacific Vietnam
  static const List<Map<String, dynamic>> internalWebApps = [
    {
      'id': 'hrm',
      'name': 'Cổng Nhân sự HRM (e-Form)',
      'url': 'https://e-form.bestpacific.vn/DonXetDuyet/DangNhap',
      'category': 'Nhân sự',
      'categoryKey': 'hr',
      'desc': 'Chấm công, gửi đơn xét duyệt nghỉ phép, công tác và tra cứu bảng lương.',
      'icon': 'users',
      'color': Color(0xFFF97316),
    },
    {
      'id': 'machine-status',
      'name': 'Machine-Status',
      'url': 'https://machine-status.bestpacific.com/',
      'category': 'Sản xuất',
      'categoryKey': 'production',
      'desc': 'Giám sát trạng thái hoạt động máy móc, chuyền may và năng suất nhà máy.',
      'icon': 'cpu',
      'color': Color(0xFF10B981),
    },
    {
      'id': 'camera-isapi',
      'name': 'Giám sát Camera qua ISAPI',
      'url': 'http://10.0.60.238:3005/login',
      'category': 'Kỹ thuật - IT',
      'categoryKey': 'it',
      'desc': 'Hệ thống điều khiển và giám sát luồng camera an ninh toàn khu vực.',
      'icon': 'video',
      'color': Color(0xFF06B6D4),
    },
    {
      'id': 'grafana',
      'name': 'Giám sát Dịch vụ CNTT',
      'url': 'https://grafana.bestpacific.com/dashboards',
      'category': 'Kỹ thuật - IT',
      'categoryKey': 'it',
      'desc': 'Bảng điều khiển theo dõi hiệu năng máy chủ, mạng, lưu lượng và cảnh báo IT.',
      'icon': 'activity',
      'color': Color(0xFF8B5CF6),
    },
  ];
}
