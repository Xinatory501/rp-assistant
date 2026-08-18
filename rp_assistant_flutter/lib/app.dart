import 'package:flutter/material.dart';
import 'package:hotkey_manager/hotkey_manager.dart';
import 'screens/main_screen.dart';
import 'screens/game_overlay_screen.dart';
import 'widgets/app_theme.dart';

class RpAssistantApp extends StatefulWidget {
  final bool overlayMode;
  const RpAssistantApp({super.key, this.overlayMode = false});

  @override
  State<RpAssistantApp> createState() => _RpAssistantAppState();
}

class _RpAssistantAppState extends State<RpAssistantApp> {
  final _navKey = GlobalKey<NavigatorState>();
  bool _overlayVisible = true;

  @override
  void initState() {
    super.initState();
    if (widget.overlayMode) {
      _registerHotkeys();
    }
  }

  @override
  void dispose() {
    hotKeyManager.unregisterAll();
    super.dispose();
  }

  void _registerHotkeys() {
    // INSERT key
    hotKeyManager.register(
      HotKey(KeyCode.insert, modifiers: [], scope: HotKeyScope.system),
      keyDownHandler: (_) => _toggleOverlay(),
    );
    // F2 key
    hotKeyManager.register(
      HotKey(KeyCode.f2, modifiers: [], scope: HotKeyScope.system),
      keyDownHandler: (_) => _toggleOverlay(),
    );
    // Alt + M
    hotKeyManager.register(
      HotKey(KeyCode.keyM, modifiers: [KeyModifier.alt], scope: HotKeyScope.system),
      keyDownHandler: (_) => _toggleOverlay(),
    );
    // F10 key
    hotKeyManager.register(
      HotKey(KeyCode.f10, modifiers: [], scope: HotKeyScope.system),
      keyDownHandler: (_) => _toggleOverlay(),
    );
  }

  void _toggleOverlay() {
    setState(() => _overlayVisible = !_overlayVisible);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: _navKey,
      title: widget.overlayMode ? 'RP Assistant Overlay' : 'RP Assistant',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: widget.overlayMode
          ? const GameOverlayScreen()
          : const MainScreen(),
    );
  }
}