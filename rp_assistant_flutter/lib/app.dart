import 'package:flutter/material.dart';
import 'screens/main_screen.dart';
import 'screens/game_overlay_screen.dart';
import 'widgets/app_theme.dart';

class RpAssistantApp extends StatelessWidget {
  final bool overlayMode;
  const RpAssistantApp({super.key, this.overlayMode = false});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: overlayMode ? 'RP Assistant Overlay' : 'RP Assistant',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: overlayMode ? const GameOverlayScreen() : const MainScreen(),
    );
  }
}