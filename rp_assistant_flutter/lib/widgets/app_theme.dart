import 'package:flutter/material.dart';

class AppColors {
  static const bg = Color(0xFF171615);
  static const bgDark = Color(0xFF171615);
  static const bgCard = Color(0xFF201d1b);
  static const bgMid = Color(0xFF252220);
  static const border = Color(0xFF332e29);
  static const borderLight = Color(0x14FFFFFF);
  static const textPrimary = Color(0xFFede5dc);
  static const textSecondary = Color(0xFF8e8579);
  static const textMuted = Color(0xFF8e8579);
  static const textDim = Color(0xFF5a544e);
  static const accent = Color(0xFFd97757);
  static const accentDark = Color(0xFF33241b);
  static const accentBorder = Color(0xFF523828);
  static const titlebarBg = Color(0xFF201d1b);
  static const tabbarBg = Color(0xFF171615);
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.accent,
      secondary: AppColors.accent,
      surface: AppColors.bgCard,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: AppColors.textPrimary,
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: AppColors.textPrimary, fontSize: 14),
      bodyMedium: TextStyle(color: AppColors.textPrimary, fontSize: 12),
      bodySmall: TextStyle(color: AppColors.textMuted, fontSize: 11),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF1a1917),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.borderLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.borderLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0x60d97757), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      hintStyle: const TextStyle(color: AppColors.textDim, fontSize: 11),
      labelStyle: const TextStyle(color: AppColors.textMuted, fontSize: 11),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    ),
  );
}
