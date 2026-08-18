import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../constants/servers.dart';
import '../services/game_detector.dart';
import '../services/keyauth_service.dart';
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Лаунчер Amazing Online не найден по умолчанию. Пожалуйста, запустите его вручную.', style: TextStyle(fontSize: 12)),
            backgroundColor: AppColors.bgMid,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        _checkGame();
      }
    }
  }

  Future<void> _showActivateKeyDialog() async {
    final ctrl = TextEditingController();
    String? error;
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setInner) => AlertDialog(
          backgroundColor: AppColors.bgCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.border),
          ),
          title: const Text(
            'Ввести ключ активации',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: ctrl,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontFamily: 'monospace'),
                decoration: const InputDecoration(
                  hintText: 'AMAZING-XXXX-XXXX-XXXX',
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 8),
                Text(error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 11)),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Отмена', style: TextStyle(color: AppColors.textMuted)),
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
      body: Column(
        children: [
          // Claude Minimal Frameless Titlebar
          ClaudeTitleBar(
            title: 'RP Assistant',
            subtitle: settings.isPremium ? 'PRO' : 'FREE',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (!settings.isPremium)
                  GestureDetector(
                    onTap: _showActivateKeyDialog,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.accent.withOpacity(0.4)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.key, size: 10, color: AppColors.accent),
                          SizedBox(width: 4),
                          Text(
                            'Активировать PRO',
                            style: TextStyle(fontSize: 10, color: AppColors.accent, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                Text(
                  settings.username.isNotEmpty ? settings.username : 'Пользователь',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
                const SizedBox(width: 12),
              ],
            ),
          ),

          // Main Scrollable Area
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Center(
                child: ConstrainedBox(
                  constraints: const ConstrainedBoxConstraints(maxWidth: 820),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Status Bar: Game Detection
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.bgCard,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _gameInfo.isRunning
                                ? const Color(0xFF10B981).withOpacity(0.3)
                                : AppColors.border,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _gameInfo.isRunning
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFF59E0B),
                                boxShadow: [
                                  BoxShadow(
                                    color: (_gameInfo.isRunning
                                            ? const Color(0xFF10B981)
                                            : const Color(0xFFF59E0B))
                                        .withOpacity(0.4),
                                    blurRadius: 6,
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
                                        ? 'Amazing Online активен (${_gameInfo.processName ?? 'amazing.exe'})'
                                        : 'Amazing Online не запущен',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _gameInfo.isRunning
                                        ? 'Оверлей готов к работе поверх окна игры'
                                        : 'Запустите игру через лаунчер Amazing Online для автоматической привязки',
                                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                            if (!_gameInfo.isRunning) ...[
                              RpButton(
                                label: _isLaunchingGame ? 'Запуск...' : 'Открыть игру',
                                icon: Icons.play_arrow,
                                small: true,
                                outlined: true,
                                onPressed: _isLaunchingGame ? null : _handleStartGame,
                              ),
                              const SizedBox(width: 8),
                            ],
                            IconButton(
                              icon: _isChecking
                                  ? const SizedBox(
                                      width: 12,
                                      height: 12,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2, color: AppColors.accent))
                                  : const Icon(Icons.refresh, size: 15, color: AppColors.textMuted),
                              tooltip: 'Обновить статус',
                              onPressed: _isChecking ? null : () => _checkGame(),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 2. Main Hero CTA Button
                      Container(
                        height: 56,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: AppColors.accent,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withOpacity(0.25),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(10),
                            onTap: widget.onLaunchOverlay,
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 20),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.layers, size: 20, color: Colors.white),
                                  SizedBox(width: 10),
                                  Text(
                                    'ОТКРЫТЬ ОВЕРЛЕЙ RP ASSISTANT',
                                    style: TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 8),
                      const Center(
                        child: Text(
                          'Хоткей в игре: Insert / Alt+X • Работает в режиме «В окне» и «В окне без рамки»',
                          style: TextStyle(fontSize: 10.5, color: AppColors.textDim),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // 3. Active Profile Card
                      RpCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const SectionHeader('Активный персонаж'),
                                if (profile != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Color(kServerColors[profile.server] ?? 0xFFEF4444).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: Color(kServerColors[profile.server] ?? 0xFFEF4444).withOpacity(0.35),
                                      ),
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
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          profile.name.isNotEmpty ? profile.name : 'Имя не задано',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${profile.org} • ${profile.rank}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.accent,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        if (profile.dept.isNotEmpty || profile.callsign.isNotEmpty) ...[
                                          const SizedBox(height: 3),
                                          Text(
                                            [
                                              if (profile.dept.isNotEmpty) 'Отдел: ${profile.dept}',
                                              if (profile.callsign.isNotEmpty) 'Позывной: «${profile.callsign}»',
                                            ].join(' • '),
                                            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  if (state.profiles.length > 1)
                                    SizedBox(
                                      width: 200,
                                      child: DropdownButtonFormField<String>(
                                        value: state.activeProfileId,
                                        isDense: true,
                                        decoration: const InputDecoration(
                                          labelText: 'Сменить',
                                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        ),
                                        items: state.profiles.map((p) {
                                          return DropdownMenuItem(
                                            value: p.id,
                                            child: Text('${p.name} [${p.server}]',
                                                style: const TextStyle(fontSize: 11)),
                                          );
                                        }).toList(),
                                        onChanged: (id) {
                                          if (id != null) notifier.setActiveProfile(id);
                                        },
                                      ),
                                    ),
                                  const SizedBox(width: 8),
                                  RpButton(
                                    label: '+ Новый',
                                    small: true,
                                    outlined: true,
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

                      const SizedBox(height: 16),

                      // 4. Feature Cards (2x2 Grid in Claude Style)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _FeatureCard(
                              icon: Icons.keyboard_alt_outlined,
                              title: 'Многострочный Биндер',
                              description: 'Автоматические отыгровки, доклады в рацию и настраиваемые горячие клавиши с задержками.',
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: _FeatureCard(
                              icon: Icons.gavel_outlined,
                              title: 'Законы и Кодексы',
                              description: 'Уголовный, Административный кодексы и Уставы всех 12 серверов с мгновенным поиском.',
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _FeatureCard(
                              icon: Icons.balance_outlined,
                              title: 'Миранда & Задержание',
                              description: 'Быстрое копирование прав задержанного (/me, чат) и команд /cuff, /frisk, /incar.',
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: _FeatureCard(
                              icon: Icons.menu_book_outlined,
                              title: 'Шпаргалки & Термины',
                              description: 'РП-термины (DM, DB, MG, PG, SK, TK), подсказки для собеседований и экзаменов.',
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // 5. Clean Minimal Footer
                      const Center(
                        child: Text(
                          'RP Assistant v1.2 • Полная совместимость с Amazing Online • Без инжектов и без риска вылетов',
                          style: TextStyle(fontSize: 10, color: AppColors.textDim),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Center(
                  child: Icon(icon, size: 14, color: AppColors.accent),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textMuted,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}