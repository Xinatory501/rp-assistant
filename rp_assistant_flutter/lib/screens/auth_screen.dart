import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../services/keyauth_service.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

enum _AuthMode { login, register }

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  _AuthMode _mode = _AuthMode.login;
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _licenseCtrl = TextEditingController(); // optional license key at registration

  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _userCtrl.dispose();
    _passCtrl.dispose();
    _emailCtrl.dispose();
    _licenseCtrl.dispose();
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
      if (_mode == _AuthMode.login) {
        if (_userCtrl.text.trim().isEmpty || _passCtrl.text.trim().isEmpty) {
          setState(() => _errorMessage = 'Введите логин и пароль для входа');
          return;
        }
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
        if (_userCtrl.text.trim().isEmpty || _passCtrl.text.trim().isEmpty) {
          setState(() => _errorMessage = 'Заполните обязательные поля: Логин и Пароль');
          return;
        }
        final res = await KeyAuthService.registerUser(
          username: _userCtrl.text,
          password: _passCtrl.text,
          email: _emailCtrl.text,
          key: _licenseCtrl.text.trim().isEmpty ? null : _licenseCtrl.text.trim(),
        );
        if (res.success) {
          // If license key was valid — auto-activate premium
          if (_licenseCtrl.text.trim().isNotEmpty && res.isPremium) {
            final notifier = ref.read(appStoreProvider.notifier);
            final settings = ref.read(appStoreProvider).settings;
            notifier.updateSettings(settings.copyWith(
              isPremium: true,
              premiumKey: _licenseCtrl.text.trim(),
            ));
          }
          setState(() {
            _successMessage = 'Аккаунт успешно создан! Введите пароль для входа.';
            _mode = _AuthMode.login;
            _licenseCtrl.clear();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 440),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: AppColors.bgCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black54,
                  blurRadius: 32,
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
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF28231f),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.accentBorder),
                      ),
                      child: const Icon(Icons.shield, color: AppColors.accent, size: 24),
                    ),
                    const SizedBox(width: 14),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'RP Assistant',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        Text(
                          'Лаунчер и оверлей для Amazing Online',
                          style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Tab Switcher (Вход / Регистрация)
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
                        child: _tabButton('Вход', _AuthMode.login),
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
                if (_mode == _AuthMode.login) ...[
                  RpTextField(
                    label: 'Логин',
                    hint: 'Введите ваш логин',
                    controller: _userCtrl,
                  ),
                  const SizedBox(height: 12),
                  RpTextField(
                    label: 'Пароль',
                    hint: '••••••••',
                    controller: _passCtrl,
                    obscureText: true,
                  ),
                ] else ...[
                  RpTextField(
                    label: 'Желаемый логин',
                    hint: 'Придумайте логин',
                    controller: _userCtrl,
                  ),
                  const SizedBox(height: 12),
                  RpTextField(
                    label: 'Email (необязательно)',
                    hint: 'you@mail.ru',
                    controller: _emailCtrl,
                  ),
                  const SizedBox(height: 12),
                  RpTextField(
                    label: 'Пароль',
                    hint: '••••••••',
                    controller: _passCtrl,
                    obscureText: true,
                  ),
                  const SizedBox(height: 12),
                  // License key field
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      RpTextField(
                        label: 'Лицензионный ключ (необязательно)',
                        hint: 'AMAZING-XXXX-XXXX-XXXX',
                        controller: _licenseCtrl,
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Если у вас есть ключ — введите его для активации Premium сразу.',
                        style: TextStyle(fontSize: 10, color: AppColors.textDim),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 24),

                // Submit Button
                SizedBox(
                  height: 42,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(
                            _mode == _AuthMode.login
                                ? 'Войти в аккаунт'
                                : 'Зарегистрировать аккаунт',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),

                const SizedBox(height: 16),

                // Bottom Switch Links
                if (_mode == _AuthMode.login) ...[
                  Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Нет аккаунта? ', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                        GestureDetector(
                          onTap: () => setState(() {
                            _mode = _AuthMode.register;
                            _errorMessage = null;
                            _successMessage = null;
                          }),
                          child: const Text(
                            'Зарегистрироваться',
                            style: TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Уже есть аккаунт? ', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                        GestureDetector(
                          onTap: () => setState(() {
                            _mode = _AuthMode.login;
                            _errorMessage = null;
                            _successMessage = null;
                          }),
                          child: const Text(
                            'Войти',
                            style: TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
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
        padding: const EdgeInsets.symmetric(vertical: 7),
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

