import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../services/deepseek_service.dart';
import '../widgets/app_theme.dart';

class _ChatMessage {
  final String id;
  final String role;
  final String content;
  final DateTime timestamp;

  _ChatMessage({
    String? id,
    required this.role,
    required this.content,
    DateTime? timestamp,
  })  : id = id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        timestamp = timestamp ?? DateTime.now();
}

class ChatTab extends ConsumerStatefulWidget {
  const ChatTab({super.key});
  @override
  ConsumerState<ChatTab> createState() => _ChatTabState();
}

class _ChatTabState extends ConsumerState<ChatTab> {
  final List<_ChatMessage> _messages = [];
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  bool _loading = false;
  String _error = '';

  final List<String> _quickPrompts = [
    'Какая статья за неподчинение?',
    'Порядок применения оружия ст. 15',
    'Основания для обыска без ордера',
    'Каковы правила допроса подозреваемого?',
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(_ChatMessage(
      role: 'assistant',
      content: 'Привет! Я **ИИ-Юрист** для AmazingRP. Задайте любой вопрос по законодательству области, КоАП, УК РФ или процессуальным действиям.',
    ));
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _send([String? customText]) async {
    final text = (customText ?? _inputController.text).trim();
    if (text.isEmpty || _loading) return;

    if (customText == null) {
      _inputController.clear();
    }

    setState(() {
      _messages.add(_ChatMessage(role: 'user', content: text));
      _loading = true;
      _error = '';
    });
    _scrollToBottom();

    final profile = ref.read(appStoreProvider).activeProfile;
    final server = profile?.server ?? 'Red';
    final org = profile?.org ?? 'УГИБДД';
    final rank = profile?.rank ?? 'Лейтенант';
    final apiKey = ref.read(appStoreProvider).settings.deepseekApiKey;

    // If API key is not specified, provide smart offline assistance
    if (apiKey.isEmpty) {
      await Future.delayed(const Duration(milliseconds: 600));
      final reply = _getOfflineLawyerResponse(text, server, org, rank);
      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(role: 'assistant', content: reply));
          _loading = false;
        });
        _scrollToBottom();
      }
      return;
    }

    try {
      final systemPrompt =
          'Ты профессиональный ИИ-юрист и консультант по законодательству Amazing Online (AmazingRP/CRMP). '
          'Текущий сервер: $server. Фракция пользователя: $org, звание: $rank. '
          'Опирайся на законы Нижегородской области, УК РФ, КоАП, ФЗ «О полиции», УПК и внутренние уставы. '
          'Отвечай чётко, структурированно, без лишней воды. Указывай конкретные статьи и порядок действий.';

      final msgs = [
        DeepseekMessage(role: 'system', content: systemPrompt),
        ..._messages.map((m) => DeepseekMessage(role: m.role, content: m.content)),
      ];

      final reply = await DeepseekService.chat(apiKey: apiKey, messages: msgs);

      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(role: 'assistant', content: reply));
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      // Fallback to offline knowledge base if API fails
      final offlineReply = _getOfflineLawyerResponse(text, server, org, rank);
      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(
            role: 'assistant',
            content: '$offlineReply\n\n*(Ответ из оффлайн-базы. Ошибка онлайн-запроса DeepSeek: $e)*',
          ));
          _loading = false;
        });
        _scrollToBottom();
      }
    }
  }

  static String _getOfflineLawyerResponse(String query, String server, String org, String rank) {
    final q = query.toLowerCase();
    if (q.contains('неподчин') || q.contains('требован')) {
      return '### ⚖️ Неповиновение законному распоряжению сотрудника\n\n'
          '* **Статья:** ст. 19.3 КоАП РФ / ст. 39 УК РФ (в зависимости от тяжести).\n'
          '* **Санкция:** Штраф от 10 000 до 30 000 руб. либо административный арест / объявление в розыск (2-3 уровень).\n'
          '* **Порядок действий:**\n'
          '  1. Трижды озвучить законное требование с предупреждением о применении спецсредств.\n'
          '  2. Зафиксировать отказ на боди-камеру (`/do Включена боди-камера Дозор-3`).\n'
          '  3. Произвести задержание с применением наручников (`/cuff`).';
    }
    if (q.contains('оружи') || q.contains('ст. 15') || q.contains('стрельб')) {
      return '### 🔫 Применение огнестрельного оружия (ст. 15 ФЗ «О полиции»)\n\n'
          '* **Основания:**\n'
          '  1. Для защиты другого лица либо себя от посягательства, сопряженного с насилием, опасным для жизни.\n'
          '  2. Для пресечения попытки завладения огнестрельным оружием, спецтехникой или служебным транспортом.\n'
          '  3. Для задержания лица, совершающего тяжкое преступление и пытающегося скрыться вооруженным.\n'
          '  4. Для остановки ТС путем повреждения (при создании угрозы жизни граждан).\n'
          '* **Запрещено:** Применять против женщин с видимыми признаками беременности, лиц с явными признаками инвалидности и несовершеннолетних, кроме случаев вооруженного нападения.';
    }
    if (q.contains('обыск') || q.contains('досмотр')) {
      return '### 🔍 Личный досмотр и обыск (УПК)\n\n'
          '* **Основания без ордера:**\n'
          '  1. Задержание лица на месте преступления или непосредственно после его совершения.\n'
          '  2. Введение режима КТО, спецоперации или ЧС.\n'
          '  3. Наличие явных следов преступления (оружие в руках, маска на лице, кровь).\n'
          '* **Процедура:**\n'
          '  1. Разъяснить права и причину досмотра.\n'
          '  2. Привлечь двух понятых либо вести непрерывную видеофиксацию.\n'
          '  3. Составить протокол досмотра (`/frisk {id}`).';
    }
    if (q.contains('миранд') || q.contains('прав')) {
      return '### 📜 Правило Миранды (Права задержанного)\n\n'
          '> *«Вы имеете право хранить молчание. Всё, что вы скажете, может и будет использовано против вас в суде. Вы имеете право на адвоката и один телефонный звонок. Если у вас нет средств на адвоката, он будет предоставлен государством. Вам ясны ваши права?»*\n\n'
          '* Зачитывается сразу после надевания наручников и ограничения свободы.';
    }
    if (q.contains('допрос')) {
      return '### 📋 Порядок проведения допроса (УПК)\n\n'
          '* **Максимальная длительность:** не более 4 часов непрерывно (и не более 8 часов в сутки с перерывом на 1 час).\n'
          '* **Обязательные действия:**\n'
          '  1. Установить личность допрашиваемого по паспорту (`/pass`).\n'
          '  2. Разъяснить право не свидетельствовать против себя и близких (ст. 51 Конституции РФ).\n'
          '  3. Включить аудио/видеофиксацию.\n'
          '  4. По окончании предоставить протокол для ознакомления и подписи.';
    }
    return '### ⚖️ Ответ юридической базы RP Assistant (Сервер: $server, $org)\n\n'
        'Запрос: **$query**\n\n'
        'Для получения детального юридического разбора с точными статьями подключите API-ключ DeepSeek в **Настройки -> DeepSeek ИИ**.\n\n'
        '**Быстрые подсказки:**\n'
        '* Для ареста используйте команду `/cuff`, затем зачитайте правило Миранды (вкладка «Шпаргалки» -> `Alt+1`).\n'
        '* Доклады в рацию доступны во вкладке «Доклады».';
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
        if (_error.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            color: const Color(0x33EF4444),
            child: Row(
              children: [
                const Icon(Icons.warning, size: 12, color: Color(0xFFFCA5A5)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _error,
                    style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 12, color: Color(0xFFFCA5A5)),
                  onPressed: () => setState(() => _error = ''),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
                ),
              ],
            ),
          ),
        // Messages Area
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(10),
            itemCount: _messages.length + (_loading ? 1 : 0),
            itemBuilder: (ctx, i) {
              if (i == _messages.length) {
                return Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.bgCard,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.accent),
                        ),
                        SizedBox(width: 8),
                        Text('ИИ-Юрист изучает законы...',
                            style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ),
                );
              }

              final msg = _messages[i];
              final isUser = msg.role == 'user';

              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 3),
                  padding: const EdgeInsets.all(10),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                  decoration: BoxDecoration(
                    color: isUser ? AppColors.accentDark : AppColors.bgCard,
                    borderRadius: BorderRadius.circular(10),
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
                          p: const TextStyle(color: AppColors.textPrimary, fontSize: 12, height: 1.45),
                          code: const TextStyle(
                            color: Color(0xFFa5b4fc),
                            fontFamily: 'monospace',
                            fontSize: 10,
                          ),
                          strong: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${msg.timestamp.hour.toString().padLeft(2, '0')}:${msg.timestamp.minute.toString().padLeft(2, '0')}',
                            style: const TextStyle(color: AppColors.textDim, fontSize: 9),
                          ),
                          const Spacer(),
                          if (!isUser)
                            IconButton(
                              icon: const Icon(Icons.copy, size: 11, color: AppColors.textDim),
                              onPressed: () => Clipboard.setData(ClipboardData(text: msg.content)),
                              tooltip: 'Скопировать ответ',
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        // Quick Prompts Bar
        if (_messages.length <= 2)
          Container(
            height: 32,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: _quickPrompts.map((p) {
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ActionChip(
                    label: Text(p, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                    backgroundColor: const Color(0x0DFFFFFF),
                    side: const BorderSide(color: AppColors.borderLight),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    onPressed: () => _send(p),
                  ),
                );
              }).toList(),
            ),
          ),
        // Input Bar
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
                    hintText: 'Задайте юридический вопрос...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  onSubmitted: (_) => _send(),
                ),
              ),
              const SizedBox(width: 6),
              SizedBox(
                height: 34,
                child: ElevatedButton(
                  onPressed: _loading ? null : () => _send(),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white),
                        )
                      : const Icon(Icons.send, size: 13),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
