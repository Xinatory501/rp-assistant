import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';
import '../providers/app_store_provider.dart';
import '../constants/servers.dart';
import '../tabs/binder_tab.dart';
import '../tabs/reports_tab.dart';
import '../tabs/interview_tab.dart';
import '../tabs/hints_tab.dart';
import '../tabs/chat_tab.dart';
import '../tabs/settings_tab.dart';
import '../widgets/app_theme.dart';
import '../services/game_detector.dart';
import '../services/lua_injector_service.dart';
import 'welcome_screen.dart';
import 'auth_screen.dart';
import 'launcher_screen.dart';
import 'game_path_wizard.dart';

enum _Tab { binder, reports, interview, hints, chat, settings }

const _kTabLabels = {
  _Tab.binder: 'Биндер',
  _Tab.reports: 'Доклады',
  _Tab.interview: 'Собеседование',
  _Tab.hints: 'Шпаргалки',
  _Tab.chat: 'ИИ-Юрист',
  _Tab.settings: 'Настройки',
};

const _kTabIcons = {
  _Tab.binder: Icons.tag,
  _Tab.reports: Icons.radio,
  _Tab.interview: Icons.how_to_reg,
  _Tab.hints: Icons.menu_book,
  _Tab.chat: Icons.smart_toy,
  _Tab.settings: Icons.settings,
};

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});
  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> with WindowListener {
  _Tab _tab = _Tab.binder;
  bool _profileMenuOpen = false;
  bool _configMenuOpen = false;

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        await windowManager.show();
        await windowManager.focus();
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    super.dispose();
  }

  void _closeMenus() {
    if (_profileMenuOpen || _configMenuOpen) {
      setState(() {
        _profileMenuOpen = false;
        _configMenuOpen = false;
      });
    }
  }

  Future<void> _handleLaunchOverlay() async {
    final state = ref.read(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);

    // 1. Inject Lua script into game (ONLY injection method)
    if (state.activeProfile != null) {
      await LuaInjectorService.inject(
        profile: state.activeProfile!,
        binds: state.binds,
        hints: state.hints,
        moonloaderDir: state.settings.gamePath.isNotEmpty
            ? '${state.settings.gamePath}\\moonloader'
            : null,
      );
    }

    // 2. Attach overlay window above game
    notifier.updateSettings(state.settings.copyWith(isOverlayMode: true));
    await _attachOverlayToGame();
    _startGameWatcher();
  }

  Future<void> _attachOverlayToGame() async {
    try {
      await windowManager.setAlwaysOnTop(true);
      await windowManager.setSkipTaskbar(true);

      final bounds = await GameDetector.getGameWindowBounds();
      if (bounds != null) {
        // Position our overlay in top-right corner of game window
        final x = bounds['left']! + (bounds['width']! - 420).toDouble();
        final y = bounds['top']! + 20.0;
        await windowManager.setPosition(Offset(x, y));
        await windowManager.setSize(const Size(410, 680));
      }
    } catch (_) {}
  }

  void _startGameWatcher() {
    // Poll every 2 seconds until game window found, then attach
    Future.delayed(const Duration(seconds: 2), () async {
      if (!mounted) return;
      final bounds = await GameDetector.getGameWindowBounds();
      if (bounds != null) {
        await _attachOverlayToGame();
      } else {
        _startGameWatcher(); // keep polling
      }
    });
  }

  Future<void> _handleReturnToLauncher() async {
    final state = ref.read(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);
    try {
      await windowManager.setAlwaysOnTop(false);
    } catch (_) {}
    notifier.updateSettings(state.settings.copyWith(isOverlayMode: false));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);

    if (state.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.bg,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.accent),
        ),
      );
    }

    // 1. Auth Flow: If not logged in, show Auth / Key screen
    if (!state.settings.isLoggedIn) {
      return const AuthScreen();
    }

    // 2. Game Path Wizard: Ask once where Amazing Online is installed
    if (!state.settings.gamePathConfigured) {
      return GamePathWizard(onDone: () => setState(() {}));
    }

    // 3. Character Setup: If no profiles created yet, show Welcome onboarding
    if (state.profiles.isEmpty) {
      return WelcomeScreen(onCompleted: () => setState(() {}));
    }

    // 4. Launcher Dashboard: If not in overlay mode, show Launcher Screen
    if (!state.settings.isOverlayMode) {
      return LauncherScreen(
        onLaunchOverlay: _handleLaunchOverlay,
      );
    }

    final profile = state.activeProfile;
    final config = state.activeConfig;
    final settings = state.settings;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              decoration: BoxDecoration(
                color: Color.fromRGBO(23, 22, 21, settings.opacity),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0x18FFFFFF)),
              ),
              child: Column(
                children: [
                  // --- Row 1: Frameless Titlebar ---
                  GestureDetector(
                    onPanStart: (_) => windowManager.startDragging(),
                    child: Container(
                      height: 38,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: const BoxDecoration(
                        color: AppColors.titlebarBg,
                        border: Border(bottom: BorderSide(color: AppColors.borderLight)),
                      ),
                      child: Row(
                        children: [
                          // App Shield Logo
                          Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(Icons.shield, size: 12, color: Colors.white),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'RP Assistant',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.2,
                            ),
                          ),
                          if (settings.isPremium) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.accentDark,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: AppColors.accentBorder),
                              ),
                              child: const Text(
                                'PRO',
                                style: TextStyle(
                                  color: AppColors.accent,
                                  fontSize: 9,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                          const Spacer(),
                          // Profile Selector Pill
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _profileMenuOpen = !_profileMenuOpen;
                                _configMenuOpen = false;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0x0DFFFFFF),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppColors.borderLight),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Color(kServerColors[profile?.server] ?? 0xFFd97757),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    profile?.name ?? 'Персонаж',
                                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '[${profile?.org ?? '—'}]',
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                                  ),
                                  const Icon(Icons.expand_more, size: 11, color: AppColors.textMuted),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          // Config Pill
                          if (state.savedConfigs.isNotEmpty) ...[
                            GestureDetector(
                              onTap: () {
                                setState(() {
                                  _configMenuOpen = !_configMenuOpen;
                                  _profileMenuOpen = false;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0x0DFFFFFF),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppColors.borderLight),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.folder_zip, size: 10, color: AppColors.accent),
                                    const SizedBox(width: 4),
                                    Text(
                                      config?.title ?? 'Конфиг',
                                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                                    ),
                                    const Icon(Icons.expand_more, size: 11, color: AppColors.textMuted),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                          ],
                          // Return to Launcher
                          IconButton(
                            icon: const Icon(Icons.dashboard_outlined, size: 14, color: AppColors.accent),
                            onPressed: _handleReturnToLauncher,
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                            tooltip: 'Вернуться в меню лаунчера',
                          ),
                          const SizedBox(width: 2),
                          // Window Actions
                          IconButton(
                            icon: const Icon(Icons.remove, size: 13, color: AppColors.textMuted),
                            onPressed: () => windowManager.minimize(),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                            tooltip: 'Свернуть',
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 13, color: AppColors.textMuted),
                            onPressed: () => windowManager.hide(),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                            tooltip: 'Скрыть (Insert)',
                          ),
                        ],
                      ),
                    ),
                  ),
                  // --- Row 2: Tab Bar ---
                  Container(
                    height: 32,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: const BoxDecoration(
                      color: AppColors.tabbarBg,
                      border: Border(bottom: BorderSide(color: AppColors.borderLight)),
                    ),
                    child: Row(
                      children: _Tab.values.map((t) {
                        final active = t == _tab;
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: InkWell(
                            onTap: () {
                              _closeMenus();
                              setState(() => _tab = t);
                            },
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: active ? AppColors.accent : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _kTabIcons[t]!,
                                    size: 11,
                                    color: active ? Colors.white : AppColors.textMuted,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _kTabLabels[t]!,
                                    style: TextStyle(
                                      color: active ? Colors.white : AppColors.textMuted,
                                      fontSize: 11,
                                      fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  // --- Tab Content ---
                  Expanded(
                    child: GestureDetector(
                      onTap: _closeMenus,
                      child: Container(
                        color: AppColors.bg,
                        child: switch (_tab) {
                          _Tab.binder => const BinderTab(),
                          _Tab.reports => const ReportsTab(),
                          _Tab.interview => const InterviewTab(),
                          _Tab.hints => const HintsTab(),
                          _Tab.chat => const ChatTab(),
                          _Tab.settings => const SettingsTab(),
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // --- Profile Dropdown Overlay ---
          if (_profileMenuOpen)
            Positioned(
              top: 38,
              right: 80,
              width: 220,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.bgMid,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                  boxShadow: const [
                    BoxShadow(color: Colors.black87, blurRadius: 16, offset: Offset(0, 6))
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.fromLTRB(10, 8, 10, 4),
                      child: Text('ПЕРСОНАЖИ',
                          style: TextStyle(color: AppColors.textDim, fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                    ...state.profiles.map((p) {
                      final isSel = p.id == state.activeProfileId;
                      return InkWell(
                        onTap: () {
                          notifier.setActiveProfile(p.id);
                          _closeMenus();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          color: isSel ? AppColors.accentDark : Colors.transparent,
                          child: Row(
                            children: [
                              Container(
                                width: 5,
                                height: 5,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(kServerColors[p.server] ?? 0xFFd97757),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  p.name,
                                  style: TextStyle(
                                    color: isSel ? AppColors.accent : AppColors.textPrimary,
                                    fontSize: 11,
                                    fontWeight: isSel ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ),
                              Text(p.org, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          // --- Config Dropdown Overlay ---
          if (_configMenuOpen)
            Positioned(
              top: 38,
              right: 140,
              width: 200,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.bgMid,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                  boxShadow: const [
                    BoxShadow(color: Colors.black87, blurRadius: 16, offset: Offset(0, 6))
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.fromLTRB(10, 8, 10, 4),
                      child: Text('КОНФИГУРАЦИИ',
                          style: TextStyle(color: AppColors.textDim, fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                    ...state.savedConfigs.map((c) {
                      final isSel = c.id == state.activeConfigId;
                      return InkWell(
                        onTap: () {
                          notifier.loadConfig(c.id);
                          _closeMenus();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          color: isSel ? AppColors.accentDark : Colors.transparent,
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  c.title,
                                  style: TextStyle(
                                    color: isSel ? AppColors.accent : AppColors.textPrimary,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                              if (isSel) const Icon(Icons.check, size: 12, color: AppColors.accent),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
