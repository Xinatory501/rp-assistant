import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../models/profile.dart';
import '../services/game_sender.dart';
import '../services/ahk_generator.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

class HintsTab extends ConsumerStatefulWidget {
  const HintsTab({super.key});
  @override
  ConsumerState<HintsTab> createState() => _HintsTabState();
}

class _HintsTabState extends ConsumerState<HintsTab> {
  String? _expanded;
  String? _toast;
  bool _showGpsTool = false;
  final _houseController = TextEditingController();
  final _estateController = TextEditingController();

  @override
  void dispose() {
    _houseController.dispose();
    _estateController.dispose();
    super.dispose();
  }

  void _showToast(String msg) {
    setState(() => _toast = msg);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _toast = null);
    });
  }

  void _calcGpsHouse() {
    final n = int.tryParse(_houseController.text);
    if (n == null || n < 1 || n > 541) {
      _showToast('Номер дома должен быть от 1 до 541');
      return;
    }
    Clipboard.setData(const ClipboardData(text: '/gps'));
    GameSender.sendLine('/gps');
    _showToast('✓ Маршрут к дому №$n: /gps -> Пункт 15 (Дома) -> №$n');
  }

  void _calcGpsEstate() {
    final n = int.tryParse(_estateController.text);
    if (n == null || n < 1 || n > 53) {
      _showToast('Номер особняка должен быть от 1 до 53');
      return;
    }
    Clipboard.setData(const ClipboardData(text: '/gps'));
    GameSender.sendLine('/gps');
    _showToast('✓ Маршрут к особняку №$n: /gps -> Пункт 16 (Особняки) -> №$n');
  }

  void _openAhkModal() {
    _showAhkCommandsDialog(context, ref);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);

    return Stack(
      children: [
        Column(
          children: [
            // Toolbar with GPS and AHK toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: const BoxDecoration(
                color: Color(0x33000000),
                border: Border(bottom: BorderSide(color: AppColors.borderLight)),
              ),
              child: Row(
                children: [
                  InkWell(
                    onTap: () => setState(() => _showGpsTool = !_showGpsTool),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _showGpsTool ? AppColors.accentDark : const Color(0x0DFFFFFF),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: _showGpsTool ? AppColors.accentBorder : AppColors.borderLight,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.navigation, size: 11, color: _showGpsTool ? AppColors.accent : AppColors.textMuted),
                          const SizedBox(width: 4),
                          Text(
                            'GPS Навигатор',
                            style: TextStyle(
                              color: _showGpsTool ? AppColors.accent : AppColors.textMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _openAhkModal,
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0x1AD97757),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0x44D97757)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bolt, size: 12, color: AppColors.accent),
                          SizedBox(width: 4),
                          Text(
                            'Команды & AHK Скрипт',
                            style: TextStyle(
                              color: AppColors.accent,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Spacer(),
                  RpButton(
                    label: '+ Шпаргалка',
                    small: true,
                    icon: Icons.add,
                    onPressed: () => _showDialog(context, ref, null),
                  ),
                ],
              ),
            ),
            // GPS Tool Drawer
            if (_showGpsTool)
              Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  color: AppColors.bgMid,
                  border: Border(bottom: BorderSide(color: AppColors.border)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Text('Дом №:', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          const SizedBox(width: 6),
                          SizedBox(
                            width: 60,
                            height: 26,
                            child: TextField(
                              controller: _houseController,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                              decoration: const InputDecoration(
                                hintText: '1-541',
                                contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              ),
                              onSubmitted: (_) => _calcGpsHouse(),
                            ),
                          ),
                          const SizedBox(width: 6),
                          RpButton(label: 'Найти', small: true, onPressed: _calcGpsHouse),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Row(
                        children: [
                          const Text('Особняк №:', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          const SizedBox(width: 6),
                          SizedBox(
                            width: 60,
                            height: 26,
                            child: TextField(
                              controller: _estateController,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                              decoration: const InputDecoration(
                                hintText: '1-53',
                                contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              ),
                              onSubmitted: (_) => _calcGpsEstate(),
                            ),
                          ),
                          const SizedBox(width: 6),
                          RpButton(label: 'Найти', small: true, onPressed: _calcGpsEstate),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            // Hints List
            Expanded(
              child: state.hints.isEmpty
                  ? const Center(
                      child: Text('Нет шпаргалок. Нажмите «+ Шпаргалка».',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
                      itemCount: state.hints.length,
                      itemBuilder: (ctx, i) {
                        final hint = state.hints[i];
                        final isExp = _expanded == hint.id;

                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.bgCard,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.borderLight),
                          ),
                          child: Column(
                            children: [
                              InkWell(
                                borderRadius: BorderRadius.circular(8),
                                onTap: () => setState(() => _expanded = isExp ? null : hint.id),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  child: Row(
                                    children: [
                                      if (hint.hotkey.isNotEmpty) ...[
                                        Container(
                                          margin: const EdgeInsets.only(right: 6),
                                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: const Color(0x1Ad97757),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: AppColors.accentBorder),
                                          ),
                                          child: Text(
                                            hint.hotkey,
                                            style: const TextStyle(
                                              color: AppColors.accent,
                                              fontSize: 9,
                                              fontFamily: 'monospace',
                                            ),
                                          ),
                                        ),
                                      ],
                                      Expanded(
                                        child: Text(
                                          hint.title,
                                          style: const TextStyle(
                                            color: AppColors.textPrimary,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.send, size: 12, color: AppColors.textMuted),
                                        onPressed: () async {
                                          await GameSender.sendLine(hint.content);
                                          _showToast('Отправлено в чат!');
                                        },
                                        tooltip: 'Отправить в чат',
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.copy, size: 12, color: AppColors.textMuted),
                                        onPressed: () async {
                                          await Clipboard.setData(ClipboardData(text: hint.content));
                                          _showToast('Скопировано в буфер!');
                                        },
                                        tooltip: 'Копировать',
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.edit, size: 12, color: AppColors.textMuted),
                                        onPressed: () => _showDialog(context, ref, hint),
                                        tooltip: 'Редактировать',
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete, size: 12, color: AppColors.textMuted),
                                        onPressed: () => notifier.deleteHint(hint.id),
                                        tooltip: 'Удалить',
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                                      ),
                                      Icon(
                                        isExp ? Icons.expand_less : Icons.expand_more,
                                        size: 14,
                                        color: AppColors.textMuted,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              if (isExp)
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0x08FFFFFF),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: MarkdownBody(
                                      data: hint.content,
                                      styleSheet: MarkdownStyleSheet(
                                        p: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 11,
                                          height: 1.4,
                                        ),
                                        code: const TextStyle(
                                          color: Color(0xFFa5b4fc),
                                          fontFamily: 'monospace',
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
        if (_toast != null)
          Positioned(
            bottom: 14,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.bgMid,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(_toast!, style: const TextStyle(color: AppColors.textPrimary, fontSize: 11)),
              ),
            ),
          ),
      ],
    );
  }

  void _showDialog(BuildContext context, WidgetRef ref, Hint? editing) {
    showDialog(
      context: context,
      builder: (_) => _HintDialog(editing: editing, ref: ref),
    );
  }
}

class _HintDialog extends StatefulWidget {
  final Hint? editing;
  final WidgetRef ref;
  const _HintDialog({this.editing, required this.ref});
  @override
  State<_HintDialog> createState() => _HintDialogState();
}

class _HintDialogState extends State<_HintDialog> {
  late final TextEditingController _title;
  late final TextEditingController _content;
  late final TextEditingController _hotkey;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.editing?.title ?? '');
    _content = TextEditingController(text: widget.editing?.content ?? '');
    _hotkey = TextEditingController(text: widget.editing?.hotkey ?? '');
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    _hotkey.dispose();
    super.dispose();
  }

  void _save() {
    final title = _title.text.trim();
    if (title.isEmpty) return;
    final notifier = widget.ref.read(appStoreProvider.notifier);
    if (widget.editing != null) {
      notifier.updateHint(
        widget.editing!.id,
        widget.editing!.copyWith(
          title: title,
          content: _content.text,
          hotkey: _hotkey.text.trim(),
        ),
      );
    } else {
      notifier.addHint(Hint(
        title: title,
        content: _content.text,
        hotkey: _hotkey.text.trim(),
      ));
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        widget.editing != null ? 'Редактировать шпаргалку' : 'Новая шпаргалка',
        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
      ),
      content: SizedBox(
        width: 480,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: RpTextField(label: 'Название', controller: _title, hint: 'Правило Миранды'),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 90,
                  child: RpTextField(label: 'Хоткей', controller: _hotkey, hint: 'Alt+1'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            RpTextField(
              label: 'Содержимое (Markdown)',
              controller: _content,
              maxLines: 6,
              hint: 'Текст шпаргалки...',
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Отмена')),
        ElevatedButton(
          onPressed: _save,
          child: Text(widget.editing != null ? 'Сохранить' : 'Создать'),
        ),
      ],
    );
  }
}

void _showAhkCommandsDialog(BuildContext context, WidgetRef ref) {
  final state = ref.read(appStoreProvider);
  final profile = state.activeProfile;
  final ahkCode = AhkGenerator.generateScript(
    profile: profile,
    binds: state.binds,
    hints: state.hints,
  );

  showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setDlgState) {
        String? toast;
        return AlertDialog(
          backgroundColor: AppColors.bgCard,
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.accentDark,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.bolt, color: AppColors.accent, size: 18),
              ),
              const SizedBox(width: 10),
              const Text(
                'Быстрые команды & AHK Скрипт',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ],
          ),
          content: SizedBox(
            width: 580,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '1. Всплывающие подсказки на экране игры (ToolTip)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accent),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.bgMid,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      children: const [
                        _AhkRow('Alt + 1', 'Шпаргалка по статьям УК и КоАП (2.1 УК, 2.2 УК, 1.1 КоАП)'),
                        SizedBox(height: 4),
                        _AhkRow('Alt + 2', 'Термины для собеседования (МГ, ДМ, ДБ, СК, ТК, ПГ, РП)'),
                        SizedBox(height: 4),
                        _AhkRow('Alt + 3', 'Правило Миранды (Права задержанного)'),
                        SizedBox(height: 4),
                        _AhkRow('Alt + 4', 'Порядок проведения допроса (УПК)'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    '2. Автозамена команд в чате игры (Hotstrings)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accent),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.bgMid,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      children: [
                        _CommandRow('/uk2.1', '2.1 УК — Покушение на жизнь сотрудника (6 лет)'),
                        const SizedBox(height: 4),
                        _CommandRow('/uk2.2', '2.2 УК — Вооруженное нападение на гос. сотрудника (6 лет)'),
                        const SizedBox(height: 4),
                        _CommandRow('/uk3.1', '3.1 УК — Неподчинение законным требованиям (3 года)'),
                        const SizedBox(height: 4),
                        _CommandRow('/koap1.1', '1.1 КоАП — Выезд на встречную полосу (штраф 15.000 руб)'),
                        const SizedBox(height: 4),
                        _CommandRow('/dm', 'ДМ — Убийство/урон без весомой IC причины'),
                        const SizedBox(height: 4),
                        _CommandRow('/mg', 'МГ — Информация из реального мира в IC чат'),
                        const SizedBox(height: 4),
                        _CommandRow('/pg', 'ПГ — PowerGaming (геройство без страха смерти)'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (toast != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0x3322C55E),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(toast!, style: const TextStyle(fontSize: 11, color: Color(0xFF86EFAC))),
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            OutlinedButton.icon(
              icon: const Icon(Icons.copy, size: 14),
              label: const Text('Скопировать AHK код'),
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: ahkCode));
                setDlgState(() => toast = '✓ Полный AHK-скрипт скопирован в буфер обмена!');
              },
            ),
            ElevatedButton.icon(
              icon: const Icon(Icons.download, size: 14),
              label: const Text('Сохранить .ahk на Рабочий стол'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
              onPressed: () async {
                try {
                  final file = await AhkGenerator.exportToDesktop(ahkCode);
                  setDlgState(() => toast = '✓ Скрипт сохранен: ${file.path}');
                } catch (e) {
                  setDlgState(() => toast = 'Ошибка: $e');
                }
              },
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Закрыть'),
            ),
          ],
        );
      },
    ),
  );
}

class _AhkRow extends StatelessWidget {
  final String keyName;
  final String desc;
  const _AhkRow(this.keyName, this.desc);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.accentDark,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: AppColors.accentBorder),
          ),
          child: Text(keyName, style: const TextStyle(fontSize: 10.5, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: AppColors.accent)),
        ),
        const SizedBox(width: 8),
        Expanded(child: Text(desc, style: const TextStyle(fontSize: 11, color: AppColors.textPrimary))),
      ],
    );
  }
}

class _CommandRow extends StatelessWidget {
  final String cmd;
  final String exp;
  const _CommandRow(this.cmd, this.exp);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0x1AFFFFFF),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Text(cmd, style: const TextStyle(fontSize: 10.5, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF60A5FA))),
        ),
        const SizedBox(width: 8),
        Expanded(child: Text(exp, style: const TextStyle(fontSize: 11, color: AppColors.textPrimary))),
      ],
    );
  }
}
