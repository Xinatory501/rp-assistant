import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';
import '../providers/app_store_provider.dart';
import '../constants/servers.dart';
import '../services/game_detector.dart';
import '../services/keyauth_service.dart';
import '../services/lua_injector_service.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';
import 'welcome_screen.dart';

class LauncherScreen extends ConsumerStatefulWidget {
  final VoidCallback onLaunchOverlay;
  const LauncherScreen({super.key, required this.onLaunchOverlay});

  @override
  ConsumerState<LauncherScreen> createState() => _LauncherScreenState();
}

class _LauncherScreenState extends ConsumerState<LauncherScreen> {
  GameProcessInfo _gameInfo = const GameProcessInfo(
    isRunning: false,
    statusMessage: 'Проверка процессов...',
  );
  bool _isChecking = false;
  bool _isLaunchingGame = false;
  bool _isInjecting = false;
  String? _launchError;
  String? _injectResult;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _checkGame();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _checkGame(silent: true));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkGame({bool silent = false}) async {
    if (!silent) setState(() => _isChecking = true);
    final info = await GameDetector.checkGameRunning();
    if (mounted) {
      setState(() {
        _gameInfo = info;
        _isChecking = false;
        if (info.isRunning && _launchError != null) {
          _launchError = null;
        }
      });
    }
  }

  Future<void> _handleStartGame() async {
    setState(() => _isLaunchingGame = true);
    final state = ref.read(appStoreProvider);
    final success = await GameDetector.launchAmazingLauncher(state.settings.customGamePath);
    if (mounted) {
      setState(() => _isLaunchingGame = false);
      if (!success) {
        setState(() => _launchError = 'Не удалось найти файл Amazing Games Launcher.exe. Пожалуйста, запустите лаунчер вручную.');
      } else {
        _checkGame();
      }
    }
  }

  void _onPressLaunch() {
    setState(() => _launchError = null);
    widget.onLaunchOverlay();
  }

  void _forceLaunchOverlay() {
    setState(() => _launchError = null);
    widget.onLaunchOverlay();
  }

  Future<void> _injectLua() async {
    final state = ref.read(appStoreProvider);
    final profile = state.activeProfile;
    if (profile == null) return;

    setState(() {
      _isInjecting = true;
      _injectResult = null;
    });

    final gamePath = state.settings.gamePath.isNotEmpty
        ? state.settings.gamePath
        : state.settings.customGamePath;

    final result = await LuaInjectorService.inject(
      profile: profile,
      binds: state.binds,
      hints: state.hints,
      moonloaderDir: gamePath.isNotEmpty ? gamePath : null,
    );

    if (mounted) {
      setState(() {
        _isInjecting = false;
        _injectResult = result.message;
      });
    }
  }

  Future<void> _showActivateKeyDialog() async {
    final ctrl = TextEditingController();
    String? error;
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setInner) => AlertDialog(
          backgroundColor: const Color(0xFF1A1918),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: const Text('Ввести лицензионный ключ',
              style: TextStyle(fontSize: 15, color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: ctrl,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  hintText: 'AMAZING-XXXX-XXXX-XXXX',
                  hintStyle: const TextStyle(color: Color(0xFF555555)),
                  filled: true,
                  fillColor: const Color(0xFF111111),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF333333)),
                  ),
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 8),
                Text(error!, style: const TextStyle(color: Color(0xFFFF6B6B), fontSize: 11)),
              ],
              const SizedBox(height: 8),
              const Text(
                'Приобрести ключ можно на amzrp.vercel.app',
                style: TextStyle(fontSize: 10, color: Color(0xFF888888)),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Отмена', style: TextStyle(color: Color(0xFF888888))),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
              onPressed: () async {
                final key = ctrl.text.trim();
                if (key.isEmpty) return;
                final notifier = ref.read(appStoreProvider.notifier);
                final settings = ref.read(appStoreProvider).settings;
                final res = await KeyAuthService.validateAndActivateKey(key);
                if (res.success) {
                  notifier.updateSettings(settings.copyWith(
                    isPremium: true,
                    premiumKey: key,
                  ));
                  if (ctx.mounted) Navigator.pop(ctx);
                } else {
                  setInner(() => error = res.message);
                }
              },
              child: const Text('Активировать'),
            ),
          ],
        ),
      ),
    );
  }

  void _logout() {
    final notifier = ref.read(appStoreProvider.notifier);
    final state = ref.read(appStoreProvider);
    notifier.updateSettings(state.settings.copyWith(
      isLoggedIn: false,
      premiumKey: '',
      isPremium: false,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);
    final profile = state.activeProfile;
    final settings = state.settings;

    if (state.profiles.isEmpty) {
      return WelcomeScreen(onCompleted: () => setState(() {}));
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          Column(
            children: [
              // ─── Header Bar ───
              GestureDetector(
                onPanStart: (_) => windowManager.startDragging(),
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: const BoxDecoration(
                    color: AppColors.bgCard,
                    border: Border(bottom: BorderSide(color: AppColors.border)),
                  ),
                  child: Row(
                    children: [
                      // App Brand
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: AppColors.accentDark,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.accentBorder),
                        ),
                        child: const Icon(Icons.auto_awesome, size: 14, color: AppColors.accent),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'RP ASSISTANT LAUNCHER',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: AppColors.textPrimary),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: settings.isPremium ? const Color(0x3322C55E) : const Color(0x336B7280),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: settings.isPremium ? const Color(0x6622C55E) : const Color(0x666B7280)),
                        ),
                        child: Text(
                          settings.isPremium ? 'PRO LICENSED' : 'FREE BASIC',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: settings.isPremium ? const Color(0xFF86EFAC) : AppColors.textMuted,
                          ),
                        ),
                      ),
                      const Spacer(),

                      // User info
                      Row(
                        children: [
                          const Icon(Icons.account_circle, size: 16, color: AppColors.textMuted),
                          const SizedBox(width: 6),
                          Text(
                            settings.username.isNotEmpty ? settings.username : 'Игрок',
                            style: const TextStyle(fontSize: 11, color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 12),
                          IconButton(
                            icon: const Icon(Icons.logout, size: 15, color: AppColors.textDim),
                            tooltip: 'Сменить аккаунт / Выйти',
                            onPressed: _logout,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // ─── Main Content ───
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Status Bar: Game Detection
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: _gameInfo.isRunning ? const Color(0x1A22C55E) : const Color(0x1AEAB308),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _gameInfo.isRunning ? const Color(0x4022C55E) : const Color(0x40EAB308),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _gameInfo.isRunning ? const Color(0xFF22C55E) : const Color(0xFFEAB308),
                                boxShadow: [
                                  BoxShadow(
                                    color: (_gameInfo.isRunning ? const Color(0xFF22C55E) : const Color(0xFFEAB308)).withOpacity(0.5),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _gameInfo.isRunning
                                        ? 'Игра Amazing Online обнаружена (${_gameInfo.processName ?? 'active'}${_gameInfo.pid != null ? ', PID: ${_gameInfo.pid}' : ''})'
                                        : 'Игра Amazing Online не найдена в процессах',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: _gameInfo.isRunning ? const Color(0xFF86EFAC) : const Color(0xFFFDE047),
                                    ),
                                  ),
                                  Text(
                                    _gameInfo.isRunning
                                        ? 'Оверлей готов к инъекции команд F6 и работе поверх экрана'
                                        : 'Запустите Amazing Online через официальный лаунчер перед стартом',
                                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                            if (!_gameInfo.isRunning) ...[
                              RpButton(
                                label: _isLaunchingGame ? 'Запуск...' : 'Открыть игру',
                                icon: Icons.sports_esports,
                                small: true,
                                outlined: true,
                                onPressed: _isLaunchingGame ? null : _handleStartGame,
                              ),
                              const SizedBox(width: 6),
                            ],
                            IconButton(
                              icon: _isChecking
                                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent))
                                  : const Icon(Icons.refresh, size: 16, color: AppColors.textMuted),
                              tooltip: 'Проверить статус процессов',
                              onPressed: _isChecking ? null : () => _checkGame(),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // ── Free / Premium banner ──────────────────────────
                      if (!settings.isPremium)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0x22F59E0B),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0x55F59E0B)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star_border, size: 16, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Text(
                                  'Вы используете бесплатную версию. Ряд функций ограничен.',
                                  style: TextStyle(fontSize: 11, color: Color(0xFFFDE68A)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: _showActivateKeyDialog,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF59E0B),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'Ввести ключ',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              GestureDetector(
                                onTap: () {
                                  // Open site
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1A1818),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFF444444)),
                                  ),
                                  child: const Text(
                                    'Купить',
                                    style: TextStyle(fontSize: 10, color: Color(0xFFF59E0B)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      const SizedBox(height: 6),

                      // Error Diagnostic Modal Banner
                      if (_launchError != null) ...[
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0x2EF43F5E),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0x66F43F5E)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.warning_amber_rounded, size: 18, color: Color(0xFFF43F5E)),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Предупреждение о запуске',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFFDA4AF)),
                                  ),
                                  const Spacer(),
                                  IconButton(
                                    icon: const Icon(Icons.close, size: 14, color: AppColors.textMuted),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    onPressed: () => setState(() => _launchError = null),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _launchError!,
                                style: const TextStyle(fontSize: 11, color: Color(0xFFFECDD3), height: 1.4),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  ElevatedButton.icon(
                                    icon: const Icon(Icons.refresh, size: 13),
                                    label: const Text('Повторить проверку'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF3B2421),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      textStyle: const TextStyle(fontSize: 11),
                                    ),
                                    onPressed: () => _checkGame(),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    icon: const Icon(Icons.play_arrow, size: 13),
                                    label: const Text('Принудительно запустить оверлей'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: const Color(0xFFFDA4AF),
                                      side: const BorderSide(color: Color(0x66F43F5E)),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      textStyle: const TextStyle(fontSize: 11),
                                    ),
                                    onPressed: _forceLaunchOverlay,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Middle Cards: Server & Character
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Left: Character Summary Card
                          Expanded(
                            flex: 6,
                            child: RpCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const SectionHeader('Активный персонаж'),
                                      if (profile != null)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Color(kServerColors[profile.server] ?? 0xFFEF4444).withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: Color(kServerColors[profile.server] ?? 0xFFEF4444).withOpacity(0.4)),
                                          ),
                                          child: Text(
                                            'Сервер ${profile.server}',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: Color(kServerColors[profile.server] ?? 0xFFEF4444),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  if (profile != null) ...[
                                    Text(
                                      profile.name.isNotEmpty ? profile.name : 'Имя не указано',
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${profile.org} • ${profile.rank}',
                                      style: const TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w500),
                                    ),
                                    if (profile.dept.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text('Отдел: ${profile.dept}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                    ],
                                    if (profile.callsign.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text('Позывной: «${profile.callsign}»', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                    ],
                                    // Quick Switcher dropdown or create new
                                    Row(
                                      children: [
                                        if (state.profiles.length > 1)
                                          Expanded(
                                            child: DropdownButtonFormField<String>(
                                              value: state.activeProfileId,
                                              isDense: true,
                                              decoration: const InputDecoration(
                                                labelText: 'Сменить персонажа',
                                                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                              ),
                                              items: state.profiles.map((p) {
                                                return DropdownMenuItem(
                                                  value: p.id,
                                                  child: Text('${p.name} [${p.server}]', style: const TextStyle(fontSize: 11)),
                                                );
                                              }).toList(),
                                              onChanged: (id) {
                                                if (id != null) notifier.setActiveProfile(id);
                                              },
                                            ),
                                          ),
                                        if (state.profiles.length > 1) const SizedBox(width: 8),
                                        OutlinedButton.icon(
                                          icon: const Icon(Icons.person_add, size: 12),
                                          label: const Text('+ Персонаж'),
                                          style: OutlinedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                            textStyle: const TextStyle(fontSize: 10.5),
                                          ),
                                          onPressed: () {
                                            notifier.updateSettings(settings.copyWith(firstRun: true));
                                          },
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(width: 14),

                          // Right: Capabilities & Hotkeys Card
                          Expanded(
                            flex: 5,
                            child: RpCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SectionHeader('Режим оверлея & Горячие клавиши'),
                                  const SizedBox(height: 8),
                                  // Overlay Mode Selector
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.bgMid,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppColors.borderLight),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            const Text('Режим окна:', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                            DropdownButton<String>(
                                              value: settings.overlayAttachmentMode,
                                              underline: const SizedBox(),
                                              isDense: true,
                                              dropdownColor: AppColors.bgCard,
                                              style: const TextStyle(fontSize: 11, color: AppColors.accent, fontWeight: FontWeight.bold),
                                              items: const [
                                                DropdownMenuItem(
                                                  value: 'game_bound',
                                                  child: Text('🎮 Привязка к экрану игры'),
                                                ),
                                                DropdownMenuItem(
                                                  value: 'floating',
                                                  child: Text('🪟 Свободное окно'),
                                                ),
                                              ],
                                              onChanged: (v) {
                                                if (v != null) {
                                                  notifier.updateSettings(settings.copyWith(overlayAttachmentMode: v));
                                                }
                                              },
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          settings.overlayAttachmentMode == 'game_bound'
                                              ? 'Оверлей откроется на том же мониторе, где запущена игра Amazing Online, и закрепится поверх.'
                                              : 'Окно оверлея можно свободно перемещать между экранами.',
                                          style: const TextStyle(fontSize: 9.5, color: AppColors.textDim, height: 1.2),
                                        ),
                                      ],
                                    ),
                                  ),
                                   const SizedBox(height: 10),
                                   _hotkeyRow('Меню в игре', 'Insert / F2 / Alt+M'),
                                   _hotkeyRow('Команда в чат', '/rp или /menu'),
                                   _hotkeyRow('Оверлей Windows', 'Insert / Alt+X'),
                                   const Divider(color: AppColors.borderLight, height: 16),
                                  const Row(
                                    children: [
                                      Icon(Icons.check_circle, size: 13, color: Color(0xFF22C55E)),
                                      SizedBox(width: 6),
                                      Text('Многострочный Биндер готов', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  const Row(
                                    children: [
                                      Icon(Icons.check_circle, size: 13, color: Color(0xFF22C55E)),
                                      SizedBox(width: 6),
                                      Text('Доклады в рацию настроены', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  const Row(
                                    children: [
                                      Icon(Icons.check_circle, size: 13, color: Color(0xFF22C55E)),
                                      SizedBox(width: 6),
                                      Text('База законов 12 серверов активна', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Big Launch Button
                      Container(
                        height: 52,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          gradient: const LinearGradient(
                            colors: [Color(0xFFd97757), Color(0xFFc45b38)],
                          ),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x40d97757),
                              blurRadius: 18,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: _onPressLaunch,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.rocket_launch, size: 20, color: Colors.white),
                              SizedBox(width: 10),
                              Text(
                                'ЗАПУСТИТЬ ОВЕРЛЕЙ RP ASSISTANT',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.8,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Center(
                        child: Text(
                          'После запуска оверлей закрепится поверх игры. Нажимайте Insert в любой момент игры для скрытия и показа.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 10.5, color: AppColors.textDim),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // ── Lua / MoonLoader inject button ──────────────────
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0x559B59B6)),
                          color: const Color(0x159B59B6),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.code, size: 15, color: Color(0xFFBB8FFF)),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Text(
                                    'Lua-инджект в игру (MoonLoader)',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFBB8FFF)),
                                  ),
                                ),
                                SizedBox(
                                  height: 32,
                                  child: ElevatedButton.icon(
                                    icon: _isInjecting
                                        ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                        : const Icon(Icons.system_update_alt, size: 14),
                                    label: Text(_isInjecting ? 'Устанавливаю...' : 'Инджект .lua'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF7D3C98),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                                      textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                    onPressed: _isInjecting ? null : _injectLua,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Устанавливает rp_assistant.lua в папку moonloader\\scripts\\ игры.\nМеню открывается: [INSERT] / [F2] / [Alt+M] / [F10] или командой /rp в чат.',
                              style: TextStyle(fontSize: 10, color: AppColors.textDim, height: 1.3),
                            ),
                            if (_injectResult != null) ...{
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: _injectResult!.startsWith('✅')
                                      ? const Color(0x2222C55E)
                                      : const Color(0x33F43F5E),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: _injectResult!.startsWith('✅')
                                        ? const Color(0x6622C55E)
                                        : const Color(0x66F43F5E),
                                  ),
                                ),
                                child: Text(
                                  _injectResult!,
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    color: _injectResult!.startsWith('✅')
                                        ? const Color(0xFF86EFAC)
                                        : const Color(0xFFFECDD3),
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            },
                          ],
                        ),
                      ),

                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _hotkeyRow(String label, String key) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.bgMid,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(key, style: const TextStyle(fontSize: 10.5, fontFamily: 'monospace', color: AppColors.accent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
