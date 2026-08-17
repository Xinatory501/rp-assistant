import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../models/profile.dart';
import '../services/game_sender.dart';
import '../constants/servers.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

class ReportsTab extends ConsumerStatefulWidget {
  const ReportsTab({super.key});
  @override
  ConsumerState<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends ConsumerState<ReportsTab> {
  String _count = '2';
  String _status = 'стабильное';
  String _currentPost = '';
  String _partner = 'Иванов';
  String _reason = 'окончание смены';
  String _targetOrg = 'УМВД';
  String? _toast;

  void _showToast(String msg) {
    setState(() => _toast = msg);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _toast = null);
    });
  }

  String _render(String template, Profile? profile) {
    if (profile == null) return template;
    final defaultPosts = getPostsForOrg(profile.org);
    final postToUse = _currentPost.isNotEmpty
        ? _currentPost
        : (profile.post.isNotEmpty ? profile.post : defaultPosts.first);

    final vars = {
      'name': profile.name,
      'nameRu': profile.nameRu.isNotEmpty ? profile.nameRu : profile.name,
      'rank': profile.rank,
      'org': profile.org,
      'dept': profile.dept,
      'callsign': profile.callsign,
      'post': postToUse,
      'server': profile.server,
      'count': _count,
      'status': _status,
      'partner': _partner,
      'reason': _reason,
      'targetOrg': _targetOrg,
    };
    return renderTemplate(template, vars);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(appStoreProvider);
    final notifier = ref.read(appStoreProvider.notifier);
    final profile = state.activeProfile;

    return Stack(
      children: [
        Column(
          children: [
            // Param Quick Toolbar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: const BoxDecoration(
                color: Color(0x33000000),
                border: Border(bottom: BorderSide(color: AppColors.borderLight)),
              ),
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  _QuickField(
                    label: 'Состав',
                    value: _count,
                    width: 55,
                    onChanged: (v) => setState(() => _count = v),
                  ),
                  _QuickField(
                    label: 'Состояние',
                    value: _status,
                    width: 100,
                    onChanged: (v) => setState(() => _status = v),
                  ),
                  _QuickField(
                    label: 'Напарник',
                    value: _partner,
                    width: 90,
                    onChanged: (v) => setState(() => _partner = v),
                  ),
                  _QuickField(
                    label: 'Причина',
                    value: _reason,
                    width: 110,
                    onChanged: (v) => setState(() => _reason = v),
                  ),
                ],
              ),
            ),
            // Reports List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
                itemCount: state.reportTemplates.length + 1,
                itemBuilder: (ctx, i) {
                  if (i == state.reportTemplates.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: RpButton(
                        label: '+ Новый шаблон доклада',
                        outlined: true,
                        icon: Icons.add,
                        onPressed: () => _showDialog(context, ref, null),
                      ),
                    );
                  }
                  final tmpl = state.reportTemplates[i];
                  final rendered = _render(tmpl.template, profile);

                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.bgCard,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                tmpl.title,
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit, size: 12, color: AppColors.textMuted),
                              onPressed: () => _showDialog(context, ref, tmpl),
                              tooltip: 'Редактировать',
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, size: 12, color: AppColors.textMuted),
                              onPressed: () => notifier.deleteReportTemplate(tmpl.id),
                              tooltip: 'Удалить',
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                            ),
                            IconButton(
                              icon: const Icon(Icons.copy, size: 12, color: AppColors.textMuted),
                              onPressed: () async {
                                await Clipboard.setData(ClipboardData(text: rendered));
                                _showToast('Скопировано в буфер!');
                              },
                              tooltip: 'Копировать',
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                            ),
                            const SizedBox(width: 4),
                            SizedBox(
                              height: 24,
                              child: ElevatedButton(
                                onPressed: profile == null
                                    ? null
                                    : () async {
                                        await GameSender.sendLine(rendered);
                                        _showToast('✓ Отправлено в рацию (F6+Enter)!');
                                      },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accent,
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.send, size: 10),
                                    SizedBox(width: 3),
                                    Text('В рацию', style: TextStyle(fontSize: 10)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0x0AFFFFFF),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            rendered,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 11,
                              fontFamily: 'monospace',
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

  void _showDialog(BuildContext context, WidgetRef ref, ReportTemplate? editing) {
    showDialog(
      context: context,
      builder: (_) => _ReportDialog(editing: editing, ref: ref),
    );
  }
}

class _QuickField extends StatelessWidget {
  final String label;
  final String value;
  final double width;
  final ValueChanged<String> onChanged;

  const _QuickField({
    required this.label,
    required this.value,
    required this.width,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
        const SizedBox(width: 4),
        SizedBox(
          width: width,
          height: 24,
          child: TextField(
            controller: TextEditingController(text: value),
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 10),
            decoration: const InputDecoration(
              contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            ),
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }
}

class _ReportDialog extends StatefulWidget {
  final ReportTemplate? editing;
  final WidgetRef ref;
  const _ReportDialog({this.editing, required this.ref});
  @override
  State<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<_ReportDialog> {
  late final TextEditingController _title;
  late final TextEditingController _template;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.editing?.title ?? '');
    _template = TextEditingController(text: widget.editing?.template ?? '');
  }

  @override
  void dispose() {
    _title.dispose();
    _template.dispose();
    super.dispose();
  }

  void _save() {
    final title = _title.text.trim();
    final template = _template.text.trim();
    if (title.isEmpty || template.isEmpty) return;
    final notifier = widget.ref.read(appStoreProvider.notifier);
    if (widget.editing != null) {
      notifier.updateReportTemplate(
        widget.editing!.id,
        widget.editing!.copyWith(title: title, template: template),
      );
    } else {
      notifier.addReportTemplate(ReportTemplate(title: title, template: template));
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        widget.editing != null ? 'Редактировать доклад' : 'Новый доклад',
        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
      ),
      content: SizedBox(
        width: 480,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            RpTextField(label: 'Название', controller: _title, hint: 'Заступление на пост'),
            const SizedBox(height: 8),
            RpTextField(
              label: 'Шаблон доклада в рацию',
              controller: _template,
              maxLines: 4,
              hint: '[{org}] Докладывает: {rank} {name}. Заступил на пост «{post}». Состояние: {status}.',
            ),
            const SizedBox(height: 6),
            const Text(
              'Теги: {name}, {rank}, {org}, {dept}, {post}, {callsign}, {count}, {status}, {partner}, {reason}',
              style: TextStyle(color: AppColors.textDim, fontSize: 10),
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
