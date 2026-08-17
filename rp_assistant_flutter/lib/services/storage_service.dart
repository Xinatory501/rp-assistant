import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import '../models/profile.dart';
import '../models/settings.dart';
import '../models/saved_config.dart';

class StorageService {
  static StorageService? _instance;
  static StorageService get instance => _instance ??= StorageService._();
  StorageService._();

  File? _file;
  Map<String, dynamic> _data = {};

  Future<void> init() async {
    try {
      final dir = await getApplicationSupportDirectory();
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }
      _file = File(p.join(dir.path, 'config.json'));
      if (await _file!.exists()) {
        final raw = await _file!.readAsString();
        _data = json.decode(raw) as Map<String, dynamic>;
      }
    } catch (_) {
      _data = {};
    }
  }

  dynamic get(String key, [dynamic defaultVal]) {
    final keys = key.split('.');
    dynamic cur = _data;
    for (final k in keys) {
      if (cur is Map<String, dynamic>) {
        cur = cur[k];
      } else {
        return defaultVal;
      }
    }
    return cur ?? defaultVal;
  }

  void set(String key, dynamic value) {
    final keys = key.split('.');
    Map<String, dynamic> cur = _data;
    for (int i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] is! Map<String, dynamic>) {
        cur[keys[i]] = <String, dynamic>{};
      }
      cur = cur[keys[i]] as Map<String, dynamic>;
    }
    cur[keys.last] = value;
    _save();
  }

  Future<void> _save() async {
    try {
      await _file?.writeAsString(json.encode(_data), flush: true);
    } catch (_) {}
  }

  AppSettings loadSettings() {
    final raw = get('settings');
    if (raw is Map<String, dynamic>) return AppSettings.fromJson(raw);
    return const AppSettings();
  }

  void saveSettings(AppSettings s) => set('settings', s.toJson());

  List<Profile> loadProfiles() {
    final raw = get('profiles') as List<dynamic>?;
    return raw?.map((e) => Profile.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  void saveProfiles(List<Profile> profiles) =>
      set('profiles', profiles.map((p) => p.toJson()).toList());

  String? loadActiveProfileId() => get('activeProfileId') as String?;
  void saveActiveProfileId(String? id) => set('activeProfileId', id);

  List<Bind> loadBinds() {
    final raw = get('binds') as List<dynamic>?;
    return raw?.map((e) => Bind.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  void saveBinds(List<Bind> binds) => set('binds', binds.map((b) => b.toJson()).toList());

  List<Hint> loadHints() {
    final raw = get('hints') as List<dynamic>?;
    return raw?.map((e) => Hint.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  void saveHints(List<Hint> hints) => set('hints', hints.map((h) => h.toJson()).toList());

  List<ReportTemplate> loadReportTemplates() {
    final raw = get('reportTemplates') as List<dynamic>?;
    return raw?.map((e) => ReportTemplate.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  void saveReportTemplates(List<ReportTemplate> templates) =>
      set('reportTemplates', templates.map((t) => t.toJson()).toList());

  List<SavedConfig> loadSavedConfigs() {
    final raw = get('savedConfigs') as List<dynamic>?;
    return raw?.map((e) => SavedConfig.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  void saveSavedConfigs(List<SavedConfig> configs) =>
      set('savedConfigs', configs.map((c) => c.toJson()).toList());

  String? loadActiveConfigId() => get('activeConfigId') as String?;
  void saveActiveConfigId(String? id) => set('activeConfigId', id);

  Map<String, dynamic> loadAccounts() {
    final raw = get('accounts');
    if (raw is Map<String, dynamic>) return raw;
    return {};
  }

  void saveAccounts(Map<String, dynamic> accounts) => set('accounts', accounts);
}

