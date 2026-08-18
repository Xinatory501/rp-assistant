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
  // ─── Candidate MoonLoader paths ───────────────────────────────────────────
  static const List<String> _moonloaderPaths = [
    r'C:\Amazing Games\Amazing Online\moonloader',
    r'C:\Amazing Games\moonloader',
    r'C:\Games\Amazing Games\moonloader',
    r'C:\Games\Amazing Online\moonloader',
    r'C:\Amazing Online\moonloader',
    r'D:\Amazing Games\Amazing Online\moonloader',
    r'D:\Amazing Games\moonloader',
    r'D:\Games\Amazing Games\moonloader',
    r'D:\Games\Amazing Online\moonloader',
    r'D:\Amazing Online\moonloader',
    r'E:\Amazing Games\Amazing Online\moonloader',
    r'E:\Amazing Games\moonloader',
    r'E:\Games\Amazing Games\moonloader',
    r'E:\Games\Amazing Online\moonloader',
    r'E:\Amazing Online\moonloader',
    r'C:\Program Files (x86)\Amazing Games\moonloader',
    r'C:\Program Files\Amazing Games\moonloader',
    r'C:\GTA San Andreas\moonloader',
    r'D:\GTA San Andreas\moonloader',
    r'C:\Games\GTA San Andreas\moonloader',
    r'D:\Games\GTA San Andreas\moonloader',
  ];

  static const List<String> _gtaRootPaths = [
    r'C:\Amazing Games\Amazing Online',
    r'C:\Amazing Games',
    r'C:\Games\Amazing Games',
    r'C:\Games\Amazing Online',
    r'C:\Amazing Online',
    r'D:\Amazing Games\Amazing Online',
    r'D:\Amazing Games',
    r'D:\Games\Amazing Games',
    r'D:\Games\Amazing Online',
    r'D:\Amazing Online',
    r'E:\Amazing Games\Amazing Online',
    r'E:\Amazing Games',
    r'E:\Games\Amazing Games',
    r'E:\Games\Amazing Online',
    r'E:\Amazing Online',
    r'C:\Program Files (x86)\Amazing Games',
    r'C:\Program Files\Amazing Games',
    r'C:\GTA San Andreas',
    r'D:\GTA San Andreas',
    r'C:\Games\GTA San Andreas',
    r'D:\Games\GTA San Andreas',
  ];

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

    // 2. Check candidate moonloader directories
    for (final p in _moonloaderPaths) {
      final d = Directory(p);
      if (await d.exists()) return p;
    }

    // 3. Check candidate game root directories and create moonloader inside
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
      return InjectionResult(
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

  // ─── Lua script (MoonLoader + ImGui) ───────────────────────────────────
  static const String _luaScript = r'''
-- RP Assistant — MoonLoader in-game overlay
-- Injected by RP Assistant Flutter app
-- Требует: MoonLoader + imgui

script_name("RP Assistant")
script_description("Помощник RP игрока для Amazing Online")
script_version("1.2")
script_author("RP Assistant")

require "lib.moonloader"
require "lib.sampfuncs"
local imgui = require "imgui"
local json  = require "moonloader"
local encoding = require "encoding"
encoding.default = "CP1251"
local e = encoding.UTF8

-- ─── Загрузка конфига ───────────────────────────────────────────────────
local config_path = getWorkingDirectory() .. "\\rp_assistant_config.json"
local profile = {name="Игрок", org="УГИБДД", rank="Сотрудник", server="Red", dept="", callsign=""}
local binds   = {}
local hints   = {}

local function load_config()
  local f = io.open(config_path, "r")
  if not f then return end
  local raw = f:read("*all"); f:close()
  local ok, data = pcall(decodeJson, raw)
  if not ok or not data then return end
  if data.profile then
    profile = data.profile
  end
  if data.binds then
    binds = data.binds
  end
  if data.hints then
    hints = data.hints
  end
end

load_config()

-- ─── UI State ───────────────────────────────────────────────────────────
local show_window    = imgui.ImBool(false)
local active_tab     = 1
local bind_filter    = imgui.ImBuffer(128)
local hint_search    = imgui.ImBuffer(128)

-- ─── Переключение меню ───────────────────────────────────────────────────
local function toggle_menu()
  show_window.v = not show_window.v
  if show_window.v then
    load_config()
  end
end

-- ─── Hotkeys: INSERT / F2 / Alt+M / F10 / Команды в чат ──────────────────
function main()
  while not isSampAvailable() do wait(100) end

  -- Регистрация команд в игровой чат
  sampRegisterChatCommand("rp", toggle_menu)
  sampRegisterChatCommand("menu", toggle_menu)
  sampRegisterChatCommand("assistant", toggle_menu)

  -- Стартовое уведомление в чат игры
  wait(2000)
  sampAddChatMessage("{00BFFF}[RP Assistant] {FFFFFF}Бот-помощник загружен! Меню: {00FF00}INSERT{FFFFFF} / {00FF00}F2{FFFFFF} / {00FF00}Alt+M{FFFFFF} или {00FF00}/rp{FFFFFF} в чат.", -1)

  while true do
    wait(0)

    -- 1. Клавиша INSERT (VK_INSERT = 0x2D)
    -- 2. Клавиша F2 (VK_F2 = 0x71)
    -- 3. Комбинация Alt + M (0x12 + 0x4D)
    -- 4. Клавиша F10 (VK_F10 = 0x79)
    local isAltM = isKeyDown(0x12) and wasKeyPressed(0x4D)
    local isInsert = wasKeyPressed(0x2D)
    local isF2 = wasKeyPressed(0x71)
    local isF10 = wasKeyPressed(0x79)

    if isInsert or isF2 or isAltM or isF10 then
      toggle_menu()
    end

    imgui.Process = show_window.v
  end
end

-- ─── ImGui rendering ─────────────────────────────────────────────────────
function imgui.OnDrawFrame()
  if not show_window.v then return end

  imgui.SetNextWindowSize(imgui.ImVec2(500, 600), imgui.Cond.FirstUseEver)
  imgui.SetNextWindowPos(imgui.ImVec2(30, 30), imgui.Cond.FirstUseEver)

  local flags = imgui.WindowFlags.NoCollapse
  if imgui.Begin(e("🎮 RP Assistant — ") .. e(profile.name or "Игрок"), show_window, flags) then

    -- Header: profile info
    imgui.TextColored(imgui.ImVec4(0, 0.75, 1, 1),
      e(profile.org or "") .. " | " .. e(profile.rank or "") .. " | " .. e("Сервер: ") .. e(profile.server or ""))
    imgui.Separator()

    -- Tabs
    if imgui.BeginTabBar("main_tabs") then

      -- ── TAB 1: Биндер ──────────────────────────────────────────────
      if imgui.BeginTabItem(e("⌨ Биндер")) then
        imgui.Text(e("Быстрые команды персонажа:"))
        imgui.InputText(e("Поиск##bind"), bind_filter)
        imgui.Separator()
        local filter = ffi.string(bind_filter.v):lower()
        for _, b in ipairs(binds) do
          local title = b.title or "Без названия"
          if filter == "" or title:lower():find(filter, 1, true) then
            if imgui.Button(e(title) .. "##b" .. tostring(b.id), imgui.ImVec2(460, 0)) then
              -- Send all lines to chat
              for _, line in ipairs(b.lines or {}) do
                local text = line.text or ""
                text = text:gsub("{name}", profile.name or "")
                text = text:gsub("{rank}", profile.rank or "")
                text = text:gsub("{org}", profile.org or "")
                text = text:gsub("{dept}", profile.dept or "")
                text = text:gsub("{callsign}", profile.callsign or "")
                sampSendChat(text)
                if (line.delay or 0) > 0 then
                  wait(line.delay)
                end
              end
            end
          end
        end
        if #binds == 0 then
          imgui.TextColored(imgui.ImVec4(1, 0.5, 0, 1), e("Биндов нет. Создайте их в приложении RP Assistant."))
        end
        imgui.EndTabItem()
      end

      -- ── TAB 2: Статьи УК / КоАП ────────────────────────────────────
      if imgui.BeginTabItem(e("📜 УК / КоАП")) then
        local laws = {
          {e("2.1 УК"),   e("Покушение на гос. сотрудника — 6 лет л/с")},
          {e("2.2 УК"),   e("Вооружённое нападение на гос. сотрудника — 6 лет")},
          {e("3.1 УК"),   e("Неподчинение сотруднику полиции — 3 года л/с")},
          {e("4.1 УК"),   e("Незаконное ношение оружия — 4 года л/с")},
          {e("5.1 УК"),   e("Сбыт/хранение наркотиков — 5 лет л/с")},
          {e("1.1 КоАП"), e("Движение по встречной — штраф 15.000 руб / лишение ВУ")},
          {e("2.1 КоАП"), e("Превышение скорости — штраф 10.000 руб")},
          {e("3.1 КоАП"), e("Оскорбление представителя власти — штраф 20.000 руб")},
        }
        imgui.BeginChild("laws_scroll", imgui.ImVec2(0, 480), true)
        for _, row in ipairs(laws) do
          imgui.TextColored(imgui.ImVec4(0, 1, 0.5, 1), row[1])
          imgui.SameLine()
          imgui.Text(" — " .. row[2])
          -- Click to send to chat
          imgui.SameLine(imgui.GetContentRegionAvail().x - 60)
          if imgui.SmallButton(e("В чат##") .. row[1]) then
            sampSendChat("Статья " .. row[1] .. ": " .. row[2])
          end
        end
        imgui.EndChild()
        imgui.EndTabItem()
      end

      -- ── TAB 3: РП-термины ──────────────────────────────────────────
      if imgui.BeginTabItem(e("📝 Термины")) then
        local terms = {
          {"МГ",  e("MetaGaming — использование реальной информации в IC")},
          {"ДМ",  e("DeathMatch — убийство/урон без IC причины")},
          {"ДБ",  e("DriveBy — урон/убийство с использованием автомобиля")},
          {"СК",  e("SpawnKill — убийство на точке появления")},
          {"ТК",  e("TeamKill — убийство сотрудника своей фракции")},
          {"ПГ",  e("PowerGaming — воображение себя неуязвимым/героем")},
          {"РП",  e("RolePlay — игра в соответствии с выбранной ролью")},
          {"ООС", e("Out Of Character — выход из роли, общение как игрок")},
        }
        imgui.BeginChild("terms_scroll", imgui.ImVec2(0, 480), true)
        for _, t in ipairs(terms) do
          imgui.TextColored(imgui.ImVec4(1, 0.8, 0, 1), t[1])
          imgui.SameLine()
          imgui.TextWrapped(" — " .. t[2])
        end
        imgui.EndChild()
        imgui.EndTabItem()
      end

      -- ── TAB 4: Шпаргалки пользователя ──────────────────────────────
      if imgui.BeginTabItem(e("📌 Шпаргалки")) then
        imgui.InputText(e("Поиск##hint"), hint_search)
        imgui.Separator()
        local hf = ffi.string(hint_search.v):lower()
        imgui.BeginChild("hints_scroll", imgui.ImVec2(0, 460), true)
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

      -- ── TAB 5: Право Миранды ────────────────────────────────────────
      if imgui.BeginTabItem(e("⚖ Миранда")) then
        imgui.TextWrapped(e(
          "«Вы имеете право хранить молчание.\n" ..
          "Всё, что вы скажете, может быть использовано против вас.\n" ..
          "Вы имеете право на адвоката и один телефонный звонок.\n" ..
          "Вам ясны ваши права?»"
        ))
        imgui.Separator()
        if imgui.Button(e("📢 Зачитать задержанному (чат)"), imgui.ImVec2(460, 0)) then
          sampSendChat("/me зачитывает задержанному его права.")
          wait(500)
          sampSendChat("Вы имеете право хранить молчание. Всё сказанное может быть использовано против вас. Вы имеете право на адвоката и один звонок. Права ясны?")
        end
        imgui.EndTabItem()
      end

      imgui.EndTabBar()
    end

    -- Footer
    imgui.Separator()
    imgui.TextColored(imgui.ImVec4(0.5, 0.5, 0.5, 1),
      e("Клавиши: INSERT / F2 / Alt+M / F10 | Команда: /rp | RP Assistant v1.2"))

  end
  imgui.End()
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
