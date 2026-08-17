import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../models/profile.dart';
import '../models/settings.dart';
import '../services/keyauth_service.dart';
import '../constants/servers.dart';
import '../utils/translit_helper.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

class SettingsTab extends ConsumerStatefulWidget {
  const SettingsTab({super.key});
  @override
  ConsumerState<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends ConsumerState<SettingsTab> {
  String _section = 'profiles';
  bool _showApiKey = false;
  String _keyStatus = 'idle';
  final _keyController = TextEditingController();
  final _apiKeyController = TextEditingController();
  final _configTitleController = TextEditingController();
  final _importJsonController = TextEditingController();

  @override
  void dispose() {
    _keyController.dispose();
    _apiKeyController.dispose();
    _configTitleController.dispose();
    _importJsonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);
    final settings = state.settings;

    return Row(
      children: [
        // Settings Sidebar
        Container(
          width: 125,
          decoration: const BoxDecoration(
            border: Border(right: BorderSide(color: AppColors.border)),
          ),
          child: Column(
            children: [
              for (final s in const [
                ('profiles', Icons.person, 'Персонажи'),
                ('configs', Icons.folder_zip, 'Конфиги'),
                ('appearance', Icons.palette, 'Вид & CMS'),
                ('hotkeys', Icons.keyboard, 'Хоткеи'),
                ('api', Icons.smart_toy, 'DeepSeek ИИ'),
                ('premium', Icons.star, 'Premium'),
                ('account', Icons.account_circle, 'Аккаунт'),
              ])
                _SideNavItem(
                  id: s.$1,
                  icon: s.$2,
                  label: s.$3,
                  active: _section == s.$1,
                  onTap: () => setState(() => _section = s.$1),
                ),
            ],
          ),
        ),
        // Content Area
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(12),
            child: switch (_section) {
              'profiles' => _ProfilesSection(state: state, notifier: notifier),
              'configs' => _ConfigsSection(
                  state: state,
                  notifier: notifier,
                  titleCtrl: _configTitleController,
                  importCtrl: _importJsonController,
                ),
              'appearance' => _AppearanceSection(settings: settings, notifier: notifier),
              'hotkeys' => _HotkeysSection(settings: settings, notifier: notifier),
              'api' => _ApiSection(
                  settings: settings,
                  notifier: notifier,
                  showApiKey: _showApiKey,
                  apiKeyCtrl: _apiKeyController,
                  onToggleShow: () => setState(() => _showApiKey = !_showApiKey),
                ),
              'premium' => _PremiumSection(
                  settings: settings,
                  notifier: notifier,
                  keyCtrl: _keyController,
                  keyStatus: _keyStatus,
                  onVerify: () async {
                    setState(() => _keyStatus = 'checking');
                    final res = await KeyAuthService.loginWithKey(_keyController.text);
                    if (res.success) {
                      notifier.updateSettings(
                        settings.copyWith(
                          isPremium: true,
                          premiumKey: _keyController.text.trim(),
                          licenseExpiry: res.expiry ?? 'Бессрочно',
                        ),
                      );
                    }
                    if (mounted) setState(() => _keyStatus = res.success ? 'ok' : 'fail');
                  },
                ),
              'account' => _AccountSection(settings: settings, notifier: notifier),
              _ => const SizedBox.shrink(),
            },
          ),
        ),
      ],
    );
  }
}

