/**
 * Intelligent AutoHotkey (.ahk) Script Parser for Amazing Online
 * Extracts Binds, Hotkeys, Sleep delays, and Profile Metadata from any AHK script.
 */

import { Bind, Profile, SavedConfig } from '../store';

export interface ParsedAhkResult {
  profileName: string;
  org: string;
  rank: string;
  dept: string;
  server: string;
  binds: Bind[];
  title: string;
}

export function parseAhkScript(ahkContent: string, fileName = 'script.ahk'): ParsedAhkResult {
  const lines = ahkContent.split(/\r?\n/);
  
  let profileName = 'Auto_Player';
  let org = 'УГИБДД';
  let rank = 'Лейтенант';
  let dept = 'ОБ ДПС';
  let server = 'Red';

  // 1. Scan for profile variables
  for (const line of lines) {
    const nickMatch = line.match(/(?:CRMP_USER_NICKNAME|Nick|Name|PlayerName)\s*[:=]+\s*["']?([A-Za-z0-9_]+)["']?/i);
    if (nickMatch && nickMatch[1]) {
      profileName = nickMatch[1];
    }

    const orgMatch = line.match(/(?:TegText|Fraction|Org|Frak)\s*[:=]+\s*["']?([^"'\r\n]+)["']?/i);
    if (orgMatch && orgMatch[1]) {
      const found = orgMatch[1].trim();
      if (found.includes('ДПС') || found.includes('ГИБДД')) org = 'УГИБДД';
      else if (found.includes('МВД') || found.includes('УМВД') || found.includes('ППС')) org = 'УМВД';
      else if (found.includes('ФСБ')) org = 'УФСБ';
      else if (found.includes('ВЧ') || found.includes('Арми')) org = 'ВЧ (Воинская часть №20115)';
      else if (found.includes('ФСИН')) org = 'УФСИН';
      else if (found.includes('ЕСС') || found.includes('МЧС') || found.includes('Больниц')) org = 'ЕСС';
      else if (found.includes('Прав') || found.includes('ПР')) org = 'Правительство (ПР)';
    }

    const zvanMatch = line.match(/(?:Zvan|Rank|Zvanie)\s*[:=]+\s*["']?([^"'\r\n]+)["']?/i);
    if (zvanMatch && zvanMatch[1]) {
      rank = zvanMatch[1].trim();
    }
  }

  // 2. Parse Hotkeys and Action Blocks
  const binds: Bind[] = [];
  let currentKey: string | null = null;
  let currentTitle: string = '';
  let currentLines: Array<{ text: string; delay: number }> = [];

  const flushCurrentBind = () => {
    if (currentKey && currentLines.length > 0) {
      // Clean up key format (e.g. Numpad1 -> Num 1, !1 -> Alt+1, ^1 -> Ctrl+1)
      let formattedKey = currentKey;
      if (/^Numpad(\d)$/i.test(formattedKey)) {
        formattedKey = `Num ${formattedKey.replace(/Numpad/i, '')}`;
      } else if (formattedKey.startsWith('!')) {
        formattedKey = `Alt+${formattedKey.slice(1)}`;
      } else if (formattedKey.startsWith('^')) {
        formattedKey = `Ctrl+${formattedKey.slice(1)}`;
      } else if (formattedKey.startsWith('+')) {
        formattedKey = `Shift+${formattedKey.slice(1)}`;
      }

      binds.push({
        id: 'bind-ahk-' + Math.random().toString(36).slice(2, 9),
        title: currentTitle || `Бинд ${formattedKey}`,
        key: formattedKey,
        lines: [...currentLines],
      });
    }
    currentKey = null;
    currentTitle = '';
    currentLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith(';')) continue;

    // Detect hotkey header (e.g. Numpad1::, !1::, F2::, LAlt & r::)
    const hotkeyMatch = raw.match(/^([~#!^+&<>\w\s]+)::(.*)$/i);
    if (hotkeyMatch) {
      flushCurrentBind();
      currentKey = hotkeyMatch[1].trim();
      currentTitle = `Отыгровка ${currentKey}`;

      // If one-liner hotkey
      const rest = hotkeyMatch[2].trim();
      if (rest) {
        const text = extractText(rest);
        if (text) currentLines.push({ text, delay: 0 });
      }
      continue;
    }

    // End of block
    if (raw.toLowerCase() === 'return' || raw.toLowerCase() === 'exit') {
      flushCurrentBind();
      continue;
    }

    // Inside block: parse send / sleep
    if (currentKey) {
      const sleepMatch = raw.match(/^Sleep,?\s*(\d+)/i);
      if (sleepMatch && currentLines.length > 0) {
        currentLines[currentLines.length - 1].delay = parseInt(sleepMatch[1]);
        continue;
      }

      const text = extractText(raw);
      if (text) {
        currentLines.push({ text, delay: 0 });
      }
    }
  }

  flushCurrentBind();

  // If no hotkeys were explicitly defined, parse standalone SendChat lines
  if (binds.length === 0) {
    const fallbackLines: Array<{ text: string; delay: number }> = [];
    lines.forEach(l => {
      const t = extractText(l);
      if (t) fallbackLines.push({ text: t, delay: 1000 });
    });
    if (fallbackLines.length > 0) {
      binds.push({
        id: 'bind-ahk-1',
        title: fileName.replace(/\.ahk$/i, ''),
        key: 'Num 1',
        lines: fallbackLines,
      });
    }
  }

  return {
    profileName,
    org,
    rank,
    dept,
    server,
    binds,
    title: fileName.replace(/\.ahk$/i, ''),
  };
}

function extractText(line: string): string | null {
  const sendChat = line.match(/sendChat\s*\(\s*["']?([^"')]+)["']?\s*\)/i);
  if (sendChat && sendChat[1]) {
    return cleanVariables(sendChat[1].trim());
  }

  const sendInput = line.match(/^Send(?:Input|Play)?,?\s*["']?(.+?)["']?$/i);
  if (sendInput && sendInput[1]) {
    const cleaned = sendInput[1].replace(/\{[A-Za-z0-9]+\}/g, '').trim();
    if (cleaned.length > 1) {
      return cleanVariables(cleaned);
    }
  }

  return null;
}

function cleanVariables(text: string): string {
  return text
    .replace(/%CRMP_USER_NICKNAME%/gi, '{name}')
    .replace(/%Fam%/gi, '{name}')
    .replace(/%Zvan%/gi, '{rank}')
    .replace(/%TegText%/gi, '{org}')
    .replace(/%playerID%/gi, '{id}')
    .replace(/%playerMask%/gi, '{id}')
    .replace(/"\s*\.\s*playerID\s*\.\s*"/gi, '{id}')
    .replace(/"\s*\.\s*TegText\s*\.\s*"/gi, '{org}');
}
