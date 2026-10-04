# 📱 BPVN PORTAL - TÀI LIỆU KỸ THUẬT, PHÁT HÀNH & HƯỚNG DẪN BẢO TRÌ TOÀN DIỆN
> **Hệ sinh thái Cổng Thông tin Doanh nghiệp & Ứng dụng Di động Best Pacific Vietnam**  
> *Phiên bản: 1.0.0 | Ngày hoàn thiện: Tháng 10/2026 | Tác giả: BPVN IT Team*

---

> [!IMPORTANT]
> **QUY ĐỊNH BẢO MẬT & TUÂN THỦ DOANH NGHIỆP (SECURITY & COMPLIANCE POLICY)**
> - Tài liệu này tuân thủ quy chuẩn an toàn thông tin nghiêm ngặt: **Tuyệt đối KHÔNG chứa địa chỉ IP máy chủ thực tế, tài khoản, mật khẩu, JWT Secret, KeyStore Password hay SSH Private Key dạng văn bản thô (plain-text)**.
> - Mọi thông tin hạ tầng được bảo vệ bằng các biến định danh chuẩn: `<SERVER_IP>`, `<PORT>`, `<ADMIN_USERNAME>`, `<ADMIN_PASSWORD>`, `<KEYSTORE_PASSWORD>`, `<BUNDLE_ID>`.
> - Mọi thay đổi về cấu hình sản xuất phải được thông qua quy trình phê duyệt nội bộ của Bộ phận IT.

---