class _SideNavItem extends StatelessWidget {
  final String id;
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _SideNavItem({
    required this.id,
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.accentDark : Colors.transparent,
          border: Border(
            right: BorderSide(
              color: active ? AppColors.accent : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 12, color: active ? AppColors.accent : AppColors.textMuted),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: active ? AppColors.accent : AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfilesSection extends StatelessWidget {
  final AppState state;
  final AppStoreNotifier notifier;
  const _ProfilesSection({required this.state, required this.notifier});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const SectionHeader('Профили персонажей'),
            const Spacer(),
            RpButton(
              label: '+ Профиль',
              small: true,
              icon: Icons.add,
              onPressed: () => _showProfileDialog(context, null),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ...state.profiles.map((p) {
          final isAct = p.id == state.activeProfileId;
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isAct ? AppColors.accentDark : AppColors.bgCard,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isAct ? AppColors.accentBorder : AppColors.borderLight,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(kServerColors[p.server] ?? 0xFFd97757),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '${p.server} · ${p.org} · ${p.rank}',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                      ),
                    ],
                  ),
                ),
                if (!isAct)
                  TextButton(
                    onPressed: () => notifier.setActiveProfile(p.id),
                    child: const Text('Выбрать', style: TextStyle(fontSize: 10)),
                  ),
                IconButton(
                  icon: const Icon(Icons.edit, size: 12, color: AppColors.textMuted),
                  onPressed: () => _showProfileDialog(context, p),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 12, color: AppColors.textMuted),
                  onPressed: () => notifier.deleteProfile(p.id),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  void _showProfileDialog(BuildContext context, Profile? editing) {
    showDialog(
      context: context,
      builder: (_) => _ProfileDialog(editing: editing, notifier: notifier),
    );
  }
}

class _ProfileDialog extends StatefulWidget {
  final Profile? editing;
  final AppStoreNotifier notifier;
  const _ProfileDialog({this.editing, required this.notifier});
  @override
  State<_ProfileDialog> createState() => _ProfileDialogState();
}

class _ProfileDialogState extends State<_ProfileDialog> {
  final _name = TextEditingController();
  final _nameRu = TextEditingController();
  final _callsign = TextEditingController();
  final _post = TextEditingController();
  String _server = 'Red';
  String _org = 'УГИБДД';
  String _dept = '';
  String _rank = '';
  bool _userManuallyEditedRu = false;

  @override
  void initState() {
    super.initState();
    final e = widget.editing;
    _name.text = e?.name ?? '';
    _nameRu.text = e?.nameRu ?? '';
    _callsign.text = e?.callsign ?? '';
    _post.text = e?.post ?? 'Мост г. Южный';
    _server = e?.server ?? 'Red';
    _org = e?.org ?? 'УГИБДД';
    _dept = e?.dept ?? getDeptsForOrg('УГИБДД').first;
    _rank = e?.rank ?? getRanksForOrg('УГИБДД').first;

    if (e == null) {
      _name.addListener(_onNameChanged);
      _nameRu.addListener(_onNameRuChanged);
    }
  }

  void _onNameChanged() {
    if (!_userManuallyEditedRu && widget.editing == null) {
      final translit = TranslitHelper.transliterateSurname(_name.text);
      if (translit.isNotEmpty) {
        _nameRu.value = TextEditingValue(
          text: translit,
          selection: TextSelection.collapsed(offset: translit.length),
        );
      }
    }
  }

  void _onNameRuChanged() {
    if (_nameRu.text.isNotEmpty &&
        _nameRu.text != TranslitHelper.transliterateSurname(_name.text)) {
      _userManuallyEditedRu = true;
    }
  }

  @override
  void dispose() {
    _name.removeListener(_onNameChanged);
    _nameRu.removeListener(_onNameRuChanged);
    _name.dispose();
    _nameRu.dispose();
    _callsign.dispose();
    _post.dispose();
    super.dispose();
  }

  void _save() {
    final name = _name.text.trim();
    if (name.isEmpty) return;
    final p = Profile(
      id: widget.editing?.id,
      name: name,
      nameRu: _nameRu.text.trim(),
      server: _server,
      org: _org,
      dept: _dept,
      rank: _rank,
      callsign: _callsign.text.trim(),
      post: _post.text.trim(),
    );
    if (widget.editing != null) {
      widget.notifier.updateProfile(p.id, p);
    } else {
      widget.notifier.addProfile(p);
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final depts = getDeptsForOrg(_org);
    final ranks = getRanksForOrg(_org);
    if (!depts.contains(_dept)) _dept = depts.first;
    if (!ranks.contains(_rank)) _rank = ranks.first;

    return AlertDialog(
      title: Text(
        widget.editing != null ? 'Редактировать персонажа' : 'Новый персонаж',
        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
      ),
      content: SizedBox(
        width: 480,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: RpTextField(label: 'Никнейм (Ivan_Ivanov)', controller: _name),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RpTextField(label: 'Фамилия на русском (Иванов)', controller: _nameRu),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _Dropdown(
                      label: 'Сервер',
                      value: _server,
                      items: kServers,
                      onChanged: (v) => setState(() => _server = v!),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _Dropdown(
                      label: 'Организация',
                      value: _org,
                      items: kOrgs,
                      onChanged: (v) {
                        setState(() {
                          _org = v!;
                          _dept = getDeptsForOrg(v).first;
                          _rank = getRanksForOrg(v).first;
                        });
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _Dropdown(
                label: 'Отдел / Подразделение',
                value: depts.contains(_dept) ? _dept : depts.first,
                items: depts,
                onChanged: (v) => setState(() => _dept = v!),
              ),
              const SizedBox(height: 8),
              _Dropdown(
                label: 'Звание / Должность',
                value: ranks.contains(_rank) ? _rank : ranks.first,
                items: ranks,
                onChanged: (v) => setState(() => _rank = v!),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: RpTextField(label: 'Позывной', controller: _callsign, hint: 'Сокол-1'),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RpTextField(label: 'Пост по умолчанию', controller: _post, hint: 'Мост г. Южный'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Отмена')),
        ElevatedButton(onPressed: _save, child: const Text('Сохранить')),
      ],
    );
  }
}

class _Dropdown extends StatelessWidget {
  final String label;
  final String value;
  final List<String> items;
  final ValueChanged<String?> onChanged;

  const _Dropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
        const SizedBox(height: 3),
        SizedBox(
          height: 32,
          child: DropdownButtonFormField<String>(
            value: items.contains(value) ? value : items.first,
            decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 2)),
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
            dropdownColor: AppColors.bgMid,
            onChanged: onChanged,
            items: items.map((i) => DropdownMenuItem(value: i, child: Text(i, overflow: TextOverflow.ellipsis))).toList(),
          ),
        ),
      ],
    );
  }
}

class _ConfigsSection extends StatelessWidget {
  final AppState state;
  final AppStoreNotifier notifier;
  final TextEditingController titleCtrl;
  final TextEditingController importCtrl;

  const _ConfigsSection({
    required this.state,
    required this.notifier,
    required this.titleCtrl,
    required this.importCtrl,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader('Сохранить текущую конфигурацию'),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 32,
                child: TextField(
                  controller: titleCtrl,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                  decoration: const InputDecoration(hintText: 'Название конфига (например: ДПС Майор)'),
                ),
              ),
            ),
            const SizedBox(width: 8),
            RpButton(
              label: 'Сохранить',
              small: true,
              onPressed: () {
                if (titleCtrl.text.trim().isNotEmpty) {
                  notifier.saveCurrentAsConfig(titleCtrl.text.trim());
                  titleCtrl.clear();
                }
              },
            ),
          ],
        ),
        const SizedBox(height: 12),
        const SectionHeader('Сохраненные конфиги'),
        if (state.savedConfigs.isEmpty)
          const Text('Нет сохраненных конфигов.', style: TextStyle(color: AppColors.textMuted, fontSize: 11))
        else
          ...state.savedConfigs.map((c) {
            final isAct = c.id == state.activeConfigId;
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: isAct ? AppColors.accentDark : AppColors.bgCard,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isAct ? AppColors.accentBorder : AppColors.borderLight),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(c.title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600)),
                        Text('${c.server} · ${c.org}', style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                      ],
                    ),
                  ),
                  if (!isAct)
                    RpButton(
                      label: 'Загрузить',
                      small: true,
                      outlined: true,
                      onPressed: () => notifier.loadConfig(c.id),
                    ),
                  IconButton(
                    icon: const Icon(Icons.copy, size: 12, color: AppColors.textMuted),
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: json.encode(c.toJson())));
                    },
                    tooltip: 'Экспорт JSON',
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, size: 12, color: AppColors.textMuted),
                    onPressed: () => notifier.deleteConfig(c.id),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}

