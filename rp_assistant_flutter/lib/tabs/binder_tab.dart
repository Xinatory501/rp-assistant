import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../models/profile.dart';
import '../services/game_sender.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

class BinderTab extends ConsumerStatefulWidget {
  const BinderTab({super.key});
  @override
  ConsumerState<BinderTab> createState() => _BinderTabState();
}

class _BinderTabState extends ConsumerState<BinderTab> {
  final _targetController = TextEditingController();
  String? _sendingId;
  String? _toast;

  @override
  void initState() {
    super.initState();
    _targetController.text = ref.read(appStoreProvider).targetId;
  }

  @override
  void dispose() {
    _targetController.dispose();
    super.dispose();
  }

  void _showToast(String msg) {
    setState(() => _toast = msg);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _toast = null);
    });
  }

  String _resolve(String text, AppState state) {
    final p = state.activeProfile;
    var t = text;
    final target = state.targetId.isNotEmpty ? state.targetId : _targetController.text;
    t = t.replaceAll('{id}', target);
    if (p != null) {
      t = t.replaceAll('{name}', p.name);
      t = t.replaceAll('{nameRu}', p.nameRu.isNotEmpty ? p.nameRu : p.name);
      t = t.replaceAll('{rank}', p.rank);
      t = t.replaceAll('{org}', p.org);
      t = t.replaceAll('{dept}', p.dept);
      t = t.replaceAll('{callsign}', p.callsign);
      t = t.replaceAll('{post}', p.post);
    }
    return t;
  }

  Future<void> _sendBind(Bind bind, AppState state) async {
    setState(() => _sendingId = bind.id);
    final resolved = bind.lines
        .map((l) => (text: _resolve(l.text, state), delay: l.delay))
        .toList();
    await GameSender.sendLines(resolved);
    if (mounted) {
      setState(() => _sendingId = null);
      _showToast('✓ ${bind.title} отправлено в чат');
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);

    return Stack(
      children: [
        Column(
          children: [
            // Target Controls Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: const BoxDecoration(
                color: Color(0x33000000),
                border: Border(bottom: BorderSide(color: AppColors.borderLight)),
              ),
              child: Row(
                children: [
                  // Target ID Input
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        state.targetType == 'mask' ? 'Маска:' : 'ID цели:',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                      ),
                      const SizedBox(width: 6),
                      SizedBox(
                        width: 80,
                        height: 26,
                        child: TextField(
                          controller: _targetController,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 11,
                            fontFamily: 'monospace',
                          ),
                          decoration: const InputDecoration(
                            hintText: '123',
                            contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          ),
                          onChanged: (v) => notifier.setTargetId(v),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                  // Target Type Switcher
                  InkWell(
                    onTap: () {
                      final newType = state.targetType == 'id' ? 'mask' : 'id';
                      notifier.setTargetType(newType);
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: state.targetType == 'mask' ? AppColors.accentDark : const Color(0x0DFFFFFF),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: state.targetType == 'mask' ? AppColors.accentBorder : AppColors.borderLight,
                        ),
                      ),
                      child: Text(
                        state.targetType == 'mask' ? 'Режим: Маска' : 'Режим: ID',
                        style: TextStyle(
                          color: state.targetType == 'mask' ? AppColors.accent : AppColors.textMuted,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  RpButton(
                    label: '+ Бинд',
                    small: true,
                    icon: Icons.add,
                    onPressed: () => _showBindDialog(context, ref, null),
                  ),
                ],
              ),
            ),
            // Binds List
            Expanded(
              child: state.binds.isEmpty
                  ? const Center(
                      child: Text('Нет биндов. Нажмите «+ Бинд», чтобы добавить.',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
                      itemCount: state.binds.length,
                      itemBuilder: (ctx, i) {
                        final bind = state.binds[i];
                        final isSending = _sendingId == bind.id;
                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.bgCard,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.borderLight),
                          ),
                          child: Row(
                            children: [
                              // Hotkey Badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0x1Ad97757),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: AppColors.accentBorder),
                                ),
                                child: Text(
                                  bind.key,
                                  style: const TextStyle(
                                    color: AppColors.accent,
                                    fontSize: 10,
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      bind.title,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      '${bind.lines.length} строк(и)',
                                      style: const TextStyle(color: AppColors.textDim, fontSize: 10),
                                    ),
                                  ],
                                ),
                              ),
                              // Quick Actions
                              IconButton(
                                icon: const Icon(Icons.copy, size: 13, color: AppColors.textMuted),
                                onPressed: () async {
                                  final text = bind.lines.map((l) => _resolve(l.text, state)).join('\n');
                                  await Clipboard.setData(ClipboardData(text: text));
                                  _showToast('Скопировано в буфер!');
                                },
                                tooltip: 'Копировать',
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                              ),
                              IconButton(
                                icon: const Icon(Icons.edit, size: 13, color: AppColors.textMuted),
                                onPressed: () => _showBindDialog(context, ref, bind),
                                tooltip: 'Редактировать',
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, size: 13, color: AppColors.textMuted),
                                onPressed: () => notifier.deleteBind(bind.id),
                                tooltip: 'Удалить',
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(minWidth: 26, minHeight: 26),
                              ),
                              const SizedBox(width: 4),
                              // Send Button
                              SizedBox(
                                height: 26,
                                child: ElevatedButton(
                                  onPressed: isSending ? null : () => _sendBind(bind, state),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.accent,
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                  ),
                                  child: isSending
                                      ? const SizedBox(
                                          width: 11,
                                          height: 11,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 1.5,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.send, size: 10),
                                            SizedBox(width: 4),
                                            Text('В чат', style: TextStyle(fontSize: 10)),
                                          ],
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
                  boxShadow: const [
                    BoxShadow(color: Colors.black45, blurRadius: 8, offset: Offset(0, 2))
                  ],
                ),
                child: Text(_toast!, style: const TextStyle(color: AppColors.textPrimary, fontSize: 11)),
              ),
            ),
          ),
      ],
    );
  }

  void _showBindDialog(BuildContext context, WidgetRef ref, Bind? editing) {
    showDialog(
      context: context,
      builder: (_) => _BindDialog(editing: editing, ref: ref),
    );
  }
}

