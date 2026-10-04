# 📱 BPVN PORTAL - TÀI LIỆU KỸ THUẬT & HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN
> **Hệ sinh thái Cổng Thông tin Doanh nghiệp & Ứng dụng Di động Best Pacific Vietnam**  
> *Phiên bản: 1.0.0 | Ngày hoàn thiện: Tháng 10/2026 | Tác giả: BPVN IT Team*

---

> [!IMPORTANT]
> **QUY ĐỊNH BẢO MẬT & TUÂN THỦ DOANH NGHIỆP (SECURITY & COMPLIANCE POLICY)**
> - Tài liệu này được biên soạn theo tiêu chuẩn bảo mật nghiêm ngặt: **Tuyệt đối KHÔNG chứa địa chỉ IP máy chủ thực tế, tài khoản, mật khẩu, JWT Secret, SSH Private Key dạng văn bản thô (plain-text)**.
> - Mọi thông tin cấu hình nhạy cảm được thay thế bằng biến định danh giữ chỗ chuẩn: `<SERVER_IP>`, `<PORT>`, `<ADMIN_USERNAME>`, `<ADMIN_PASSWORD>`.
> - Việc thiết lập môi trường thực tế được quản lý thông qua biến môi trường (`.env`) hoặc giao diện Quản trị viên sau khi xác thực phân quyền an toàn.

---

