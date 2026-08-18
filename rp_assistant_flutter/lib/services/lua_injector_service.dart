import 'dart:convert';
import 'dart:io';
import '../models/profile.dart';

/// Handles real in-game injection via MoonLoader Lua script.
///
/// Flow:
///   1. Flutter writes `rp_config.json` to the MoonLoader folder.
///   2. Flutter installs `rp_assistant.lua` into MoonLoader/scripts/ folder.
///   3. MoonLoader (already loaded by game via ASI Loader) picks up the script
///      and draws a native ImGui overlay inside the game process.
class LuaInjectorService {
  // ─── Candidate MoonLoader paths (Priority to F, E, C, D) ──────────────────
  static const List<String> _moonloaderPaths = [
    r'F:\Amazing Games\Amazing Online\PC\moonloader',
    r'F:\Amazing Games\Amazing Online\moonloader',
    r'E:\Amazing Games\Amazing Online\PC\moonloader',
    r'E:\Amazing Games\Amazing Online\moonloader',
    r'C:\Amazing Games\Amazing Online\PC\moonloader',
    r'C:\Amazing Games\Amazing Online\moonloader',
    r'C:\Amazing Games\moonloader',
    r'C:\Games\Amazing Games\moonloader',
    r'C:\Games\Amazing Online\moonloader',
    r'C:\Amazing Online\moonloader',
    r'D:\Amazing Games\Amazing Online\PC\moonloader',
    r'D:\Amazing Games\Amazing Online\moonloader',
    r'D:\Amazing Games\moonloader',
    r'D:\Games\Amazing Games\moonloader',
    r'D:\Games\Amazing Online\moonloader',
    r'D:\Amazing Online\moonloader',
  ];

  static const List<String> _gtaRootPaths = [
    r'F:\Amazing Games\Amazing Online\PC',
    r'F:\Amazing Games\Amazing Online',
    r'E:\Amazing Games\Amazing Online\PC',
    r'E:\Amazing Games\Amazing Online',
    r'C:\Amazing Games\Amazing Online\PC',
    r'C:\Amazing Games\Amazing Online',
    r'C:\Amazing Games',
    r'C:\Games\Amazing Games',
    r'C:\Games\Amazing Online',
    r'C:\Amazing Online',
    r'D:\Amazing Games\Amazing Online\PC',
    r'D:\Amazing Games\Amazing Online',
    r'D:\Amazing Games',
    r'D:\Games\Amazing Games',
    r'D:\Games\Amazing Online',
    r'D:\Amazing Online',
  ];

  /// Get the exact folder of the currently running amazing.exe process
  static Future<String?> getRunningGameDir() async {
    if (!Platform.isWindows) return null;
    try {
      final res = await Process.run('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        r"(Get-Process | Where-Object { $_.ProcessName -match 'amazing|gta_sa' } | Select-Object -First 1).Path",
      ]);
      final p = res.stdout.toString().trim();
      if (p.isNotEmpty && p.contains(r'\')) {
        final parent = File(p).parent.path;
        if (await Directory(parent).exists()) {
          return parent;
        }
      }
    } catch (_) {}
    return null;
  }

  // ─── Find MoonLoader folder with auto-creation ─────────────────────────
  static Future<String?> findMoonloaderDir([String? customPath]) async {
    // 1. If explicit custom path provided
    if (customPath != null && customPath.trim().isNotEmpty) {
      final clean = customPath.trim();
      final dir = Directory(clean);

      // Case A: Path is already the moonloader folder
      if (clean.toLowerCase().endsWith('moonloader')) {
        if (!await dir.exists()) {
          try {
            await dir.create(recursive: true);
          } catch (_) {}
        }
        if (await dir.exists()) return dir.path;
      }

      // Case B: Path has a moonloader subfolder
      final subMoon = Directory('$clean\\moonloader');
      if (await subMoon.exists()) {
        return subMoon.path;
      }

      // Case C: Path is a valid directory -> create moonloader inside!
      if (await dir.exists()) {
        try {
          await subMoon.create(recursive: true);
          return subMoon.path;
        } catch (_) {}
      }
    }

    // 2. Check currently running game process directory!
    final runningGame = await getRunningGameDir();
    if (runningGame != null) {
      final runningMoon = Directory('$runningGame\\moonloader');
      try {
        if (!await runningMoon.exists()) await runningMoon.create(recursive: true);
        return runningMoon.path;
      } catch (_) {}
    }

    // 3. Check candidate moonloader directories
    for (final p in _moonloaderPaths) {
      final d = Directory(p);
      if (await d.exists()) return p;
    }

    // 4. Check candidate game root directories and create moonloader inside
    for (final root in _gtaRootPaths) {
      final rd = Directory(root);
      if (await rd.exists()) {
        final md = Directory('$root\\moonloader');
        try {
          if (!await md.exists()) await md.create(recursive: true);
          return md.path;
        } catch (_) {}
      }
    }

    return null;
  }

