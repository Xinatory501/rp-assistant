/**
 * Intelligent ChatLog and Target Parser for Amazing Online
 * Accurately distinguishes between standard Player ID (0-999) and Mask Number (Неизвестный [XXXX])
 * regardless of the number of digits!
 */

export interface DetectedTarget {
  id: string;
  type: 'id' | 'mask';
  name?: string;
  action?: string;
  rawLine: string;
}

export function parseChatlogLine(line: string): DetectedTarget | null {
  const clean = line.trim();
  if (!clean) return null;

  // 1. Mask detection: "Неизвестный [12345]" or "Неизвестный (123)" or "Игрок в маске [421]"
  const maskMatch = clean.match(/(?:Неизвестный|в маске|Mask|Незнакомец)\s*[\[(](\d+)[\])]/i);
  if (maskMatch && maskMatch[1]) {
    return {
      id: maskMatch[1],
      type: 'mask',
      name: `Неизвестный [${maskMatch[1]}]`,
      action: 'Маска нарушителя',
      rawLine: clean,
    };
  }

  // 2. Player with Nickname and ID: "Ivan_Ivanov [42]" or "Alexander_Smirnov (15)"
  const playerMatch = clean.match(/([A-Za-z0-9_]+)\s*[\[(](\d{1,4})[\])]/);
  if (playerMatch && playerMatch[1] && playerMatch[2]) {
    const nick = playerMatch[1];
    const pid = playerMatch[2];
    if (nick.toLowerCase() !== 'неизвестный' && nick.toLowerCase() !== 'server' && nick.toLowerCase() !== 'amazing') {
      return {
        id: pid,
        type: 'id',
        name: nick,
        action: 'Игрок',
        rawLine: clean,
      };
    }
  }

  // 3. /id lookup response: "ID: 42 | Nick_Name" or "Игрок Nick_Name [42] в сети"
  const idSearchMatch = clean.match(/(?:ID:\s*(\d+).*?([A-Za-z0-9_]+))|(?:([A-Za-z0-9_]+)\s*\[(\d+)\])/i);
  if (idSearchMatch) {
    const pid = idSearchMatch[1] || idSearchMatch[4];
    const pnick = idSearchMatch[2] || idSearchMatch[3];
    if (pid) {
      return {
        id: pid,
        type: 'id',
        name: pnick,
        action: 'Поиск /id',
        rawLine: clean,
      };
    }
  }

  return null;
}
