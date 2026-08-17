import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_store_provider.dart';
import '../models/profile.dart';
import '../constants/servers.dart';
import '../widgets/app_theme.dart';
import '../widgets/common.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  final VoidCallback onCompleted;
  const WelcomeScreen({super.key, required this.onCompleted});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  final _nameController = TextEditingController(text: 'Ivan_Ivanov');
  final _nameRuController = TextEditingController(text: 'Иванов');
  String _server = 'Red';
  String _org = 'УГИБДД';
  String _dept = '';
  String _rank = '';

  @override
  void initState() {
    super.initState();
    _dept = getDeptsForOrg(_org).first;
    _rank = getRanksForOrg(_org).first;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nameRuController.dispose();
    super.dispose();
  }

  void _finish() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    final notifier = ref.read(appStoreProvider.notifier);
    final profile = Profile(
      name: name,
      nameRu: _nameRuController.text.trim(),
      server: _server,
      org: _org,
      dept: _dept,
      rank: _rank,
      callsign: 'Сокол-1',
      post: 'Мост г. Южный',
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
              const SizedBox(height: 16),
              // Name Inputs
              Row(
                children: [
                  Expanded(
                    child: RpTextField(
                      label: 'Никнейм (Ivan_Ivanov)',
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
