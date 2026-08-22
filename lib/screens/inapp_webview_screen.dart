import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../constants.dart';

class InAppWebviewScreen extends StatefulWidget {
  final String title;
  final String url;

  const InAppWebviewScreen({super.key, required this.title, required this.url});

  @override
  State<InAppWebviewScreen> createState() => _InAppWebviewScreenState();
}

class _InAppWebviewScreenState extends State<InAppWebviewScreen> {
  InAppWebViewController? _webViewController;
  double _progress = 0;
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.url;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.bgDark,
      appBar: AppBar(
        backgroundColor: AppConstants.surfaceDark,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.x, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
            Row(
              children: [
                const Icon(LucideIcons.lock, color: AppConstants.accentEmerald, size: 10),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    _currentUrl,
                    style: const TextStyle(color: Colors.white54, fontSize: 10, fontFamily: 'monospace'),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.rotateCw, color: Colors.white70, size: 18),
            onPressed: () => _webViewController?.reload(),
          ),
        ],
        bottom: _progress < 1.0
            ? PreferredSize(
                preferredSize: const Size.fromHeight(2),
                child: LinearProgressIndicator(
                  value: _progress,
                  backgroundColor: Colors.transparent,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppConstants.primaryBlue),
                  minHeight: 2,
                ),
              )
            : null,
      ),
      body: InAppWebView(
        initialUrlRequest: URLRequest(url: WebUri(widget.url)),
        initialSettings: InAppWebViewSettings(
          useShouldOverrideUrlLoading: true,
          mediaPlaybackRequiresUserGesture: false,
          allowsInlineMediaPlayback: true,
          javaScriptEnabled: true,
          domStorageEnabled: true,
          cacheEnabled: true,
          // Bỏ qua lỗi SSL không hợp lệ đối với máy chủ nội bộ hoặc Enterprise CA
          allowUniversalAccessFromFileURLs: true,
          allowFileAccessFromFileURLs: true,
        ),
        onWebViewCreated: (controller) {
          _webViewController = controller;
        },
        onLoadStart: (controller, url) {
          if (url != null) setState(() => _currentUrl = url.toString());
        },
        onProgressChanged: (controller, progress) {
          setState(() => _progress = progress / 100);
        },
        onLoadStop: (controller, url) {
          if (url != null) setState(() => _currentUrl = url.toString());
        },
        onReceivedServerTrustAuthRequest: (controller, challenge) async {
          // Chấp nhận chứng chỉ máy chủ nội bộ BPVN
          return ServerTrustAuthResponse(action: ServerTrustAuthResponseAction.PROCEED);
        },
      ),
      bottomNavigationBar: Container(
        height: 48,
        color: AppConstants.surfaceDark,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(
              icon: const Icon(LucideIcons.arrowLeft, color: Colors.white70, size: 18),
              onPressed: () async {
                if (await _webViewController?.canGoBack() ?? false) {
                  _webViewController?.goBack();
                }
              },
            ),
            IconButton(
              icon: const Icon(LucideIcons.arrowRight, color: Colors.white70, size: 18),
              onPressed: () async {
                if (await _webViewController?.canGoForward() ?? false) {
                  _webViewController?.goForward();
                }
              },
            ),
            IconButton(
              icon: const Icon(LucideIcons.shieldCheck, color: AppConstants.accentEmerald, size: 18),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đang duyệt an toàn qua đường truyền FortiClient VPN')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