class _BindDialog extends StatefulWidget {
  final Bind? editing;
  final WidgetRef ref;
  const _BindDialog({this.editing, required this.ref});
  @override
  State<_BindDialog> createState() => _BindDialogState();
}

class _BindDialogState extends State<_BindDialog> {
  late final TextEditingController _title;
  late final TextEditingController _key;
  late List<({TextEditingController text, TextEditingController delay})> _lines;

  @override
  void initState() {
    super.initState();
    final e = widget.editing;
    _title = TextEditingController(text: e?.title ?? '');
    _key = TextEditingController(text: e?.key ?? '');
    _lines = (e?.lines ?? [const BindLine(text: '', delay: 1000)])
        .map((l) => (
              text: TextEditingController(text: l.text),
              delay: TextEditingController(text: '${l.delay}'),
            ))
        .toList();
  }

  @override
  void dispose() {
    _title.dispose();
    _key.dispose();
    for (final l in _lines) {
      l.text.dispose();
      l.delay.dispose();
    }
    super.dispose();
  }

  void _addLine() {
    setState(() => _lines.add((
          text: TextEditingController(),
          delay: TextEditingController(text: '1000'),
        )));
  }

  void _removeLine(int i) {
    if (_lines.length <= 1) return;
    setState(() {
      _lines[i].text.dispose();
      _lines[i].delay.dispose();
      _lines.removeAt(i);
    });
  }

  void _save() {
    final title = _title.text.trim();
    final key = _key.text.trim();
    if (title.isEmpty || key.isEmpty) return;
    final lines = _lines
        .where((l) => l.text.text.trim().isNotEmpty)
        .map((l) => BindLine(
              text: l.text.text,
              delay: int.tryParse(l.delay.text) ?? 1000,
            ))
        .toList();
    if (lines.isEmpty) return;
    final notifier = widget.ref.read(appStoreProvider.notifier);
    if (widget.editing != null) {
      notifier.updateBind(
        widget.editing!.id,
        widget.editing!.copyWith(title: title, key: key, lines: lines),
      );
    } else {
      notifier.addBind(Bind(title: title, key: key, lines: lines));
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        widget.editing != null ? 'Редактировать бинд' : 'Новый бинд',
        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
      ),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: RpTextField(label: 'Название бинда', controller: _title, hint: 'Задержание и наручники'),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 1,
                    child: RpTextField(label: 'Клавиша', controller: _key, hint: 'Num 1'),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text('Строки команды (отправляются по очереди):',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
              const SizedBox(height: 4),
              ..._lines.asMap().entries.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 5),
                    child: Row(
                      children: [
                        Text('${e.key + 1}.',
                            style: const TextStyle(color: AppColors.textDim, fontSize: 10, fontFamily: 'monospace')),
                        const SizedBox(width: 5),
                        Expanded(
                          child: SizedBox(
                            height: 28,
                            child: TextField(
                              controller: e.value.text,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 11,
                                fontFamily: 'monospace',
                              ),
                              decoration: const InputDecoration(
                                hintText: '/me действие или команда',
                                contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        SizedBox(
                          width: 55,
                          height: 28,
                          child: TextField(
                            controller: e.value.delay,
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                            decoration: const InputDecoration(
                              hintText: 'мс',
                              contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.remove_circle, size: 14, color: AppColors.textMuted),
                          onPressed: () => _removeLine(e.key),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 22, minHeight: 22),
                        ),
                      ],
                    ),
                  )),
              TextButton.icon(
                onPressed: _addLine,
                icon: const Icon(Icons.add, size: 12),
                label: const Text('Добавить строку', style: TextStyle(fontSize: 11)),
                style: TextButton.styleFrom(foregroundColor: AppColors.accent),
              ),
              const SizedBox(height: 4),
              const Text(
                'Поддерживаемые теги: {id}, {name}, {rank}, {org}, {dept}, {callsign}, {post}',
                style: TextStyle(color: AppColors.textDim, fontSize: 10),
              ),
            ],
          ),
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
