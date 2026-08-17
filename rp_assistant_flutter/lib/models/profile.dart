import 'package:uuid/uuid.dart';

const _uuid = Uuid();

class Profile {
  final String id;
  final String name;
  final String nameRu;
  final String server;
  final String org;
  final String dept;
  final String rank;
  final String callsign;
  final String post;

  Profile({
    String? id,
    required this.name,
    this.nameRu = '',
    required this.server,
    required this.org,
    required this.dept,
    required this.rank,
    required this.callsign,
    required this.post,
  }) : id = id ?? _uuid.v4();

  Profile copyWith({
    String? id, String? name, String? nameRu, String? server,
    String? org, String? dept, String? rank, String? callsign, String? post,
  }) {
    return Profile(
      id: id ?? this.id, name: name ?? this.name, nameRu: nameRu ?? this.nameRu,
      server: server ?? this.server, org: org ?? this.org, dept: dept ?? this.dept,
      rank: rank ?? this.rank, callsign: callsign ?? this.callsign, post: post ?? this.post,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'name': name, 'nameRu': nameRu, 'server': server,
    'org': org, 'dept': dept, 'rank': rank, 'callsign': callsign, 'post': post,
  };

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
    id: json['id'] as String?,
    name: json['name'] as String? ?? '',
    nameRu: json['nameRu'] as String? ?? '',
    server: json['server'] as String? ?? 'Red',
    org: json['org'] as String? ?? 'УГИБДД',
    dept: json['dept'] as String? ?? '',
    rank: json['rank'] as String? ?? 'Лейтенант полиции',
    callsign: json['callsign'] as String? ?? '',
    post: json['post'] as String? ?? 'Мост г. Южный',
  );
}

class BindLine {
  final String text;
  final int delay;
  const BindLine({required this.text, this.delay = 1000});
  Map<String, dynamic> toJson() => {'text': text, 'delay': delay};
  factory BindLine.fromJson(Map<String, dynamic> json) =>
      BindLine(text: json['text'] as String? ?? '', delay: json['delay'] as int? ?? 1000);
}

class Bind {
  final String id;
  final String title;
  final String key;
  final List<BindLine> lines;
  Bind({String? id, required this.title, required this.key, required this.lines})
      : id = id ?? _uuid.v4();
  Bind copyWith({String? id, String? title, String? key, List<BindLine>? lines}) =>
      Bind(id: id ?? this.id, title: title ?? this.title, key: key ?? this.key, lines: lines ?? this.lines);
  Map<String, dynamic> toJson() => {
    'id': id, 'title': title, 'key': key,
    'lines': lines.map((l) => l.toJson()).toList(),
  };
  factory Bind.fromJson(Map<String, dynamic> json) => Bind(
    id: json['id'] as String?, title: json['title'] as String? ?? '',
    key: json['key'] as String? ?? '',
    lines: (json['lines'] as List<dynamic>?)
        ?.map((e) => BindLine.fromJson(e as Map<String, dynamic>)).toList() ?? [],
  );
}

class Hint {
  final String id;
  final String title;
  final String content;
  final String hotkey;
  Hint({String? id, required this.title, required this.content, this.hotkey = ''}) : id = id ?? _uuid.v4();
  Hint copyWith({String? id, String? title, String? content, String? hotkey}) =>
      Hint(id: id ?? this.id, title: title ?? this.title, content: content ?? this.content, hotkey: hotkey ?? this.hotkey);
  Map<String, dynamic> toJson() => {'id': id, 'title': title, 'content': content, 'hotkey': hotkey};
  factory Hint.fromJson(Map<String, dynamic> json) => Hint(
    id: json['id'] as String?, title: json['title'] as String? ?? '',
    content: json['content'] as String? ?? '', hotkey: json['hotkey'] as String? ?? '',
  );
}

class ReportTemplate {
  final String id;
  final String title;
  final String template;
  ReportTemplate({String? id, required this.title, required this.template}) : id = id ?? _uuid.v4();
  ReportTemplate copyWith({String? id, String? title, String? template}) =>
      ReportTemplate(id: id ?? this.id, title: title ?? this.title, template: template ?? this.template);
  Map<String, dynamic> toJson() => {'id': id, 'title': title, 'template': template};
  factory ReportTemplate.fromJson(Map<String, dynamic> json) => ReportTemplate(
    id: json['id'] as String?, title: json['title'] as String? ?? '', template: json['template'] as String? ?? '',
  );
}