class _AppearanceSection extends StatelessWidget {
  final AppSettings settings;
  final AppStoreNotifier notifier;
  const _AppearanceSection({required this.settings, required this.notifier});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader('Режим привязки и отображения окна'),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Режим работы:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  DropdownButton<String>(
                    value: settings.overlayAttachmentMode,
                    underline: const SizedBox(),
                    dropdownColor: AppColors.bgMid,
                    style: const TextStyle(fontSize: 11, color: AppColors.accent, fontWeight: FontWeight.bold),
                    items: const [
                      DropdownMenuItem(
                        value: 'game_bound',
                        child: Text('🎮 Привязка к экрану Amazing Online'),
                      ),
                      DropdownMenuItem(
                        value: 'floating',
                        child: Text('🪟 Свободное плавающее окно'),
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
              const SizedBox(height: 6),
              Text(
                settings.overlayAttachmentMode == 'game_bound'
                    ? 'Оверлей автоматически находит монитор с игрой Amazing Online, закрепляется поверх (Always on Top) и скрывается/показывается по кнопке Insert.'
                    : 'Оверлей открывается как стандартное плавающее окно без жесткого закрепления поверх игры, свободно перемещается между мониторами.',
                style: const TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.3),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        const SectionHeader('Прозрачность оверлея'),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: settings.opacity,
                min: 0.5,
                max: 1.0,
                divisions: 10,
                activeColor: AppColors.accent,
                onChanged: (v) => notifier.updateSettings(settings.copyWith(opacity: v)),
              ),
            ),
            Text('${(settings.opacity * 100).round()}%',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 8),
        const SectionHeader('CMS Опции & Автоматизация'),
        SwitchListTile(
          value: settings.streamerMode,
          onChanged: (v) => notifier.updateSettings(settings.copyWith(streamerMode: v)),
          title: const Text('Streamer Mode (защита от захвата OBS)', style: TextStyle(fontSize: 11)),
          subtitle: const Text('Скрывает окно ассистента от записи экрана', style: TextStyle(fontSize: 10, color: AppColors.textDim)),
          activeColor: AppColors.accent,
          contentPadding: EdgeInsets.zero,
        ),
        SwitchListTile(
          value: settings.autoScreenshot,
          onChanged: (v) => notifier.updateSettings(settings.copyWith(autoScreenshot: v)),
          title: const Text('Авто-скриншот F8 при арестах/задержаниях', style: TextStyle(fontSize: 11)),
          activeColor: AppColors.accent,
          contentPadding: EdgeInsets.zero,
        ),
        SwitchListTile(
          value: settings.autoMask,
          onChanged: (v) => notifier.updateSettings(settings.copyWith(autoMask: v)),
          title: const Text('Авто-маска при спецоперациях (/mask)', style: TextStyle(fontSize: 11)),
          activeColor: AppColors.accent,
          contentPadding: EdgeInsets.zero,
        ),
      ],
    );
  }
}

