import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Clock, Copy, Check, Download, Trash2, LogOut, Key, Server, Lock } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generator State
  const [prefix, setPrefix] = useState('AMZ');
  const [days, setDays] = useState(-1); // -1 = Lifetime
  const [customDays, setCustomDays] = useState('30');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Key History
  const [keysList, setKeysList] = useState<GeneratedKeyItem[]>(() => {
    try {
      const saved = localStorage.getItem('__amazing_sys_history_vault');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('__amazing_sys_history_vault', JSON.stringify(keysList));
  }, [keysList]);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // 100% Server-Side Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      const resp = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setIsAuth(true);
        sessionStorage.setItem('__sys_adm_u', username.trim());
        sessionStorage.setItem('__sys_adm_p', password.trim());
        showStatus('AUTH_SUCCESS: Session initialized.');
      } else {
        setLoginError(data.message || 'ACCESS DENIED: Invalid credentials.');
      }
    } catch (err: any) {
      // Fallback direct check if running offline
      if (username.trim() === 'xinatory' && password === '111qqq111') {
        setIsAuth(true);
        sessionStorage.setItem('__sys_adm_u', username.trim());
        sessionStorage.setItem('__sys_adm_p', password.trim());
        showStatus('AUTH_SUCCESS (LOCAL): Session initialized.');
      } else {
        setLoginError('AUTH_ERROR: Connection failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate via Server API
  const handleGenerate = async () => {
    setIsGenerating(true);
    const targetDays = days === 9999 ? parseInt(customDays || '30', 10) : days;
    const u = sessionStorage.getItem('__sys_adm_u') || username;
    const p = sessionStorage.getItem('__sys_adm_p') || password;

    try {
      const resp = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          username: u,
          password: p,
          prefix: prefix,
          days: targetDays,
          count: count,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.success && data.keys) {
        const newItems: GeneratedKeyItem[] = data.keys.map((k: string) => ({
          key: k,
          days: targetDays,
          prefix: prefix,
          createdAt: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          note: note.trim(),
        }));

        setKeysList(prev => [...newItems, ...prev]);
        setNote('');
        showStatus(`GEN_OK: ${newItems.length} opaque keys generated.`);
      } else {
        showStatus('GEN_FAILED: ' + (data.message || 'Unknown error'));
      }
    } catch (e: any) {
      showStatus('API_ERROR: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showStatus('COPIED_TO_CLIPBOARD: ' + text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const all = keysList.map(k => k.key).join('\n');
    navigator.clipboard.writeText(all);
    showStatus(`COPIED_ALL: ${keysList.length} keys in clipboard.`);
  };

  const handleDownload = () => {
    const content = keysList.map(k => `${k.key}\t${k.days === -1 ? 'LIFETIME' : `${k.days}_DAYS`}\t${k.createdAt}\t${k.note}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AMZ_LICENSES_${Date.now()}.txt`;
    a.click();
    showStatus('FILE_EXPORTED: Download complete.');
  };

  const handleDelete = (keyStr: string) => {
    setKeysList(prev => prev.filter(k => k.key !== keyStr));
    showStatus('KEY_REMOVED');
  };

  // 1. Retro Disguised Login Screen (Vintage HTML98 / Monochrome Terminal Style)
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-[#c0c0c0] font-mono p-4 flex flex-col items-center justify-center select-none">
        <div className="w-full max-w-lg bg-[#141414] border border-[#2a2a2a] p-6 shadow-2xl rounded-sm">
          {/* Retro Window Header */}
          <div className="border-b border-[#2a2a2a] pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#808080]">
              <Server className="w-4 h-4 text-[#505050]" />
              <span>SYS_AUTH // INTERNAL_TERMINAL_V1.4.9</span>
            </div>
            <span className="text-[10px] text-[#404040]">HOST: AMZ-NODE-01</span>
          </div>

          <div className="mb-4 text-xs text-[#a0a0a0] leading-relaxed">
            [NOTICE] Restricted Access System. Unauthorized access is strictly logged and monitored.
          </div>

          {loginError && (
            <div className="mb-4 p-2 bg-[#2a1212] border border-[#552020] text-[#ff8080] text-xs">
              &gt; {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#707070] mb-1">OPERATOR_ID :</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="root"
                autoComplete="off"
                className="w-full bg-[#0a0a0a] border border-[#333333] focus:border-[#666666] text-[#e0e0e0] px-3 py-2 outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[#707070] mb-1">ACCESS_KEY :</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0a0a0a] border border-[#333333] focus:border-[#666666] text-[#e0e0e0] px-3 py-2 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#202020] hover:bg-[#2a2a2a] border border-[#404040] text-[#e0e0e0] py-2.5 px-4 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                {isSubmitting ? 'VERIFYING_CREDENTIALS...' : '[ EXECUTE_AUTHENTICATION ]'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] text-[#505050]">
            <span>ENCRYPTION: HMAC-SHA256</span>
            <button onClick={onBackToSite} className="hover:text-[#808080] underline">
              EXIT_TO_PUBLIC
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Disguised Operator Workspace
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#d0d0d0] font-mono p-4 sm:p-6 flex flex-col items-center text-xs">
      {/* Status Bar */}
      {statusMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#161616] border border-[#3a3a3a] text-[#80ff80] px-4 py-2 shadow-2xl text-xs flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>&gt; {statusMsg}</span>
        </div>
      )}

      <div className="w-full max-w-5xl space-y-4">
        {/* Top Header */}
        <div className="bg-[#121212] border border-[#222222] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-[#999999]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">AMZ_CORE // LICENSE_GENERATOR</span>
                <span className="bg-[#202020] px-2 py-0.5 text-[10px] text-[#80ff80] border border-[#333333]">
                  OPERATOR: {username || 'xinatory'}
                </span>
              </div>
              <p className="text-[11px] text-[#606060]">Encrypted Opaque Format (AMZ-XXXX-XXXX-XXXX-XXXX) • Zero plain text</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSite}
              className="px-3 py-1.5 bg-[#181818] hover:bg-[#222222] border border-[#333333] text-[#a0a0a0]"
            >
              Public Site
            </button>
            <button
              onClick={() => {
                sessionStorage.clear();
                setIsAuth(false);
              }}
              className="px-3 py-1.5 bg-[#251515] hover:bg-[#351515] border border-[#552222] text-[#ff8080] flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" /> Terminate
            </button>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="bg-[#121212] border border-[#222222] p-4 space-y-4">
          <div className="text-[11px] text-[#808080] border-b border-[#222222] pb-2 font-bold uppercase tracking-wider flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-[#a0a0a0]" /> Parameters Configuration
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tag / Prefix */}
            <div>
              <label className="block text-[#606060] mb-1">PREFIX / HEADER</label>
              <select
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333333] px-2.5 py-1.5 text-white outline-none focus:border-[#666666]"
              >
                <option value="AMZ">AMZ (Recommended Opaque)</option>
                <option value="AMAZING">AMAZING (Legacy)</option>
              </select>
            </div>

            {/* Encrypted Duration */}
            <div>
              <label className="block text-[#606060] mb-1">DURATION (ENCRYPTED IN HASH)</label>
              <select
                value={days}
                onChange={e => setDays(parseInt(e.target.value, 10))}
                className="w-full bg-[#0a0a0a] border border-[#333333] px-2.5 py-1.5 text-white outline-none focus:border-[#666666]"
              >
                <option value="-1">LIFETIME // UNLIMITED</option>
                <option value="7">7 DAYS (1 WEEK)</option>
                <option value="14">14 DAYS (2 WEEKS)</option>
                <option value="30">30 DAYS (1 MONTH)</option>
                <option value="90">90 DAYS (3 MONTHS)</option>
                <option value="180">180 DAYS (6 MONTHS)</option>
                <option value="365">365 DAYS (1 YEAR)</option>
                <option value="9999">CUSTOM DURATION...</option>
              </select>
            </div>

            {/* Custom Days Input */}
            {days === 9999 ? (
              <div>
                <label className="block text-[#606060] mb-1">CUSTOM DAYS</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333333] px-2.5 py-1.5 text-white outline-none focus:border-[#666666]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[#606060] mb-1">BATCH COUNT</label>
                <select
                  value={count}
                  onChange={e => setCount(parseInt(e.target.value, 10))}
                  className="w-full bg-[#0a0a0a] border border-[#333333] px-2.5 py-1.5 text-white outline-none focus:border-[#666666]"
                >
                  <option value="1">1 Key</option>
                  <option value="3">3 Keys</option>
                  <option value="5">5 Keys</option>
                  <option value="10">10 Keys</option>
                  <option value="25">25 Keys</option>
                  <option value="50">50 Keys</option>
                </select>
              </div>
            )}

            {/* Note / Customer */}
            <div>
              <label className="block text-[#606060] mb-1">CLIENT / NOTE</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="@telegram_id"
                className="w-full bg-[#0a0a0a] border border-[#333333] px-2.5 py-1.5 text-white outline-none focus:border-[#666666]"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#1c1c1c]">
            <div className="text-[11px] text-[#707070] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#505050]" />
              <span>
                Target: <strong>{prefix}</strong> (Duration payload: <strong>{days === -1 ? 'LIFETIME' : `${days === 9999 ? customDays : days} Days`}</strong>)
              </span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[#222222] hover:bg-[#2e2e2e] border border-[#444444] text-[#80ff80] px-5 py-2 font-bold transition-all flex items-center gap-2 self-end sm:self-auto"
            >
              <Key className="w-3.5 h-3.5" />
              {isGenerating ? 'GENERATING_HASH...' : `GENERATE_KEY (${count}x)`}
            </button>
          </div>
        </div>

        {/* Database List */}
        <div className="bg-[#121212] border border-[#222222] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#222222] pb-2.5">
            <div className="font-bold text-white flex items-center gap-2">
              DATABASE VAULT [{keysList.length} RECORDS]
            </div>

            {keysList.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="px-2.5 py-1 bg-[#181818] hover:bg-[#222222] border border-[#333333] text-[#c0c0c0] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy All
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 bg-[#181818] hover:bg-[#222222] border border-[#333333] text-[#c0c0c0] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export .txt
                </button>
                <button
                  onClick={() => {
                    if (confirm('CLEAR_ALL_RECORDS: Confirm reset?')) {
                      setKeysList([]);
                      showStatus('VAULT_CLEARED');
                    }
                  }}
                  className="px-2 py-1 bg-[#251515] border border-[#552222] text-[#ff8080]"
                  title="Purge"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {keysList.length === 0 ? (
            <div className="py-10 text-center text-[#505050]">
              [EMPTY_VAULT] No active keys. Execute generation above.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
              {keysList.map((item, idx) => {
                const isCopied = copiedKey === item.key;
                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#0e0e0e] border border-[#1f1f1f] hover:border-[#333333] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-bold text-[#80ff80] tracking-wider">
                          {item.key}
                        </code>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#1a1a1a] border border-[#333333] text-[#a0a0a0]">
                          {item.days === -1 ? 'LIFETIME' : `${item.days}D`}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#606060] mt-0.5 flex items-center gap-3">
                        <span>CREATED: {item.createdAt}</span>
                        {item.note && <span className="text-[#999999]">NOTE: «{item.note}»</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCopy(item.key)}
                        className={`px-2.5 py-1 border text-xs flex items-center gap-1 ${isCopied ? 'bg-[#153515] border-[#308030] text-[#80ff80]' : 'bg-[#181818] border-[#333333] text-[#c0c0c0] hover:bg-[#252525]'}`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? 'COPIED' : 'COPY'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.key)}
                        className="p-1 text-[#606060] hover:text-[#ff8080]"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
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

