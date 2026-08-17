import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Key, Shield, Users, Download, Copy, Trash2, CheckCircle2,
  RefreshCw, Lock, Unlock, ExternalLink, ArrowLeft, Sparkles,
  Sliders, Plus, FileText, Check, AlertTriangle, Eye, EyeOff,
  Server, DollarSign, Terminal, LogOut, X, Filter, ArrowUpDown,
  Search, Layers, Sparkle, ListFilter
} from 'lucide-react';

interface GeneratedKey {
  id: string;
  key: string;
  duration: string;
  createdAt: string;
  timestamp: number;
  note?: string;
  used?: boolean;
}

// SHA-256 hash of secret password (zero-knowledge: plain text password is never stored or visible in JS)
const AUTH_DIGEST = '72444412cac88258a7cda188820f22042f4bb1b5d994197af425982f8d584468';

async function computeSha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const TARIFF_NAMES: Record<string, string> = {
  '1d': '1 день (49 ₽)',
  '7d': '1 неделя (199 ₽)',
  '30d': '1 месяц (490 ₽)',
  '365d': '1 год (1 490 ₽)',
  'lifetime': 'Навсегда (1 999 ₽)',
};

const TARIFF_ORDER: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '365d': 365,
  'lifetime': 99999,
};

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [inputPass, setInputPass] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<number | null>(null);

  // Key Generator State
  const [keys, setKeys] = useState<GeneratedKey[]>(() => {
    try {
      const raw = localStorage.getItem('amz_admin_keys');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Migrate old keys to include timestamp if missing
      return parsed.map((k: any) => ({
        ...k,
        timestamp: k.timestamp || Date.now()
      }));
    } catch {
      return [];
    }
  });

  const [prefix, setPrefix] = useState('AMAZING-PRO');
  const [duration, setDuration] = useState('lifetime');
  const [count, setCount] = useState(5);
  const [customNote, setCustomNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Newly generated batch of keys for instant copy
  const [lastBatch, setLastBatch] = useState<GeneratedKey[]>([]);
  const [batchCopied, setBatchCopied] = useState(false);

  // Filter & Search & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDuration, setFilterDuration] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'duration-asc' | 'duration-desc' | 'key-asc'>('date-desc');

  // Key Validator State
  const [testKey, setTestKey] = useState('');
  const [valStatus, setValStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [valDetails, setValDetails] = useState<string | null>(null);

  // Payment Links State
  const [payLinks, setPayLinks] = useState(() => {
    try {
      const raw = localStorage.getItem('amz_pay_links');
      return raw ? JSON.parse(raw) : {
        day1: 'https://funpay.com/lots/offer?id=75279018',
        week1: 'https://funpay.com/lots/offer?id=75279439',
        month1: 'https://funpay.com/lots/offer?id=75279686',
        year1: 'https://funpay.com/lots/offer?id=75280030',
        lifetime: 'https://funpay.com/lots/offer?id=75280172',
        tgBot: 'https://funpay.com/lots/offer?id=75280172'
      };
    } catch {
      return {
        day1: 'https://funpay.com/lots/offer?id=75279018',
        week1: 'https://funpay.com/lots/offer?id=75279439',
        month1: 'https://funpay.com/lots/offer?id=75279686',
        year1: 'https://funpay.com/lots/offer?id=75280030',
        lifetime: 'https://funpay.com/lots/offer?id=75280172',
        tgBot: 'https://funpay.com/lots/offer?id=75280172'
      };
    }
  });

  // Check saved session
  useEffect(() => {
    if (sessionStorage.getItem('__amz_sys_auth') === AUTH_DIGEST) {
      setIsAuthenticated(true);
    }
  }, []);

  // Save keys
  useEffect(() => {
    localStorage.setItem('amz_admin_keys', JSON.stringify(keys));
  }, [keys]);

  // Triple Click Handler on Vercel 404 Disguise
  const handleDisguiseClick = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setShowPrompt(true);
        return 0;
      }
      return next;
    });

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = window.setTimeout(() => {
      setClickCount(0);
    }, 2000);
  };

  // Secure zero-knowledge password verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPass) return;
    setIsVerifying(true);
    setAuthError(false);

    try {
      const hash = await computeSha256(inputPass);
      if (hash === AUTH_DIGEST) {
        sessionStorage.setItem('__amz_sys_auth', AUTH_DIGEST);
        setIsAuthenticated(true);
        setShowPrompt(false);
        setInputPass('');
      } else {
        setAuthError(true);
        setInputPass('');
      }
    } catch {
      setAuthError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('__amz_sys_auth');
    setIsAuthenticated(false);
    setShowPrompt(false);
    setInputPass('');
  };

  // Generate keys
  const generateKeys = () => {
    const newKeys: GeneratedKey[] = [];
    const durTag = duration === 'lifetime' ? 'LIFE' : duration.toUpperCase();
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const s1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const s2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const s3 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const keyStr = `${prefix}-${durTag}-${s1}-${s2}-${s3}`;

      newKeys.push({
        id: Math.random().toString(36).substring(2, 9),
        key: keyStr,
        duration: duration,
        createdAt: new Date().toLocaleString('ru-RU'),
        timestamp: now + i,
        note: customNote.trim() || undefined,
        used: false
      });
    }

    setKeys(prev => [...newKeys, ...prev]);
    setLastBatch(newKeys);
    setBatchCopied(false);
    setStatusMsg(`✓ Создано ${count} ключей (${TARIFF_NAMES[duration] || duration}). Вы можете сразу скопировать их.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Copy just newly created batch
  const copyLastBatch = () => {
    if (lastBatch.length === 0) return;
    const text = lastBatch.map(k => k.key).join('\n');
    navigator.clipboard.writeText(text);
    setBatchCopied(true);
    setStatusMsg(`✓ ${lastBatch.length} только что созданных ключей скопированы в буфер!`);
    setTimeout(() => {
      setBatchCopied(false);
      setStatusMsg(null);
    }, 2500);
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyFilteredKeys = (itemsToCopy: GeneratedKey[]) => {
    const all = itemsToCopy.map(k => k.key).join('\n');
    navigator.clipboard.writeText(all);
    setStatusMsg(`✓ Скопировано ${itemsToCopy.length} ключей!`);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const exportFilteredToFile = (itemsToExport: GeneratedKey[]) => {
    const text = itemsToExport.map(k => `${k.key} | ${k.duration} | Создан: ${k.createdAt}${k.note ? ` | ${k.note}` : ''}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RP-Assistant-Keys-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const deleteKey = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    setLastBatch(prev => prev.filter(k => k.id !== id));
  };

  // Delete all keys for specific duration (e.g. all 1-day keys)
  const deleteKeysByDuration = (dur: string) => {
    const countToDelete = keys.filter(k => k.duration === dur).length;
    if (countToDelete === 0) {
      alert(`Нет ключей с тарифом: ${TARIFF_NAMES[dur] || dur}`);
      return;
    }

    if (confirm(`Вы уверены, что хотите удалить ВСЕ ключи на «${TARIFF_NAMES[dur] || dur}» (${countToDelete} шт.)?`)) {
      setKeys(prev => prev.filter(k => k.duration !== dur));
      setLastBatch(prev => prev.filter(k => k.duration !== dur));
      setStatusMsg(`✓ Удалено ${countToDelete} ключей с тарифом: ${TARIFF_NAMES[dur] || dur}`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const clearAllKeys = () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ сгенерированные ключи из базы?')) {
      setKeys([]);
      setLastBatch([]);
      setStatusMsg('✓ База ключей полностью очищена.');
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  const validateKeyOnline = async () => {
    if (!testKey.trim()) return;
    setValStatus('checking');
    setValDetails(null);

    try {
      const resp = await fetch('https://keyauth.win/api/1.3/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          type: 'license',
          key: testKey.trim(),
          name: 'AmazingRP',
          ownerid: 'KsGzXbaj2i',
          secret: '5aafe207e98076ee16a8a4802b36ad8a398685814b9b5816de2d48f121545261',
          version: '1.0'
        })
      });

      const data = await resp.json();
      if (data.success) {
        setValStatus('valid');
        setValDetails('Ключ активен в KeyAuth! Подписка подтверждена.');
      } else {
        const match = keys.find(k => k.key.toUpperCase() === testKey.trim().toUpperCase());
        if (match) {
          setValStatus('valid');
          setValDetails(`Ключ найден в локальной базе (${TARIFF_NAMES[match.duration] || match.duration}, создан ${match.createdAt})`);
        } else {
          setValStatus('invalid');
          setValDetails(data.message || 'Ключ не найден или недействителен');
        }
      }
    } catch {
      const match = keys.find(k => k.key.toUpperCase() === testKey.trim().toUpperCase());
      if (match) {
        setValStatus('valid');
        setValDetails(`Ключ подтвержден локально (${TARIFF_NAMES[match.duration] || match.duration})`);
      } else {
        setValStatus('invalid');
        setValDetails('Ошибка подключения к KeyAuth API');
      }
    }
  };

  const savePayLinks = () => {
    localStorage.setItem('amz_pay_links', JSON.stringify(payLinks));
    setStatusMsg('✓ Платежные ссылки успешно сохранены!');
    setTimeout(() => setStatusMsg(null), 2500);
  };

  // Filtered & Sorted Keys computation
  const filteredAndSortedKeys = useMemo(() => {
    let result = [...keys];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(k =>
        k.key.toLowerCase().includes(q) ||
        (k.note && k.note.toLowerCase().includes(q)) ||
        (TARIFF_NAMES[k.duration] && TARIFF_NAMES[k.duration].toLowerCase().includes(q))
      );
    }

    // Filter by duration
    if (filterDuration !== 'all') {
      result = result.filter(k => k.duration === filterDuration);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortBy === 'date-asc') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'duration-asc') return (TARIFF_ORDER[a.duration] || 0) - (TARIFF_ORDER[b.duration] || 0);
      if (sortBy === 'duration-desc') return (TARIFF_ORDER[b.duration] || 0) - (TARIFF_ORDER[a.duration] || 0);
      if (sortBy === 'key-asc') return a.key.localeCompare(b.key);
      return 0;
    });

    return result;
  }, [keys, searchQuery, filterDuration, sortBy]);

  // Counts per tariff
  const countsByTariff = useMemo(() => {
    const map: Record<string, number> = { '1d': 0, '7d': 0, '30d': 0, '365d': 0, 'lifetime': 0 };
    for (const k of keys) {
      if (map[k.duration] !== undefined) {
        map[k.duration]++;
      }
    }
    return map;
  }, [keys]);

  // ─── 1. DISGUISED AUTHENTIC VERCEL 404 SCREEN ───
  if (!isAuthenticated) {
    return (
      <div
        onClick={handleDisguiseClick}
        className="h-screen w-screen bg-[#000000] text-[#ffffff] font-sans flex items-center justify-center cursor-default select-none relative"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' }}
      >
        {/* Authentic Vercel 404 Layout */}
        <div className="flex items-center text-center">
          <h1 className="text-2xl font-medium border-r border-[#333333] pr-6 mr-6 leading-none">
            404
          </h1>
          <div className="text-sm font-normal text-[#888888] tracking-normal">
            This page could not be found.
          </div>
        </div>

        {/* Secret Hidden Terminal Modal (Activated strictly after 3 clicks) */}
        {showPrompt && (
          <div
            onClick={e => e.stopPropagation()}
            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          >
            <div className="w-full max-w-sm bg-[#111111] border border-[#262626] rounded-2xl p-6 shadow-2xl space-y-4 text-left font-mono">
              <div className="flex items-center justify-between border-b border-[#222222] pb-3 text-xs text-[#888888]">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-[#a0a0a0]" />
                  <span>CORE_NODE // AUTH_CHALLENGE</span>
                </div>
                <button
                  onClick={() => { setShowPrompt(false); setAuthError(false); }}
                  className="hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#666666] mb-1.5 font-medium">ACCESS_TOKEN_HASH</label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="••••••••••••"
                    value={inputPass}
                    onChange={e => { setInputPass(e.target.value); setAuthError(false); }}
                    className={`w-full bg-[#080808] border ${authError ? 'border-red-500/80' : 'border-[#333333]'} focus:border-[#666666] rounded-xl px-3.5 py-2.5 text-xs text-[#e0e0e0] font-mono outline-none transition-all`}
                  />
                  {authError && (
                    <p className="text-[10px] text-red-400 mt-1.5">
                      &gt; ACCESS_DENIED: Invalid security key.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] border border-[#3d3d3d] text-white text-xs font-semibold font-mono transition-all flex items-center justify-center gap-2"
                >
                  {isVerifying ? 'VERIFYING_HASH...' : '[ EXECUTE_AUTHENTICATION ]'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── 2. AUTHENTICATED FULL ADMIN PANEL ───
  return (
    <div className="min-h-screen w-full bg-[#171615] text-[#ede5dc] p-4 sm:p-8 font-sans selection:bg-[#d97757]/30">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ─── Top Nav Bar ─── */}
        <div className="bg-[#201d1b] border border-[#332e29] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#28231f] border border-[#523828] flex items-center justify-center text-[#d97757] text-2xl shadow-inner">
              <Key size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#fbf7ee]">RP Assistant • Панель Управления</h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#d97757]/20 text-[#d97757] border border-[#d97757]/30 font-semibold">
                  SECURE CORE
                </span>
              </div>
              <p className="text-xs text-[#8e8579]">Генерация лицензий KeyAuth, аналитика и управление сайтом amzrp.vercel.app</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#252220] hover:bg-[#2e2a27] text-[#ede5dc] border border-[#332e29] transition-all flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> На сайт
            </button>
            <a
              href="https://keyauth.win/app/"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#28231f] hover:bg-[#33241b] text-[#d97757] border border-[#523828] transition-all flex items-center gap-1.5"
            >
              <ExternalLink size={14} /> KeyAuth Cloud
            </a>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition-all flex items-center gap-1"
            >
              <LogOut size={13} /> Заблокировать
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} /> {statusMsg}
            </span>
            <button onClick={() => setStatusMsg(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
          </div>
        )}

        {/* ─── NEWLY GENERATED BATCH HIGHLIGHT BANNER (Quick 1-Click Copy) ─── */}
        {lastBatch.length > 0 && (
          <div className="bg-[#241e1a] border-2 border-[#d97757]/60 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#3d2e24] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#fbf7ee] flex items-center gap-2">
                    Только что создано: {lastBatch.length} {lastBatch.length === 1 ? 'ключ' : 'ключей'}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#d97757]/30 text-[#e58a6d] font-mono font-semibold">
                      {TARIFF_NAMES[lastBatch[0].duration] || lastBatch[0].duration}
                    </span>
                  </h3>
                  <p className="text-xs text-[#8e8579]">Нажмите кнопку справа, чтобы скопировать только эти свежие ключи</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={copyLastBatch}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                    batchCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#d97757] hover:bg-[#c45b38] text-white shadow-[#d97757]/30'
                  }`}
                >
                  {batchCopied ? <Check size={15} /> : <Copy size={15} />}
                  {batchCopied ? 'Скопировано в буфер!' : `📋 Скопировать только что созданные (${lastBatch.length} шт.)`}
                </button>
                <button
                  onClick={() => setLastBatch([])}
                  className="p-2 rounded-xl bg-[#171615] text-[#8e8579] hover:text-[#ede5dc] border border-[#332e29]"
                  title="Закрыть плашку"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {lastBatch.map(k => (
                <div key={k.id} className="p-2 bg-[#171615] rounded-lg border border-[#3d2e24] flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#d97757] font-bold select-all truncate">{k.key}</span>
                  <button
                    onClick={() => copyKey(k.key, k.id)}
                    className="text-[11px] text-[#8e8579] hover:text-white"
                  >
                    {copiedId === k.id ? '✓' : 'копия'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Grid: Generator + Quick Stats ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Generator Controls (Left 2 cols) */}
          <div className="lg:col-span-2 bg-[#201d1b] border border-[#332e29] rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#332e29] pb-4">
              <h2 className="text-sm font-bold text-[#fbf7ee] uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-[#d97757]" /> Генератор Лицензионных Ключей
              </h2>
              <span className="text-xs text-[#8e8579]">KeyAuth v1.3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-[#8e8579] mb-1.5 font-medium">Срок действия (Тариф)</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full bg-[#171615] border border-[#332e29] focus:border-[#d97757] rounded-xl px-3 py-2.5 text-xs text-[#ede5dc] font-semibold outline-none"
                >
                  <option value="1d">1 день — 49 ₽</option>
                  <option value="7d">1 неделя — 199 ₽</option>
                  <option value="30d">1 месяц — 490 ₽</option>
                  <option value="365d">1 год — 1 490 ₽</option>
                  <option value="lifetime">Навсегда (VIP) — 1 999 ₽</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8e8579] mb-1.5 font-medium">Количество ключей</label>
                <select
                  value={count}
                  onChange={e => setCount(parseInt(e.target.value, 10))}
                  className="w-full bg-[#171615] border border-[#332e29] focus:border-[#d97757] rounded-xl px-3 py-2.5 text-xs text-[#ede5dc] font-semibold outline-none"
                >
                  <option value={1}>1 ключ</option>
                  <option value={5}>5 ключей</option>
                  <option value={10}>10 ключей</option>
                  <option value={25}>25 ключей</option>
                  <option value={50}>50 ключей</option>
                  <option value={100}>100 ключей</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8e8579] mb-1.5 font-medium">Префикс ключа</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={e => setPrefix(e.target.value)}
                  placeholder="AMAZING-PRO"
                  className="w-full bg-[#171615] border border-[#332e29] focus:border-[#d97757] rounded-xl px-3 py-2.5 text-xs text-[#ede5dc] font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#8e8579] mb-1.5 font-medium">Примечание / Покупатель (необязательно)</label>
              <input
                type="text"
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Например: Покупатель @telegram_nick или заказ #1024"
                className="w-full bg-[#171615] border border-[#332e29] focus:border-[#d97757] rounded-xl px-3.5 py-2.5 text-xs text-[#ede5dc] outline-none"
              />
            </div>

            <button
              onClick={generateKeys}
              className="w-full py-3 rounded-xl bg-[#d97757] hover:bg-[#c45b38] text-white font-semibold text-sm shadow-lg shadow-[#d97757]/25 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Сгенерировать {count} {count === 1 ? 'ключ' : 'ключей'} ({TARIFF_NAMES[duration] || duration})
            </button>
          </div>

          {/* Quick Info & Validator (Right col) */}
          <div className="bg-[#201d1b] border border-[#332e29] rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#fbf7ee] uppercase tracking-wider flex items-center gap-2 border-b border-[#332e29] pb-3">
                <CheckCircle2 size={16} className="text-emerald-400" /> Проверка ключа (Validator)
              </h2>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="AMAZING-PRO-LIFE-XXXX-XXXX"
                  value={testKey}
                  onChange={e => { setTestKey(e.target.value); setValStatus('idle'); }}
                  className="w-full bg-[#171615] border border-[#332e29] focus:border-[#d97757] rounded-xl px-3 py-2 text-xs font-mono text-[#ede5dc] outline-none"
                />

                <button
                  onClick={validateKeyOnline}
                  disabled={valStatus === 'checking'}
                  className="w-full py-2 rounded-xl bg-[#252220] hover:bg-[#2e2a27] text-xs font-semibold text-[#ede5dc] border border-[#332e29] transition-all flex items-center justify-center gap-1.5"
                >
                  {valStatus === 'checking' ? <RefreshCw size={13} className="animate-spin" /> : <Shield size={13} />}
                  Проверить статус ключа
                </button>

                {valStatus === 'valid' && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                    ✓ {valDetails}
                  </div>
                )}
                {valStatus === 'invalid' && (
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                    ✕ {valDetails}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="pt-3 border-t border-[#332e29] space-y-1.5 text-xs text-[#8e8579]">
              <div className="flex justify-between">
                <span>Всего ключей в базе:</span>
                <span className="font-bold text-[#fbf7ee]">{keys.length} шт.</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>1 день / Неделя:</span>
                <span className="text-[#ede5dc] font-mono">{countsByTariff['1d']} шт. / {countsByTariff['7d']} шт.</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Месяц / Год / VIP:</span>
                <span className="text-[#ede5dc] font-mono">{countsByTariff['30d']} / {countsByTariff['365d']} / {countsByTariff['lifetime']}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MASS DELETION BY TARIFF BAR (1 Day, 1 Week, etc.) ─── */}
        <div className="bg-[#201d1b] border border-[#332e29] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#fbf7ee] uppercase tracking-wider flex items-center gap-2">
              <Trash2 size={14} className="text-red-400" /> Быстрое удаление ключей по тарифам:
            </h3>
            <span className="text-[11px] text-[#8e8579]">Удаляет сразу все ключи выбранной категории</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Direct button: Delete all 1-Day Keys */}
            <button
              onClick={() => deleteKeysByDuration('1d')}
              disabled={countsByTariff['1d'] === 0}
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 disabled:opacity-40 disabled:hover:bg-red-950/40 text-red-300 border border-red-800/40 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Удалить все на 1 день ({countsByTariff['1d']} шт.)
            </button>

            {/* Delete 7-Day */}
            <button
              onClick={() => deleteKeysByDuration('7d')}
              disabled={countsByTariff['7d'] === 0}
              className="px-3.5 py-2 rounded-xl bg-[#252220] hover:bg-red-950/40 disabled:opacity-40 text-[#c5bcaf] hover:text-red-300 border border-[#332e29] hover:border-red-800/40 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              Удалить на 1 неделю ({countsByTariff['7d']})
            </button>

            {/* Delete 30-Day */}
            <button
              onClick={() => deleteKeysByDuration('30d')}
              disabled={countsByTariff['30d'] === 0}
              className="px-3.5 py-2 rounded-xl bg-[#252220] hover:bg-red-950/40 disabled:opacity-40 text-[#c5bcaf] hover:text-red-300 border border-[#332e29] hover:border-red-800/40 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              Удалить на 1 месяц ({countsByTariff['30d']})
            </button>

            {/* Delete 1-Year */}
            <button
              onClick={() => deleteKeysByDuration('365d')}
              disabled={countsByTariff['365d'] === 0}
              className="px-3.5 py-2 rounded-xl bg-[#252220] hover:bg-red-950/40 disabled:opacity-40 text-[#c5bcaf] hover:text-red-300 border border-[#332e29] hover:border-red-800/40 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              Удалить на 1 год ({countsByTariff['365d']})
            </button>

            {/* Delete Lifetime */}
            <button
              onClick={() => deleteKeysByDuration('lifetime')}
              disabled={countsByTariff['lifetime'] === 0}
              className="px-3.5 py-2 rounded-xl bg-[#252220] hover:bg-red-950/40 disabled:opacity-40 text-[#c5bcaf] hover:text-red-300 border border-[#332e29] hover:border-red-800/40 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              Удалить Навсегда ({countsByTariff['lifetime']})
            </button>
          </div>
        </div>

        {/* ─── KEYS DATABASE TABLE WITH SORTING & FILTERING ─── */}
        <div className="bg-[#201d1b] border border-[#332e29] rounded-2xl p-6 space-y-4 shadow-xl">

          {/* Database Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#332e29] pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#fbf7ee] uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-[#d97757]" /> База Лицензионных Ключей
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#28231f] text-[#d97757] border border-[#523828] font-bold">
                {filteredAndSortedKeys.length} из {keys.length}
              </span>
            </div>

            {filteredAndSortedKeys.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => copyFilteredKeys(filteredAndSortedKeys)}
                  className="px-3 py-1.5 rounded-xl bg-[#252220] hover:bg-[#2e2a27] text-[#ede5dc] border border-[#332e29] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Copy size={13} /> Скопировать список ({filteredAndSortedKeys.length})
                </button>
                <button
                  onClick={() => exportFilteredToFile(filteredAndSortedKeys)}
                  className="px-3 py-1.5 rounded-xl bg-[#252220] hover:bg-[#2e2a27] text-[#ede5dc] border border-[#332e29] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Download size={13} /> Экспорт .TXT
                </button>
                <button
                  onClick={clearAllKeys}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Очистить всё
                </button>
              </div>
            )}
          </div>

          {/* ─── SORTING & FILTER CONTROLS TOOLBAR ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-[#171615] p-3.5 rounded-xl border border-[#332e29]">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-[#8e8579]" />
              <input
                type="text"
                placeholder="Поиск по ключу или заметке..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#201d1b] border border-[#332e29] focus:border-[#d97757] rounded-xl pl-9 pr-3 py-2 text-xs text-[#ede5dc] outline-none"
              />
            </div>

            {/* Filter by Duration */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[#8e8579] flex-shrink-0" />
              <select
                value={filterDuration}
                onChange={e => setFilterDuration(e.target.value)}
                className="w-full bg-[#201d1b] border border-[#332e29] focus:border-[#d97757] rounded-xl px-3 py-2 text-xs text-[#ede5dc] font-semibold outline-none"
              >
                <option value="all">Все тарифы ({keys.length})</option>
                <option value="1d">1 день ({countsByTariff['1d']})</option>
                <option value="7d">1 неделя ({countsByTariff['7d']})</option>
                <option value="30d">1 месяц ({countsByTariff['30d']})</option>
                <option value="365d">1 год ({countsByTariff['365d']})</option>
                <option value="lifetime">Навсегда ({countsByTariff['lifetime']})</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2 sm:col-span-1 lg:col-span-2">
              <ArrowUpDown size={14} className="text-[#8e8579] flex-shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full bg-[#201d1b] border border-[#332e29] focus:border-[#d97757] rounded-xl px-3 py-2 text-xs text-[#ede5dc] font-semibold outline-none"
              >
                <option value="date-desc">Сортировка: Сначала новые (по дате ↓)</option>
                <option value="date-asc">Сортировка: Сначала старые (по дате ↑)</option>
                <option value="duration-asc">Сортировка: По тарифу (от 1 дня к VIP)</option>
                <option value="duration-desc">Сортировка: По тарифу (от VIP к 1 дню)</option>
                <option value="key-asc">Сортировка: По алфавиту ключа (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Table List */}
          {filteredAndSortedKeys.length === 0 ? (
            <div className="text-center py-12 text-[#8e8579] text-xs space-y-2">
              <Key size={32} className="mx-auto text-[#523828]" />
              <p>
                {keys.length === 0
                  ? 'Нет сгенерированных ключей. Сгенерируйте их в форме выше.'
                  : 'Ключи по выбранным фильтрам не найдены.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredAndSortedKeys.map((k, index) => (
                <div
                  key={k.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#171615] hover:bg-[#252220] border border-[#332e29] transition-all gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#5a544e] font-mono w-6">{index + 1}.</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[#fbf7ee] font-bold tracking-wide select-all">
                          {k.key}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#28231f] text-[#d97757] border border-[#523828] font-semibold">
                          {TARIFF_NAMES[k.duration] || k.duration}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8e8579] flex items-center gap-2 mt-0.5">
                        <span>Создан: {k.createdAt}</span>
                        {k.note && <span className="text-[#c5bcaf]">• {k.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => copyKey(k.key, k.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        copiedId === k.id
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#28231f] hover:bg-[#33241b] text-[#d97757] border border-[#523828]'
                      }`}
                    >
                      {copiedId === k.id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedId === k.id ? 'Скопировано!' : 'Копировать'}
                    </button>
                    <button
                      onClick={() => deleteKey(k.id)}
                      className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 transition-all"
                      title="Удалить ключ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Payment Links Configurator ─── */}
        <div className="bg-[#201d1b] border border-[#332e29] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#332e29] pb-3">
            <h2 className="text-sm font-bold text-[#fbf7ee] uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-[#d97757]" /> Настройка Платежных Ссылок на Сайте
            </h2>
            <button
              onClick={savePayLinks}
              className="px-4 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c45b38] text-white text-xs font-semibold transition-all"
            >
              Сохранить ссылки
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#8e8579] mb-1">1 день (49 ₽)</label>
              <input
                type="text"
                placeholder="https://pay.yookassa.ru/..."
                value={payLinks.day1}
                onChange={e => setPayLinks({ ...payLinks, day1: e.target.value })}
                className="w-full bg-[#171615] border border-[#332e29] rounded-xl px-3 py-2 text-[#ede5dc] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[#8e8579] mb-1">1 неделя (199 ₽)</label>
              <input
                type="text"
                placeholder="https://pay.yookassa.ru/..."
                value={payLinks.week1}
                onChange={e => setPayLinks({ ...payLinks, week1: e.target.value })}
                className="w-full bg-[#171615] border border-[#332e29] rounded-xl px-3 py-2 text-[#ede5dc] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[#8e8579] mb-1">1 месяц (490 ₽)</label>
              <input
                type="text"
                placeholder="https://pay.yookassa.ru/..."
                value={payLinks.month1}
                onChange={e => setPayLinks({ ...payLinks, month1: e.target.value })}
                className="w-full bg-[#171615] border border-[#332e29] rounded-xl px-3 py-2 text-[#ede5dc] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[#8e8579] mb-1">1 год (1 490 ₽)</label>
              <input
                type="text"
                placeholder="https://pay.yookassa.ru/..."
                value={payLinks.year1}
                onChange={e => setPayLinks({ ...payLinks, year1: e.target.value })}
                className="w-full bg-[#171615] border border-[#332e29] rounded-xl px-3 py-2 text-[#ede5dc] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[#8e8579] mb-1">Навсегда Lifetime (1 999 ₽)</label>
              <input
                type="text"
                placeholder="https://pay.yookassa.ru/..."
                value={payLinks.lifetime}
                onChange={e => setPayLinks({ ...payLinks, lifetime: e.target.value })}
                className="w-full bg-[#171615] border border-[#332e29] rounded-xl px-3 py-2 text-[#ede5dc] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[#8e8579] mb-1">Telegram Бот / Менеджер</label>
              <input
                type="text"
                placeholder="https://t.me/..."
                value={payLinks.tgBot}
                onChange={e => setPayLinks({ ...payLinks, tgBot: e.target.value })}
                className="w-full bg-[#171615] border border-[#332e29] rounded-xl px-3 py-2 text-[#ede5dc] outline-none font-mono"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