class _HotkeysSection extends StatelessWidget {
  final AppSettings settings;
  final AppStoreNotifier notifier;
  const _HotkeysSection({required this.settings, required this.notifier});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader('Глобальные горячие клавиши оверлея'),
        const Text(
          'Нажмите клавишу в игре, чтобы показать или скрыть оверлей:',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11),
        ),
        const SizedBox(height: 10),
        _HotkeyItem(label: 'Основной хоткей', keyName: settings.hotkey),
        _HotkeyItem(label: 'Дополнительный', keyName: settings.hotkeyAlt),
      ],
    );
  }
}

class _HotkeyItem extends StatelessWidget {
  final String label;
  final String keyName;
  const _HotkeyItem({required this.label, required this.keyName});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 11)),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.accentDark,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: AppColors.accentBorder),
            ),
            child: Text(
              keyName,
              style: const TextStyle(color: AppColors.accent, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _ApiSection extends StatelessWidget {
  final AppSettings settings;
  final AppStoreNotifier notifier;
  final bool showApiKey;
  final TextEditingController apiKeyCtrl;
  final VoidCallback onToggleShow;

  const _ApiSection({
    required this.settings,
    required this.notifier,
    required this.showApiKey,
    required this.apiKeyCtrl,
    required this.onToggleShow,
  });

  @override
  Widget build(BuildContext context) {
    apiKeyCtrl.text = settings.deepseekApiKey;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader('API Ключ DeepSeek'),
        const Text(
          'Используется для работы вкладки «ИИ-Юрист» и собеседований.\n'
          'Получите официальный ключ на platform.deepseek.com',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: apiKeyCtrl,
                obscureText: !showApiKey,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontFamily: 'monospace'),
                decoration: const InputDecoration(hintText: 'sk-...'),
                onChanged: (v) => notifier.updateSettings(settings.copyWith(deepseekApiKey: v)),
              ),
            ),
            const SizedBox(width: 6),
            IconButton(
              icon: Icon(showApiKey ? Icons.visibility_off : Icons.visibility, size: 14, color: AppColors.textMuted),
              onPressed: onToggleShow,
            ),
          ],
        ),
      ],
    );
  }
}

