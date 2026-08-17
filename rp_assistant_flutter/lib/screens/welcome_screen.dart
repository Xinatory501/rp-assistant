import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../models/profile.dart';
import '../constants/servers.dart';
import '../utils/translit_helper.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  final VoidCallback onCompleted;
  const WelcomeScreen({super.key, required this.onCompleted});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  final _nameController = TextEditingController(text: '');
  final _nameRuController = TextEditingController(text: '');
  final _callsignController = TextEditingController(text: '');
  final _postController = TextEditingController(text: '');
  String _server = 'Red';
  String _org = 'УГИБДД';
  String _dept = '';
  String _rank = '';
  String? _error;
  bool _userManuallyEditedRu = false;

  @override
  void initState() {
    super.initState();
    _dept = getDeptsForOrg(_org).first;
    _rank = getRanksForOrg(_org).first;
    _nameController.addListener(_onNameChanged);
    _nameRuController.addListener(_onNameRuChanged);
  }

  void _onNameChanged() {
    if (!_userManuallyEditedRu) {
      final translit = TranslitHelper.transliterateNickname(_nameController.text);
      if (translit.isNotEmpty) {
        _nameRuController.value = TextEditingValue(
          text: translit,
          selection: TextSelection.collapsed(offset: translit.length),
        );
      }
    }
  }

  void _onNameRuChanged() {
    if (_nameRuController.text.isNotEmpty &&
        _nameRuController.text != TranslitHelper.transliterateNickname(_nameController.text)) {
      _userManuallyEditedRu = true;
    }
  }

  @override
  void dispose() {
    _nameController.removeListener(_onNameChanged);
    _nameRuController.removeListener(_onNameRuChanged);
    _nameController.dispose();
    _nameRuController.dispose();
    _callsignController.dispose();
    _postController.dispose();
    super.dispose();
  }

  void _finish() {
    final name = _nameController.text.trim();
    final nameRu = _nameRuController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Введите игровой никнейм персонажа (например: Nick_Name)');
      return;
    }

    final notifier = ref.read(appStoreProvider.notifier);
    final profile = Profile(
      name: name,
      nameRu: nameRu.isNotEmpty ? nameRu : name.split('_').last,
      server: _server,
      org: _org,
      dept: _dept,
      rank: _rank,
      callsign: _callsignController.text.trim().isNotEmpty ? _callsignController.text.trim() : 'Позывной',
      post: _postController.text.trim().isNotEmpty ? _postController.text.trim() : 'Пост №1',
    );
    notifier.addProfile(profile);
    notifier.updateSettings(
      ref.read(appStoreProvider).settings.copyWith(firstRun: false),
    );
    widget.onCompleted();
  }

  @override
  Widget build(BuildContext context) {
    final depts = getDeptsForOrg(_org);
    final ranks = getRanksForOrg(_org);
    if (!depts.contains(_dept)) _dept = depts.first;
    if (!ranks.contains(_rank)) _rank = ranks.first;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: Container(
          width: 460,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: const [
              BoxShadow(color: Colors.black54, blurRadius: 20, offset: Offset(0, 8))
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Logo
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [
                    BoxShadow(color: Color(0x60d97757), blurRadius: 12, offset: Offset(0, 4))
                  ],
                ),
                child: const Icon(Icons.shield, color: Colors.white, size: 24),
              ),
              const SizedBox(height: 12),
              const Text(
                'Добро пожаловать в RP Assistant',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Настройте вашего первого персонажа для автоматических биндов и докладов',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
              const SizedBox(height: 14),

              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0x33EF4444),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0x66EF4444)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, size: 14, color: Color(0xFFEF4444)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(fontSize: 11, color: Color(0xFFFCA5A5)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Name Inputs
              Row(
                children: [
                  Expanded(
                    child: RpTextField(
                      label: 'Никнейм (Ivan_Ivanov)',
                      hint: 'Nick_Name',
                      controller: _nameController,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RpTextField(
                      label: 'Фамилия (Иванов)',
                      controller: _nameRuController,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Server & Org
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Сервер', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        const SizedBox(height: 3),
                        SizedBox(
                          height: 32,
                          child: DropdownButtonFormField<String>(
                            value: _server,
                            dropdownColor: AppColors.bgMid,
                            style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                            decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 2)),
                            onChanged: (v) => setState(() => _server = v!),
                            items: kServers.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Организация', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        const SizedBox(height: 3),
                        SizedBox(
                          height: 32,
                          child: DropdownButtonFormField<String>(
                            value: _org,
                            dropdownColor: AppColors.bgMid,
                            style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                            decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 2)),
                            onChanged: (v) {
                              setState(() {
                                _org = v!;
                                _dept = getDeptsForOrg(v).first;
                                _rank = getRanksForOrg(v).first;
                              });
                            },
                            items: kOrgs.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Dept & Rank
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Отдел', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 3),
                  SizedBox(
                    height: 32,
                    child: DropdownButtonFormField<String>(
                      value: depts.contains(_dept) ? _dept : depts.first,
                      dropdownColor: AppColors.bgMid,
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                      decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 2)),
                      onChanged: (v) => setState(() => _dept = v!),
                      items: depts.map((d) => DropdownMenuItem(value: d, child: Text(d, overflow: TextOverflow.ellipsis))).toList(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Звание', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 3),
                  SizedBox(
                    height: 32,
                    child: DropdownButtonFormField<String>(
                      value: ranks.contains(_rank) ? _rank : ranks.first,
                      dropdownColor: AppColors.bgMid,
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 11),
                      decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 2)),
                      onChanged: (v) => setState(() => _rank = v!),
                      items: ranks.map((r) => DropdownMenuItem(value: r, child: Text(r, overflow: TextOverflow.ellipsis))).toList(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 36,
                child: ElevatedButton(
                  onPressed: _finish,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Начать работу', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
