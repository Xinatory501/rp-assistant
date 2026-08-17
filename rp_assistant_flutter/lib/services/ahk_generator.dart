import 'dart:io';
import '../models/profile.dart';

class AhkGenerator {
  static String generateScript({
    Profile? profile,
    List<Bind> binds = const [],
    List<Hint> hints = const [],
  }) {
    final charName = profile?.name ?? 'Игрок';
    final charOrg = profile?.org ?? 'УГИБДД';
    final charRank = profile?.rank ?? 'Сотрудник';
    final charServer = profile?.server ?? 'Red';

    final sb = StringBuffer();
    sb.writeln('; ========================================================');
    sb.writeln('; RP Assistant — Injected AutoHotkey Hook для Amazing Online');
    sb.writeln('; Персонаж: $charName | $charOrg ($charRank) | Сервер: $charServer');
    sb.writeln('; ========================================================');
    sb.writeln('#NoEnv');
    sb.writeln('#SingleInstance Force');
    sb.writeln('SendMode Input');
    sb.writeln('SetWorkingDir %A_ScriptDir%');
    sb.writeln('');
    sb.writeln('; --- ВСПЛЫВАЮЩЕЕ ПРИВЕТСТВИЕ ПРИ ИНДЖЕКТЕ В ИГРУ ---');
    sb.writeln('ToolTip, 🚀 [RP ASSISTANT INJECTED]`nБот-помощник успешно внедрён в Amazing Online!`n📌 Доступные команды: /helpahk | Шпаргалка: Alt+1..Alt+4 | Меню: Insert, 35, 35');
    sb.writeln('SetTimer, RemoveToolTip, -8000');
    sb.writeln('');
    sb.writeln('#IfWinActive AMAZING Online');
    sb.writeln('');
    sb.writeln('; ────────────────────────────────────────────────────────');
    sb.writeln('; 0. СПРАВКА И ПОМОЩЬ ПО КОМАНДАМ В ИГРЕ (/helpahk)');
    sb.writeln('; ────────────────────────────────────────────────────────');
    sb.writeln('::/helpahk::');
    sb.writeln('ToolTip, 🤖 [RP ASSISTANT BOT — ПОМОЩЬ ПО КОМАНДАМ]`n=====================================`n💬 Быстрые команды в чат:`n/uk2.1 - /uk5.1 : Статьи УК РФ`n/koap1.1 - /koap3.1 : Статьи КоАП`n/dm /db /mg /sk /tk /pg /rp : РП-термины`n`n⚡ Горячие клавиши (HUD):`nAlt + 1 : Шпаргалка УК и КоАП`nAlt + 2 : Термины собеседования`nAlt + 3 : Правило Миранды`nAlt + 4 : Порядок допроса`nInsert : Открыть меню биндера, 35, 35');
    sb.writeln('SetTimer, RemoveToolTip, -12000');
    sb.writeln('return');
    sb.writeln('');
    sb.writeln('::/rphelp::');
    sb.writeln('ToolTip, 🤖 [RP ASSISTANT BOT — ПОМОЩЬ ПО КОМАНДАМ]`n=====================================`n💬 Быстрые команды в чат:`n/uk2.1 - /uk5.1 : Статьи УК РФ`n/koap1.1 - /koap3.1 : Статьи КоАП`n/dm /db /mg /sk /tk /pg /rp : РП-термины`n`n⚡ Горячие клавиши (HUD):`nAlt + 1 : Шпаргалка УК и КоАП`nAlt + 2 : Термины собеседования`nAlt + 3 : Правило Миранды`nAlt + 4 : Порядок допроса`nInsert : Открыть меню биндера, 35, 35');
    sb.writeln('SetTimer, RemoveToolTip, -12000');
    sb.writeln('return');
    sb.writeln('');
    sb.writeln('; ────────────────────────────────────────────────────────');
    sb.writeln('; 1. БЫСТРЫЕ КОМАНДЫ АВТОЗАМЕНЫ В ЧАТЕ (HOTSTRINGS)');
    sb.writeln('; ────────────────────────────────────────────────────────');
    sb.writeln('::/uk2.1::Статья 2.1 УК — Покушение на жизнь сотрудника правоохранительных органов (6 лет лишения свободы).');
    sb.writeln('::/uk2.2::Статья 2.2 УК — Вооруженное нападение на гос. сотрудника (6 лет лишения свободы, изъятие лицензии на оружие).');
    sb.writeln('::/uk3.1::Статья 3.1 УК — Неподчинение законным требованиям сотрудника полиции (3 года лишения свободы).');
    sb.writeln('::/uk4.1::Статья 4.1 УК — Незаконное ношение/хранение оружия или боеприпасов (4 года лишения свободы).');
    sb.writeln('::/uk5.1::Статья 5.1 УК — Сбыт/хранение наркотических веществ (5 лет лишения свободы).');
    sb.writeln('::/koap1.1::Статья 1.1 КоАП — Движение по полосе встречного движения (штраф 15.000 руб или лишение ВУ).');
    sb.writeln('::/koap2.1::Статья 2.1 КоАП — Превышение установленной скорости движения (штраф 10.000 руб).');
    sb.writeln('::/koap3.1::Статья 3.1 КоАП — Оскорбление представителя власти (штраф 20.000 руб).');
    sb.writeln('::/dm::ДМ (DeathMatch) — нанесение урона персонажу без весомой игровой (IC) причины.');
    sb.writeln('::/db::ДБ (DriveBy) — нанесение урона или убийство с использованием автомобиля.');
    sb.writeln('::/mg::МГ (MetaGaming) — использование информации из реального мира в игровой (IC) процесс.');
    sb.writeln('::/sk::СК (SpawnKill) — убийство или нанесение урона на месте появления (спавна) персонажа.');
    sb.writeln('::/tk::ТК (TeamKill) — убийство или стрельба по сотрудникам своей фракции/организации.');
    sb.writeln('::/pg::ПГ (PowerGaming) — превышение физических или духовных возможностей персонажа (геройство без страха).');
    sb.writeln('::/rp::РП (RolePlay) — игра по ролям в соответствии с выбранной ролью и законами реального мира.');
    sb.writeln('');
    sb.writeln('; ────────────────────────────────────────────────────────');
    sb.writeln('; 2. ВСПЛЫВАЮЩИЕ ОВЕРЛЕЙ-ПОДСКАЗКИ НА ЭКРАНЕ (TOOLTIP)');
    sb.writeln('; ────────────────────────────────────────────────────────');
    sb.writeln('; Alt + 1: Шпаргалка по статьям УК и КоАП');
    sb.writeln('!1::');
    sb.writeln('ToolTip, 📜 ШПАРГАЛКА ПО СТАТЬЯМ УК И КоАП:`n2.1 УК - Покушение на гос. сотрудника (6 лет)`n2.2 УК - Вооруженное нападение (6 лет)`n3.1 УК - Неподчинение полиции (3 года)`n4.1 УК - Оружие без лицензии (4 года)`n1.1 КоАП - Встречная полоса (15.000 руб)`n2.1 КоАП - Превышение скорости (10.000 руб), 35, 35');
    sb.writeln('SetTimer, RemoveToolTip, -6000');
    sb.writeln('return');
    sb.writeln('');
    sb.writeln('; Alt + 2: Термины для собеседования');
    sb.writeln('!2::');
    sb.writeln('ToolTip, 📝 ТЕРМИНЫ ДЛЯ СОБЕСЕДОВАНИЯ:`nМГ - MetaGaming (инфа из реального мира в IC)`nДМ - DeathMatch (убийство/урон без причины)`nДБ - DriveBy (урон автомобилем)`nСК - SpawnKill (убийство на спавне)`nТК - TeamKill (убийство своих)`nПГ - PowerGaming (воображение себя героем)`nРП - RolePlay (игра по ролям), 35, 35');
    sb.writeln('SetTimer, RemoveToolTip, -6000');
    sb.writeln('return');
    sb.writeln('');
    sb.writeln('; Alt + 3: Правило Миранды и права задержанного');
    sb.writeln('!3::');
    sb.writeln('ToolTip, 🛡 ПРАВИЛО МИРАНДЫ (ПРАВА ЗАДЕРЖАННОГО):`n«Вы имеете право хранить молчание. Всё, что вы скажете,`nможет и будет использовано против вас. Вы имеете право на адвоката`nи один телефонный звонок. Вам ясны ваши права?», 35, 35');
    sb.writeln('SetTimer, RemoveToolTip, -7000');
    sb.writeln('return');
    sb.writeln('');
    sb.writeln('; Alt + 4: Порядок проведения допроса');
    sb.writeln('!4::');
    sb.writeln('ToolTip, ⚖️ ПОРЯДОК ДОПРОСА (УПК):`n1. Установить личность по паспорту (/pass)`n2. Разъяснить ст. 51 Конституции РФ (право не свидетельствовать против себя)`n3. Включить видеозапись`n4. Максимальная длительность непрерывно: не более 4 часов, 35, 35');
    sb.writeln('SetTimer, RemoveToolTip, -7000');
    sb.writeln('return');
    sb.writeln('');
    sb.writeln('; ────────────────────────────────────────────────────────');
    sb.writeln('; 3. ПОЛЬЗОВАТЕЛЬСКИЕ БИНДЫ ПЕРСОНАЖА');
    sb.writeln('; ────────────────────────────────────────────────────────');

    for (final b in binds) {
      if (b.key.isEmpty) continue;
      final ahkKey = _convertHotkeyToAhk(b.key);
      if (ahkKey.isEmpty) continue;

      sb.writeln('; Бинд: ${b.title}');
      sb.writeln('$ahkKey::');
      for (final line in b.lines) {
        if (line.text.trim().isEmpty) continue;
        final processed = line.text
            .replaceAll('{name}', profile?.name ?? '')
            .replaceAll('{rank}', profile?.rank ?? '')
            .replaceAll('{org}', profile?.org ?? '')
            .replaceAll('{dept}', profile?.dept ?? '')
            .replaceAll('{callsign}', profile?.callsign ?? '')
            .replaceAll('{post}', profile?.post ?? '');
        sb.writeln('SendInput, {F6}');
        sb.writeln('Sleep, 40');
        sb.writeln('SendInput, ${processed.replaceAll('{id}', '%A_Args%')}');
        sb.writeln('Sleep, 40');
        sb.writeln('SendInput, {Enter}');
        if (line.delay > 0) {
          sb.writeln('Sleep, ${line.delay}');
        }
      }
      sb.writeln('return');
      sb.writeln('');
    }

    sb.writeln('RemoveToolTip:');
    sb.writeln('ToolTip');
    sb.writeln('return');
    sb.writeln('');
    sb.writeln('#IfWinActive');
    return sb.toString();
  }

