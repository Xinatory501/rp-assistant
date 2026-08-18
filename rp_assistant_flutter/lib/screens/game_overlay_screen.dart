import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:window_manager/window_manager.dart';
import '../providers/app_store_provider.dart';
import '../models/profile.dart';
import '../widgets/app_theme.dart';

/// Game overlay window — always-on-top transparent floating panel.
class GameOverlayScreen extends ConsumerStatefulWidget {
  const GameOverlayScreen({super.key});
  @override
  ConsumerState<GameOverlayScreen> createState() => _GameOverlayScreenState();
}

class _GameOverlayScreenState extends ConsumerState<GameOverlayScreen>
    with WindowListener {
  int _tab = 0;
  bool _collapsed = false;
  String _bindFilter = '';
  String _hintFilter = '';
  final _filterCtrl = TextEditingController();
  final _hintCtrl = TextEditingController();
  double _opacity = 0.92;

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    _filterCtrl.dispose();
    _hintCtrl.dispose();
    super.dispose();
  }

  Future<void> _closeOverlay() async {
    try {
      await windowManager.setSize(const Size(440, 680));
      await windowManager.center();
      await windowManager.setAlwaysOnTop(false);
      await windowManager.setSkipTaskbar(false);
      await windowManager.setOpacity(1.0);
    } catch (_) {}
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final store = ref.watch(appStoreProvider);
    final profile = store.activeProfile;
    final binds = store.binds;
    final hints = store.hints;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: GestureDetector(
        onPanStart: (_) => windowManager.startDragging(),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: AppColors.bgCard.withOpacity(_opacity),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.accent.withOpacity(0.4), width: 1.5),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.6), blurRadius: 20, spreadRadius: 2),
            ],
          ),
          child: _collapsed
              ? _buildCollapsed(profile)
              : _buildExpanded(profile, binds, hints),
        ),
      ),
    );
  }

  Widget _buildCollapsed(Profile? profile) {
    return SizedBox(
      height: 48,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(width: 12),
          const Icon(Icons.gamepad, color: AppColors.accent, size: 20),
          const SizedBox(width: 8),
          const Text('RP Assistant', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 8),
          Text('| ${profile?.name ?? ''}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const Spacer(),
          IconButton(icon: const Icon(Icons.expand_more, size: 18), color: AppColors.textSecondary,
              tooltip: 'Развернуть', onPressed: () => setState(() => _collapsed = false)),
          IconButton(icon: const Icon(Icons.close, size: 18), color: AppColors.textSecondary,
              tooltip: 'Закрыть', onPressed: _closeOverlay),
          const SizedBox(width: 4),
        ],
      ),
    );
  }

  Widget _buildExpanded(Profile? profile, List<Bind> binds, List<Hint> hints) {
    return SizedBox(
      width: 480,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHeader(profile),
          _buildTabBar(),
          SizedBox(height: 400, child: _buildTabContent(binds, hints, profile)),
          _buildFooter(),
        ],
      ),
    );
  }

  Widget _buildHeader(Profile? profile) {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
        border: Border(bottom: BorderSide(color: AppColors.accent.withOpacity(0.2))),
      ),
      child: Row(
        children: [
          const Icon(Icons.gamepad, color: AppColors.accent, size: 16),
          const SizedBox(width: 6),
          const Text('RP Assistant', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 6),
          if (profile != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppColors.accent.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
              child: Text('${profile.org} | ${profile.rank}',
                  style: const TextStyle(color: AppColors.accent, fontSize: 10)),
            ),
          const Spacer(),
          SizedBox(
            width: 70,
            child: Slider(
              value: _opacity, min: 0.4, max: 1.0,
              activeColor: AppColors.accent, inactiveColor: AppColors.bgDark,
              onChanged: (v) async {
                setState(() => _opacity = v);
                await windowManager.setOpacity(v);
              },
            ),
          ),
          IconButton(
            icon: const Icon(Icons.minimize, size: 16), color: AppColors.textSecondary,
            tooltip: 'Свернуть', padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
            onPressed: () => setState(() => _collapsed = true),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 16), color: AppColors.textSecondary,
            tooltip: 'Закрыть', padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
            onPressed: _closeOverlay,
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    const tabs = [
      (Icons.keyboard, 'Биндер'),
      (Icons.gavel, 'УК/КоАП'),
      (Icons.menu_book, 'Термины'),
      (Icons.push_pin, 'Шпаргалки'),
      (Icons.balance, 'Миранда'),
    ];
    return Container(
      height: 36, color: AppColors.bgCard,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: tabs.asMap().entries.map((e) {
            final i = e.key; final t = e.value; final sel = _tab == i;
            return GestureDetector(
              onTap: () => setState(() => _tab = i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(border: Border(bottom: BorderSide(
                  color: sel ? AppColors.accent : Colors.transparent, width: 2))),
                child: Row(children: [
                  Icon(t.$1, size: 13, color: sel ? AppColors.accent : AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(t.$2, style: TextStyle(
                    color: sel ? AppColors.accent : AppColors.textSecondary,
                    fontSize: 12, fontWeight: sel ? FontWeight.bold : FontWeight.normal)),
                ]),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildTabContent(List<Bind> binds, List<Hint> hints, Profile? profile) {
    switch (_tab) {
      case 0: return _buildBinderTab(binds, profile);
      case 1: return _buildLawsTab();
      case 2: return _buildTermsTab();
      case 3: return _buildHintsTab(hints);
      case 4: return _buildMirandaTab();
      default: return _buildBinderTab(binds, profile);
    }
  }

  Widget _buildBinderTab(List<Bind> binds, Profile? profile) {
    final filtered = binds.where((b) =>
      _bindFilter.isEmpty || b.title.toLowerCase().contains(_bindFilter.toLowerCase())
    ).toList();
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 4),
        child: TextField(
          controller: _filterCtrl,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 12),
          decoration: InputDecoration(
            hintText: 'Поиск биндов...', hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            prefixIcon: const Icon(Icons.search, size: 16, color: AppColors.textSecondary),
            isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 6),
            filled: true, fillColor: AppColors.bgDark,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide.none),
          ),
          onChanged: (v) => setState(() => _bindFilter = v),
        ),
      ),
      Expanded(
        child: filtered.isEmpty
            ? Center(child: Text(binds.isEmpty ? 'Биндов нет.\nДобавьте их в настройках.' : 'Ничего не найдено',
                textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)))
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                itemCount: filtered.length,
                itemBuilder: (ctx, i) => _BindCard(bind: filtered[i], profile: profile),
              ),
      ),
    ]);
  }

  Widget _buildLawsTab() {
    final laws = [
      ('УК', '1.1', 'Умышленное причинение тяжкого вреда здоровью', '3-5 лет'),
      ('УК', '1.2', 'Убийство', '5-6 лет'),
      ('УК', '2.1', 'Террористический акт', '6 лет'),
      ('УК', '2.2', 'Вооружённое нападение на гос. сотрудника', '6 лет'),
      ('УК', '3.1', 'Хулиганство', '1-3 года'),
      ('УК', '4.1', 'Неподчинение законному требованию', '2 года'),
      ('УК', '5.1', 'Взятка должностному лицу', '3-5 лет'),
      ('УК', '6.1', 'Хранение / сбыт наркотиков', '3-5 лет'),
      ('КоАП', '1.1', 'Езда по встречной полосе', 'Штраф 15 000 / лишение'),
      ('КоАП', '2.1', 'Превышение скорости', 'Штраф 10 000'),
      ('КоАП', '3.1', 'Оскорбление сотрудника власти', 'Штраф 20 000'),
      ('КоАП', '4.1', 'Парковка в неположенном месте', 'Штраф 5 000'),
    ];
    return ListView.builder(
      padding: const EdgeInsets.all(8), itemCount: laws.length,
      itemBuilder: (ctx, i) {
        final l = laws[i]; final isUK = l.$1 == 'УК';
        final clr = isUK ? Colors.redAccent : Colors.orangeAccent;
        return Container(
          margin: const EdgeInsets.only(bottom: 4),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: AppColors.bgDark, borderRadius: BorderRadius.circular(6),
            border: Border(left: BorderSide(color: clr, width: 3)),
          ),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(color: clr.withOpacity(0.2), borderRadius: BorderRadius.circular(3)),
              child: Text('${l.$1} ${l.$2}', style: TextStyle(color: clr, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(l.$3, style: const TextStyle(color: AppColors.textPrimary, fontSize: 11))),
            const SizedBox(width: 8),
            Text(l.$4, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10)),
          ]),
        );
      },
    );
  }

  Widget _buildTermsTab() {
    const terms = [
      ('DM', 'DeathMatch', 'Убийство/урон без RP-причины'),
      ('DB', 'DriveBy', 'Убийство из движущегося авто'),
      ('MG', 'MetaGaming', 'OOC информация в IC'),
      ('PG', 'PowerGaming', 'Игра в режиме «супергероя»'),
      ('SK', 'SpawnKill', 'Убийство сразу после респавна'),
      ('TK', 'TeamKill', 'Убийство союзника по фракции'),
      ('IC', 'In Character', 'Информация вашего персонажа'),
      ('OOC', 'Out Of Character', 'Реальная информация вне роли'),
      ('РП', 'RolePlay', 'Игра в рамках роли'),
    ];
    return ListView.builder(
      padding: const EdgeInsets.all(8), itemCount: terms.length,
      itemBuilder: (ctx, i) {
        final t = terms[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 4),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(color: AppColors.bgDark, borderRadius: BorderRadius.circular(6)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 40, child: Text(t.$1,
                style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 12))),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(t.$2, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(t.$3, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
            ])),
          ]),
        );
      },
    );
  }

  Widget _buildHintsTab(List<Hint> hints) {
    final filtered = hints.where((h) =>
      _hintFilter.isEmpty || h.title.toLowerCase().contains(_hintFilter.toLowerCase())
    ).toList();
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 4),
        child: TextField(
          controller: _hintCtrl,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 12),
          decoration: InputDecoration(
            hintText: 'Поиск шпаргалок...', hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            prefixIcon: const Icon(Icons.search, size: 16, color: AppColors.textSecondary),
            isDense: true, contentPadding: const EdgeInsets.symmetric(vertical: 6),
            filled: true, fillColor: AppColors.bgDark,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide.none),
          ),
          onChanged: (v) => setState(() => _hintFilter = v),
        ),
      ),
      Expanded(
        child: filtered.isEmpty
            ? Center(child: Text(hints.isEmpty ? 'Шпаргалок нет.\nДобавьте в настройках.' : 'Ничего не найдено',
                textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)))
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                itemCount: filtered.length,
                itemBuilder: (ctx, i) {
                  final h = filtered[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.bgDark, borderRadius: BorderRadius.circular(6),
                      border: Border(left: BorderSide(color: AppColors.accent.withOpacity(0.5), width: 3)),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(h.title, style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(h.content, style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, height: 1.4)),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }

  Widget _buildMirandaTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.bgDark, borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.accent.withOpacity(0.3)),
          ),
          child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('⚖️ Правило Миранды', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 13)),
            SizedBox(height: 10),
            Text(
              '«Вы имеете право хранить молчание.\n'
              'Всё, что вы скажете, может быть использовано против вас в суде.\n'
              'Вы имеете право на адвоката.\n'
              'Если вы не можете его оплатить — он будет предоставлен государством.\n\n'
              'Вам ясны ваши права?»',
              style: TextStyle(color: AppColors.textPrimary, fontSize: 12, height: 1.5),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        const Text('Быстрые команды — нажми для копирования:', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
        const SizedBox(height: 6),
        _mirandaBtn(context, '/me зачитывает задержанному его права.', '📢 Зачитать Миранду (/me)'),
        _mirandaBtn(context,
          'Вы имеете право хранить молчание. Всё сказанное может быть использовано против вас. Вы имеете право на адвоката. Права ясны?',
          '💬 Текст Миранды (в чат)'),
        _mirandaBtn(context, '/cuff', '🔗 Надеть наручники (/cuff)'),
        _mirandaBtn(context, '/frisk', '🔍 Обыск (/frisk)'),
      ]),
    );
  }

  Widget _mirandaBtn(BuildContext ctx, String cmd, String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: OutlinedButton.icon(
        onPressed: () {
          Clipboard.setData(ClipboardData(text: cmd));
          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
            content: const Text('Скопировано! Вставьте в чат игры (Ctrl+V)', style: TextStyle(fontSize: 11)),
            duration: const Duration(seconds: 2),
            backgroundColor: AppColors.accent.withOpacity(0.9),
            behavior: SnackBarBehavior.floating,
          ));
        },
        icon: const Icon(Icons.copy, size: 13),
        label: Text(label, style: const TextStyle(fontSize: 11)),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: BorderSide(color: AppColors.accent.withOpacity(0.3)),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          alignment: Alignment.centerLeft,
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      height: 28, padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.bgDark.withOpacity(0.8),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
      ),
      child: Row(children: [
        const Icon(Icons.keyboard, size: 11, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        const Text('INSERT / F2 / Alt+M — показать/скрыть', style: TextStyle(color: AppColors.textSecondary, fontSize: 10)),
        const Spacer(),
        Text('RP Assistant v1.2', style: TextStyle(color: AppColors.textSecondary.withOpacity(0.6), fontSize: 9)),
      ]),
    );
  }
}

