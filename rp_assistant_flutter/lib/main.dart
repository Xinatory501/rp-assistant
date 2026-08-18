import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';
import 'package:hotkey_manager/hotkey_manager.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await windowManager.ensureInitialized();

  // Check if launched in overlay mode
  final args = const String.fromEnvironment('OVERLAY_MODE');
  final isOverlay = args == 'true' ||
      const bool.fromEnvironment('OVERLAY_MODE', defaultValue: false);

  if (isOverlay) {
    await _initOverlayWindow();
  } else {
    await _initLauncherWindow();
  }

  // Init hotkey manager
  await hotKeyManager.unregisterAll();

  runApp(ProviderScope(child: RpAssistantApp(overlayMode: isOverlay)));
}

Future<void> _initLauncherWindow() async {
  await windowManager.waitUntilReadyToShow(
    const WindowOptions(
      size: Size(440, 680),
      minimumSize: Size(380, 580),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden,
      title: 'RP Assistant',
    ),
    () async {
      await windowManager.show();
      await windowManager.focus();
    },
  );
}

Future<void> _initOverlayWindow() async {
  await windowManager.waitUntilReadyToShow(
    const WindowOptions(
      size: Size(490, 510),
      minimumSize: Size(300, 48),
      backgroundColor: Colors.transparent,
      skipTaskbar: true,
      titleBarStyle: TitleBarStyle.hidden,
      title: 'RP Assistant Overlay',
    ),
    () async {
      await windowManager.setAlwaysOnTop(true);
      await windowManager.setPosition(const Offset(40, 40));
      await windowManager.setOpacity(0.92);
      await windowManager.show();
      await windowManager.focus();
    },
  );
}