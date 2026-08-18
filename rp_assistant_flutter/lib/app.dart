import 'package:flutter/material.dart';
import 'screens/main_screen.dart';
import 'widgets/app_theme.dart';

class RpAssistantApp extends StatelessWidget {
  const RpAssistantApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RP Assistant',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const MainScreen(),
    );
  }
}