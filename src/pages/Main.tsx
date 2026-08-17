import React, { useState } from 'react';
import {
  MessageSquare, BookOpen, Hash, Radio, Settings,
  X, Minus, ChevronDown, Shield, Check, User, UserCheck
} from 'lucide-react';
import { useAppStore } from '../store';
import { SERVER_COLORS } from '../constants';
import ChatTab from '../components/ChatTab';
import HintsTab from '../components/HintsTab';
import BinderTab from '../components/BinderTab';
import ReportsTab from '../components/ReportsTab';
import InterviewTab from '../components/InterviewTab';
import SettingsTab from '../components/SettingsTab';

type Tab = 'chat' | 'hints' | 'binder' | 'reports' | 'interview' | 'settings';

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'binder',    icon: <Hash size={13} />,         label: 'Биндер'       },
  { id: 'reports',   icon: <Radio size={13} />,        label: 'Доклады'      },
  { id: 'interview', icon: <UserCheck size={13} />,    label: 'Собеседование'},
  { id: 'hints',     icon: <BookOpen size={13} />,     label: 'Шпаргалки'    },
  { id: 'chat',      icon: <MessageSquare size={13} />, label: 'ИИ-Юрист'     },
  { id: 'settings',  icon: <Settings size={13} />,     label: 'Настройки'    },
];

export default function Main() {
  const {
    profiles, activeProfileId, settings,
    setActiveProfile, savedConfigs, activeConfigId, loadConfig
  } = useAppStore();

  const [tab, setTab]                     = useState<Tab>('binder');
  const [profileMenuOpen, setProfileMenu] = useState(false);
  const [configMenuOpen,  setConfigMenu]  = useState(false);

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null;
  const activeConfig  = savedConfigs.find(c => c.id === activeConfigId) ?? null;
  const api           = (window as any).electronAPI;

  const closeAll = () => { setProfileMenu(false); setConfigMenu(false); };

  return (
    <div
      className="w-full h-full flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: `rgba(23,22,21,${Math.round(settings.opacity * 100)}%)`,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* ── Row 1: Titlebar ──────────────────────────────────── */}
      <div
        className="drag-region shrink-0 flex items-center justify-between px-3 h-9 border-b border-white/[0.06]"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent,#d97757)' }}
          >
            <Shield size={11} className="text-white" />
          </div>
          <span className="text-[#fbf7ee] text-xs font-semibold tracking-tight select-none">RP Assistant</span>
          {settings.isPremium && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#33241b] text-[#d97757] border border-[#523828]">PRO</span>
          )}
        </div>

        {/* Profile + Config pills */}
        <div className="no-drag flex items-center gap-1.5">
          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileMenu(v => !v); setConfigMenu(false); }}
              className="flex items-center gap-1.5 h-6 px-2 rounded-lg text-[11px] bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[#ede5dc] transition-colors"
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: activeProfile ? SERVER_COLORS[activeProfile.server] ?? '#d97757' : '#555' }}
              />
              <span className="truncate max-w-[90px]">{activeProfile?.name ?? 'Профиль'}</span>
              <span className="text-[#8e8579] font-mono">[{activeProfile?.org ?? '—'}]</span>
              <ChevronDown size={10} className="text-[#8e8579] ml-0.5" />
            </button>

            {profileMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 z-50 rounded-xl bg-[#201d1b] border border-[#332e29] shadow-2xl p-1 animate-in fade-in duration-100">
                <p className="px-2.5 py-1 text-[10px] font-semibold text-[#8e8579] uppercase tracking-wider">Персонаж</p>
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setActiveProfile(p.id); setProfileMenu(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      p.id === activeProfileId
                        ? 'bg-[#35271e] text-[#d97757]'
                        : 'text-[#ede5dc] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SERVER_COLORS[p.server] ?? '#d97757' }} />
                    <span className="truncate flex-1 font-medium">{p.name}</span>
                    <span className="text-[#8e8579] text-[10px]">{p.org}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Config */}
          <div className="relative">
            <button
              onClick={() => { setConfigMenu(v => !v); setProfileMenu(false); }}
              className="flex items-center gap-1 h-6 px-2 rounded-lg text-[11px] bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[#ede5dc] transition-colors"
              title="Конфигурация"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97757] flex-shrink-0" />
              <span className="truncate max-w-[80px]">{activeConfig?.title ?? 'Конфиг'}</span>
              <ChevronDown size={10} className="text-[#8e8579] ml-0.5" />
            </button>

            {configMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-52 z-50 rounded-xl bg-[#201d1b] border border-[#332e29] shadow-2xl p-1 animate-in fade-in duration-100">
                <p className="px-2.5 py-1 text-[10px] font-semibold text-[#8e8579] uppercase tracking-wider">Конфигурация</p>
                {savedConfigs.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { loadConfig(c.id); setConfigMenu(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      c.id === activeConfigId
                        ? 'bg-[#35271e] text-[#d97757]'
                        : 'text-[#ede5dc] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="truncate flex-1">{c.title}</span>
                    {c.id === activeConfigId && <Check size={11} className="text-[#d97757] ml-2 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Window controls */}
        <div className="no-drag flex items-center gap-0.5">
          <button
            onClick={() => api?.minimizeWindow?.()}
            className="w-6 h-6 rounded flex items-center justify-center text-[#8e8579] hover:text-[#ede5dc] hover:bg-white/[0.07] transition-colors"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={() => api?.hideOverlay?.()}
            className="w-6 h-6 rounded flex items-center justify-center text-[#8e8579] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ── Row 2: Tab Bar ───────────────────────────────────── */}
      <div
        className="no-drag shrink-0 flex items-center gap-1 px-3 h-8 border-b border-white/[0.06]"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'text-white font-semibold shadow-sm'
                  : 'text-[#9c9386] hover:text-[#ede5dc] hover:bg-white/[0.05]'
              }`}
              style={active ? { background: 'var(--accent,#d97757)' } : {}}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden bg-[#171615]">
        {tab === 'binder'    && <BinderTab />}
        {tab === 'reports'   && <ReportsTab />}
        {tab === 'interview' && <InterviewTab />}
        {tab === 'hints'     && <HintsTab />}
        {tab === 'chat'      && <ChatTab />}
        {tab === 'settings'  && <SettingsTab />}
      </div>

      {/* Backdrop to close dropdowns */}
      {(profileMenuOpen || configMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}
    </div>
  );
}
