import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/profile.dart';
import '../models/settings.dart';
import '../models/saved_config.dart';
import '../services/storage_service.dart';
import '../constants/default_data.dart';



class AppState {
  final List<Profile> profiles;
  final String? activeProfileId;
  final List<Bind> binds;
  final List<Hint> hints;
  final List<ReportTemplate> reportTemplates;
  final List<SavedConfig> savedConfigs;
  final String? activeConfigId;
  final AppSettings settings;
  final String targetId;
  final String targetType; // 'id' or 'mask'
  final bool isLoading;

  const AppState({
    this.profiles = const [],
    this.activeProfileId,
    this.binds = const [],
    this.hints = const [],
    this.reportTemplates = const [],
    this.savedConfigs = const [],
    this.activeConfigId,
    this.settings = const AppSettings(),
    this.targetId = '',
    this.targetType = 'id',
    this.isLoading = true,
  });

  Profile? get activeProfile {
    if (activeProfileId == null || profiles.isEmpty) return null;
    return profiles.where((p) => p.id == activeProfileId).firstOrNull ?? profiles.first;
  }

  SavedConfig? get activeConfig {
    if (activeConfigId == null || savedConfigs.isEmpty) return null;
    return savedConfigs.where((c) => c.id == activeConfigId).firstOrNull;
  }

