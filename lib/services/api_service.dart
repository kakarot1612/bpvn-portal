import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  String? _jwtToken;
  Map<String, dynamic>? _currentUser;

  Map<String, dynamic>? get currentUser => _currentUser;
  bool get isAuthenticated => _jwtToken != null;

  /// Đăng nhập Active Directory qua Backend Gateway
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('${AppConstants.apiBaseUrl}/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 && data['success'] == true) {
      _jwtToken = data['data']['token'];
      _currentUser = data['data']['user'];
      await _storage.write(key: 'jwt_token', value: _jwtToken);
      await _storage.write(key: 'saved_username', value: username);
      return data;
    } else {
      throw Exception(data['message'] ?? 'Đăng nhập Active Directory thất bại.');
    }
  }

  /// Đổi Mật khẩu Active Directory (SSPR)
  Future<bool> changePassword(String username, String oldPassword, String newPassword) async {
    final response = await http.post(
      Uri.parse('${AppConstants.apiBaseUrl}/auth/change-password'),
      headers: {
        'Content-Type': 'application/json',
        if (_jwtToken != null) 'Authorization': 'Bearer $_jwtToken',
      },
      body: jsonEncode({
        'username': username,
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 && data['success'] == true) {
      return true;
    } else {
      throw Exception(data['message'] ?? 'Không thể đổi mật khẩu Active Directory.');
    }
  }

  /// Đăng xuất
  Future<void> logout() async {
    _jwtToken = null;
    _currentUser = null;
    await _storage.delete(key: 'jwt_token');
  }

  Future<String?> getSavedUsername() async {
    return await _storage.read(key: 'saved_username');
  }
}