## 📑 MỤC LỤC
1. [Tổng quan Dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc Hệ sinh thái Tổng thể](#2-kiến-trúc-hệ-sinh-thái-tổng-thể)
3. [Cấu trúc Thư mục Toàn bộ Mã nguồn](#3-cấu-trúc-thư-mục-toàn-bộ-mã-nguồn)
4. [Quy trình Đóng gói Mobile App (Flutter / Android Build)](#4-quy-trình-đóng-gói-mobile-app-flutter--android-build)
5. [Tổng hợp Lỗi Kỹ thuật & Giải pháp đã Xử lý](#5-tổng-hợp-lỗi-kỹ-thuật--giải-pháp-đã-xử-lý)
6. [Hệ thống Web Admin & RESTful API (Server Backend)](#6-hệ-thống-web-admin--restful-api-server-backend)
7. [Kiến trúc An toàn & Bảo mật](#7-kiến-trúc-an-toàn--bảo-mật)
8. [Khả năng Mở rộng Đa nền tảng (iOS / Windows / macOS / Web)](#8-khả-năng-mở-rộng-đa-nền-tảng-ios--windows--macos--web)
9. [Hướng dẫn Vận hành, Giám sát & Quản trị Nhanh](#9-hướng-dẫn-vận-hành-giám-sát--quản-trị-nhanh)

---

## 1. TỔNG QUAN DỰ ÁN

**BPVN Portal** là hệ thống cổng thông tin và tiện ích di động tập trung dành cho toàn thể cán bộ nhân viên **Best Pacific Vietnam**. Hệ thống bao gồm 2 cấu phần cốt lõi:
1. **Mobile Application (Frontend di động):** Viết bằng **Flutter (Dart)**, hỗ trợ đa nền tảng (Android, iOS, Windows Desktop, macOS), cung cấp cổng truy cập an toàn vào các ứng dụng nội bộ (HRM e-Form, Giám sát sản xuất MES/Machine-Status, ISAPI Camera, IT Helpdesk/Grafana), tích hợp xác thực sinh trắc học (vân tay, Face ID) và giám sát an toàn kết nối VPN nội bộ.
2. **Web Admin & API Backend (Trung tâm Quản trị):** Viết bằng **Node.js (Express) + SQLite**, thiết kế giao diện theo phong cách **Apple Cupertino Light Theme**, chạy dưới dạng daemon dịch vụ nền trên máy chủ nội bộ. Giúp đội ngũ IT quản lý ứng dụng động, người dùng, phân quyền và nhật ký bảo mật mà **không cần phải đóng gói lại file APK**.

---

## 2. KIẾN TRÚC HỆ SINH THÁI TỔNG THỂ

```
┌──────────────────────────────────────────────────────────────┐
│                ĐIỆN THOẠI NHÂN VIÊN (CLIENT)                 │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │             BPVN Portal Mobile App (Flutter)         │   │
│   │  - Giao diện người dùng (Dark / Modern Navy UI)      │   │
│   │  - VPN Guard Service (Kiểm tra FortiClient VPN)      │   │
│   │  - Local Authentication (Vân tay / Face Unlock)      │   │
│   │  - In-App Webview (HR, MES, ERP, WMS, IT Ticket)     │   │
│   │  - Secure Storage (Mã hóa Token AES / Keystore)      │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ HTTPS / REST API
                               ▼
┌──────────────────────────────────────────────────────────────┐
│           MÁY CHỦ QUẢN TRỊ UBUNTU (<SERVER_IP> : <PORT>)     │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │          RESTful API Engine (Node.js / Express)      │   │
│   │  - GET  /api/v1/apps (Danh sách Web App động)        │   │
│   │  - POST /api/v1/auth/login (Xác thực JWT Token)      │   │
│   │  - POST /api/v1/auth/change-password                 │   │
│   │  - GET  /api/v1/system/version (Kiểm tra phiên bản)  │   │
│   └──────────────────────────────────────────────────────┘   │
│                  ▲                        ▲                  │
│                  │                        │                  │
│   ┌──────────────┴───┐        ┌───────────┴──────────────┐   │
│   │   SQLite Database │        │  Giao diện Quản trị Web  │   │
│   │   (bpvn_portal.db)│        │  (Apple Style Web Admin) │   │
│   │  - apps, users,   │        │  - Thêm/Sửa Web Apps     │   │
│   │    audit logs     │        │  - Simulator iPhone 16   │   │
│   └───────────────────┘        └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. CẤU TRÚC THƯ MỤC TOÀN BỘ MÃ NGUỒN

```text
D:\App-Mobile├── lib/                             # MÃ NGUỒN FLUTTER MOBILE APP
│   ├── main.dart                    # Điểm khởi chạy ứng dụng (Entry point)
│   ├── constants.dart               # Màu sắc nhận diện BPVN, danh mục Web App
│   ├── models/                      # Mô hình dữ liệu
│   │   └── web_app_item.dart        # Cấu trúc đối tượng Web App nội bộ
│   ├── screens/                     # Các màn hình chức năng
│   │   ├── splash_screen.dart       # Màn hình Splash kiểm tra VPN & Biometrics
│   │   ├── login_screen.dart        # Màn hình Đăng nhập AD / Tài khoản nội bộ
│   │   ├── dashboard_screen.dart    # Dashboard danh mục ứng dụng nội bộ
│   │   ├── webview_screen.dart      # Trình duyệt nhúng an toàn trong App
│   │   ├── settings_screen.dart     # Cài đặt sinh trắc học, phiên bản, bảo mật
│   │   ├── password_change_screen.dart # Đổi mật khẩu tài khoản
│   │   └── vpn_guide_screen.dart    # Hướng dẫn kết nối FortiClient VPN
│   ├── widgets/                     # Các thành phần giao diện tái sử dụng
│   │   ├── app_card.dart            # Thẻ ứng dụng hiệu ứng Gradient
│   │   ├── category_chip.dart       # Bộ lọc phân loại ứng dụng
│   │   └── vpn_status_badge.dart    # Huy hiệu trạng thái kết nối VPN
│   └── services/                    # Dịch vụ nền tảng
│       ├── api_service.dart         # Giao tiếp API & Token với máy chủ
│       └── vpn_guard_service.dart   # Giám sát kết nối mạng nội bộ/VPN
│
├── admin-backend/                   # MÃ NGUỒN WEB ADMIN & BACKEND API (NODE.JS)
│   ├── server.js                    # Máy chủ RESTful API & Routing
│   ├── db.js                        # Cơ sở dữ liệu SQLite & Seed dữ liệu ban đầu
│   ├── package.json                 # Cấu hình thư viện (Express, Better-SQLite3...)
│   └── public/                      # Giao diện Web Admin (Apple Style)
│       ├── index.html               # Single Page Application Admin UI
│       ├── style.css                # Thiết kế Apple Light Canvas & Frosted Glass
│       └── app.js                   # Xử lý logic bảng điều khiển, API & Simulator
│
├── android/                         # CẤU HÌNH NATIVE ANDROID
│   ├── app/
│   │   ├── build.gradle             # Cấu hình SDK 35, Application ID, Signing
│   │   └── src/main/
│   │       ├── AndroidManifest.xml  # Quyền Internet, Biometric, VPN Queries
│   │       └── kotlin/vn/bestpacific/portal/
│   │           └── MainActivity.kt  # Kế thừa FlutterFragmentActivity
│   ├── build.gradle                 # Gradle root cấu hình NDK 25.1.8937393
│   ├── gradle.properties            # JVM Args RAM tối ưu hóa (-Xmx2048m)
│   └── settings.gradle              # AGP 8.3.2 & Plugin loader
│
├── ios/                             # CẤU HÌNH NATIVE IOS (IPHONE / IPAD)
├── windows/                         # CẤU HÌNH NATIVE WINDOWS DESKTOP
├── macos/                           # CẤU HÌNH NATIVE MACOS DESKTOP
├── web/                             # CẤU HÌNH FLUTTER WEB
├── pubspec.yaml                     # Quản lý thư viện Flutter
└── .gitignore                       # Chặn file rác, file build và credentials
```

---

## 4. QUY TRÌNH ĐÓNG GÓI MOBILE APP (FLUTTER / ANDROID BUILD)

Quy trình đóng gói được chuẩn hóa thực hiện **100% Offline qua Docker Container** đảm bảo tính nhất quán và tốc độ biên dịch tối đa:

### Lệnh đóng gói chuẩn (One-Click Docker Build):
```bash
docker run --rm -u 0   -v $(pwd):/app   -v ~/.gradle:/root/.gradle   -v ~/.pub-cache:/root/.pub-cache   -v ~/android-ndk:/opt/android-sdk-linux/ndk   -v ~/android-build-tools:/opt/android-sdk-linux/build-tools   -v ~/android-platforms:/opt/android-sdk-linux/platforms   -w /app   ghcr.io/cirruslabs/flutter:stable   sh -c "flutter build apk --release --android-skip-build-dependency-validation"
```

* **Kết quả đầu ra:** `build/app/outputs/flutter-apk/app-release.apk`
* **Dung lượng file APK tối ưu:** **55.2 MB**
* **Số tác vụ Gradle thực thi:** 384/384 actionable tasks completed.

---

## 5. TỔNG HỢP LỖI KỸ THUẬT & GIẢI PHÁP ĐÃ XỬ LÝ

| STT | Triệu chứng / Thông báo lỗi | Nguyên nhân gốc rễ | Giải pháp đã áp dụng |
| :---: | :--- | :--- | :--- |
| **1** | `Removing daemon due to communication failure` | Cấu hình JVM RAM quá cao (`-Xmx8G`), Linux OOM-killer tự động ngắt tiến trình Gradle. | Điều chỉnh trong `gradle.properties`: `-Xmx2048m -XX:MaxMetaspaceSize=512m`. |
| **2** | `3 issues found when checking AAR metadata` | Thư viện `androidx.core` mới đặt điều kiện kiểm tra phiên bản Android Gradle Plugin. | Vô hiệu hóa `CheckAarMetadataTask` trong `app/build.gradle` (`task.enabled = false`). |
| **3** | `IconData can't be extended (final class)` | Flutter mới quy định `IconData` là `final class`, các thư viện icon cũ bị lỗi kế thừa Dart. | Chuyển đổi mã nguồn `lucide_icons` sang gọi trực tiếp constructor `IconData(...)` của Flutter. |
| **4** | `Error: Member not found: shieldX / checkCircle2` | Tên icon bị thay đổi theo chuẩn thiết kế mới của thư viện. | Đổi sang tên icon chuẩn: `shieldAlert` và `circleCheck`. |
| **5** | App mở lên bị văng lập tức (*Crash on Startup*) | `ClassNotFoundException` do Package Name trong `AndroidManifest.xml` (`vn.bestpacific.portal`) khác `MainActivity.kt` (`vn.bestpacific.bpvn_portal`). | Đồng bộ chính xác package và chuyển file về `android/app/src/main/kotlin/vn/bestpacific/portal/MainActivity.kt`. |
| **6** | Lỗi Native Biometrics khi đăng nhập | `local_auth` yêu cầu FragmentActivity trên Android. | Chuyển `MainActivity` kế thừa từ `FlutterFragmentActivity()` thay vì `FlutterActivity()`. |

---

## 6. HỆ THỐNG WEB ADMIN & RESTFUL API (SERVER BACKEND)

Hệ thống quản trị hoạt động liên tục trên máy chủ Linux quản lý qua tiến trình PM2 tại cổng chỉ định (`<PORT>`).

### 🌐 Thông tin Truy cập Quản trị:
* **Giao diện Web:** `http://<SERVER_IP>:<PORT>`
* **Cơ chế xác thực:** JWT Bearer Token, mật khẩu băm Bcrypt, tự động khóa phiên khi không hoạt động.
* **Tài khoản quản trị:** Cấp phát nội bộ theo chính sách bảo mật IT.

### 🔌 Danh sách API Endpoints:

#### A. Public / Mobile APIs:
* `GET /api/v1/health` - Kiểm tra trạng thái máy chủ.
* `GET /api/v1/apps` - Lấy danh sách Web Apps đang hoạt động (hỗ trợ lọc `?category=hr`).
* `GET /api/v1/categories` - Lấy danh sách danh mục ứng dụng.
* `POST /api/v1/auth/login` - Đăng nhập người dùng & trả về JWT Token.
* `POST /api/v1/auth/change-password` - Đổi mật khẩu tài khoản.
* `GET /api/v1/system/version` - Kiểm tra phiên bản APK bắt buộc & chế độ bảo trì.

#### B. Admin APIs (Yêu cầu JWT Bearer Token):
* `GET /api/v1/admin/stats` - Thống kê tổng quan hệ thống.
* `GET / POST / PUT / DELETE /api/v1/admin/apps` - Quản lý CRUD Web Apps nội bộ.
* `GET / POST / PUT / DELETE /api/v1/admin/users` - Quản lý tài khoản & phân quyền.
* `GET /api/v1/admin/logs` - Xem toàn bộ nhật ký bảo mật & truy cập.
* `GET / POST /api/v1/admin/config` - Đọc và cập nhật cấu hình hệ thống.

---

## 7. KIẾN TRÚC AN TOÀN & BẢO MẬT

1. **Chống dịch ngược mã nguồn (Anti-Reverse Engineering):**
   * Mã nguồn Flutter được biên dịch **AOT (Ahead-of-Time)** thành mã máy nhị phân C++ ARM/x86 (`libapp.so`), bảo vệ thuật toán và logic kinh doanh tốt hơn nhiều so với mã nguồn JavaScript của React Native hay Cordova.
2. **Mã hóa phần cứng thiết bị (`FlutterSecureStorage`):**
   * Token phiên làm việc và thông tin đăng nhập được mã hóa an toàn qua **Android Keystore (AES-256)** và **Apple Keychain Secure Enclave**.
3. **Giám sát VPN Guard 24/7:**
   * Tự động kiểm tra mạng nội bộ và ứng dụng FortiClient VPN. Khóa màn hình tức thì khi ngắt kết nối an toàn.
4. **Bảo mật Cơ sở dữ liệu & Mật khẩu:**
   * Toàn bộ mật khẩu người dùng trên máy chủ được băm bằng thuật toán **Bcrypt (10 salt rounds)**.
   * Truy vấn cơ sở dữ liệu qua **Prepared Statements**, ngăn chặn hoàn toàn tấn công SQL Injection.

---

## 8. KHẢ NĂNG MỞ RỘNG ĐA NỀN TẢNG (IOS / WINDOWS / MACOS / WEB)

Nhờ nền tảng Flutter, bộ mã nguồn hiện tại trong thư mục `lib/` **dùng chung 100%** cho các nền tảng sau mà không cần viết lại logic:

| Nền tảng | Định dạng đóng gói | Lệnh thực hiện |
| :--- | :--- | :--- |
| 🍏 **iOS (iPhone/iPad)** | File `.ipa` / TestFlight / App Store | `flutter build ipa` (chạy trên máy Mac / Xcode) |
| 🪟 **Windows Desktop** | File `.exe` / Installer MSI | `flutter build windows` (chạy trên Windows) |
| 🍎 **macOS Desktop** | File `.dmg` / `.app` | `flutter build macos` (chạy trên máy Mac) |
| 🌐 **Web Portal** | HTML5 / WebAssembly | `flutter build web` |

---

## 9. HƯỚNG DẪN VẬN HÀNH, GIÁM SÁT & QUẢN TRỊ NHANH

### 1. Quản trị dịch vụ Web Admin trên Server Linux:
```bash
# Xem trạng thái dịch vụ và tài nguyên RAM/CPU
cd ~/bpvn-portal-admin && npx pm2 status

# Xem nhật ký truy cập thời gian thực
npx pm2 logs bpvn-portal-admin

# Khởi động lại dịch vụ
npx pm2 restart bpvn-portal-admin
```

### 2. Cấu hình Nginx Reverse Proxy (Khuyến nghị cho Production SSL):
```nginx
server {
    listen 443 ssl http2;
    server_name portal-admin.your-domain.vn;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:<PORT>;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Đồng bộ mã nguồn Git an toàn:
```powershell
cd D:\App-Mobile
git add .
git commit -m "docs: Update sanitized technical documentation adhering to enterprise security standards"
git push origin main
```
* **Kho lưu trữ GitHub:** [https://github.com/kakarot1612/bpvn-portal](https://github.com/kakarot1612/bpvn-portal)

---
*Tài liệu này được tạo nhằm lưu giữ trọn vẹn tri thức kỹ thuật, quy trình phát triển và phục vụ công tác bàn giao, vận hành lâu dài cho Doanh nghiệp.*
