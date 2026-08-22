import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../constants.dart';
import '../services/api_service.dart';
import 'password_change_screen.dart';
import 'inapp_webview_screen.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback onLogout;

  const DashboardScreen({super.key, required this.onLogout});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedCategory = 'all';

  @override
  Widget build(BuildContext context) {
    final user = ApiService().currentUser;
    final displayName = user?['displayName'] ?? 'Cán bộ Nhân viên';
    final username = user?['sAMAccountName'] ?? 'BPVN User';
    final department = user?['department'] ?? 'Best Pacific Vietnam';

    final filteredApps = _selectedCategory == 'all'
        ? AppConstants.internalWebApps
        : AppConstants.internalWebApps.where((a) => a['categoryKey'] == _selectedCategory).toList();

    return Scaffold(
      backgroundColor: AppConstants.bgDark,
      appBar: AppBar(
        backgroundColor: AppConstants.surfaceDark,
        elevation: 0,
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppConstants.primaryBlue,
              radius: 18,
              child: const Icon(LucideIcons.user, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(displayName, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  Text('$department • $username', style: const TextStyle(color: Colors.white54, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, color: Colors.white70, size: 20),
            onPressed: () async {
              await ApiService().logout();
              widget.onLogout();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // VPN Status Live Card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppConstants.accentEmerald.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppConstants.accentEmerald.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: AppConstants.accentEmerald, shape: BoxShape.circle),
                    child: const Icon(LucideIcons.shieldCheck, color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('FortiClient VPN Đang Bảo Vệ', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                        Text('Gateway: ${AppConstants.vpnGatewayHost}:${AppConstants.vpnGatewayPort} • Subnet: ${AppConstants.vpnSubnet}',
                            style: TextStyle(color: Colors.white70, fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick Banner: ĐỔI MẬT KHẨU ACTIVE DIRECTORY
            GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const PasswordChangeScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppConstants.primaryNavy, AppConstants.primaryBlue.withOpacity(0.8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppConstants.accentCyan.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(LucideIcons.keyRound, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Đổi Mật khẩu Active Directory', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                          SizedBox(height: 2),
                          Text('Cập nhật mật khẩu định kỳ tài khoản bestpacific.com', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        ],
                      ),
                    ),
                    const Icon(LucideIcons.chevronRight, color: Colors.white70, size: 20),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Header Section: Internal Web Apps
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Ứng dụng & Web Nội bộ', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                Text('${filteredApps.length} Dịch vụ', style: const TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 12),

            // Category Filter Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildCategoryPill('all', 'Tất cả'),
                  _buildCategoryPill('hr', 'Nhân sự'),
                  _buildCategoryPill('production', 'Sản xuất'),
                  _buildCategoryPill('it', 'Kỹ thuật - IT'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Grid / List of BPVN Apps
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredApps.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final app = filteredApps[index];
                return _buildAppCard(app);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryPill(String key, String label) {
    final isSelected = _selectedCategory == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedCategory = key),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppConstants.primaryBlue : AppConstants.surfaceDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppConstants.primaryBlue : Colors.white10),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildAppCard(Map<String, dynamic> app) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => InAppWebviewScreen(
              title: app['name'],
              url: app['url'],
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppConstants.surfaceDark,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: (app['color'] as Color).withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Icon(_getIconForApp(app['icon']), color: app['color'] as Color, size: 22),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(app['name'], style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white10,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(app['category'], style: const TextStyle(color: Colors.white70, fontSize: 10)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(app['desc'], style: const TextStyle(color: Colors.white60, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(app['url'], style: const TextStyle(color: AppConstants.accentCyan, fontSize: 10, fontFamily: 'monospace')),
                ],
              ),
            ),
            const Icon(LucideIcons.arrowUpRight, color: Colors.white38, size: 18),
          ],
        ),
      ),
    );
  }

  IconData _getIconForApp(String iconName) {
    switch (iconName) {
      case 'users': return LucideIcons.users;
      case 'cpu': return LucideIcons.cpu;
      case 'video': return LucideIcons.video;
      case 'activity': return LucideIcons.activity;
      default: return LucideIcons.globe;
    }
  }
}