  static String _convertHotkeyToAhk(String hotkey) {
    var key = hotkey.trim();
    var prefix = '';
    if (key.contains('Alt+')) {
      prefix += '!';
      key = key.replaceAll('Alt+', '');
    }
    if (key.contains('Ctrl+')) {
      prefix += '^';
      key = key.replaceAll('Ctrl+', '');
    }
    if (key.contains('Shift+')) {
      prefix += '+';
      key = key.replaceAll('Shift+', '');
    }
    if (key.toLowerCase() == 'numpad0') return '${prefix}Numpad0';
    if (key.toLowerCase() == 'numpad1') return '${prefix}Numpad1';
    if (key.toLowerCase() == 'numpad2') return '${prefix}Numpad2';
    if (key.toLowerCase() == 'numpad3') return '${prefix}Numpad3';
    if (key.toLowerCase() == 'numpad4') return '${prefix}Numpad4';
    if (key.toLowerCase() == 'numpad5') return '${prefix}Numpad5';
    if (key.toLowerCase() == 'numpad6') return '${prefix}Numpad6';
    if (key.toLowerCase() == 'numpad7') return '${prefix}Numpad7';
    if (key.toLowerCase() == 'numpad8') return '${prefix}Numpad8';
    if (key.toLowerCase() == 'numpad9') return '${prefix}Numpad9';
    return '$prefix$key';
  }