  AppState copyWith({
    List<Profile>? profiles,
    String? activeProfileId,
    bool clearActiveProfile = false,
    List<Bind>? binds,
    List<Hint>? hints,
    List<ReportTemplate>? reportTemplates,
    List<SavedConfig>? savedConfigs,
    String? activeConfigId,
    bool clearActiveConfig = false,
    AppSettings? settings,
    String? targetId,
    String? targetType,
    bool? isLoading,
  }) {
    return AppState(
      profiles: profiles ?? this.profiles,
      activeProfileId: clearActiveProfile ? null : (activeProfileId ?? this.activeProfileId),
      binds: binds ?? this.binds,
      hints: hints ?? this.hints,
      reportTemplates: reportTemplates ?? this.reportTemplates,
      savedConfigs: savedConfigs ?? this.savedConfigs,
      activeConfigId: clearActiveConfig ? null : (activeConfigId ?? this.activeConfigId),
      settings: settings ?? this.settings,
      targetId: targetId ?? this.targetId,
      targetType: targetType ?? this.targetType,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AppStoreNotifier extends StateNotifier<AppState> {
  AppStoreNotifier() : super(const AppState()) {
    _load();
  }

  final _storage = StorageService.instance;

  Future<void> _load() async {
    await _storage.init();
    final profiles = _storage.loadProfiles();
    final binds = _storage.loadBinds();
    final hints = _storage.loadHints();
    final templates = _storage.loadReportTemplates();
    final configs = _storage.loadSavedConfigs();
    final settings = _storage.loadSettings();
    final activeProfId = _storage.loadActiveProfileId();
    final activeCfgId = _storage.loadActiveConfigId();

    final initialProfiles = profiles;

    final initialBinds = binds.isNotEmpty ? binds : kDefaultBinds;
    final initialHints = hints.isNotEmpty ? hints : kDefaultHints;
    final initialTemplates = templates.isNotEmpty
        ? templates
        : kDefaultReports.map((r) => ReportTemplate.fromJson(r)).toList();

    state = AppState(
      profiles: initialProfiles,
      activeProfileId: activeProfId ?? (initialProfiles.isNotEmpty ? initialProfiles.first.id : null),
      binds: initialBinds,
      hints: initialHints,
      reportTemplates: initialTemplates,
      savedConfigs: configs,
      activeConfigId: activeCfgId,
      // Always restore saved login session, but reset overlay mode on start
      settings: settings.copyWith(isOverlayMode: false),
      isLoading: false,
    );
  }

  void _persist() {
    _storage.saveProfiles(state.profiles);
    _storage.saveActiveProfileId(state.activeProfileId);
    _storage.saveBinds(state.binds);
    _storage.saveHints(state.hints);
    _storage.saveReportTemplates(state.reportTemplates);
    _storage.saveSavedConfigs(state.savedConfigs);
    _storage.saveActiveConfigId(state.activeConfigId);
    _storage.saveSettings(state.settings);
  }

  // --- Profiles ---
  void addProfile(Profile p) {
    state = state.copyWith(
      profiles: [...state.profiles, p],
      activeProfileId: state.activeProfileId ?? p.id,
    );
    _persist();
  }

  void updateProfile(String id, Profile updated) {
    state = state.copyWith(
      profiles: state.profiles.map((p) => p.id == id ? updated : p).toList(),
    );
    _persist();
  }

  void deleteProfile(String id) {
    final newProfiles = state.profiles.where((p) => p.id != id).toList();
    state = state.copyWith(
      profiles: newProfiles,
      activeProfileId: state.activeProfileId == id
          ? (newProfiles.isNotEmpty ? newProfiles.first.id : null)
          : state.activeProfileId,
    );
    _persist();
  }

  void setActiveProfile(String id) {
    state = state.copyWith(activeProfileId: id);
    _persist();
  }

  // --- Target ID ---
  void setTargetId(String val, [String? forcedType]) {
    state = state.copyWith(
      targetId: val,
      targetType: forcedType ?? state.targetType,
    );
  }

  void setTargetType(String type) {
    state = state.copyWith(targetType: type);
  }

  // --- Binds ---
  void addBind(Bind b) {
    state = state.copyWith(binds: [...state.binds, b]);
    _persist();
  }

  void updateBind(String id, Bind updated) {
    state = state.copyWith(
      binds: state.binds.map((b) => b.id == id ? updated : b).toList(),
    );
    _persist();
  }

  void deleteBind(String id) {
    state = state.copyWith(binds: state.binds.where((b) => b.id != id).toList());
    _persist();
  }

  // --- Hints ---
  void addHint(Hint h) {
    state = state.copyWith(hints: [...state.hints, h]);
    _persist();
  }

  void updateHint(String id, Hint updated) {
    state = state.copyWith(
      hints: state.hints.map((h) => h.id == id ? updated : h).toList(),
    );
    _persist();
  }

  void deleteHint(String id) {
    state = state.copyWith(hints: state.hints.where((h) => h.id != id).toList());
    _persist();
  }

  // --- Reports ---
  void addReportTemplate(ReportTemplate r) {
    state = state.copyWith(reportTemplates: [...state.reportTemplates, r]);
    _persist();
  }

  void updateReportTemplate(String id, ReportTemplate updated) {
    state = state.copyWith(
      reportTemplates: state.reportTemplates.map((r) => r.id == id ? updated : r).toList(),
    );
    _persist();
  }

  void deleteReportTemplate(String id) {
    state = state.copyWith(
      reportTemplates: state.reportTemplates.where((r) => r.id != id).toList(),
    );
    _persist();
  }

  // --- Configs ---
  void saveCurrentAsConfig(String title, [String description = '']) {
    final cfg = SavedConfig(
      title: title,
      description: description,
      server: state.activeProfile?.server ?? 'Red',
      org: state.activeProfile?.org ?? 'УГИБДД',
      profiles: state.profiles,
      activeProfileId: state.activeProfileId,
      hints: state.hints,
      binds: state.binds,
      reportTemplates: state.reportTemplates,
      settings: state.settings,
    );
    state = state.copyWith(
      savedConfigs: [...state.savedConfigs, cfg],
      activeConfigId: cfg.id,
    );
    _persist();
  }

  void loadConfig(String configId) {
    final cfg = state.savedConfigs.where((c) => c.id == configId).firstOrNull;
    if (cfg == null) return;
    state = state.copyWith(
      activeConfigId: cfg.id,
      profiles: cfg.profiles.isNotEmpty ? cfg.profiles : state.profiles,
      activeProfileId: cfg.activeProfileId ?? (cfg.profiles.isNotEmpty ? cfg.profiles.first.id : state.activeProfileId),
      hints: cfg.hints.isNotEmpty ? cfg.hints : state.hints,
      binds: cfg.binds.isNotEmpty ? cfg.binds : state.binds,
      reportTemplates: cfg.reportTemplates.isNotEmpty ? cfg.reportTemplates : state.reportTemplates,
    );
    _persist();
  }

  void deleteConfig(String configId) {
    final newConfigs = state.savedConfigs.where((c) => c.id != configId).toList();
    state = state.copyWith(
      savedConfigs: newConfigs,
      activeConfigId: state.activeConfigId == configId ? null : state.activeConfigId,
    );
    _persist();
  }

  // --- Settings ---
  void updateSettings(AppSettings updated) {
    state = state.copyWith(settings: updated);
    _persist();
  }
}

final appStoreProvider = StateNotifierProvider<AppStoreNotifier, AppState>(
  (ref) => AppStoreNotifier(),
);
