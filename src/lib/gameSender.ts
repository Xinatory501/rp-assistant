/**
 * Helper to auto-send lines directly into Amazing Online in-game chat
 */
export async function sendToGameChat(text: string): Promise<boolean> {
  const api = (window as any).electronAPI;

  // Always copy to clipboard for fallback
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {}

  if (api && api.sendGameChat) {
    try {
      await api.sendGameChat(text);
      return true;
    } catch (err) {
      console.warn("Failed to send via Electron game chat API:", err);
    }
  }

  return false;
}

export async function sendLinesToGameChat(lines: Array<{ text: string; delay?: number }>): Promise<boolean> {
  const api = (window as any).electronAPI;

  const validLines = lines.filter(l => l.text.trim());
  if (validLines.length === 0) return false;

  // Copy full block to clipboard
  try {
    const fullBlock = validLines.map(l => l.text).join("\n");
    await navigator.clipboard.writeText(fullBlock);
  } catch (e) {}

  if (api && api.sendGameLines) {
    try {
      await api.sendGameLines(validLines);
      return true;
    } catch (err) {
      console.warn("Failed to send multiple lines via Electron:", err);
    }
  } else if (api && api.sendGameChat) {
    // Fallback: send sequentially
    for (const item of validLines) {
      await api.sendGameChat(item.text);
      const delay = Math.max(item.delay || 1000, 300);
      await new Promise(r => setTimeout(r, delay));
    }
    return true;
  }

  return false;
}
