import React, { useState, useEffect } from 'react';
import { Key, Shield, Clock, Copy, Check, Download, Trash2, LogOut, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

const SECRET_SALT = 'AMAZING_RP_2026_SECURE_HMAC_SALT_KEYAUTH_XINATORY_9921';

// Client-side SHA-256 HMAC for instant key generation
async function generateClientKey(prefix: string, days: number): Promise<string> {
  const durTag = days === -1 ? 'LIFE' : `${days}D`;
  const rand = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
  const base = `${prefix}-${durTag}-${rand}`;
  
  // Calculate signature using Web Crypto API
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_SALT),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(base));
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const sig = hex.substring(0, 4);
  return `${base}-${sig}`;
}

interface GeneratedKeyItem {
  key: string;
  days: number;
  prefix: string;
  createdAt: string;
  note: string;
}

export default function AdminPanel({ onBackToSite }: { onBackToSite: () => void }) {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Generator State
  const [prefix, setPrefix] = useState('AMAZING-PRO');
  const [days, setDays] = useState(-1); // -1 = Lifetime
  const [customDays, setCustomDays] = useState('30');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Key History
  const [keysList, setKeysList] = useState<GeneratedKeyItem[]>(() => {
    try {
      const saved = localStorage.getItem('__amazing_admin_keys_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('__amazing_admin_keys_history', JSON.stringify(keysList));
  }, [keysList]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'xinatory' && password === '111qqq111') {
      setIsAuth(true);
      setLoginError('');
      showToast('✓ Добро пожаловать, Главный Администратор!');
    } else {
      setLoginError('Неверный логин или пароль администратора');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const targetDays = days === 9999 ? parseInt(customDays || '30', 10) : days;
      const newItems: GeneratedKeyItem[] = [];

      for (let i = 0; i < count; i++) {
        const k = await generateClientKey(prefix, targetDays);
        newItems.push({
          key: k,
          days: targetDays,
          prefix: prefix,
          createdAt: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          note: note.trim(),
        });
      }

      setKeysList(prev => [...newItems, ...prev]);
      setNote('');
      showToast(`✓ Сгенерировано ${count} лицензионных ключей!`);
    } catch (e) {
      showToast('Ошибка генерации: ' + e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast('✓ Ключ скопирован в буфер обмена');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const all = keysList.map(k => k.key).join('\n');
    navigator.clipboard.writeText(all);
    showToast(`✓ Скопировано ${keysList.length} ключей!`);
  };

  const handleDownload = () => {
    const content = keysList.map(k => `${k.key} | ${k.days === -1 ? 'Бессрочно (Lifetime)' : `${k.days} дней`} | ${k.createdAt} | ${k.note}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AmazingRP_Keys_${Date.now()}.txt`;
    a.click();
    showToast('✓ Файл со всеми ключами скачан!');
  };

  const handleDelete = (keyStr: string) => {
    setKeysList(prev => prev.filter(k => k.key !== keyStr));
    showToast('Ключ удален из списка');
  };

  const handleClearAll = () => {
    if (confirm('Вы уверены, что хотите очистить весь список сгенерированных ключей?')) {
      setKeysList([]);
      showToast('Список очищен');
    }
  };

  // 1. Login Screen
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-md bg-[#121216] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Панель Управления</h1>
              <p className="text-xs text-zinc-400">Генератор лицензионных ключей AmazingRP</p>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Логин Администратора</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="xinatory"
                className="w-full bg-[#18181e] border border-zinc-700/80 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#18181e] border border-zinc-700/80 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
            >
              Войти в Панель
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
            <button
              onClick={onBackToSite}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Вернуться на главную страницу сайта
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Admin Dashboard
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-8 flex flex-col items-center">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-zinc-900 border border-purple-500/40 text-purple-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="w-full max-w-5xl space-y-6">
        {/* Top Header */}
        <div className="bg-[#121216] border border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">AmazingRP • Генератор Лицензий</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Admin: xinatory
                </span>
              </div>
              <p className="text-xs text-zinc-400">Создание невзламываемых криптографических ключей на любое время</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToSite}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all"
            >
              На сайт
            </button>
            <button
              onClick={() => setIsAuth(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Выйти
            </button>
          </div>
        </div>

        {/* Generator Controls Card */}
        <div className="bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Настройки генерации ключей
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type / Prefix */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Тип тарифа</label>
              <select
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                className="w-full bg-[#18181e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="AMAZING-PRO">PRO Тариф (AMAZING-PRO)</option>
                <option value="AMAZING-VIP">VIP Тариф (AMAZING-VIP)</option>
                <option value="AMAZING-PLUS">PLUS Тариф (AMAZING-PLUS)</option>
              </select>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Срок действия</label>
              <select
                value={days}
                onChange={e => setDays(parseInt(e.target.value, 10))}
                className="w-full bg-[#18181e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="-1">🔥 Навсегда (Lifetime)</option>
                <option value="7">7 дней (1 неделя)</option>
                <option value="14">14 дней (2 недели)</option>
                <option value="30">30 дней (1 месяц)</option>
                <option value="90">90 дней (3 месяца)</option>
                <option value="180">180 дней (полгода)</option>
                <option value="365">365 дней (1 год)</option>
                <option value="9999">Свое количество дней...</option>
              </select>
            </div>

            {/* Custom Days Input (if selected) */}
            {days === 9999 ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Кол-во дней</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                  placeholder="30"
                  className="w-full bg-[#18181e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Количество ключей</label>
                <select
                  value={count}
                  onChange={e => setCount(parseInt(e.target.value, 10))}
                  className="w-full bg-[#18181e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="1">1 ключ</option>
                  <option value="3">3 ключа</option>
                  <option value="5">5 ключей</option>
                  <option value="10">10 ключей</option>
                  <option value="25">25 ключей</option>
                  <option value="50">50 ключей</option>
                </select>
              </div>
            )}

            {/* Buyer Note */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Примечание / Покупатель</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="@telegram / никнейм"
                className="w-full bg-[#18181e] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>
                Будет создан ключ: <strong className="text-white">{prefix}</strong> на{' '}
                <strong className="text-purple-400">{days === -1 ? 'Бессрочно' : `${days === 9999 ? customDays : days} дн.`}</strong>
              </span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center gap-2"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Сгенерировать {count > 1 ? `(${count} шт.)` : 'ключ'}
            </button>
          </div>
        </div>

        {/* Generated Keys List */}
        <div className="bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                База сгенерированных ключей
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-purple-400 font-mono">
                  Всего: {keysList.length}
                </span>
              </h2>
            </div>

            {keysList.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Скопировать все
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Скачать .txt
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                  title="Очистить список"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {keysList.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Нет сгенерированных ключей. Выберите параметры выше и нажмите «Сгенерировать».
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {keysList.map((item, idx) => {
                const isCopied = copiedKey === item.key;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#18181e] border border-zinc-800/80 hover:border-purple-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-bold text-purple-300 tracking-wider">
                            {item.key}
                          </code>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.days === -1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                            {item.days === -1 ? '🔥 Lifetime' : `⏳ ${item.days} дней`}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-3">
                          <span>Создан: {item.createdAt}</span>
                          {item.note && <span className="text-zinc-300">Примечание: «{item.note}»</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCopy(item.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isCopied ? 'bg-emerald-600 text-white' : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30'}`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Скопировано' : 'Копировать'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.key)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
