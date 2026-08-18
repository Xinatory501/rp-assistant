import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await windowManager.ensureInitialized();
    const windowOptions = WindowOptions(
      size: Size(940, 640),
      minimumSize: Size(820, 540),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden,
    );
    windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.focus();
    });
  } catch (e) {
    debugPrint('windowManager warning: $e');
  }
  runApp(const ProviderScope(child: RpAssistantApp()));
}