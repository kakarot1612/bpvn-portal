import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../constants.dart';
import '../services/api_service.dart';

class PasswordChangeScreen extends StatefulWidget {
  const PasswordChangeScreen({super.key});

  @override
  State<PasswordChangeScreen> createState() => _PasswordChangeScreenState();
}

class _PasswordChangeScreenState extends State<PasswordChangeScreen> {
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  bool _hasLength = false;
  bool _hasCase = false;
  bool _hasNumber = false;
  bool _hasSpecial = false;
  bool _isNotOld = false;

  @override
  void initState() {
    super.initState();
    _newPasswordController.addListener(_validatePolicy);
  }

  void _validatePolicy() {
    final text = _newPasswordController.text;
    setState(() {
      _hasLength = text.length >= 8;
      _hasCase = RegExp(r'[A-Z]').hasMatch(text) && RegExp(r'[a-z]').hasMatch(text);
      _hasNumber = RegExp(r'[0-9]').hasMatch(text);
      _hasSpecial = RegExp(r'[^A-Za-z0-9]').hasMatch(text);
      _isNotOld = text.isNotEmpty && text != 'Password123!' && text != _oldPasswordController.text;
    });
  }

  int _calculateStrengthScore() {
    int score = 0;
    if (_hasLength) score++;
    if (_hasCase) score++;
    if (_hasNumber) score++;
    if (_hasSpecial) score++;
    return score;
  }

  Future<void> _handleSubmit() async {
    final user = ApiService().currentUser;
    final username = user?['sAMAccountName'] ?? '';
    final oldPassword = _oldPasswordController.text;
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (newPassword != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mật khẩu xác nhận không trùng khớp!'), backgroundColor: AppConstants.accentRose),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ApiService().changePassword(username, oldPassword, newPassword);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đổi mật khẩu Active Directory thành công! Đã đồng bộ sang máy tính và VPN.'),
          backgroundColor: AppConstants.accentEmerald,
        ),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppConstants.accentRose,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ApiService().currentUser;
    final username = user?['sAMAccountName'] ?? 'BPVN User';
    final score = _calculateStrengthScore();
    final canSubmit = _hasLength && _hasCase && _hasNumber && _hasSpecial && _isNotOld &&
        _confirmPasswordController.text == _newPasswordController.text &&
        _oldPasswordController.text.isNotEmpty;

    return Scaffold(
      backgroundColor: AppConstants.bgDark,
      appBar: AppBar(
        backgroundColor: AppConstants.surfaceDark,
        elevation: 0,
        title: const Text('Đổi Mật khẩu AD', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppConstants.surfaceDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.keyRound, color: AppConstants.accentCyan, size: 20),
                  const SizedBox(width: 10),
                  Text('Tài khoản: bestpacific.com\\$username', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Current Password
            const Text('Mật khẩu Domain hiện tại', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextField(
              controller: _oldPasswordController,
              obscureText: _obscureOld,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                prefixIcon: const Icon(LucideIcons.lock, color: Colors.white54, size: 18),
                suffixIcon: IconButton(
                  icon: Icon(_obscureOld ? LucideIcons.eye : LucideIcons.eyeOff, color: Colors.white54, size: 18),
                  onPressed: () => setState(() => _obscureOld = !_obscureOld),
                ),
                hintText: 'Nhập mật khẩu đang dùng',
                hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
                filled: true,
                fillColor: AppConstants.surfaceDark,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 16),

            // New Password
            const Text('Mật khẩu Mới', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextField(
              controller: _newPasswordController,
              obscureText: _obscureNew,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                prefixIcon: const Icon(LucideIcons.shield, color: Colors.white54, size: 18),
                suffixIcon: IconButton(
                  icon: Icon(_obscureNew ? LucideIcons.eye : LucideIcons.eyeOff, color: Colors.white54, size: 18),
                  onPressed: () => setState(() => _obscureNew = !_obscureNew),
                ),
                hintText: 'Nhập mật khẩu mới',
                hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
                filled: true,
                fillColor: AppConstants.surfaceDark,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 10),

            // Strength Indicator Bar
            Row(
              children: [
                Expanded(
                  child: LinearProgressIndicator(
                    value: _newPasswordController.text.isEmpty ? 0 : score / 4,
                    backgroundColor: Colors.white10,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      score <= 1 ? AppConstants.accentRose : (score <= 2 ? AppConstants.accentAmber : AppConstants.accentEmerald),
                    ),
                    minHeight: 4,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  score == 4 ? 'Cực mạnh' : (score >= 2 ? 'Khá' : 'Yếu'),
                  style: TextStyle(
                    color: score == 4 ? AppConstants.accentEmerald : (score >= 2 ? AppConstants.accentAmber : AppConstants.accentRose),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Confirm Password
            const Text('Xác nhận Mật khẩu Mới', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextField(
              controller: _confirmPasswordController,
              obscureText: _obscureConfirm,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                prefixIcon: const Icon(LucideIcons.circleCheck, color: Colors.white54, size: 18),
                suffixIcon: IconButton(
                  icon: Icon(_obscureConfirm ? LucideIcons.eye : LucideIcons.eyeOff, color: Colors.white54, size: 18),
                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                hintText: 'Nhập lại mật khẩu mới',
                hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
                filled: true,
                fillColor: AppConstants.surfaceDark,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 20),

            // 5 Active Directory Policy Checklist of Best Pacific
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppConstants.surfaceDark,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(LucideIcons.info, color: AppConstants.accentCyan, size: 16),
                      SizedBox(width: 8),
                      Text('Chính sách Mật khẩu Active Directory (bestpacific.com):',
                          style: TextStyle(color: AppConstants.accentCyan, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _buildPolicyItem(_hasLength, 'Độ dài tối thiểu từ 8 ký tự trở lên'),
                  _buildPolicyItem(_hasCase, 'Bao gồm cả chữ hoa (A-Z) và chữ thường (a-z)'),
                  _buildPolicyItem(_hasNumber, 'Chứa ít nhất một chữ số (0-9)'),
                  _buildPolicyItem(_hasSpecial, 'Chứa ít nhất một ký tự đặc biệt (!@#\$%^&*...)'),
                  _buildPolicyItem(_isNotOld, 'Không trùng với 3 mật khẩu đã sử dụng gần nhất'),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: (canSubmit && !_isLoading) ? _handleSubmit : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Lưu & Đồng bộ Mật khẩu AD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPolicyItem(bool passed, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        children: [
          Icon(
            passed ? LucideIcons.circleCheck : LucideIcons.circleDashed,
            color: passed ? AppConstants.accentEmerald : Colors.white38,
            size: 14,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: passed ? AppConstants.accentEmerald : Colors.white60,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