  static Future<File> exportToDesktop(String content) async {
    final desktop = Directory('${Platform.environment['USERPROFILE']}\\Desktop');
    final file = File('${desktop.path}\\Amazing_RP_Assistant.ahk');
    await file.writeAsString(content);
    return file;
  }

  /// Automatically injects and executes runtime in-game hook
  static Future<bool> injectAndRunRuntimeScript({
    Profile? profile,
    List<Bind> binds = const [],
    List<Hint> hints = const [],
  }) async {
    if (!Platform.isWindows) return false;
    try {
      final content = generateScript(profile: profile, binds: binds, hints: hints);
      final tmp = Directory.systemTemp;
      final file = File('${tmp.path}\\rp_assistant_injected.ahk');
      await file.writeAsString(content);

      // Check standard AHK executable paths
      final ahkPaths = [
        r'C:\Program Files\AutoHotkey\AutoHotkey.exe',
        r'C:\Program Files\AutoHotkey\AutoHotkeyU64.exe',
        r'C:\Program Files\AutoHotkey\AutoHotkeyU32.exe',
        r'C:\Program Files (x86)\AutoHotkey\AutoHotkey.exe',
        r'C:\Program Files (x86)\AutoHotkey\AutoHotkeyU32.exe',
      ];

      for (final p in ahkPaths) {
        if (await File(p).exists()) {
          await Process.start(p, [file.path], mode: ProcessStartMode.detached);
          return true;
        }
      }

      // Default Windows association
      await Process.start('cmd', ['/c', 'start', '', file.path], mode: ProcessStartMode.detached);
      return true;
    } catch (_) {
      return false;
    }
  }
}

