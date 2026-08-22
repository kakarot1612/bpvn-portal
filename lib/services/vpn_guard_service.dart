import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../constants.dart';

class VpnGuardService {
  static final VpnGuardService _instance = VpnGuardService._internal();
  factory VpnGuardService() => _instance;
  VpnGuardService._internal();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _vpnStateController = StreamController<bool>.broadcast();

  Stream<bool> get onVpnStateChanged => _vpnStateController.stream;
  bool isConnected = false;

  void initialize() {
    _connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      checkVpnStatus();
    });
    checkVpnStatus();
  }

  /// Kiểm tra xem thiết bị có đang kích hoạt kết nối VPN và thông mạng nội bộ Best Pacific hay không
  Future<bool> checkVpnStatus() async {
    try {
      final connectivityResults = await _connectivity.checkConnectivity();
      final hasVpn = connectivityResults.contains(ConnectivityResult.vpn);

      // Thử ping nhanh đến endpoint nội bộ e-Form hoặc Backend Gateway
      bool isIntranetReachable = false;
      try {
        final res = await http.get(
          Uri.parse('${AppConstants.apiBaseUrl}/health'),
        ).timeout(const Duration(seconds: 3));
        if (res.statusCode == 200) {
          isIntranetReachable = true;
        }
      } catch (_) {
        // Fallback kiểm tra qua healthCheckUrl
        try {
          final resFallback = await http.get(
            Uri.parse(AppConstants.healthCheckUrl),
          ).timeout(const Duration(seconds: 3));
          if (resFallback.statusCode >= 200 && resFallback.statusCode < 500) {
            isIntranetReachable = true;
          }
        } catch (_) {
          isIntranetReachable = false;
        }
      }

      // Trạng thái VPN hợp lệ khi có VPN transport hoặc đã reach được mạng nội bộ
      isConnected = hasVpn || isIntranetReachable;
      _vpnStateController.add(isConnected);
      return isConnected;
    } catch (e) {
      isConnected = false;
      _vpnStateController.add(false);
      return false;
    }
  }

  /// Mở ứng dụng FortiClient VPN trên Android
  Future<void> openFortiClientApp() async {
    final Uri playStoreUri = Uri.parse('market://details?id=${AppConstants.forticlientPackageName}');
    final Uri webFallbackUri = Uri.parse('https://play.google.com/store/apps/details?id=${AppConstants.forticlientPackageName}');

    if (await canLaunchUrl(playStoreUri)) {
      await launchUrl(playStoreUri);
    } else {
      await launchUrl(webFallbackUri, mode: LaunchMode.externalApplication);
    }
  }
}
