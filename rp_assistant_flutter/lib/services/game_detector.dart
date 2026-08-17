import 'dart:io';

class GameProcessInfo {
  final bool isRunning;
  final String? processName;
  final int? pid;
  final String statusMessage;

  const GameProcessInfo({
    required this.isRunning,
    this.processName,
    this.pid,
    required this.statusMessage,
  });
}

class GameDetector {
  static const List<String> _gameProcessNames = [
    'amazing.exe',
    'amazingonline.exe',
    'amazing_launcher.exe',
    'amazing games launcher.exe',
    'amazing launcher.exe',
    'gta_sa.exe',
    'amazing',
  ];

  static Future<GameProcessInfo> checkGameRunning() async {
    if (!Platform.isWindows) {
      // Non-Windows simulation for development
      return const GameProcessInfo(
        isRunning: true,
        processName: 'amazing.exe (симуляция)',
        pid: 7777,
        statusMessage: 'Режим симуляции (не Windows платформа)',
      );
    }

    try {
      final result = await Process.run(
        'tasklist',
        ['/FO', 'CSV', '/NH'],
        runInShell: true,
      );

      if (result.exitCode != 0) {
        return GameProcessInfo(
          isRunning: false,
          statusMessage: 'Не удалось опросить список процессов (код ${result.exitCode})',
        );
      }

      final output = result.stdout.toString().toLowerCase();
      final lines = output.split('\n');

      for (final line in lines) {
        for (final target in _gameProcessNames) {
          if (line.contains(target)) {
            // Extract PID if possible
            final parts = line.replaceAll('"', '').split(',');
            int? pid;
            if (parts.length > 1) {
              pid = int.tryParse(parts[1].trim());
            }
            return GameProcessInfo(
              isRunning: true,
              processName: parts.isNotEmpty ? parts[0] : target,
              pid: pid,
              statusMessage: 'Игра Amazing Online обнаружена в процессах Windows',
            );
          }
        }
      }

      return const GameProcessInfo(
        isRunning: false,
        statusMessage: 'Процесс Amazing Online не найден среди активных процессов',
      );
    } catch (e) {
      return GameProcessInfo(
        isRunning: false,
        statusMessage: 'Ошибка проверки процессов: $e',
      );
    }
  }

  static Future<bool> launchAmazingLauncher([String? customPath]) async {
    if (!Platform.isWindows) return false;

    final candidatePaths = [
      if (customPath != null && customPath.isNotEmpty) customPath,
      r'C:\Games\Amazing Games\Amazing Games Launcher.exe',
      r'D:\Games\Amazing Games\Amazing Games Launcher.exe',
      r'E:\Games\Amazing Games\Amazing Games Launcher.exe',
      r'C:\Amazing Online\Amazing Games Launcher.exe',
      r'D:\Amazing Online\Amazing Games Launcher.exe',
      r'C:\Program Files (x86)\Amazing Games\Amazing Games Launcher.exe',
      r'C:\Program Files\Amazing Games\Amazing Games Launcher.exe',
    ];

    for (final p in candidatePaths) {
      final file = File(p);
      if (await file.exists()) {
        try {
          await Process.start(file.path, [], mode: ProcessStartMode.detached);
          return true;
        } catch (_) {}
      }
    }

    return false;
  }
}
