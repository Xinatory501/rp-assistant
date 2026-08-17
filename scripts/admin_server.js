const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const KEYS_FILE = path.join(__dirname, '..', 'generated_keys.txt');

function generateKey(prefix = 'AMAZING-PRO', duration = 'lifetime') {
  const s1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const s2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const s3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const durTag = duration === 'lifetime' ? 'LIFE' : duration.toUpperCase();
  return `${prefix}-${durTag}-${s1}-${s2}-${s3}`;
}

function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) return [];
  return fs.readFileSync(KEYS_FILE, 'utf8')
    .split('\n')
    .map(k => k.trim())
    .filter(Boolean);
}

function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, keys.join('\n') + '\n', 'utf8');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/keys' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ keys: loadKeys() }));
  }

  if (url.pathname === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const count = Math.min(Math.max(parseInt(data.count || '1', 10), 1), 100);
        const prefix = (data.prefix || 'AMAZING-PRO').trim();

        const duration = data.duration || 'lifetime';
        const current = loadKeys();
        const newKeys = [];
        for (let i = 0; i < count; i++) {
          newKeys.push(generateKey(prefix, duration));
        }

        const all = [...newKeys, ...current];
        saveKeys(all);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, created: newKeys, total: all.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === '/api/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const current = loadKeys();
        const updated = current.filter(k => k !== data.key);
        saveKeys(updated);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, total: updated.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Web Admin HTML
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Панель управления лицензиями • AmazingRP</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0c10; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
  </style>
</head>
<body class="min-h-screen p-4 sm:p-8 flex flex-col items-center justify-start">
  <div class="w-full max-w-4xl space-y-6">
    <!-- Header -->
    <div class="glass rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-purple-500/20 shadow-2xl">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
          🔑
        </div>
        <div>
          <h1 class="text-xl font-bold text-white flex items-center gap-2">
            AmazingRP • Веб-Панель Лицензий
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin Pro</span>
          </h1>
          <p class="text-xs text-zinc-400">Генерация, учет и выдача ключей активации Premium покупателям</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a href="https://keyauth.win/app/" target="_blank" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 transition-all flex items-center gap-1.5">
          🌐 Облачный KeyAuth.win
        </a>
      </div>
    </div>

    <!-- Generator Controls -->
    <div class="glass rounded-3xl p-6 space-y-4 border-purple-500/30 shadow-xl">
      <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span>⚡ Быстрая генерация ключей</span>
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label class="block text-[11px] text-zinc-400 mb-1">Тариф (Срок)</label>
          <select id="durationSelect" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-purple-300 font-semibold outline-none focus:border-purple-500">
            <option value="1d">1 день — 49 ₽</option>
            <option value="7d">1 неделя — 199 ₽</option>
            <option value="30d">1 месяц — 490 ₽</option>
            <option value="365d">1 год — 1 490 ₽</option>
            <option value="lifetime" selected>Навсегда (VIP) — 1 999 ₽</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] text-zinc-400 mb-1">Количество ключей</label>
          <select id="countSelect" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500">
            <option value="1">1 ключ</option>
            <option value="5" selected>5 ключей</option>
            <option value="10">10 ключей</option>
            <option value="25">25 ключей</option>
            <option value="50">50 ключей</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] text-zinc-400 mb-1">Префикс</label>
          <input id="prefixInput" value="AMAZING" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500 font-mono" />
        </div>

        <div class="flex items-end">
          <button id="genBtn" onclick="generate()" class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2">
            <span>✨ Создать ключи</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Keys List -->
    <div class="glass rounded-3xl p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>📋 База активных ключей</span>
          <span id="totalBadge" class="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">0</span>
        </h2>

        <div id="toast" class="hidden text-xs text-emerald-400 font-medium px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          Скопировано в буфер обмена!
        </div>
      </div>

      <div id="keysContainer" class="space-y-2 max-h-[450px] overflow-y-auto pr-1">
        <div class="text-center py-8 text-zinc-500 text-sm">Загрузка ключей...</div>
      </div>
    </div>
  </div>

  <script>
    async function loadKeys() {
      const res = await fetch('/api/keys');
      const data = await res.json();
      renderKeys(data.keys || []);
    }

    function renderKeys(keys) {
      document.getElementById('totalBadge').innerText = keys.length;
      const container = document.getElementById('keysContainer');
      if (keys.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-zinc-500 text-sm">Нет сгенерированных ключей. Нажмите «Сгенерировать».</div>';
        return;
      }

      container.innerHTML = keys.map((k, i) => \`
        <div class="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all">
          <div class="flex items-center gap-3">
            <span class="text-xs text-zinc-500 font-mono w-6">\${i + 1}.</span>
            <span class="font-mono text-sm text-purple-300 font-bold tracking-wide select-all">\${k}</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="copyKey('\${k}')" class="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all">
              📋 Копировать
            </button>
            <button onclick="deleteKey('\${k}')" class="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition-all" title="Удалить ключ">
              ✕
            </button>
          </div>
        </div>
      \`).join('');
    }

    async function generate() {
      const btn = document.getElementById('genBtn');
      btn.disabled = true;
      btn.innerText = 'Создание...';

      const count = document.getElementById('countSelect').value;
      const prefix = document.getElementById('prefixInput').value;
      const duration = document.getElementById('durationSelect').value;

      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, prefix, duration })
      });

      await loadKeys();
      btn.disabled = false;
      btn.innerText = '✨ Создать ключи';
      showToast('Ключи успешно созданы!');
    }

    async function deleteKey(key) {
      if (!confirm('Удалить ключ ' + key + '?')) return;
      await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      await loadKeys();
    }

    function copyKey(key) {
      navigator.clipboard.writeText(key);
      showToast('Ключ ' + key + ' скопирован!');
    }

    function showToast(text) {
      const t = document.getElementById('toast');
      t.innerText = text;
      t.classList.remove('hidden');
      setTimeout(() => t.classList.add('hidden'), 2500);
    }

    loadKeys();
  </script>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌐 Веб-панель генерации ключей запущена: http://localhost:${PORT}\n`);
});
