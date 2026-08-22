#!/bin/bash
# ==============================================================================
# SCRIPT ĐÓNG GÓI BẢN RELEASE APK: BPVN PORTAL (ANDROID)
# ==============================================================================

set -e

echo ">>> Bắt đầu đóng gói ứng dụng Android APK: BPVN Portal..."

# 1. Cài đặt dependencies
echo "[*] Tải các thư viện Flutter..."
flutter pub get

# 2. Build Release APK (Tách ABI để tối ưu dung lượng tải nhanh trên điện thoại)
echo "[*] Đang build Release APK..."
flutter build apk --release --split-per-abi

echo ""
echo "========================================================================"
echo "✅ ĐÓNG GÓI APK THÀNH CÔNG!"
echo "📁 Thư mục xuất file APK:"
echo "   build/app/outputs/flutter-apk/app-arm64-v8a-release.apk"
echo "   build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk"
echo ""
echo "🚀 Sẵn sàng tải lên Firebase App Distribution hoặc gửi qua Email nội bộ!"
echo "========================================================================"
