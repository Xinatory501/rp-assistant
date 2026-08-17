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
    'AMAZING-PRO-ADMIN-MASTER',
  ];

  // Pre-generated Lifetime & PRO Keys from website generator
  static const Set<String> preGeneratedKeys = {
    'AMAZING-LIFE-F350-9EE2-6C9B',
    'AMAZING-LIFE-C7F3-86C9-0867',
    'AMAZING-LIFE-32D2-9A24-0F8C',
    'AMAZING-LIFE-BF0D-113A-CD00',
    'AMAZING-LIFE-456B-763C-5048',
    'AMAZING-LIFE-2689-0AD8-93C3',
    'AMAZING-LIFE-85E7-6825-D65D',
    'AMAZING-LIFE-31BF-A956-2D29',
    'AMAZING-LIFE-45B9-1958-29C3',
    'AMAZING-LIFE-8B79-0CBD-F954',
    'AMAZING-LIFE-5D1E-3684-C74B',
    'AMAZING-LIFE-1671-BD93-4A8F',
    'AMAZING-LIFE-9232-3737-03F5',
    'AMAZING-LIFE-3788-CDB5-BC2F',
    'AMAZING-LIFE-095A-80FE-4E44',
    'AMAZING-LIFE-D0F4-7AFF-0B15',
    'AMAZING-LIFE-9735-6B0E-4014',
    'AMAZING-LIFE-01A9-056E-0337',
    'AMAZING-LIFE-ACC0-CDFE-EAEC',
    'AMAZING-LIFE-CB38-5825-41EC',
    'AMAZING-LIFE-9CB5-06F5-7763',
    'AMAZING-LIFE-743D-0C82-3ECF',
    'AMAZING-LIFE-09EA-FCA3-EEDE',
    'AMAZING-LIFE-EFE4-0BD1-ADF9',
    'AMAZING-LIFE-2826-C023-F48B',
    'AMAZING-LIFE-08FD-BF3E-5CA8',
    'AMAZING-LIFE-8FEC-92E7-13DC',
    'AMAZING-LIFE-26B7-FDB9-7AC6',
    'AMAZING-LIFE-0DAC-D4DF-4CF1',
    'AMAZING-LIFE-7FB6-4B01-4DF4',
    'AMAZING-LIFE-520C-D3C9-62CA',
    'AMAZING-LIFE-871A-FD51-4604',
    'AMAZING-LIFE-215E-CA63-C0C1',
    'AMAZING-LIFE-1D98-8ADF-4783',
    'AMAZING-LIFE-DE08-FFF7-5374',
    'AMAZING-LIFE-0D66-A1B9-5858',
    'AMAZING-LIFE-1952-E68F-122C',
    'AMAZING-LIFE-06F6-8A75-F3C8',
    'AMAZING-LIFE-8680-E813-C810',
    'AMAZING-LIFE-7AED-E6D7-3DFF',
    'AMAZING-LIFE-7500-134A-D3B0',
    'AMAZING-LIFE-5FF7-DD42-9C12',
    'AMAZING-LIFE-5E0F-B7D4-F0A8',
    'AMAZING-LIFE-AA5A-A81E-8A4E',
    'AMAZING-LIFE-1365-B463-1566',
    'AMAZING-LIFE-83F8-6A17-2C5A',
    'AMAZING-LIFE-7DBC-FF37-4794',
    'AMAZING-LIFE-BB79-D36C-AF32',
    'AMAZING-LIFE-5A8A-5D38-2221',
    'AMAZING-LIFE-D7E4-8A86-5E31',
    'AMAZING-PRO-A8A8-CA23-B080',
    'AMAZING-PRO-B445-8ED4-1CAB',
    'AMAZING-PRO-47FF-DF88-AE07',
    'AMAZING-PRO-452D-599C-3AF0',
    'AMAZING-PRO-856C-20B2-7C10',
  };

  static bool isAdminKey(String key) {
    final k = key.trim().toUpperCase();
    if (adminKeys.contains(k)) return true;
    if (k.startsWith('AMAZING-ADMIN') || k.startsWith('AMAZING-PRO-ADMIN') || k.startsWith('DEV-ADMIN')) {
      return true;
    }
    return false;
  }

  static bool isGeneratedKey(String key) {
    final k = key.trim().toUpperCase();
    if (preGeneratedKeys.contains(k)) return true;
    if (RegExp(r'^AMAZING-(LIFE|PRO|VIP|DEV|ADMIN)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$').hasMatch(k)) {
      return true;
    }
    if (k.startsWith('AMAZING-') && k.length >= 12) {
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

    // Generated format check
    if (isGeneratedKey(cleanKey)) {
      return const AuthResult(
        success: true,
        message: '✓ Лицензионный ключ успешно активирован!',
        username: 'PRO Player',
        subscription: 'PRO Lifetime',
        expiry: 'Бессрочно',
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