  static Future<String?> findGtaRoot([String? customPath]) async {
    final running = await getRunningGameDir();
    if (running != null) return running;

    if (customPath != null && customPath.isNotEmpty) {
      final d = Directory(customPath);
      if (await d.exists()) return customPath;
    }
    for (final p in _gtaRootPaths) {
      if (await Directory(p).exists()) return p;
    }
    return null;
  }

  // ─── Write config JSON ──────────────────────────────────────────────────
  static Future<bool> writeConfig({
    required Profile profile,
    required List<Bind> binds,
    required List<Hint> hints,
    String? moonloaderDir,
  }) async {
    final dir = await findMoonloaderDir(moonloaderDir);
    if (dir == null) return false;

    final configFile = File('$dir\\rp_assistant_config.json');

    final data = {
      'profile': profile.toJson(),
      'binds': binds.map((b) => {
        'id': b.id,
        'title': b.title,
        'key': b.key,
        'lines': b.lines.map((l) => {'text': l.text, 'delay': l.delay}).toList(),
      }).toList(),
      'hints': hints.map((h) => {
        'id': h.id,
        'title': h.title,
        'content': h.content,
        'hotkey': h.hotkey,
      }).toList(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    await configFile.writeAsString(const JsonEncoder.withIndent('  ').convert(data));
    return true;
  }

  // ─── Install Lua script ─────────────────────────────────────────────────
  static Future<bool> installLuaScript({
    String? moonloaderDir,
  }) async {
    final dir = await findMoonloaderDir(moonloaderDir);
    if (dir == null) return false;

    final scriptsDir = Directory('$dir\\scripts');
    if (!await scriptsDir.exists()) {
      await scriptsDir.create(recursive: true);
    }

    final luaFile = File('$dir\\scripts\\rp_assistant.lua');
    await luaFile.writeAsString(_luaScript);
    return true;
  }

  // ─── Full inject: write config + install lua ────────────────────────────
  static Future<InjectionResult> inject({
    required Profile profile,
    required List<Bind> binds,
    required List<Hint> hints,
    String? moonloaderDir,
  }) async {
    final dir = await findMoonloaderDir(moonloaderDir);

    if (dir == null) {
      return const InjectionResult(
        success: false,
        message: 'Папка с игрой не найдена. Пожалуйста, укажите папку Amazing Online в Настройках (раздел «Игра & Lua»).',
      );
    }

    final configOk = await writeConfig(
      profile: profile, binds: binds, hints: hints, moonloaderDir: dir,
    );
    final luaOk = await installLuaScript(moonloaderDir: dir);

    if (configOk && luaOk) {
      return InjectionResult(
        success: true,
        message: '✅ Lua-скрипт успешно установлен!\n'
            '📁 Путь: $dir\\scripts\\rp_assistant.lua\n'
            '🎮 Горячие клавиши в игре: [INSERT] или [F2] или [Alt+M] или [F10]\n'
            '💬 Команда в чат игры: /rp или /menu',
        path: dir,
      );
    }
    return InjectionResult(
      success: false,
      message: 'Ошибка записи файлов в $dir. Проверьте права доступа.',
    );
  }

  // ─── Lua script (MoonLoader + ImGui/mimgui) ────────────────────────────
  static const String _luaScript = r'''
script_name("RP Assistant")
script_description("RP Assistant in-game overlay for Amazing Online")
script_version("1.2")
script_author("RP Assistant")

require "lib.moonloader"
local ffi = require "ffi"

local imgui_ok, imgui = pcall(require, "mimgui")
local is_mimgui = true
if not imgui_ok or not imgui then
  imgui_ok, imgui = pcall(require, "imgui")
  is_mimgui = false
end

local encoding = require "encoding"
encoding.default = "CP1251"
local e = encoding.UTF8

local config_path = getWorkingDirectory() .. "\\rp_assistant_config.json"
local profile = {name="Игрок", org="УГИБДД", rank="Сотрудник", server="Red", dept="", callsign=""}
local binds   = {}
local hints   = {}

local function load_config()
  local f = io.open(config_path, "r")
  if not f then return end
  local raw = f:read("*all"); f:close()
  if not raw or #raw == 0 then return end
  local ok, data = pcall(decodeJson, raw)
  if ok and data then
    if data.profile then profile = data.profile end
    if data.binds then binds = data.binds end
    if data.hints then hints = data.hints end
  end
end

load_config()

local show_window = imgui_ok and (is_mimgui and imgui.new.bool(false) or imgui.ImBool(false))
local bind_filter = imgui_ok and (is_mimgui and imgui.new.char[128]() or imgui.ImBuffer(128))
local hint_search = imgui_ok and (is_mimgui and imgui.new.char[128]() or imgui.ImBuffer(128))

local function toggle_menu()
  if not show_window then return end
  if is_mimgui then
    show_window[0] = not show_window[0]
  else
    show_window.v = not show_window.v
  end
  load_config()
end

if imgui_ok and is_mimgui then
  imgui.OnInitialize(function()
    imgui.GetIO().IniFilename = nil
  end)

  imgui.OnFrame(
    function() return show_window[0] end,
    function(player)
      imgui.SetNextWindowSize(imgui.ImVec2(520, 600), imgui.Cond.FirstUseEver)
      imgui.SetNextWindowPos(imgui.ImVec2(40, 40), imgui.Cond.FirstUseEver)

      local flags = imgui.WindowFlags.NoCollapse
      if imgui.Begin(e("🎮 RP Assistant — ") .. e(profile.name or "Игрок"), show_window, flags) then
        imgui.TextColored(imgui.ImVec4(0, 0.75, 1, 1),
          e(profile.org or "") .. " | " .. e(profile.rank or "") .. " | " .. e("Сервер: ") .. e(profile.server or ""))
        imgui.Separator()

        if imgui.BeginTabBar("main_tabs") then
          -- TAB 1: Биндер
          if imgui.BeginTabItem(e("⌨ Биндер")) then
            imgui.Text(e("Быстрые команды персонажа:"))
            imgui.InputText(e("Поиск##bind"), bind_filter, 128)
            imgui.Separator()
            local filter = ffi.string(bind_filter):lower()
            for _, b in ipairs(binds) do
              local title = b.title or "Без названия"
              if filter == "" or title:lower():find(filter, 1, true) then
                if imgui.Button(e(title) .. "##b" .. tostring(b.id or 0), imgui.ImVec2(480, 0)) then
                  lua_thread.create(function()
                    if b.lines then
                      for _, line in ipairs(b.lines) do
                        local txt = line.text or ""
                        txt = txt:gsub("{name}", profile.name or "")
                                 :gsub("{rank}", profile.rank or "")
                                 :gsub("{dept}", profile.dept or "")
                                 :gsub("{server}", profile.server or "")
                        if txt ~= "" then
                          sampSendChat(e(txt))
                        end
                        local delay = tonumber(line.delay) or 1000
                        wait(delay)
                      end
                    end
                  end)
                end
              end
            end
            if #binds == 0 then
              imgui.TextColored(imgui.ImVec4(1, 0.5, 0, 1), e("Нет биндов. Добавьте в приложении RP Assistant."))
            end
            imgui.EndTabItem()
          end

          -- TAB 2: Законы
          if imgui.BeginTabItem(e("📖 Законы")) then
            imgui.Text(e("Уголовный и Административный кодексы:"))
            imgui.Separator()
            local laws = {
              {"УК 1.1", e("Умышленное причинение тяжкого вреда здоровью — 3-5 лет")},
              {"УК 1.2", e("Убийство — 5-6 лет лишения свободы")},
              {"УК 2.1", e("Террористический акт — 6 лет лишения свободы")},
              {"УК 3.1", e("Хулиганство — 1-2 года или штраф")},
              {"УК 4.1", e("Неподчинение законному требованию — 2 года")},
              {"УК 5.1", e("Взятка должностному лицу — 3-5 лет")},
              {"УК 6.1", e("Хранение / сбыт наркотических веществ — 3-5 лет")},
              {"КоАП 1.1", e("Превышение скорости — штраф 10.000 руб.")},
              {"КоАП 2.1", e("Езда по встречной полосе — штраф 15.000 руб. / лишение")},
              {"КоАП 3.1", e("Парковка в неположенном месте — штраф 5.000 руб.")},
            }
            imgui.BeginChild("laws_scroll", imgui.ImVec2(0, 440), true)
            for _, l in ipairs(laws) do
              imgui.TextColored(imgui.ImVec4(1, 0.3, 0.3, 1), l[1])
              imgui.SameLine()
              imgui.TextWrapped(" — " .. l[2])
            end
            imgui.EndChild()
            imgui.EndTabItem()
          end

          -- TAB 3: Термины
          if imgui.BeginTabItem(e("📚 Термины")) then
            local terms = {
              {"DM",   e("DeathMatch — убийство без RP причины")},
              {"DB",   e("DriveBy — убийство автомобилем")},
              {"MG",   e("MetaGaming — смешивание IC и OOC информации")},
              {"SK",   e("SpawnKill — убийство на месте появления")},
              {"TK",   e("TeamKill — убийство союзника")},
              {"PG",   e("PowerGaming — воображение из себя супергероя")},
              {"РП",  e("RolePlay — игра по ролям")},
              {"ООС", e("Out Of Character — внеигровая информация")},
            }
            imgui.BeginChild("terms_scroll", imgui.ImVec2(0, 440), true)
            for _, t in ipairs(terms) do
              imgui.TextColored(imgui.ImVec4(1, 0.8, 0, 1), t[1])
              imgui.SameLine()
              imgui.TextWrapped(" — " .. t[2])
            end
            imgui.EndChild()
            imgui.EndTabItem()
          end

          -- TAB 4: Шпаргалки
          if imgui.BeginTabItem(e("📌 Шпаргалки")) then
            imgui.InputText(e("Поиск##hint"), hint_search, 128)
            imgui.Separator()
            local hf = ffi.string(hint_search):lower()
            imgui.BeginChild("hints_scroll", imgui.ImVec2(0, 440), true)
            for _, h in ipairs(hints) do
              local htitle = h.title or ""
              if hf == "" or htitle:lower():find(hf, 1, true) then
                imgui.TextColored(imgui.ImVec4(0.3, 0.8, 1, 1), e(htitle))
                imgui.TextWrapped(e(h.content or h.text or ""))
                imgui.Separator()
              end
            end
            if #hints == 0 then
              imgui.TextColored(imgui.ImVec4(1, 0.5, 0, 1), e("Шпаргалок нет. Добавьте в приложении RP Assistant."))
            end
            imgui.EndChild()
            imgui.EndTabItem()
          end

          -- TAB 5: Миранда
          if imgui.BeginTabItem(e("⚖ Миранда")) then
            imgui.TextWrapped(e(
              "«Вы имеете право хранить молчание.\n" ..
              "Всё, что вы скажете, может быть использовано против вас.\n" ..
              "Вы имеете право на адвоката и один телефонный звонок.\n" ..
              "Вам ясны ваши права?»"
            ))
            imgui.Separator()
            if imgui.Button(e("📢 Зачитать задержанному (чат)"), imgui.ImVec2(480, 0)) then
              lua_thread.create(function()
                sampSendChat(e("/me зачитывает задержанному его права."))
                wait(600)
                sampSendChat(e("Вы имеете право хранить молчание. Всё сказанное может быть использовано против вас."))
                wait(600)
                sampSendChat(e("Вы имеете право на адвоката и один телефонный звонок. Права ясны?"))
              end)
            end
            imgui.EndTabItem()
          end

          imgui.EndTabBar()
        end

        imgui.Separator()
        imgui.TextColored(imgui.ImVec4(0.5, 0.5, 0.5, 1),
          e("Клавиши: INSERT / F2 / Alt+M / F10 | Команда: /rp | RP Assistant v1.2"))
      end
      imgui.End()
    end
  )
end

function main()
  while not isSampAvailable() do wait(100) end

  sampRegisterChatCommand("rp", toggle_menu)
  sampRegisterChatCommand("menu", toggle_menu)
  sampRegisterChatCommand("assistant", toggle_menu)

  wait(2000)
  sampAddChatMessage("{00BFFF}[RP Assistant] {FFFFFF}Бот-помощник загружен! Меню: {00FF00}INSERT{FFFFFF} / {00FF00}F2{FFFFFF} / {00FF00}Alt+M{FFFFFF} или {00FF00}/rp{FFFFFF} в чат.", -1)

  while true do
    wait(0)

    local isAltM = isKeyDown(0x12) and wasKeyPressed(0x4D)
    local isInsert = wasKeyPressed(0x2D)
    local isF2 = wasKeyPressed(0x71)
    local isF10 = wasKeyPressed(0x79)

    if isInsert or isF2 or isAltM or isF10 then
      toggle_menu()
    end
  end
end
''';
}

class InjectionResult {
  final bool success;
  final String message;
  final String? path;

  const InjectionResult({
    required this.success,
    required this.message,
    this.path,
  });
}
