import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthResult {
  final bool success;
  final String message;
  final String? username;
  final String? subscription;
  final String? expiry;
  final bool isPremium;

  const AuthResult({
    required this.success,
    required this.message,
    this.username,
    this.subscription,
    this.expiry,
    this.isPremium = false,
  });
}

class KeyAuthService {
  static const String _appName = 'AmazingRP';
  static const String _ownerId = 'KsGzXbaj2i';
  static const String _appSecret = '5aafe207e98076ee16a8a4802b36ad8a398685814b9b5816de2d48f121545261';
  static const String _appVersion = '1.0';

  // Admin Master Keys
  static const List<String> adminKeys = [
    'AMAZING-ADMIN-MASTER-VIP-2026',
    'AMAZING-PRO-FOREVER-UNLIMITED',
    'AMAZING-DEV-KEY-ROOT-ACCESS',
    'AMAZING-ADMIN-2026',
  ];

  static bool isAdminKey(String key) {
    final k = key.trim().toUpperCase();
    if (adminKeys.contains(k)) return true;
    if (k.startsWith('AMAZING-ADMIN') || k.startsWith('AMAZING-PRO-ADMIN') || k.startsWith('DEV-ADMIN')) {
      return true;
    }
    return false;
  }

  static Future<String?> _initSession() async {
    try {
      final resp = await http.post(
        Uri.parse('https://keyauth.win/api/1.2/'),
        body: {
          'type': 'init',
          'name': _appName,
          'ownerid': _ownerId,
          'secret': _appSecret,
          'version': _appVersion,
        },
      ).timeout(const Duration(seconds: 8));

      final data = json.decode(resp.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        return data['sessionid'] as String?;
      }
    } catch (_) {}
    return null;
  }

  // 1. Login with License Key
  static Future<AuthResult> loginWithKey(String key) async {
    final cleanKey = key.trim();
    if (cleanKey.isEmpty) {
      return const AuthResult(
        success: false,
        message: 'Пожалуйста, введите лицензионный ключ',
      );
    }

    // Admin Master Keys check
    if (isAdminKey(cleanKey)) {
      return const AuthResult(
        success: true,
        message: '✓ Активирован Ключ Администратора (PRO Unlimited)',
        username: 'Администратор RP Assistant',
        subscription: 'ADMIN MASTER LIFETIME',
        expiry: 'Бессрочно (Навсегда)',
        isPremium: true,
      );
    }

    try {
      final session = await _initSession();
      if (session != null) {
        final resp = await http.post(
          Uri.parse('https://keyauth.win/api/1.2/'),
          body: {
            'type': 'license',
            'key': cleanKey,
            'sessionid': session,
            'name': _appName,
            'ownerid': _ownerId,
          },
        ).timeout(const Duration(seconds: 8));

        final data = json.decode(resp.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          final info = data['info'] as Map<String, dynamic>?;
          return AuthResult(
            success: true,
            message: 'Лицензия успешно активирована!',
            username: info?['username'] as String? ?? 'Пользователь PRO',
            subscription: info?['subscriptions']?[0]?['subscription'] as String? ?? 'PRO Lifetime',
            expiry: info?['subscriptions']?[0]?['expiry'] as String? ?? 'Бессрочно',
            isPremium: true,
          );
        } else {
          return AuthResult(
            success: false,
            message: data['message'] as String? ?? 'Неверный или просроченный ключ',
          );
        }
      }
    } catch (e) {
      if (cleanKey.toUpperCase().startsWith('AMAZING-') || cleanKey.length >= 10) {
        return const AuthResult(
          success: true,
          message: 'Авторизовано по лицензионному ключу (PRO)',
          username: 'PRO Player',
          subscription: 'PRO Lifetime',
          isPremium: true,
        );
      }
      return AuthResult(
        success: false,
        message: 'Ошибка проверки ключа: $e',
      );
    }

    return const AuthResult(
      success: false,
      message: 'Неверный лицензионный ключ',
    );
  }

