import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'constants.dart';
import 'services/vpn_guard_service.dart';
import 'services/api_service.dart';
import 'screens/vpn_blocked_screen.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  VpnGuardService().initialize();
  runApp(const BpvnPortalApp());
}

class BpvnPortalApp extends StatelessWidget {
  const BpvnPortalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppConstants.bgDark,
        primaryColor: AppConstants.primaryNavy,
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          ThemeData(brightness: Brightness.dark).textTheme,
        ),
        colorScheme: const ColorScheme.dark(
          primary: AppConstants.primaryBlue,
          surface: AppConstants.surfaceDark,
        ),
        useMaterial3: true,
      ),
      home: const RootScreen(),
    );
  }
}

class RootScreen extends StatefulWidget {
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  bool _isVpnConnected = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    VpnGuardService().onVpnStateChanged.listen((connected) {
      if (mounted) {
        setState(() {
          _isVpnConnected = connected;
          // Tự động ngắt phiên đăng nhập nếu mất VPN đột ngột
          if (!connected) {
            _isLoggedIn = false;
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // 1. Nếu chưa kết nối VPN -> Hiện màn hình khóa VPN Blocked
    if (!_isVpnConnected) {
      return VpnBlockedScreen(
        onRetrySuccess: () {
          setState(() => _isVpnConnected = true);
        },
      );
    }

    // 2. Nếu đã có VPN nhưng chưa Login -> Hiện màn hình đăng nhập Active Directory
    if (!_isLoggedIn) {
      return LoginScreen(
        onLoginSuccess: () {
          setState(() => _isLoggedIn = true);
        },
      );
    }

    // 3. Đã có VPN và đã Login -> Hiện Dashboard BPVN Portal
    return DashboardScreen(
      onLogout: () {
        setState(() => _isLoggedIn = false);
      },
    );
  }
}
