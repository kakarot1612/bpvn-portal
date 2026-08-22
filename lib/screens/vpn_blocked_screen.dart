import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../constants.dart';
import '../services/vpn_guard_service.dart';

class VpnBlockedScreen extends StatefulWidget {
  final VoidCallback onRetrySuccess;

  const VpnBlockedScreen({super.key, required this.onRetrySuccess});

  @override
  State<VpnBlockedScreen> createState() => _VpnBlockedScreenState();
}

class _VpnBlockedScreenState extends State<VpnBlockedScreen> {
  bool _isChecking = false;

  Future<void> _handleRetry() async {
    setState(() => _isChecking = true);
    final connected = await VpnGuardService().checkVpnStatus();
    setState(() => _isChecking = false);

    if (connected) {
      widget.onRetrySuccess();
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vẫn chưa kết nối được tới FortiClient VPN Gateway!'),
          backgroundColor: AppConstants.accentRose,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.bgDark,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Shield Icon with Pulse Halo
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: AppConstants.accentRose.withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppConstants.accentRose.withOpacity(0.4), width: 2),
                ),
                child: const Center(
                  child: Icon(LucideIcons.shieldAlert, size: 48, color: AppConstants.accentRose),
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Yêu Cầu Kết Nối VPN',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),

              Text(
                'Ứng dụng chỉ khả dụng khi điện thoại đã kết nối FortiClient VPN an toàn tới cổng ${AppConstants.vpnGatewayHost}:${AppConstants.vpnGatewayPort}.',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),

              // Network Status Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppConstants.surfaceDark,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    _buildStatusRow(
                      icon: LucideIcons.shieldAlert,
                      title: 'FortiGate SSL-VPN (${AppConstants.vpnGatewayHost})',
                      subtitle: 'Chưa phát hiện Tunnel kết nối',
                      isError: true,
                    ),
                    const Divider(color: Colors.white10, height: 20),
                    _buildStatusRow(
                      icon: LucideIcons.server,
                      title: 'Mạng Nội bộ Best Pacific (${AppConstants.vpnSubnet})',
                      subtitle: 'Không thể định tuyến tài nguyên nội bộ',
                      isError: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Open FortiClient Action
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () => VpnGuardService().openFortiClientApp(),
                  icon: const Icon(LucideIcons.externalLink, size: 18),
                  label: const Text('Mở FortiClient VPN trên máy', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.primaryBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Retry Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: _isChecking ? null : _handleRetry,
                  icon: _isChecking
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(LucideIcons.refreshCw, size: 18),
                  label: Text(_isChecking ? 'Đang kiểm tra kết nối...' : 'Kiểm tra lại kết nối'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white24),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusRow({required IconData icon, required String title, required String subtitle, required bool isError}) {
    return Row(
      children: [
        Icon(icon, color: isError ? AppConstants.accentRose : AppConstants.accentEmerald, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
              Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 11)),
            ],
          ),
        ),
      ],
    );
  }
}
