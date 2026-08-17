import 'dart:convert';
import 'package:crypto/crypto.dart';
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

  // Private cryptographic salt shared only with your private Admin Panel on Vercel
  static const String _secretSalt = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';
  static const String _verifyApiUrl = 'https://amzrp.vercel.app/api/verify';

  // Cryptographic Signature Verification
  static ({bool valid, String subscription, String expiry, String message}) _verifyCryptographicSignature(String key) {
    final clean = key.trim().toUpperCase();
    final parts = clean.split('-');
    if (parts.length < 4 || parts[0] != 'AMAZING') {
      return (
        valid: false,
        subscription: '',
        expiry: '',
        message: 'Неверный формат ключа (ожидается AMAZING-...)',
      );
    }

    final payload = parts.sublist(0, parts.length - 1).join('-');
    final providedSig = parts.last;

    final keyBytes = utf8.encode(_secretSalt);
    final payloadBytes = utf8.encode(payload);
    final hmac = Hmac(sha256, keyBytes);
    final digest = hmac.convert(payloadBytes).toString().toUpperCase();
    final calculatedSig = digest.substring(0, providedSig.length.clamp(1, digest.length));

    if (providedSig != calculatedSig) {
      return (
        valid: false,
        subscription: '',
        expiry: '',
        message: 'Цифровая подпись ключа недействительна (ключ подделан или не существует)',
      );
    }

    // Determine duration
    int days = -1;
    bool isLifetime = true;
    final durPart = parts.length > 2 ? parts[2] : '';
    if (durPart.endsWith('D')) {
      days = int.tryParse(durPart.replaceAll('D', '')) ?? 30;
      isLifetime = false;
    } else if (parts[1] == 'LIFE' || durPart == 'LIFE') {
      isLifetime = true;
      days = -1;
    }

    final now = DateTime.now();
    String expiry = 'Бессрочно';
    if (!isLifetime && days > 0) {
      final exp = now.add(Duration(days: days));
      expiry = '${exp.day.toString().padLeft(2, '0')}.${exp.month.toString().padLeft(2, '0')}.${exp.year}';
    }

    final subName = 'PRO ${isLifetime ? 'Lifetime' : '$days Дней'}';
    final msg = isLifetime ? '✓ Бессрочная лицензия PRO (Lifetime) успешно активирована!' : '✓ Лицензия PRO на $days дней успешно активирована!';

    return (
      valid: true,
      subscription: subName,
      expiry: expiry,
      message: msg,
    );
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

    // Step 1: Query Vercel Online Server API
    try {
      final resp = await http.post(
        Uri.parse(_verifyApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'key': cleanKey}),
      ).timeout(const Duration(seconds: 5));

      if (resp.statusCode == 200) {
        final data = json.decode(resp.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          return AuthResult(
            success: true,
            message: data['message'] as String? ?? 'Лицензия успешно проверена на сервере!',
            username: 'PRO Player',
            subscription: data['subscription'] as String? ?? 'PRO Lifetime',
            expiry: data['expiry'] as String? ?? 'Бессрочно',
            isPremium: true,
          );
        }
      }
    } catch (_) {}

    // Step 2: Cryptographic HMAC Signature Verification (Offline / Direct)
    final cryptoResult = _verifyCryptographicSignature(cleanKey);
    if (cryptoResult.valid) {
      return AuthResult(
        success: true,
        message: cryptoResult.message,
        username: 'PRO Player',
        subscription: cryptoResult.subscription,
        expiry: cryptoResult.expiry,
        isPremium: true,
      );
    }

    // Step 3: KeyAuth Cloud Fallback
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
        }
      }
    } catch (_) {}

    return AuthResult(
      success: false,
      message: cryptoResult.message.isNotEmpty
          ? cryptoResult.message
          : 'Недействительный или неподлинный лицензионный ключ',
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

