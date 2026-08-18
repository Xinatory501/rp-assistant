import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../providers/app_store_provider.dart';
import '../services/lua_injector_service.dart';
import '../widgets/app_theme.dart';

class GamePathWizard extends ConsumerStatefulWidget {
  final VoidCallback onDone;
  const GamePathWizard({super.key, required this.onDone});

  @override
  ConsumerState<GamePathWizard> createState() => _GamePathWizardState();
}

class _GamePathWizardState extends ConsumerState<GamePathWizard> {
  String? _foundPath;
  String? _customPath;
  bool _searching = false;
  String _status = '';

  static const _candidatePaths = [
    r'C:\Amazing Games\Amazing Online',
    r'C:\Amazing Games',
    r'C:\Games\Amazing Games',
    r'C:\Games\Amazing Online',
    r'C:\Amazing Online',
    r'D:\Amazing Games\Amazing Online',
    r'D:\Amazing Games',
    r'D:\Games\Amazing Games',
    r'D:\Games\Amazing Online',
    r'D:\Amazing Online',
    r'E:\Amazing Games\Amazing Online',
    r'E:\Amazing Games',
    r'E:\Games\Amazing Games',
    r'E:\Games\Amazing Online',
    r'E:\Amazing Online',
    r'C:\Program Files (x86)\Amazing Games',
    r'C:\Program Files\Amazing Games',
    r'C:\GTA San Andreas',
    r'D:\GTA San Andreas',
    r'C:\Games\GTA San Andreas',
    r'D:\Games\GTA San Andreas',
  ];

  @override
  void initState() {
    super.initState();
    _autoSearch();
  }

  Future<void> _autoSearch() async {
    setState(() {
      _searching = true;
      _status = 'Автоматический поиск Amazing Online...';
    });
    for (final p in _candidatePaths) {
      final dir = Directory(p);
      if (await dir.exists()) {
        setState(() {
          _foundPath = p;
          _status = 'Найдено: $p';
          _searching = false;
        });
        return;
      }
    }
    setState(() {
      _searching = false;
      _status = 'Автоматически не найдено. Укажите папку вручную.';
    });
  }

  Future<void> _browseFolder() async {
    final result = await FilePicker.platform.getDirectoryPath(
      dialogTitle: 'Выберите папку с Amazing Online (GTA San Andreas)',
    );
    if (result != null) {
      setState(() => _customPath = result);
    }
  }

  Future<void> _save(String path) async {
    final notifier = ref.read(appStoreProvider.notifier);
    final state = ref.read(appStoreProvider);
    notifier.updateSettings(state.settings.copyWith(
      gamePath: path,
      customGamePath: path,
      gamePathConfigured: true,
    ));

    // Pre-install Lua script and config in game folder
    if (state.activeProfile != null) {
      await LuaInjectorService.inject(
        profile: state.activeProfile!,
        binds: state.binds,
        hints: state.hints,
        moonloaderDir: path,
      );
    }

    widget.onDone();
  }

  void _skip() {
    final notifier = ref.read(appStoreProvider.notifier);
    final settings = ref.read(appStoreProvider).settings;
    notifier.updateSettings(settings.copyWith(gamePathConfigured: true));
    widget.onDone();
  }

  @override
  Widget build(BuildContext context) {
    final selectedPath = _customPath ?? _foundPath;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 520),
          padding: const EdgeInsets.all(36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon + title
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.accentDark,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.accentBorder),
                    ),
                    child: const Icon(Icons.folder_open, size: 26, color: AppColors.accent),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Где установлена Amazing Online?',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Нужно для Lua-инджекта прямо в игровой процесс',
                          style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Auto-search status
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Row(
                  children: [
                    if (_searching)
                      const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent),
                      )
                    else
                      Icon(
                        _foundPath != null ? Icons.check_circle : Icons.search_off,
                        size: 18,
                        color: _foundPath != null ? const Color(0xFF22C55E) : AppColors.textMuted,
                      ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _status,
                        style: TextStyle(
                          fontSize: 12,
                          color: _foundPath != null ? const Color(0xFF86EFAC) : AppColors.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Selected path display
              if (selectedPath != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0x1522C55E),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0x5522C55E)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.folder, size: 16, color: Color(0xFF22C55E)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          selectedPath,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF86EFAC), fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Browse button
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.folder_open, size: 16),
                      label: const Text('Выбрать папку вручную'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        side: const BorderSide(color: AppColors.border),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: _browseFolder,
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Ещё раз'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.bgMid,
                      foregroundColor: AppColors.textPrimary,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onPressed: _searching ? null : _autoSearch,
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Action buttons
              Row(
                children: [
                  TextButton(
                    onPressed: _skip,
                    child: const Text(
                      'Пропустить',
                      style: TextStyle(color: AppColors.textDim),
                    ),
                  ),
                  const Spacer(),
                  SizedBox(
                    height: 44,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text(
                        'Сохранить и продолжить',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                      ),
                      onPressed: selectedPath != null ? () => _save(selectedPath) : null,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