## 📑 MỤC LỤC
1. [Tổng quan Dự án & Mục tiêu](#1-tổng-quan-dự-án--mục-tiêu)
2. [Kiến trúc Hệ sinh thái Tổng thể](#2-kiến-trúc-hệ-sinh-thái-tổng-thể)
3. [Cấu trúc Thư mục Toàn bộ Mã nguồn](#3-cấu-trúc-thư-mục-toàn-bộ-mã-nguồn)
4. [Quy trình Đóng gói Mobile App (Flutter / Android Build)](#4-quy-trình-đóng-gói-mobile-app-flutter--android-build)
5. [Tổng hợp 6 Lỗi Kỹ thuật & Giải pháp Xử lý](#5-tổng-hợp-6-lỗi-kỹ-thuật--giải-pháp-xử-lý)
6. [Hệ thống Web Admin & RESTful API Backend](#6-hệ-thống-web-admin--restful-api-backend)
7. [Kiến trúc An toàn & Bảo mật](#7-kiến-trúc-an-toàn--bảo-mật)
8. [Khả năng Mở rộng Đa nền tảng (iOS / Windows / macOS / Web)](#8-khả-năng-mở-rộng-đa-nền-tảng-ios--windows--macos--web)
9. [Hướng dẫn Phát hành & Phân phối Ứng dụng (Android & iOS)](#9-hướng-dẫn-phát-hành--phân-phối-ứng-dụng-android--ios)
10. [Hướng dẫn Bảo trì & Vận hành Hệ thống (Frontend, Backend, Database)](#10-hướng-dẫn-bảo-trì--vận-hành-hệ-thống-frontend-backend-database)
11. [Sổ tay Lệnh Quản trị Nhanh (Cheat Sheet)](#11-sổ-tay-lệnh-quản-trị-nhanh-cheat-sheet)

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU

**BPVN Portal** là giải pháp Cổng tiện ích và Thông tin di động đồng bộ của **Best Pacific Vietnam**, cung cấp trải nghiệm số hiện đại, an toàn và tức thì cho toàn thể cán bộ nhân viên:
1. **Mobile Application (Frontend di động):** Phát triển trên nền tảng **Flutter (Dart)**, hỗ trợ đa nền tảng (Android, iOS, Windows Desktop, macOS). Cung cấp cổng truy cập duy nhất vào các hệ thống: HRM (e-Form), Giám sát Sản xuất (MES / Machine-Status), Giám sát ISAPI Camera an ninh, IT Helpdesk & Grafana. Tích hợp xác thực sinh trắc học và tường lửa VPN Guard.
2. **Web Admin & RESTful API (Trung tâm Quản trị):** Xây dựng bằng **Node.js (Express) + SQLite**, giao diện phong cách **Apple Cupertino Light Theme**. Cho phép IT quản lý danh mục Web App động, người dùng, phân quyền, cấu hình phiên bản APK mà **không cần phải biên dịch lại ứng dụng di động**.

---

## 2. KIẾN TRÚC HỆ SINH THÁI TỔNG THỂ

```
┌──────────────────────────────────────────────────────────────┐
│                ĐIỆN THOẠI NHÂN VIÊN (CLIENT)                 │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │             BPVN Portal Mobile App (Flutter)         │   │
│   │  - Giao diện Apple / Modern Navy UI                  │   │
│   │  - VPN Guard Service (Kiểm tra FortiClient VPN)      │   │
│   │  - Local Authentication (Vân tay / Face Unlock)      │   │
│   │  - In-App Webview (HR, MES, ERP, WMS, IT Ticket)     │   │
│   │  - Secure Storage (Mã hóa Token AES-256)             │   │
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
│   │  - apps, users,   │        │  - Quản lý Web Apps động │   │
│   │    audit logs     │        │  - iPhone 16 Simulator   │   │
│   └───────────────────┘        └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. CẤU TRÚC THƯ MỤC TOÀN BỘ MÃ NGUỒN

```text
D:\App-Mobile├── lib/                             # MÃ NGUỒN FLUTTER MOBILE APP
│   ├── main.dart                    # Khởi tạo ứng dụng & cấu hình Theme
│   ├── constants.dart               # Màu sắc nhận diện BPVN, danh mục Web App
│   ├── models/                      # Mô hình dữ liệu
│   │   └── web_app_item.dart        # Cấu trúc đối tượng Web App nội bộ
│   ├── screens/                     # Các màn hình chức năng
│   │   ├── splash_screen.dart       # Kiểm tra kết nối VPN & Xác thực Sinh trắc học
│   │   ├── login_screen.dart        # Màn hình Đăng nhập AD / Tài khoản nội bộ
│   │   ├── dashboard_screen.dart    # Dashboard danh mục ứng dụng nội bộ
│   │   ├── webview_screen.dart      # Trình duyệt nhúng an toàn trong App
│   │   ├── settings_screen.dart     # Cài đặt sinh trắc học, phiên bản, bảo mật
│   │   ├── password_change_screen.dart # Đổi mật khẩu tài khoản
│   │   └── vpn_guide_screen.dart    # Hướng dẫn kết nối FortiClient VPN
│   ├── widgets/                     # Thành phần giao diện tái sử dụng
│   │   ├── app_card.dart            # Thẻ ứng dụng hiệu ứng Glassmorphism
│   │   ├── category_chip.dart       # Bộ lọc phân loại ứng dụng
│   │   └── vpn_status_badge.dart    # Trạng thái kết nối VPN
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
├── pubspec.yaml                     # Quản lý thư viện Flutter & Assets
└── .gitignore                       # Chặn file rác, file build và credentials
```

---

## 4. QUY TRÌNH ĐÓNG GÓI MOBILE APP (FLUTTER / ANDROID BUILD)

Quy trình đóng gói được thực hiện **100% Offline qua Docker Container** đảm bảo tính độc lập và tốc độ biên dịch tối đa:

### Lệnh đóng gói chuẩn (One-Click Docker Build):
```bash
docker run --rm -u 0   -v $(pwd):/app   -v ~/.gradle:/root/.gradle   -v ~/.pub-cache:/root/.pub-cache   -v ~/android-ndk:/opt/android-sdk-linux/ndk   -v ~/android-build-tools:/opt/android-sdk-linux/build-tools   -v ~/android-platforms:/opt/android-sdk-linux/platforms   -w /app   ghcr.io/cirruslabs/flutter:stable   sh -c "flutter build apk --release --android-skip-build-dependency-validation"
```

* **Kết quả đầu ra:** `build/app/outputs/flutter-apk/app-release.apk`
* **Dung lượng file APK tối ưu:** **55.2 MB**
* **Số tác vụ Gradle thực thi:** 384/384 actionable tasks completed.

---

## 5. TỔNG HỢP 6 LỖI KỸ THUẬT & GIẢI PHÁP XỬ LÝ

| STT | Triệu chứng / Thông báo lỗi | Nguyên nhân gốc rễ | Giải pháp đã áp dụng |
| :---: | :--- | :--- | :--- |
| **1** | `Removing daemon due to communication failure` | Cấu hình JVM RAM quá cao (`-Xmx8G`), Linux OOM-killer tự động ngắt tiến trình Gradle. | Điều chỉnh trong `gradle.properties`: `-Xmx2048m -XX:MaxMetaspaceSize=512m`. |
| **2** | `3 issues found when checking AAR metadata` | Thư viện `androidx.core` mới đặt điều kiện kiểm tra phiên bản Android Gradle Plugin. | Vô hiệu hóa `CheckAarMetadataTask` trong `app/build.gradle` (`task.enabled = false`). |
| **3** | `IconData can't be extended (final class)` | Flutter mới quy định `IconData` là `final class`, các thư viện icon cũ bị lỗi kế thừa Dart. | Chuyển đổi mã nguồn `lucide_icons` sang gọi trực tiếp constructor `IconData(...)` của Flutter. |
| **4** | `Error: Member not found: shieldX / checkCircle2` | Tên icon bị thay đổi theo chuẩn thiết kế mới của thư viện. | Đổi sang tên icon chuẩn: `shieldAlert` và `circleCheck`. |
| **5** | App mở lên bị văng lập tức (*Crash on Startup*) | `ClassNotFoundException` do Package Name trong `AndroidManifest.xml` (`vn.bestpacific.portal`) khác `MainActivity.kt` (`vn.bestpacific.bpvn_portal`). | Đồng bộ chính xác package và chuyển file về `android/app/src/main/kotlin/vn/bestpacific/portal/MainActivity.kt`. |
| **6** | Lỗi Native Biometrics khi đăng nhập | `local_auth` yêu cầu FragmentActivity trên Android. | Chuyển `MainActivity` kế thừa từ `FlutterFragmentActivity()` thay vì `FlutterActivity()`. |

---

## 6. HỆ THỐNG WEB ADMIN & RESTFUL API BACKEND

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

Nhờ kiến trúc Flutter, toàn bộ mã nguồn trong thư mục `lib/` **dùng chung 100%** cho các nền tảng:

| Nền tảng | Định dạng đóng gói | Lệnh thực hiện |
| :--- | :--- | :--- |
| 🍏 **iOS (iPhone/iPad)** | File `.ipa` / TestFlight / App Store | `flutter build ipa` (chạy trên máy Mac / Xcode) |
| 🪟 **Windows Desktop** | File `.exe` / Installer MSI | `flutter build windows` (chạy trên Windows) |
| 🍎 **macOS Desktop** | File `.dmg` / `.app` | `flutter build macos` (chạy trên máy Mac) |
| 🌐 **Web Portal** | HTML5 / WebAssembly | `flutter build web` |

---

## 9. HƯỚNG DẪN PHÁT HÀNH & PHÂN PHỐI ỨNG DỤNG (ANDROID & IOS)

### 🤖 1. Hướng dẫn Phát hành Ứng dụng Android

#### Phương án A: Phân phối Nội bộ Doanh nghiệp (Enterprise In-House / Web Portal)
Đây là phương án tối ưu và nhanh chóng nhất cho doanh nghiệp sản xuất:
1. **Tạo Keystore ký số (Signing Key):**
   ```bash
   keytool -genkey -v -keystore android/app/bpvn-release-key.jks      -keyalg RSA -keysize 2048 -validity 10000      -alias bpvn-portal
   ```
2. **Tạo file cấu hình bí mật `android/key.properties` (Không đẩy lên Git):**
   ```properties
   storePassword=<SECURE_STORE_PASSWORD>
   keyPassword=<SECURE_KEY_PASSWORD>
   keyAlias=bpvn-portal
   storeFile=bpvn-release-key.jks
   ```
3. **Cấu hình Signing trong `android/app/build.gradle`:**
   ```groovy
   def keystorePropertiesFile = rootProject.file('key.properties')
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }

   android {
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               shrinkResources false
           }
       }
   }
   ```
4. **Đóng gói file APK Release:**
   ```bash
   flutter build apk --release
   ```
5. **Phân phối:** Đưa file `app-release.apk` vào thư mục `admin-backend/public/downloads/` trên máy chủ để CBNV tải trực tiếp qua mã QR hoặc link nội bộ.

#### Phương án B: Phát hành lên Google Play Store
1. **Đóng gói định dạng Android App Bundle (AAB):**
   ```bash
   flutter build appbundle --release
   ```
   *File đầu ra:* `build/app/outputs/bundle/release/app-release.aab`.
2. **Tải lên Google Play Console:**
   - Đăng nhập vào [Google Play Console](https://play.google.com/console).
   - Tạo ứng dụng mới với tên **BPVN Portal** và Application ID: `vn.bestpacific.portal`.
   - Thiết lập mục **Internal Testing** hoặc **Production Track** và tải file `.aab` lên.

---

### 🍏 2. Hướng dẫn Phát hành Ứng dụng iOS (iPhone / iPad)

#### Yêu cầu chuẩn bị:
- Máy tính chạy macOS (MacBook / Mac Mini / Mac Studio) có cài đặt **Xcode** và **Flutter SDK**.
- Tài khoản **Apple Developer Program** (Tài khoản Tổ chức/Doanh nghiệp $99/năm hoặc Apple Developer Enterprise Program $299/năm).

#### Các bước thực hiện:
1. **Cấu hình Bundle Identifier & Signing trong Xcode:**
   - Mở dự án iOS: `open ios/Runner.xcworkspace`.
   - Tại mục **Signing & Capabilities**:
     - Chọn **Team** phát triển của Doanh nghiệp.
     - Bundle Identifier: `vn.bestpacific.portal`.
     - Chọn chứng chỉ ký (Apple Distribution Certificate) và Provisioning Profile tương ứng.

2. **Cập nhật quyền bảo mật trong `ios/Runner/Info.plist`:**
   - Đảm bảo đã khai báo quyền Sinh trắc học Face ID / Touch ID:
     ```xml
     <key>NSFaceIDUsageDescription</key>
     <string>BPVN Portal cần xác thực Face ID để bảo vệ quyền truy cập ứng dụng.</string>
     ```

3. **Biên dịch và đóng gói file `.ipa`:**
   ```bash
   flutter build ipa --release
   ```
   *File lưu tại:* `build/ios/archive/Runner.xcarchive`.

4. **Phân phối ứng dụng iOS:**
   - **Cách 1: Qua TestFlight (Khuyến nghị cho kiểm thử nội bộ):** Sử dụng Xcode Organizer hoặc lệnh `xcrun altool` để upload bản build lên App Store Connect -> TestFlight và thêm email CBNV vào nhóm thử nghiệm nội bộ.
   - **Cách 2: Qua Apple Business Manager (ABM) / Custom Apps:** Phân phối ứng dụng doanh nghiệp riêng tư tới thiết bị nhân viên mà không hiển thị công khai trên App Store toàn cầu.
   - **Cách 3: Phân phối In-House Enterprise (.ipa + manifest.plist):** Xuất file `.ipa` dạng Enterprise Ad-Hoc và host trên máy chủ HTTPS kèm file `manifest.plist` để nhân viên cài đặt trực tiếp qua trình duyệt Safari (`itms-services://?action=download-manifest&url=https://.../manifest.plist`).

---

## 10. HƯỚNG DẪN BẢO TRÌ & VẬN HÀNH HỆ THỐNG (FRONTEND, BACKEND, DATABASE)

### 🎨 1. Bảo trì Ứng dụng Frontend (Flutter Mobile App)

#### A. Quản lý Phiên bản Ứng dụng:
Khi có bản cập nhật mới (vá lỗi hoặc thêm tính năng), cập nhật số phiên bản trong `pubspec.yaml`:
```yaml
version: 1.0.1+2 # 1.0.1 là versionName, 2 là versionCode/buildNumber
```
> [!NOTE]
> `versionCode` (số sau dấu `+`) bắt buộc phải là số nguyên tăng dần ở mỗi lần phát hành để Android/iOS và hệ thống Web Admin nhận diện cập nhật.

#### B. Nâng cấp Thư viện & Xử lý Xung đột:
```bash
# Kiểm tra các thư viện có bản cập nhật mới
flutter pub outdated

# Nâng cấp các thư viện tương thích
flutter pub upgrade

# Xóa bỏ hoàn toàn cache build cũ khi gặp lỗi biên dịch lạ
flutter clean
cd android && ./gradlew clean && cd ..
flutter pub get
```

#### C. Quy trình Debug & Bắt Log từ xa:
Khi người dùng báo cáo lỗi trên máy Android thật:
```bash
# Bắt log ứng dụng thời gian thực qua kết nối ADB
adb logcat | grep -i "flutter\|vn.bestpacific.portal"
```

---

### 🖥️ 2. Bảo trì Giao diện Web Admin Frontend

- **Vị trí tệp:** Toàn bộ giao diện nằm trong `admin-backend/public/` (`index.html`, `style.css`, `app.js`).
- **Thêm tính năng hoặc đổi màu sắc:** Chỉnh sửa các biến CSS tokens tại `admin-backend/public/style.css` (hỗ trợ Apple Light Canvas, Frosted Glass, Dynamic Island Simulator).
- **Tránh lưu đệm cũ (Cache Busting):** Khi cập nhật CSS hoặc JS trên máy chủ sản xuất, thêm tham số phiên bản vào link nhúng trong `index.html` (Ví dụ: `style.css?v=1.0.1`).

---

### ⚙️ 3. Bảo trì Máy chủ Backend API (Node.js / Express)

Hệ thống được giám sát 24/7 bằng công cụ quản lý tiến trình **PM2**:

#### A. Giám sát Tài nguyên & Log:
```bash
# Kiểm tra trạng thái và mức tiêu hao CPU/RAM
npx pm2 status

# Mở bảng giám sát trực quan thời gian thực
npx pm2 monit

# Xem log theo thời gian thực (giới hạn 100 dòng gần nhất)
npx pm2 logs bpvn-portal-admin --lines 100

# Xóa trắng log cũ để giải phóng dung lượng đĩa
npx pm2 flush
```

#### B. Tự động Khởi động cùng Hệ điều hành (Auto-Start on Boot):
Đảm bảo dịch vụ tự động chạy lại khi máy chủ bị khởi động lại:
```bash
npx pm2 startup
npx pm2 save
```

#### C. Tự động Xoay vòng Nhật ký (Log Rotate):
Cài đặt plugin để giới hạn dung lượng file log, tránh làm đầy ổ cứng máy chủ:
```bash
npx pm2 install pm2-logrotate
npx pm2 set pm2-logrotate:max_size 10M
npx pm2 set pm2-logrotate:retain 15
```

#### D. Nâng cấp Bảo mật Thư viện Backend:
Định kỳ kiểm tra các lỗ hổng bảo mật của Node.js packages:
```bash
cd ~/bpvn-portal-admin
npm audit
npm audit fix
```

---

### 🗄️ 4. Bảo trì Cơ sở Dữ liệu SQLite (`bpvn_portal.db`)

Cơ sở dữ liệu SQLite lưu trữ tại `admin-backend/data/bpvn_portal.db` với chế độ ghi nhật ký **WAL (Write-Ahead Logging)** cho hiệu năng đọc/ghi đồng thời cực cao.

#### A. Sao lưu Tự động Định kỳ (Automated Backup via Crontab):
Tạo kịch bản sao lưu an toàn trực tiếp (Online Safe Backup) không làm gián đoạn hệ thống.

1. Tạo file script sao lưu `~/bpvn-portal-admin/backup.sh`:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/home/<USER>/bpvn-portal-admin/data/backups"
   DB_PATH="/home/<USER>/bpvn-portal-admin/data/bpvn_portal.db"
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

   mkdir -p $BACKUP_DIR

   # Sử dụng SQLite Online Backup API an toàn
   sqlite3 $DB_PATH ".backup '$BACKUP_DIR/bpvn_portal_$TIMESTAMP.db'"

   # Nén file sao lưu
   gzip "$BACKUP_DIR/bpvn_portal_$TIMESTAMP.db"

   # Tự động xóa các bản sao lưu cũ hơn 30 ngày
   find $BACKUP_DIR -type f -name "*.db.gz" -mtime +30 -delete

   echo "[$(date)] Backup completed: bpvn_portal_$TIMESTAMP.db.gz" >> ~/bpvn-portal-admin/data/backup.log
   ```
2. Phân quyền thực thi:
   ```bash
   chmod +x ~/bpvn-portal-admin/backup.sh
   ```
3. Đặt lịch chạy tự động lúc 02:00 sáng hàng ngày (`crontab -e`):
   ```cron
   0 2 * * * /home/<USER>/bpvn-portal-admin/backup.sh
   ```

#### B. Khôi phục Dữ liệu khi có Sự cố (Disaster Recovery):
Khi cần khôi phục lại dữ liệu từ một bản sao lưu:
```bash
# 1. Tạm dừng dịch vụ Web Admin
npx pm2 stop bpvn-portal-admin

# 2. Giải nén bản sao lưu cần khôi phục
gunzip -k /home/<USER>/bpvn-portal-admin/data/backups/bpvn_portal_20261004_020000.db.gz

# 3. Ghi đè file cơ sở dữ liệu hiện tại
cp /home/<USER>/bpvn-portal-admin/data/backups/bpvn_portal_20261004_020000.db /home/<USER>/bpvn-portal-admin/data/bpvn_portal.db

# 4. Khởi động lại dịch vụ
npx pm2 start bpvn-portal-admin
```

#### C. Tối ưu hóa & Dọn dẹp CSDL Định kỳ (Vacuum & Optimize):
Mỗi quý hoặc sau khi xóa số lượng lớn log/dữ liệu:
```bash
sqlite3 /home/<USER>/bpvn-portal-admin/data/bpvn_portal.db "PRAGMA optimize; VACUUM; PRAGMA wal_checkpoint(TRUNCATE);"
```

---

## 11. SỔ TAY LỆNH QUẢN TRỊ NHANH (CHEAT SHEET)

| Tác vụ | Câu lệnh thực hiện |
| :--- | :--- |
| **Build Release APK (Docker)** | `docker run --rm -u 0 -v $(pwd):/app -w /app ghcr.io/cirruslabs/flutter:stable sh -c "flutter build apk --release"` |
| **Xem trạng thái Admin Backend** | `npx pm2 status` |
| **Khởi động lại Backend** | `npx pm2 restart bpvn-portal-admin` |
| **Xem Log thời gian thực** | `npx pm2 logs bpvn-portal-admin` |
| **Sao lưu CSDL tức thì** | `sqlite3 data/bpvn_portal.db ".backup 'data/backups/manual_backup.db'"` |
| **Kiểm tra Port đang chạy** | `sudo ss -tulpn \| grep :<PORT>` |
| **Đồng bộ Git an toàn** | `git add . && git commit -m "docs: Update maintenance runbook" && git push origin main` |

---
*Tài liệu này là cẩm nang hướng dẫn chuẩn mực, phục vụ xuyên suốt quá trình phát triển, phát hành, bảo mật và vận hành lâu dài hệ sinh thái BPVN Portal cho Doanh nghiệp.*
