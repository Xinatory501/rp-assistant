import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/app_store_provider.dart';
import '../services/keyauth_service.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

enum _AuthMode { key, login, register }

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  _AuthMode _mode = _AuthMode.key;
  final _keyCtrl = TextEditingController();
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _regKeyCtrl = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _keyCtrl.dispose();
    _userCtrl.dispose();
    _passCtrl.dispose();
    _emailCtrl.dispose();
    _regKeyCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    final notifier = ref.read(appStoreProvider.notifier);
    final state = ref.read(appStoreProvider);

    try {
      if (_mode == _AuthMode.key) {
        final res = await KeyAuthService.loginWithKey(_keyCtrl.text);
        if (res.success) {
          notifier.updateSettings(state.settings.copyWith(
            isLoggedIn: true,
            isPremium: true,
            premiumKey: _keyCtrl.text.trim(),
            username: res.username ?? 'PRO Player',
            licenseExpiry: res.expiry ?? 'Бессрочно',
          ));
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else if (_mode == _AuthMode.login) {
        final res = await KeyAuthService.loginWithCredentials(
          _userCtrl.text,
          _passCtrl.text,
        );
        if (res.success) {
          notifier.updateSettings(state.settings.copyWith(
            isLoggedIn: true,
            username: res.username ?? _userCtrl.text.trim(),
            isPremium: res.isPremium,
          ));
        } else {
          setState(() => _errorMessage = res.message);
        }
      } else {
        final res = await KeyAuthService.registerUser(
          username: _userCtrl.text,
          password: _passCtrl.text,
          email: _emailCtrl.text,
          key: _regKeyCtrl.text.trim().isEmpty ? null : _regKeyCtrl.text.trim(),
        );
        if (res.success) {
          setState(() {
            _successMessage = res.message;
            _mode = _AuthMode.login;
          });
        } else {
          setState(() => _errorMessage = res.message);
        }
      }
    } catch (e) {
      setState(() => _errorMessage = 'Ошибка: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _skipToFree() {
    final notifier = ref.read(appStoreProvider.notifier);
    final state = ref.read(appStoreProvider);
    notifier.updateSettings(state.settings.copyWith(
      isLoggedIn: true,
      isPremium: false,
      username: 'Бесплатный пользователь',
      licenseExpiry: 'Free Basic',
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 440),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.bgCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black45,
                  blurRadius: 30,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Logo
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0xFF28231f),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.accentBorder),
                      ),
                      child: const Icon(Icons.auto_awesome, color: AppColors.accent, size: 22),
                    ),
                    const SizedBox(width: 12),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'RP Assistant',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        Text(
                          'Лаунчер для Amazing Online',
                          style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Tab Switcher
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.bgMid,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  padding: const EdgeInsets.all(3),
                  child: Row(
                    children: [
                      Expanded(
                        child: _tabButton('Ключ', _AuthMode.key),
                      ),
                      Expanded(
                        child: _tabButton('Логин', _AuthMode.login),
                      ),
                      Expanded(
                        child: _tabButton('Регистрация', _AuthMode.register),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Error Banner
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0x33EF4444),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0x66EF4444)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, size: 16, color: Color(0xFFEF4444)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(fontSize: 11, color: Color(0xFFFCA5A5)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // Success Banner
                if (_successMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0x3322C55E),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0x6622C55E)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_outline, size: 16, color: Color(0xFF22C55E)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _successMessage!,
                            style: const TextStyle(fontSize: 11, color: Color(0xFF86EFAC)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // Form Fields
                if (_mode == _AuthMode.key) ...[
                  RpTextField(
                    label: 'Лицензионный ключ',
                    hint: 'AMAZING-PRO-XXXX-XXXX-XXXX',
                    controller: _keyCtrl,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Нет ключа?', style: TextStyle(fontSize: 11, color: AppColors.textDim)),
                      GestureDetector(
                        onTap: () => launchUrl(Uri.parse('https://amzrp.vercel.app#pricing')),
                        child: const Text('Купить на сайте →', style: TextStyle(fontSize: 11, color: AppColors.accent, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ] else if (_mode == _AuthMode.login) ...[
                  RpTextField(
                    label: 'Логин / Почта',
                    hint: 'nickname или email@domain.com',
                    controller: _userCtrl,
                  ),
                  const SizedBox(height: 10),
                  RpTextField(
                    label: 'Пароль',
                    hint: '••••••••',
                    controller: _passCtrl,
                    obscureText: true,
                  ),
                ] else ...[
                  RpTextField(
                    label: 'Желаемый логин',
                    hint: 'Ivan_Ivanov',
                    controller: _userCtrl,
                  ),
                  const SizedBox(height: 10),
                  RpTextField(
                    label: 'Email (для восстановления)',
                    hint: 'you@mail.ru',
                    controller: _emailCtrl,
                  ),
                  const SizedBox(height: 10),
                  RpTextField(
                    label: 'Пароль',
                    hint: '••••••••',
                    controller: _passCtrl,
                    obscureText: true,
                  ),
                  const SizedBox(height: 10),
                  RpTextField(
                    label: 'Ключ активации (необязательно)',
                    hint: 'AMAZING-PRO-XXXX...',
                    controller: _regKeyCtrl,
                  ),
                ],

                const SizedBox(height: 20),

                // Submit Button
                SizedBox(
                  height: 40,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(
                            _mode == _AuthMode.key
                                ? 'Войти по ключу'
                                : _mode == _AuthMode.login
                                    ? 'Войти в аккаунт'
                                    : 'Зарегистрироваться',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),

                const SizedBox(height: 12),

                // Free Mode Skip
                TextButton(
                  onPressed: _skipToFree,
                  style: TextButton.styleFrom(foregroundColor: AppColors.textMuted),
                  child: const Text('Продолжить в бесплатном режиме →', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tabButton(String title, _AuthMode mode) {
    final active = _mode == mode;
    return GestureDetector(
      onTap: () => setState(() {
        _mode = mode;
        _errorMessage = null;
        _successMessage = null;
      }),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppColors.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: active ? FontWeight.bold : FontWeight.normal,
            color: active ? Colors.white : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}