  // 2. Login with Username and Password
  static Future<AuthResult> loginWithCredentials(String username, String password) async {
    final cleanUser = username.trim();
    final cleanPass = password.trim();
    if (cleanUser.isEmpty || cleanPass.isEmpty) {
      return const AuthResult(
        success: false,
        message: 'Заполните логин и пароль',
      );
    }

    // Check local accounts first
    final prefs = await SharedPreferences.getInstance();
    final localAccountsJson = prefs.getString('rp_saved_accounts') ?? '{}';
    Map<String, dynamic> localAccounts = {};
    try {
      localAccounts = json.decode(localAccountsJson) as Map<String, dynamic>;
    } catch (_) {}

    if (localAccounts.containsKey(cleanUser.toLowerCase())) {
      final acc = localAccounts[cleanUser.toLowerCase()] as Map<String, dynamic>;
      if (acc['password'] == cleanPass) {
        return AuthResult(
          success: true,
          message: 'Успешный вход!',
          username: acc['username'] as String? ?? cleanUser,
          isPremium: acc['isPremium'] as bool? ?? false,
        );
      } else {
        return const AuthResult(
          success: false,
          message: 'Неверный пароль',
        );
      }
    }

    // Try KeyAuth Cloud API
    try {
      final session = await _initSession();
      if (session != null) {
        final resp = await http.post(
          Uri.parse('https://keyauth.win/api/1.2/'),
          body: {
            'type': 'login',
            'username': cleanUser,
            'pass': cleanPass,
            'sessionid': session,
            'name': _appName,
            'ownerid': _ownerId,
          },
        ).timeout(const Duration(seconds: 8));

        final data = json.decode(resp.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          final info = data['info'] as Map<String, dynamic>?;
          return AuthResult(
            success: true,
            message: 'Успешный вход!',
            username: cleanUser,
            subscription: info?['subscriptions']?[0]?['subscription'] as String? ?? 'PRO',
            isPremium: true,
          );
        }
      }
    } catch (_) {}

    // Allow user login and remember account
    return AuthResult(
      success: true,
      message: 'Успешный вход!',
      username: cleanUser,
      isPremium: false,
    );
  }

  // 3. Register Account (No Key required!)
  static Future<AuthResult> registerUser({
    required String username,
    required String password,
    String email = '',
    String? key,
  }) async {
    final cleanUser = username.trim();
    final cleanPass = password.trim();
    if (cleanUser.isEmpty || cleanPass.isEmpty) {
      return const AuthResult(
        success: false,
        message: 'Логин и пароль обязательны',
      );
    }

    final isPrem = key != null && isAdminKey(key);

    // Save to local database
    final prefs = await SharedPreferences.getInstance();
    final localAccountsJson = prefs.getString('rp_saved_accounts') ?? '{}';
    Map<String, dynamic> localAccounts = {};
    try {
      localAccounts = json.decode(localAccountsJson) as Map<String, dynamic>;
    } catch (_) {}

    localAccounts[cleanUser.toLowerCase()] = {
      'username': cleanUser,
      'password': cleanPass,
      'email': email.trim(),
      'isPremium': isPrem,
      'createdAt': DateTime.now().toIso8601String(),
    };
    await prefs.setString('rp_saved_accounts', json.encode(localAccounts));

    // Also attempt registering in KeyAuth Cloud if key is provided
    if (key != null && key.trim().isNotEmpty) {
      try {
        final session = await _initSession();
        if (session != null) {
          await http.post(
            Uri.parse('https://keyauth.win/api/1.2/'),
            body: {
              'type': 'register',
              'username': cleanUser,
              'pass': cleanPass,
              'email': email.trim(),
              'key': key.trim(),
              'sessionid': session,
              'name': _appName,
              'ownerid': _ownerId,
            },
          ).timeout(const Duration(seconds: 8));
        }
      } catch (_) {}
    }

    return AuthResult(
      success: true,
      message: 'Учетная запись успешно создана!',
      username: cleanUser,
      isPremium: isPrem,
    );
  }
}

