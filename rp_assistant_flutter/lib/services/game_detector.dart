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
    'gta_sa_cr.exe',
    'crmp.exe',
    'amazing_online.exe',
    'amazing_mp.exe',
    'samp.exe',
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

  static Future<Map<String, int>?> getGameWindowBounds() async {
    if (!Platform.isWindows) return null;
    try {
      final script = '''
\$proc = Get-Process | Where-Object { \$_.ProcessName -match 'amazing|gta_sa|crmp|samp' } | Select-Object -First 1
if (\$proc -and \$proc.MainWindowHandle -ne [IntPtr]::Zero) {
  Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class WinBounds {
      [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
      public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
    }
"@ -ErrorAction SilentlyContinue
  \$r = New-Object WinBounds+RECT
  [WinBounds]::GetWindowRect(\$proc.MainWindowHandle, [ref]\$r) | Out-Null
  Write-Output "\$(\$r.Left),\$(\$r.Top),\$(\$r.Right - \$r.Left),\$(\$r.Bottom - \$r.Top)"
}
''';
      final res = await Process.run('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-WindowStyle', 'Hidden',
        '-Command',
        script,
      ]);
      final out = res.stdout.toString().trim();
      if (out.isNotEmpty && out.contains(',')) {
        final parts = out.split(',');
        if (parts.length >= 4) {
          return {
            'left': int.tryParse(parts[0]) ?? 0,
            'top': int.tryParse(parts[1]) ?? 0,
            'width': int.tryParse(parts[2]) ?? 1920,
            'height': int.tryParse(parts[3]) ?? 1080,
          };
        }
      }
    } catch (_) {}
    return null;
  }
}

