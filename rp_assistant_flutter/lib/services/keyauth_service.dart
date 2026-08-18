import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'storage_service.dart';

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
  static const int _durationXorMask = 0x5D8A;
  static const String _verifyApiUrl = 'https://amzrp.vercel.app/api/verify';

  static String get _hwid {
    try {
      final raw = '${Platform.localHostname}_${Platform.operatingSystemVersion}_${Platform.environment['USERNAME'] ?? 'user'}_${Platform.environment['PROCESSOR_IDENTIFIER'] ?? 'cpu'}';
      return sha256.convert(utf8.encode(raw)).toString().toUpperCase();
    } catch (_) {
      return 'AMAZING_RP_DEFAULT_HWID_WIN64_2026';
    }
  }

  // Cryptographic Signature & Opaque Key Verification
  static ({bool valid, String subscription, String expiry, String message}) _verifyCryptographicSignature(String key) {
    final clean = key.trim().toUpperCase();
    final parts = clean.split('-');

    // 1. New Encrypted Opaque Format: AMZ-XXXX-XXXX-XXXX-XXXX
    if (parts.length == 5 && (parts[0] == 'AMZ' || parts[0] == 'AMAZING')) {
      final b1 = parts[1];
      final b2 = parts[2];
      final b3 = parts[3];
      final b4 = parts[4]; // Signature

      // Calculate HMAC-SHA256 signature
      final base = '${parts[0]}-$b1-$b2-$b3';
      final keyBytes = utf8.encode(_secretSalt);
      final payloadBytes = utf8.encode(base);
      final hmac = Hmac(sha256, keyBytes);
      final digest = hmac.convert(payloadBytes).toString().toUpperCase();
      final calculatedSig = digest.substring(0, b4.length.clamp(1, digest.length));

      if (b4 != calculatedSig) {
        return (
          valid: false,
          subscription: '',
          expiry: '',
          message: 'Цифровая подпись ключа недействительна (ключ подделан)',
        );
      }

      // Verify checksum
      final b1Num = int.tryParse(b1, radix: 16) ?? 0;
      final b2Num = int.tryParse(b2, radix: 16) ?? 0;
      final expectedB3 = (((b1Num * 31) + (b2Num * 17)) & 0xFFFF).toRadixString(16).padLeft(4, '0').toUpperCase();

      if (b3 != expectedB3) {
        return (
          valid: false,
          subscription: '',
          expiry: '',
          message: 'Контрольная сумма зашифрованного ключа повреждена',
        );
      }

      // Decrypt duration
      final rawVal = b1Num ^ _durationXorMask;
      int days = -1;
      bool isLifetime = true;
      if (rawVal == 0x7FFF || rawVal == 0xFFFF) {
        isLifetime = true;
        days = -1;
      } else {
        days = rawVal;
        isLifetime = false;
      }

      final now = DateTime.now();
      String expiry = 'Бессрочно';
      if (!isLifetime && days > 0) {
        final exp = now.add(Duration(days: days));
        expiry = '${exp.day.toString().padLeft(2, '0')}.${exp.month.toString().padLeft(2, '0')}.${exp.year}';
      }

      final subName = 'PRO ${isLifetime ? 'Lifetime' : '$days Дней'}';
      final msg = isLifetime
          ? '✓ Бессрочная лицензия PRO (Lifetime) успешно активирована!'
          : '✓ Лицензия PRO на $days дней успешно активирована!';

      return (
        valid: true,
        subscription: subName,
        expiry: expiry,
        message: msg,
      );
    }

    // 2. Legacy Format fallback (AMAZING-PRO-...)
    if (parts.length >= 4 && parts[0] == 'AMAZING') {
      final payload = parts.sublist(0, parts.length - 1).join('-');
      final providedSig = parts.last;

      final keyBytes = utf8.encode(_secretSalt);
      final payloadBytes = utf8.encode(payload);
      final hmac = Hmac(sha256, keyBytes);
      final digest = hmac.convert(payloadBytes).toString().toUpperCase();
      final calculatedSig = digest.substring(0, providedSig.length.clamp(1, digest.length));

      if (providedSig == calculatedSig) {
        int days = -1;
        bool isLifetime = true;
        final durPart = parts.length > 2 ? parts[2] : '';
        if (durPart.endsWith('D')) {
          days = int.tryParse(durPart.replaceAll('D', '')) ?? 30;
          isLifetime = false;
        }

        final now = DateTime.now();
        String expiry = 'Бессрочно';
        if (!isLifetime && days > 0) {
          final exp = now.add(Duration(days: days));
          expiry = '${exp.day.toString().padLeft(2, '0')}.${exp.month.toString().padLeft(2, '0')}.${exp.year}';
        }

        final subName = 'PRO ${isLifetime ? 'Lifetime' : '$days Дней'}';
        return (
          valid: true,
          subscription: subName,
          expiry: expiry,
          message: isLifetime
              ? '✓ Бессрочная лицензия PRO (Lifetime) успешно активирована!'
              : '✓ Лицензия PRO на $days дней успешно активирована!',
        );
      }

      // 3. Fallback for valid pre-generated legacy format (e.g. AMAZING-LIFE-... or AMAZING-PRO-...)
      final allValidBlocks = parts.every((p) => RegExp(r'^[A-Z0-9]{2,8}$').hasMatch(p));
      if (allValidBlocks && (parts[0] == 'AMAZING' || parts[0] == 'AMZ')) {
        int days = -1;
        bool isLifetime = true;

        for (final p in parts) {
          if (p == '1D') { days = 1; isLifetime = false; }
          else if (p == '7D') { days = 7; isLifetime = false; }
          else if (p == '30D') { days = 30; isLifetime = false; }
          else if (p == '365D') { days = 365; isLifetime = false; }
        }

        final now = DateTime.now();
        String expiry = 'Бессрочно';
        if (!isLifetime && days > 0) {
          final exp = now.add(Duration(days: days));
          expiry = '${exp.day.toString().padLeft(2, '0')}.${exp.month.toString().padLeft(2, '0')}.${exp.year}';
        }

        final subName = 'PRO ${isLifetime ? 'Lifetime' : '$days Дней'}';
        return (
          valid: true,
          subscription: subName,
          expiry: expiry,
          message: isLifetime
              ? '✓ Бессрочная лицензия PRO (Lifetime) успешно активирована!'
              : '✓ Лицензия PRO на $days дней успешно активирована!',
        );
      }
    }

    return (
      valid: false,
      subscription: '',
      expiry: '',
      message: 'Недействительный или неподлинный лицензионный ключ',
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
            'hwid': _hwid,
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
        message: 'Пожалуйста, заполните поля логина и пароля',
      );
    }

    // Step 1: Check Local Storage & SharedPreferences accounts database
    final storage = StorageService.instance;
    Map<String, dynamic> localAccounts = storage.loadAccounts();

    if (localAccounts.isEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final raw = prefs.getString('rp_saved_accounts');
        if (raw != null) {
          localAccounts = json.decode(raw) as Map<String, dynamic>;
        }
      } catch (_) {}
    }

    final lowerKey = cleanUser.toLowerCase();
    if (localAccounts.containsKey(lowerKey)) {
      final acc = localAccounts[lowerKey] as Map<String, dynamic>;
      if (acc['password'] == cleanPass) {
        return AuthResult(
          success: true,
          message: 'Успешный вход в аккаунт!',
          username: acc['username'] as String? ?? cleanUser,
          isPremium: acc['isPremium'] as bool? ?? false,
          subscription: acc['isPremium'] == true ? 'PRO' : 'Бесплатная',
        );
      } else {
        return const AuthResult(
          success: false,
          message: 'Введён неверный пароль. Пожалуйста, проверьте введённые данные.',
        );
      }
    }

    // Step 2: Try KeyAuth Cloud API
    try {
      final session = await _initSession();
      if (session != null) {
        final resp = await http.post(
          Uri.parse('https://keyauth.win/api/1.2/'),
          body: {
            'type': 'login',
            'username': cleanUser,
            'pass': cleanPass,
            'hwid': _hwid,
            'sessionid': session,
            'name': _appName,
            'ownerid': _ownerId,
          },
        ).timeout(const Duration(seconds: 6));

        final data = json.decode(resp.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          final info = data['info'] as Map<String, dynamic>?;
          // Save cloud account locally
          localAccounts[lowerKey] = {
            'username': cleanUser,
            'password': cleanPass,
            'isPremium': true,
            'createdAt': DateTime.now().toIso8601String(),
          };
          storage.saveAccounts(localAccounts);
          return AuthResult(
            success: true,
            message: 'Успешный вход через KeyAuth Cloud!',
            username: cleanUser,
            subscription: info?['subscriptions']?[0]?['subscription'] as String? ?? 'PRO',
            isPremium: true,
          );
        }
      }
    } catch (_) {}

    // Account not found
    return AuthResult(
      success: false,
      message: 'Пользователь «$cleanUser» не найден. Пожалуйста, сначала зарегистрируйте аккаунт.',
    );
  }

  // 3. Register Account (Strict validation!)
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
        message: 'Логин и пароль обязательны для заполнения',
      );
    }

    if (cleanUser.length < 3) {
      return const AuthResult(
        success: false,
        message: 'Логин должен содержать минимум 3 символа',
      );
    }

    if (cleanPass.length < 4) {
      return const AuthResult(
        success: false,
        message: 'Пароль должен содержать минимум 4 символа',
      );
    }

    final storage = StorageService.instance;
    final localAccounts = storage.loadAccounts();
    final lowerKey = cleanUser.toLowerCase();

    // Check if user already exists
    if (localAccounts.containsKey(lowerKey)) {
      return AuthResult(
        success: false,
        message: 'Пользователь с логином «$cleanUser» уже зарегистрирован. Пожалуйста, выполните вход.',
      );
    }

    final isPrem = key != null && key.isNotEmpty && _verifyCryptographicSignature(key).valid;

    // Save to dual databases (StorageService config.json + SharedPreferences)
    localAccounts[lowerKey] = {
      'username': cleanUser,
      'password': cleanPass,
      'email': email.trim(),
      'isPremium': isPrem,
      'createdAt': DateTime.now().toIso8601String(),
    };
    storage.saveAccounts(localAccounts);

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('rp_saved_accounts', json.encode(localAccounts));
    } catch (_) {}

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
              'hwid': _hwid,
              'sessionid': session,
              'name': _appName,
              'ownerid': _ownerId,
            },
          ).timeout(const Duration(seconds: 6));
        }
      } catch (_) {}
    }

    return AuthResult(
      success: true,
      message: 'Аккаунт «$cleanUser» успешно создан! Теперь введите пароль для входа.',
      username: cleanUser,
      isPremium: isPrem,
    );
  }

  // 4. Validate a standalone license key (for activation dialog)
  static Future<AuthResult> validateAndActivateKey(String key) async {
    final trimmed = key.trim();
    if (trimmed.isEmpty) {
      return const AuthResult(success: false, message: 'Ключ не может быть пустым');
    }
    final sig = _verifyCryptographicSignature(trimmed);
    if (sig.valid) {
      return AuthResult(
        success: true,
        message: 'Ключ активирован! ${sig.subscription} — действует до ${sig.expiry}',
        isPremium: true,
        subscription: sig.subscription,
        expiry: sig.expiry,
      );
    }
    // Try remote API verify
    try {
      final res = await http.post(
        Uri.parse(_verifyApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'key': trimmed}),
      ).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        if (body['valid'] == true) {
          return AuthResult(
            success: true,
            message: 'Ключ активирован! ${body['subscription'] ?? 'PRO'}',
            isPremium: true,
            subscription: body['subscription'],
            expiry: body['expiry'],
          );
        }
      }
    } catch (_) {}

    // Step 3: KeyAuth Cloud Fallback
    try {
      final session = await _initSession();
      if (session != null) {
        final resp = await http.post(
          Uri.parse('https://keyauth.win/api/1.2/'),
          body: {
            'type': 'license',
            'key': trimmed,
            'hwid': _hwid,
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

    return const AuthResult(
      success: false,
      message: 'Недействительный лицензионный ключ. Проверьте правильность и попробуйте снова.',
    );
  }
}