class _PremiumSection extends StatelessWidget {
  final AppSettings settings;
  final AppStoreNotifier notifier;
  final TextEditingController keyCtrl;
  final String keyStatus;
  final VoidCallback onVerify;

  const _PremiumSection({
    required this.settings,
    required this.notifier,
    required this.keyCtrl,
    required this.keyStatus,
    required this.onVerify,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (settings.isPremium) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.accentDark,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.accentBorder),
            ),
            child: const Row(
              children: [
                Icon(Icons.star, color: AppColors.accent, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('PRO-Лицензия активна', style: TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w700)),
                      Text('Все премиум-функции и CMS модули разблокированы.', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          const SectionHeader('Активация RP Assistant PRO'),
          const Text(
            'Введите лицензионный ключ KeyAuth для разблокировки безлимитных функций:',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: keyCtrl,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontFamily: 'monospace'),
            decoration: const InputDecoration(hintText: 'XXXX-XXXX-XXXX-XXXX'),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              RpButton(
                label: keyStatus == 'checking' ? 'Проверяем...' : 'Активировать ключ',
                onPressed: keyStatus == 'checking' ? null : onVerify,
              ),
              const SizedBox(width: 8),
              if (keyStatus == 'ok')
                const Text('✓ Ключ успешно активирован!', style: TextStyle(color: Colors.green, fontSize: 11)),
              if (keyStatus == 'fail')
                const Text('✗ Ошибка: неверный ключ или истек', style: TextStyle(color: Colors.red, fontSize: 11)),
            ],
          ),
        ],
      ],
    );
  }
}

class _AccountSection extends StatelessWidget {
  final AppSettings settings;
  final AppStoreNotifier notifier;

  const _AccountSection({
    required this.settings,
    required this.notifier,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader('Учетная запись'),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.accentDark,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.accentBorder),
                    ),
                    child: const Icon(Icons.person, color: AppColors.accent, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          settings.username.isNotEmpty ? settings.username : 'Пользователь RP Assistant',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          settings.isPremium ? 'Лицензия: PRO (${settings.licenseExpiry.isNotEmpty ? settings.licenseExpiry : "Бессрочно"})' : 'Лицензия: Базовая (Бесплатная)',
                          style: TextStyle(
                            color: settings.isPremium ? AppColors.accent : AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: AppColors.borderLight, height: 1),
              const SizedBox(height: 14),
              Row(
                children: [
                  RpButton(
                    label: 'Выйти из аккаунта',
                    icon: Icons.logout,
                    onPressed: () {
                      notifier.updateSettings(settings.copyWith(
                        isLoggedIn: false,
                        username: '',
                        isPremium: false,
                        premiumKey: '',
                      ));
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

