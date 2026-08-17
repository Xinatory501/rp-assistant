import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../services/deepseek_service.dart';
import '../services/game_sender.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

const _kAvailableOrgs = [
  'ЕСС', 'УГИБДД', 'УМВД', 'ПР', 'ВЧ', 'ТРК', 'УФСИН', 'УФСБ', 'Суд'
];

class InterviewTab extends ConsumerStatefulWidget {
  const InterviewTab({super.key});
  @override
  ConsumerState<InterviewTab> createState() => _InterviewTabState();
}

class _InterviewTabState extends ConsumerState<InterviewTab> {
  String _targetOrg = 'УГИБДД';
  final List<({String role, String content})> _messages = [];
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  bool _loading = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _resetInterview();
  }

  void _resetInterview() {
    setState(() {
      _messages
        ..clear()
        ..add((
          role: 'assistant',
          content: 'Готов помочь с собеседованием в **$_targetOrg**!\n\n'
              'Напишите вопрос проверяющего (например, «Что такое ДМ/ДБ/СК/ТК?», «Опишите порядок задержания») или нажмите **«Начать тренировку»**.',
        ));
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _send(String text) async {
    final clean = text.trim();
    if (clean.isEmpty || _loading) return;

    _inputController.clear();
    setState(() {
      _messages.add((role: 'user', content: clean));
      _loading = true;
      _error = '';
    });
    _scrollToBottom();

    // If API key is not specified, provide smart offline assistance
    if (apiKey.isEmpty) {
      await Future.delayed(const Duration(milliseconds: 500));
      final reply = _getOfflineInterviewResponse(clean, _targetOrg);
      if (mounted) {
        setState(() {
          _messages.add((role: 'assistant', content: reply));
          _loading = false;
        });
        _scrollToBottom();
      }
      return;
    }

    try {
      final systemPrompt =
          'Ты помощник на собеседовании в организацию $_targetOrg на сервере AmazingRP (Нижегородская область). '
          'Давай максимально краткие, чёткие и идеальные RP-ответы, чтобы проверяющий поставил зачёт. '
          'Отвечай в 1-3 предложениях, без воды.';

      final msgs = [
        DeepseekMessage(role: 'system', content: systemPrompt),
        ..._messages.map((m) => DeepseekMessage(role: m.role, content: m.content)),
      ];

      final reply = await DeepseekService.chat(apiKey: apiKey, messages: msgs);

      if (mounted) {
        setState(() {
          _messages.add((role: 'assistant', content: reply));
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      final offlineReply = _getOfflineInterviewResponse(clean, _targetOrg);
      if (mounted) {
        setState(() {
          _messages.add((
            role: 'assistant',
            content: '$offlineReply\n\n*(Ответ из оффлайн-базы. Ошибка онлайн DeepSeek: $e)*',
          ));
          _loading = false;
        });
        _scrollToBottom();
      }
    }
  }

  static String _getOfflineInterviewResponse(String query, String targetOrg) {
    final q = query.toLowerCase();
    if (q.contains('дм') || q.contains('deathmatch')) {
      return '**ДМ (Deathmatch)** — убийство или нанесение урона здоровью персонажа без весомой игровой (IC) причины.';
    }
    if (q.contains('дб') || q.contains('driveby')) {
      return '**ДБ (DriveBy)** — нанесение урона автомобилем, таран либо стрельба с водительского места по пешеходам.';
    }
    if (q.contains('ск') || q.contains('spawnkill')) {
      return '**СК (SpawnKill)** — убийство или нанесение урона персонажу на месте его появления / возрождения.';
    }
    if (q.contains('тк') || q.contains('teamkill')) {
      return '**ТК (TeamKill)** — убийство или причинение вреда сотрудникам своей же организации / фракции.';
    }
    if (q.contains('мг') || q.contains('metagaming')) {
      return '**МГ (Metagaming)** — использование внеигровой информации (OOC / реальной жизни) в игровой процесс (IC).';
    }
    if (q.contains('пг') || q.contains('powergaming')) {
      return '**ПГ (Powergaming)** — преувеличение физических возможностей своего персонажа, изображение супергероя (например, нападение в одиночку на толпу).';
    }
    if (q.contains('рп') || q.contains('термин')) {
      return '**РП (RolePlay)** — отыгрыш выбранной роли персонажа в соответствии с правилами сервера и реальной логикой поведения.';
    }
    if (q.contains('первый вопрос') || q.contains('начни') || q.contains('тест')) {
      return '### 📝 Вопрос №1 для собеседования в $targetOrg:\n\n'
          '> *«Что такое ДМ, ДБ, СК и ТК? Дайте определение терминов.»*\n\n'
          '*(Напишите ответ или задайте следующий вопрос)*';
    }
    return 'Ответ для собеседования в **$targetOrg**:\n\n'
        '«Готов добросовестно нести службу, строго соблюдать Устав организации $targetOrg, законы области и беспрекословно выполнять приказы старшего по званию.»';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Org selection & quick actions toolbar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: const BoxDecoration(
            color: Color(0x33000000),
            border: Border(bottom: BorderSide(color: AppColors.borderLight)),
          ),
          child: Row(
            children: [
              const Text('Организация:', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
              const SizedBox(width: 6),
              SizedBox(
                height: 26,
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _targetOrg,
                    dropdownColor: AppColors.bgMid,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                    onChanged: (v) {
                      if (v != null) {
                        setState(() => _targetOrg = v);
                        _resetInterview();
                      }
                    },
                    items: _kAvailableOrgs
                        .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                        .toList(),
                  ),
                ),
              ),
              const Spacer(),
              RpButton(
                label: 'Начать тест',
                small: true,
                onPressed: () => _send('Задай мне первый вопрос для проверки знаний в $_targetOrg.'),
              ),
              const SizedBox(width: 6),
              RpButton(
                label: 'Очистить',
                small: true,
                outlined: true,
                onPressed: _resetInterview,
              ),
            ],
          ),
        ),
        if (_error.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            color: const Color(0x33EF4444),
            child: Text(_error, style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11)),
          ),
        // Messages
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(8),
            itemCount: _messages.length + (_loading ? 1 : 0),
            itemBuilder: (ctx, i) {
              if (i == _messages.length) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 6),
                  child: Center(
                    child: SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.accent),
                    ),
                  ),
                );
              }

              final msg = _messages[i];
              final isUser = msg.role == 'user';

              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 2),
                  padding: const EdgeInsets.all(8),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                  decoration: BoxDecoration(
                    color: isUser ? AppColors.accentDark : AppColors.bgCard,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isUser ? AppColors.accentBorder : AppColors.borderLight,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MarkdownBody(
                        data: msg.content,
                        styleSheet: MarkdownStyleSheet(
                          p: const TextStyle(color: AppColors.textPrimary, fontSize: 11, height: 1.4),
                          code: const TextStyle(color: Color(0xFFa5b4fc), fontSize: 10),
                        ),
                      ),
                      if (!isUser && i > 0) ...[
                        const SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            InkWell(
                              onTap: () => Clipboard.setData(ClipboardData(text: msg.content)),
                              child: const Text('Копировать',
                                  style: TextStyle(color: AppColors.textDim, fontSize: 9)),
                            ),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () => GameSender.sendLine(msg.content),
                              child: const Text('В чат (F6)',
                                  style: TextStyle(color: AppColors.accent, fontSize: 9)),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        // Input
        Container(
          padding: const EdgeInsets.all(8),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.borderLight)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _inputController,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 12),
                  decoration: const InputDecoration(
                    hintText: 'Вопрос от проверяющего...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  onSubmitted: _send,
                ),
              ),
              const SizedBox(width: 6),
              SizedBox(
                height: 34,
                child: ElevatedButton(
                  onPressed: _loading ? null : () => _send(_inputController.text),
                  child: const Icon(Icons.send, size: 12),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
