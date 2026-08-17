import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;

class GameSender {
  static Future<void> sendLine(String text) async {
    if (text.trim().isEmpty) return;
    if (!Platform.isWindows) {
      debugPrint('[GAME CHAT SIMULATION]: $text');
      return;
    }
    final bytes = utf8.encode(text);
    final b64 = base64.encode(bytes);
    final script = """
Add-Type -AssemblyName System.Windows.Forms
\$bytes = [Convert]::FromBase64String('$b64')
\$text = [System.Text.Encoding]::UTF8.GetString(\$bytes)
[System.Windows.Forms.Clipboard]::SetText(\$text)
\$w = New-Object -ComObject WScript.Shell
Start-Sleep -Milliseconds 40
\$w.SendKeys('{F6}')
Start-Sleep -Milliseconds 60
\$w.SendKeys('^v')
Start-Sleep -Milliseconds 60
\$w.SendKeys('{ENTER}')
""";
    final tmpDir = Directory.systemTemp;
    final tmpFile = File(p.join(tmpDir.path, 'rp_send_${DateTime.now().millisecondsSinceEpoch}_${(1000 + (DateTime.now().microsecond % 9000))}.ps1'));
    await tmpFile.writeAsString(script);
    try {
      await Process.run(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', tmpFile.path],
      );
    } finally {
      try {
        if (await tmpFile.exists()) {
          await tmpFile.delete();
        }
      } catch (_) {}
    }
  }

  static Future<void> sendLines(List<({String text, int delay})> lines) async {
    for (final line in lines) {
      if (line.text.trim().isNotEmpty) {
        await sendLine(line.text);
        final d = line.delay.clamp(200, 10000);
        await Future.delayed(Duration(milliseconds: d));
      }
    }
  }
}
