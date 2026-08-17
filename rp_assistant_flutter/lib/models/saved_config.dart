import 'package:uuid/uuid.dart';
import 'profile.dart';
import 'settings.dart';

const _uuid = Uuid();

class SavedConfig {
  final String id;
  final String title;
  final String description;
  final String server;
  final String org;
  final int createdAt;
  final bool isPreset;
  final List<Profile> profiles;
  final String? activeProfileId;
  final List<Hint> hints;
  final List<Bind> binds;
  final List<ReportTemplate> reportTemplates;
  final AppSettings? settings;

  SavedConfig({
    String? id,
    required this.title,
    this.description = '',
    this.server = 'Red',
    this.org = 'УГИБДД',
    int? createdAt,
    this.isPreset = false,
    this.profiles = const [],
    this.activeProfileId,
    this.hints = const [],
    this.binds = const [],
    this.reportTemplates = const [],
    this.settings,
  })  : id = id ?? _uuid.v4(),
        createdAt = createdAt ?? DateTime.now().millisecondsSinceEpoch;

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'server': server,
    'org': org,
    'createdAt': createdAt,
    'isPreset': isPreset,
    'data': {
      'profiles': profiles.map((p) => p.toJson()).toList(),
      'activeProfileId': activeProfileId,
      'hints': hints.map((h) => h.toJson()).toList(),
      'binds': binds.map((b) => b.toJson()).toList(),
      'reportTemplates': reportTemplates.map((r) => r.toJson()).toList(),
      if (settings != null) 'settings': settings!.toJson(),
    }
  };

  factory SavedConfig.fromJson(Map<String, dynamic> json) {
    final data = (json['data'] as Map<String, dynamic>?) ?? {};
    return SavedConfig(
      id: json['id'] as String?,
      title: json['title'] as String? ?? 'Без названия',
      description: json['description'] as String? ?? '',
      server: json['server'] as String? ?? 'Red',
      org: json['org'] as String? ?? 'УГИБДД',
      createdAt: json['createdAt'] as int? ?? DateTime.now().millisecondsSinceEpoch,
      isPreset: json['isPreset'] as bool? ?? false,
      profiles: (data['profiles'] as List<dynamic>?)
          ?.map((e) => Profile.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      activeProfileId: data['activeProfileId'] as String?,
      hints: (data['hints'] as List<dynamic>?)
          ?.map((e) => Hint.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      binds: (data['binds'] as List<dynamic>?)
          ?.map((e) => Bind.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      reportTemplates: (data['reportTemplates'] as List<dynamic>?)
          ?.map((e) => ReportTemplate.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      settings: data['settings'] != null
          ? AppSettings.fromJson(data['settings'] as Map<String, dynamic>)
          : null,
    );
  }
}
