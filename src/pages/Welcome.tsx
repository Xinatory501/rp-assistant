import React, { useState } from 'react';
import { Shield, Sparkles, Check, ArrowRight, Server, User, Keyboard, Zap, ChevronLeft, ChevronRight, Key } from 'lucide-react';
import { useAppStore, Profile } from '../store';
import { SERVERS, ORGS, getDepartmentsForOrg, getRanksForOrg, SERVER_COLORS } from '../constants';
import { verifyKeyWithKeyAuth } from '../lib/keyauth';
import HotkeyRecorder from '../components/HotkeyRecorder';

type Step = 'server' | 'profile' | 'hotkey' | 'premium';

export default function Welcome() {
  const { addProfile, updateSettings } = useAppStore();

  const [step, setStep] = useState<Step>('server');
  const [server, setServer] = useState('');
  const [profile, setProfile] = useState({ name: '', org: '', dept: '', rank: '', callsign: '', post: '' });
  const [hotkey, setHotkey] = useState('Insert');
  const [hotkeyAlt, setHotkeyAlt] = useState('Alt+X');
  const [premiumKey, setPremiumKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');

  const steps: Step[] = ['server', 'profile', 'hotkey', 'premium'];
  const stepIdx = steps.indexOf(step);

  const checkKey = async () => {
    if (!premiumKey.trim()) return;
    setKeyStatus('checking');
    try {
      const res = await verifyKeyWithKeyAuth(premiumKey.trim());
      setKeyStatus(res.success ? 'ok' : 'fail');
    } catch {
      setKeyStatus('fail');
    }
  };

  const finish = () => {
    addProfile({ ...profile, server });
    updateSettings({
      hotkey,
      hotkeyAlt,
      firstRun: false,
      isPremium: keyStatus === 'ok',
      premiumKey: keyStatus === 'ok' ? premiumKey.trim() : '',
    });
    const api = (window as any).electronAPI;
    api?.reregisterShortcuts(hotkey, hotkeyAlt);
  };

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(9,9,11,0.96)' }}>
      {/* Card */}
      <div className="w-[480px] rounded-2xl overflow-hidden" style={{ background: 'rgba(24,24,27,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent,#7C3AED)' }}>
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg">RP Assistant</span>
          </div>
          <p className="text-zinc-400 text-sm">Настройка профиля — Amazing Online</p>
          {/* Steps */}
          <div className="flex items-center gap-1.5 mt-4">
            {steps.map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= stepIdx ? 'opacity-100' : 'opacity-20'}`}
                style={{ background: i <= stepIdx ? 'var(--accent,#7C3AED)' : undefined }} />
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* STEP 1 — SERVER */}
          {step === 'server' && (
            <div>
              <h2 className="text-white font-medium mb-1">Выбери сервер</h2>
              <p className="text-zinc-400 text-sm mb-4">ИИ-помощник загрузит законодательство нужного сервера</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {SERVERS.map(s => (
                  <button key={s} onClick={() => setServer(s)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 border ${
                      server === s
                        ? 'text-white border-transparent'
                        : 'text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                    }`}
                    style={server === s ? { background: 'var(--accent,#7C3AED)', borderColor: 'transparent' } : {}}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Quick AHK drop note */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between">
                <span>💡 Есть готовый скрипт? Перетащите <b>.ahk файл</b> прямо в это окно!</span>
              </div>
            </div>
          )}

          {/* STEP 2 — PROFILE */}
          {step === 'profile' && (
            <div className="space-y-3">
              <div>
                <h2 className="text-white font-medium mb-1">Данные персонажа</h2>
                <p className="text-zinc-400 text-sm mb-4">Используются в авто-докладах и запросах к ИИ</p>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs mb-1">Ник персонажа (Nick_Name)</label>
                <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ivan_Ivanov"
                  className="w-full px-3 py-2 rounded-lg text-sm text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/25 placeholder:text-zinc-600" />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">Организация (Фракция)</label>
                <select
                  value={profile.org}
                  onChange={e => {
                    const org = e.target.value;
                    const firstDept = getDepartmentsForOrg(org, server)?.[0] || '';
                    const firstRank = getRanksForOrg(org, server)?.[0] || '';
                    setProfile(p => ({ ...p, org, dept: firstDept, rank: firstRank }));
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/25"
                >
                  <option value="">Выбери организацию...</option>
                  {ORGS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {profile.org && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">Подразделение (Отдел)</label>
                    <input
                      list="welcome-dept-options"
                      value={profile.dept}
                      onChange={e => setProfile(p => ({ ...p, dept: e.target.value }))}
                      placeholder="Выбери или введи отдел..."
                      className="w-full px-3 py-2 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/25"
                    />
                    <datalist id="welcome-dept-options">
                      {getDepartmentsForOrg(profile.org, server).map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">Звание / Должность</label>
                    <input
                      list="welcome-rank-options"
                      value={profile.rank}
                      onChange={e => setProfile(p => ({ ...p, rank: e.target.value }))}
                      placeholder="Выбери или введи должность..."
                      className="w-full px-3 py-2 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/25"
                    />
                    <datalist id="welcome-rank-options">
                      {getRanksForOrg(profile.org, server).map(r => <option key={r} value={r} />)}
                    </datalist>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Пост по умолчанию</label>
                  <input value={profile.post} onChange={e => setProfile(p => ({ ...p, post: e.target.value }))}
                    placeholder="Мост г. Южный / КПП-1"
                    className="w-full px-3 py-2 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/25 placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Позывной</label>
                  <input value={profile.callsign} onChange={e => setProfile(p => ({ ...p, callsign: e.target.value }))}
                    placeholder="Сокол-1"
                    className="w-full px-3 py-2 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/25 placeholder:text-zinc-600" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — HOTKEY */}
          {step === 'hotkey' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-medium mb-1">Горячие клавиши оверлея</h2>
                <p className="text-zinc-400 text-sm mb-3">Нажмите на поле и нажмите нужную клавишу на клавиатуре</p>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 text-xs font-medium">Основная клавиша (для полноразмерных клавиатур)</label>
                <HotkeyRecorder
                  value={hotkey}
                  onChange={k => k && setHotkey(k)}
                  placeholder="Нажмите клавишу (например: Insert)..."
                  className="w-full"
                />
              </div>

              <div className="space-y-1 pt-2">
                <label className="block text-zinc-300 text-xs font-medium">Запасная комбинация (для 60% / 75% клавиатур)</label>
                <HotkeyRecorder
                  value={hotkeyAlt}
                  onChange={k => k && setHotkeyAlt(k)}
                  placeholder="Нажмите комбинацию (например: Alt+X)..."
                  className="w-full"
                />
              </div>

              <div className="rounded-xl p-3 text-xs text-zinc-400 bg-white/[0.04] border border-white/5">
                💡 В игре оверлей будет мгновенно открываться и сворачиваться по нажатию выбранной клавиши.
              </div>
            </div>
          )}

          {/* STEP 4 — PREMIUM */}
          {step === 'premium' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-medium mb-1">Premium ключ</h2>
                <p className="text-zinc-400 text-sm mb-4">Активируй ключ или продолжай бесплатно</p>
              </div>
              <div className="rounded-xl p-4 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="text-white text-sm font-medium mb-2">Premium включает</h3>
                <ul className="space-y-1.5">
                  {[
                    'ИИ-Юрист (AmazingAI)',
                    'Авто-доклады в рацию',
                    'Режим стримера (скрытие от демки)',
                    'Импорт AHK-скриптов',
                    'До 10 профилей',
                    'Эксклюзивные цвета темы',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Check size={13} style={{ color: 'var(--accent,#7C3AED)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input value={premiumKey} onChange={e => { setPremiumKey(e.target.value); setKeyStatus('idle'); }}
                    placeholder="Введи ключ активации..."
                    className="w-full pl-8 pr-24 py-2.5 rounded-lg text-sm text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/25 placeholder:text-zinc-600" />
                  <button onClick={checkKey} disabled={!premiumKey.trim() || keyStatus === 'checking'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md text-xs font-medium text-white transition-all disabled:opacity-50"
                    style={{ background: 'var(--accent,#7C3AED)' }}>
                    {keyStatus === 'checking' ? '...' : 'Активировать'}
                  </button>
                </div>
                {keyStatus === 'ok' && <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1"><Check size={11} /> Premium активирован!</p>}
                {keyStatus === 'fail' && <p className="text-red-400 text-xs mt-1.5">Недействительный ключ</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <button onClick={() => {
            const prev = steps[stepIdx - 1];
            if (prev) setStep(prev);
          }} className={`flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors ${stepIdx === 0 ? 'invisible' : ''}`}>
            <ChevronLeft size={15} /> Назад
          </button>
          {step === 'premium' ? (
            <button
              onClick={finish}
              disabled={!server || !profile.name}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
              style={{ background: 'var(--accent,#7C3AED)' }}>
              Начать <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => { const next = steps[stepIdx + 1]; if (next) setStep(next); }}
              disabled={(step === 'server' && !server) || (step === 'profile' && (!profile.name || !profile.org))}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
              style={{ background: 'var(--accent,#7C3AED)' }}>
              Далее <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