class _BindCard extends StatelessWidget {
  final Bind bind;
  final Profile? profile;
  const _BindCard({required this.bind, required this.profile});

  String _sub(String t) => t
      .replaceAll('{name}', profile?.name ?? '')
      .replaceAll('{rank}', profile?.rank ?? '')
      .replaceAll('{org}', profile?.org ?? '')
      .replaceAll('{dept}', profile?.dept ?? '')
      .replaceAll('{callsign}', profile?.callsign ?? '')
      .replaceAll('{server}', profile?.server ?? '');

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: AppColors.bgDark, borderRadius: BorderRadius.circular(6),
        child: InkWell(
          borderRadius: BorderRadius.circular(6),
          onTap: () {
            final lines = bind.lines
                .map((l) => _sub(l.text))
                .where((t) => t.isNotEmpty)
                .join('\n');
            Clipboard.setData(ClipboardData(text: lines));
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text('«${bind.title}» скопировано! Вставьте в чат (Ctrl+V)',
                  style: const TextStyle(fontSize: 11)),
              duration: const Duration(seconds: 2),
              backgroundColor: AppColors.accent.withOpacity(0.9),
              behavior: SnackBarBehavior.floating,
            ));
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            child: Row(children: [
              const Icon(Icons.play_arrow, size: 14, color: AppColors.accent),
              const SizedBox(width: 8),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(bind.title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w500)),
                if (bind.lines.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(_sub(bind.lines.first.text),
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ])),
              if (bind.key.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.15), borderRadius: BorderRadius.circular(3),
                    border: Border.all(color: AppColors.accent.withOpacity(0.3)),
                  ),
                  child: Text(bind.key, style: const TextStyle(color: AppColors.accent, fontSize: 9)),
                ),
              const SizedBox(width: 4),
              const Icon(Icons.copy, size: 13, color: AppColors.textSecondary),
            ]),
          ),
        ),
      ),
    );
  }
}