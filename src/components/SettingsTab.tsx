import React, { useState } from 'react';
import {
  User, Plus, Trash2, Edit2, Save, Shield, Monitor,
  Keyboard, Palette, Key, ChevronRight, Check, Eye, EyeOff, Sparkles,
  FolderArchive, Download, Upload, FileJson, Copy, RefreshCw, Layers
} from 'lucide-react';
import { useAppStore, Profile, SavedConfig } from '../store';
import { SERVERS, ORGS, getDepartmentsForOrg, getRanksForOrg, ACCENT_COLORS, SERVER_COLORS } from '../constants';
import { getRadioRussianSurname, transliterateNickToRussian } from '../lib/nameTranslit';
import HotkeyRecorder from './HotkeyRecorder';
import { verifyKeyWithKeyAuth } from '../lib/keyauth';

type Section = 'configs' | 'profiles' | 'hotkeys' | 'appearance' | 'premium';

export default function SettingsTab() {
  const {
    profiles, activeProfileId, setActiveProfile, addProfile, updateProfile, deleteProfile,
    settings, updateSettings,
    savedConfigs, activeConfigId, saveCurrentAsConfig, loadConfig, deleteConfig, importConfig, exportConfig
  } = useAppStore();

  const [section, setSection] = useState<Section>('configs');

  // Profile Management State
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState<{
    name: string;
    nameRu: string;
    server: string;
    org: string;
    dept: string;
    rank: string;
    callsign: string;
    post: string;
  }>({
    name: '',
    nameRu: '',
    server: 'Red',
    org: 'УГИБДД',
    dept: 'ОБ ДПС',
    rank: 'Лейтенант',
    callsign: '',
    post: 'Мост г. Южный'
  });

  // Config Management State
  const [creatingConfig, setCreatingConfig] = useState(false);
  const [configTitle, setConfigTitle] = useState('');
  const [configDesc, setConfigDesc] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [copiedConfigId, setCopiedConfigId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  // KeyAuth State
  const [premiumKey, setPremiumKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');

  // Custom Color State
  const [hue, setHue] = useState(265);
  const [lightness, setLightness] = useState(55);

  const api = (window as any).electronAPI;

  const openCreateProfile = () => {
    setProfileForm({ name: '', nameRu: '', server: 'Red', org: 'УГИБДД', dept: 'ОБ ДПС', rank: 'Лейтенант', callsign: '', post: 'Мост г. Южный' });
    setEditingProfile(null);
    setCreatingProfile(true);
  };

  const openEditProfile = (p: Profile) => {
    setProfileForm({
      name: p.name,
      nameRu: p.nameRu || getRadioRussianSurname(p.name),
      server: p.server,
      org: p.org,
      dept: p.dept,
      rank: p.rank,
      callsign: p.callsign,
      post: p.post
    });
    setEditingProfile(p);
    setCreatingProfile(true);
  };

  const saveProfile = () => {
    if (!profileForm.name.trim() || !profileForm.org) return;
    if (editingProfile) updateProfile(editingProfile.id, profileForm);
    else addProfile(profileForm);
    setCreatingProfile(false);
    setEditingProfile(null);
  };

  const maxProfiles = settings.isPremium ? 10 : 2;

  const checkKey = async () => {
    if (!premiumKey.trim()) return;
    setKeyStatus('checking');
    try {
      const res = await verifyKeyWithKeyAuth(premiumKey.trim());
      if (res.success) {
        setKeyStatus('ok');
        updateSettings({ isPremium: true, premiumKey: premiumKey.trim() });
        api?.setContentProtection(false);
      } else {
        setKeyStatus('fail');
      }
    } catch {
      setKeyStatus('fail');
    }
  };

  // Convert HSL to Hex
  const updateHslColor = (h: number, l: number) => {
    const s = 90;
    const lNorm = l / 100;
    const a = (s * Math.min(lNorm, 1 - lNorm)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    const hex = `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    updateSettings({ accentColor: hex });
  };

  // Export config file
  const handleExport = (cfg: SavedConfig) => {
    const json = exportConfig(cfg.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RP_Assistant_${cfg.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedConfigId(cfg.id);
    setTimeout(() => setCopiedConfigId(null), 1500);
  };

  // Handle Import
  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const ok = importConfig(importJsonText.trim());
    if (ok) {
      setImportStatus('ok');
      setTimeout(() => {
        setShowImportModal(false);
        setImportJsonText('');
        setImportStatus('idle');
      }, 1000);
    } else {
      setImportStatus('error');
    }
  };

  const SECTIONS: { id: Section; icon: React.ReactNode; label: string }[] = [
    { id: 'configs', icon: <FolderArchive size={14} />, label: 'Конфиги / Пресеты' },
    { id: 'profiles', icon: <User size={14} />, label: 'Профили' },
    { id: 'hotkeys', icon: <Keyboard size={14} />, label: 'Горячие клавиши' },
    { id: 'appearance', icon: <Palette size={14} />, label: 'Внешний вид' },
    { id: 'premium', icon: <Shield size={14} />, label: 'Premium' },
  ];

  return (
    <div className="flex h-full">
      {/* ─── Left Nav (Fixed width without breaking) ─── */}
      <div className="w-44 flex-shrink-0 border-r border-white/5 py-3 px-2 space-y-1 select-none">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              section === s.id
                ? 'text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            style={section === s.id ? { background: 'var(--accent,#7C3AED)' } : {}}
          >
            <span className="flex-shrink-0">{s.icon}</span>
            <span className="truncate whitespace-nowrap">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Content Area ─── */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ─── CONFIGS & PRESETS ─── */}
        {section === 'configs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">Конфигурации и пресеты</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Сохраняй и переключай полные наборы биндов, профилей и докладов</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all"
                  title="Импортировать конфиг из JSON"
                >
                  <Upload size={12} />
                  <span>Импорт</span>
                </button>
                <button
                  onClick={() => {
                    setConfigTitle('');
                    setConfigDesc('');
                    setCreatingConfig(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all"
                  style={{ background: 'var(--accent,#7C3AED)' }}
                >
                  <Plus size={13} />
                  <span>Сохранить текущий</span>
                </button>
              </div>
            </div>

            {/* Save Config Form Modal/Inline */}
            {creatingConfig && (
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-lg space-y-3 animate-in fade-in duration-150">
                <h4 className="text-zinc-200 text-xs font-semibold">Сохранить текущую конфигурацию</h4>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Название конфига</label>
                  <input
                    value={configTitle}
                    onChange={e => setConfigTitle(e.target.value)}
                    placeholder="Например: УГИБДД — Ночная смена / Патруль"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Краткое описание (необязательно)</label>
                  <input
                    value={configDesc}
                    onChange={e => setConfigDesc(e.target.value)}
                    placeholder="Набор биндов для погони и проверки документов"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setCreatingConfig(false)}
                    className="flex-1 py-1.5 rounded-lg text-xs text-zinc-400 border border-white/10 hover:border-white/20"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => {
                      if (!configTitle.trim()) return;
                      saveCurrentAsConfig(configTitle, configDesc);
                      setCreatingConfig(false);
                    }}
                    disabled={!configTitle.trim()}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shadow-md"
                    style={{ background: 'var(--accent,#7C3AED)' }}
                  >
                    Сохранить конфиг
                  </button>
                </div>
              </div>
            )}

            {/* Import JSON Modal */}
            {showImportModal && (
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-lg space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-zinc-200 text-xs font-semibold flex items-center gap-1.5">
                    <FileJson size={13} className="text-purple-400" />
                    Импорт конфигурации (.json)
                  </h4>
                  <button onClick={() => setShowImportModal(false)} className="text-zinc-500 hover:text-zinc-300">
                    ✕
                  </button>
                </div>
                <textarea
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder="Вставьте JSON текст конфигурации сюда..."
                  rows={4}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono text-white bg-zinc-800 border border-white/10 focus:outline-none resize-none placeholder:text-zinc-600"
                />
                {importStatus === 'error' && (
                  <p className="text-red-400 text-xs">Ошибка: неверный формат JSON конфигурации</p>
                )}
                {importStatus === 'ok' && (
                  <p className="text-emerald-400 text-xs">✓ Конфигурация успешно импортирована и применена!</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 py-1.5 rounded-lg text-xs text-zinc-400 border border-white/10"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={!importJsonText.trim()}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                    style={{ background: 'var(--accent,#7C3AED)' }}
                  >
                    Импортировать
                  </button>
                </div>
              </div>
            )}

            {/* Configs List */}
            <div className="space-y-2">
              {savedConfigs.map(cfg => {
                const isActive = cfg.id === activeConfigId;
                const dateStr = new Date(cfg.createdAt).toLocaleDateString();

                return (
                  <div
                    key={cfg.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-white/[0.08] border-purple-500/40 shadow-lg ring-1 ring-purple-500/30'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-white">{cfg.title}</span>
                          {cfg.isPreset && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                              Пресет
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                              <Check size={10} /> Активен
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5">{cfg.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleExport(cfg)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all"
                          title="Экспортировать в файл .json"
                        >
                          {copiedConfigId === cfg.id ? <Check size={12} className="text-emerald-400" /> : <Download size={12} />}
                        </button>
                        {!cfg.isPreset && (
                          <button
                            onClick={() => deleteConfig(cfg.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Удалить конфиг"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats & Load Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-zinc-500">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          {cfg.org || 'УГИБДД'}
                        </span>
                        <span>Бинды: <b>{cfg.data.binds?.length || 0}</b></span>
                        <span>Шпаргалки: <b>{cfg.data.hints?.length || 0}</b></span>
                      </div>

                      <button
                        onClick={() => loadConfig(cfg.id)}
                        disabled={isActive}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                          isActive
                            ? 'bg-white/10 text-zinc-400 cursor-default'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                        }`}
                      >
                        {isActive ? 'Применено' : 'Загрузить конфиг'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── PROFILES ─── */}
        {section === 'profiles' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-medium">
                Профили персонажей <span className="text-zinc-500 font-mono">({profiles.length}/{maxProfiles})</span>
              </h3>
              {profiles.length < maxProfiles && !creatingProfile && (
                <button
                  onClick={openCreateProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all"
                  style={{ background: 'var(--accent,#7C3AED)' }}
                >
                  <Plus size={13} /> Добавить
                </button>
              )}
            </div>

            {creatingProfile ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-lg">
                <h4 className="text-zinc-200 text-xs font-semibold">
                  {editingProfile ? 'Редактировать профиль' : 'Новый профиль'}
                </h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">Ник в игре (ENG)</label>
                    <input
                      value={profileForm.name}
                      onChange={e => {
                        const val = e.target.value;
                        const prevAuto = getRadioRussianSurname(profileForm.name);
                        const newAuto = getRadioRussianSurname(val);
                        setProfileForm(p => ({
                          ...p,
                          name: val,
                          nameRu: (!p.nameRu || p.nameRu === prevAuto) ? newAuto : p.nameRu
                        }));
                      }}
                      placeholder="Ivan_Ivanov"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">В рацию (RUS)</label>
                    <input
                      value={profileForm.nameRu}
                      onChange={e => setProfileForm(p => ({ ...p, nameRu: e.target.value }))}
                      placeholder="Иванов"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">Сервер</label>
                    <select
                      value={profileForm.server}
                      onChange={e => {
                        const s = e.target.value;
                        const depts = getDepartmentsForOrg(profileForm.org, s);
                        const ranks = getRanksForOrg(profileForm.org, s);
                        setProfileForm(p => ({
                          ...p,
                          server: s,
                          dept: depts.includes(p.dept) ? p.dept : depts[0] || p.dept,
                          rank: ranks.includes(p.rank) ? p.rank : ranks[0] || p.rank
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none"
                    >
                      {SERVERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Организация (Фракция)</label>
                  <select
                    value={profileForm.org}
                    onChange={e => {
                      const org = e.target.value;
                      const firstDept = getDepartmentsForOrg(org, profileForm.server)?.[0] || '';
                      const firstRank = getRanksForOrg(org, profileForm.server)?.[0] || '';
                      setProfileForm(p => ({ ...p, org, dept: firstDept, rank: firstRank }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none"
                  >
                    {ORGS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {profileForm.org && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zinc-400 text-xs mb-1">Подразделение (Отдел)</label>
                      <input
                        list="dept-options"
                        value={profileForm.dept}
                        onChange={e => setProfileForm(p => ({ ...p, dept: e.target.value }))}
                        placeholder="Выбери или введи отдел..."
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30"
                      />
                      <datalist id="dept-options">
                        {getDepartmentsForOrg(profileForm.org, profileForm.server).map(d => <option key={d} value={d} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs mb-1">Звание / Должность</label>
                      <input
                        list="rank-options"
                        value={profileForm.rank}
                        onChange={e => setProfileForm(p => ({ ...p, rank: e.target.value }))}
                        placeholder="Выбери или введи должность..."
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30"
                      />
                      <datalist id="rank-options">
                        {getRanksForOrg(profileForm.org, profileForm.server).map(r => <option key={r} value={r} />)}
                      </datalist>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">Пост по умолчанию</label>
                    <input
                      value={profileForm.post}
                      onChange={e => setProfileForm(p => ({ ...p, post: e.target.value }))}
                      placeholder="Мост г. Южный"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">Позывной</label>
                    <input
                      value={profileForm.callsign}
                      onChange={e => setProfileForm(p => ({ ...p, callsign: e.target.value }))}
                      placeholder="Сокол-1"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Сервер</label>
                  <div className="flex flex-wrap gap-1">
                    {SERVERS.map(s => (
                      <button
                        key={s}
                        onClick={() => setProfileForm(p => ({ ...p, server: s }))}
                        className={`px-2 py-1 rounded-md text-xs border transition-all ${
                          profileForm.server === s ? 'text-white border-transparent shadow' : 'text-zinc-500 border-white/10'
                        }`}
                        style={profileForm.server === s ? { background: SERVER_COLORS[s] ?? '#7C3AED' } : {}}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setCreatingProfile(false); setEditingProfile(null); }}
                    className="flex-1 py-1.5 rounded-lg text-xs text-zinc-400 border border-white/10 hover:border-white/20"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={!profileForm.name.trim() || !profileForm.org}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shadow-md"
                    style={{ background: 'var(--accent,#7C3AED)' }}
                  >
                    {editingProfile ? 'Сохранить изменения' : 'Создать профиль'}
                  </button>
                </div>
              </div>
            ) : null}

            {profiles.map(p => (
              <div
                key={p.id}
                className={`px-3.5 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer border ${
                  p.id === activeProfileId
                    ? 'bg-white/[0.08] border-purple-500/40 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                }`}
                onClick={() => setActiveProfile(p.id)}
              >
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: SERVER_COLORS[p.server] ?? '#7C3AED' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-200 text-xs sm:text-sm font-medium truncate">{p.name}</p>
                  <p className="text-zinc-400 text-xs truncate">{p.org} · {p.rank} ({p.dept || 'Основной'}) · {p.server}</p>
                </div>
                {p.id === activeProfileId && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-medium text-white shadow-sm" style={{ background: 'var(--accent,#7C3AED)' }}>
                    Активен
                  </span>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); openEditProfile(p); }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteProfile(p.id); }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {!settings.isPremium && profiles.length >= 2 && (
              <p className="text-xs text-zinc-500 text-center pt-1">
                Лимит Free: 2 профиля. В Premium доступно до 10 профилей.
              </p>
            )}
          </div>
        )}

        {/* ─── HOTKEYS ─── */}
        {section === 'hotkeys' && (
          <div className="space-y-5">
            <h3 className="text-white text-sm font-medium">Горячие клавиши оверлея</h3>
            
            <div className="space-y-1.5">
              <label className="block text-zinc-300 text-xs font-medium">Основная горячая клавиша</label>
              <p className="text-zinc-500 text-[11px] mb-2">Нажмите на кнопку и нажмите нужную клавишу на клавиатуре</p>
              <HotkeyRecorder
                value={settings.hotkey}
                onChange={(k) => {
                  if (!k) return;
                  updateSettings({ hotkey: k });
                  api?.reregisterShortcuts(k, settings.hotkeyAlt);
                }}
                placeholder="Нажмите клавишу (например: Insert, F10)..."
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="block text-zinc-300 text-xs font-medium">Запасная комбинация (для 60% клавиатур)</label>
              <p className="text-zinc-500 text-[11px] mb-2">Комбинация с модификатором (Alt, Ctrl, Shift)</p>
              <HotkeyRecorder
                value={settings.hotkeyAlt}
                onChange={(k) => {
                  if (!k) return;
                  updateSettings({ hotkeyAlt: k });
                  api?.reregisterShortcuts(settings.hotkey, k);
                }}
                placeholder="Нажмите комбинацию (например: Alt+X)..."
              />
            </div>

            <div className="p-3 rounded-xl text-xs text-zinc-400 bg-white/[0.03] border border-white/5 space-y-1">
              <p className="font-semibold text-zinc-300">💡 Как это работает:</p>
              <p>Нажатие любой из этих клавиш мгновенно открывает или сворачивает оверлей прямо поверх игры Amazing Online.</p>
            </div>
          </div>
        )}

        {/* ─── APPEARANCE & MODERN COLOR PICKER ─── */}
        {section === 'appearance' && (
          <div className="space-y-5">
            <h3 className="text-white text-sm font-medium">Внешний вид и цветовая тема</h3>
            
            {/* Opacity slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Прозрачность окна оверлея</span>
                <span className="text-purple-400 font-mono font-semibold">{Math.round(settings.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={Math.round(settings.opacity * 100)}
                onChange={e => {
                  const v = parseInt(e.target.value) / 100;
                  updateSettings({ opacity: v });
                  api?.setOpacity(v);
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Accent Presets */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="block text-zinc-300 text-xs font-medium">Готовые палитры</label>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_COLORS.map(c => {
                  const locked = c.premium && !settings.isPremium;
                  const isSelected = settings.accentColor.toUpperCase() === c.value.toUpperCase();

                  return (
                    <button
                      key={c.value}
                      onClick={() => !locked && updateSettings({ accentColor: c.value })}
                      disabled={locked}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs border transition-all relative ${
                        isSelected
                          ? 'border-white/40 bg-white/10 shadow-md ring-1 ring-white/20'
                          : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                      } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm flex items-center justify-center"
                        style={{ background: c.value }}
                      >
                        {isSelected && <Check size={10} className="text-white drop-shadow" />}
                      </div>
                      <span className="text-zinc-300 truncate text-[11px] font-medium">{c.label}</span>
                      {locked && <Shield size={9} className="text-yellow-500 absolute top-1 right-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive Color Spectrum Sliders */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-400" />
                  Пользовательский цвет (Ползунки спектра)
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-lg border border-white/20 shadow-md"
                    style={{ background: settings.accentColor }}
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={e => {
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                        updateSettings({ accentColor: e.target.value });
                      }
                    }}
                    className="w-20 px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-white font-mono text-xs uppercase text-center focus:outline-none"
                  />
                </div>
              </div>

              {/* Spectrum Rainbow Slider */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block">Оттенок спектра (Hue): {hue}°</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={hue}
                  onChange={e => {
                    const h = parseInt(e.target.value);
                    setHue(h);
                    updateHslColor(h, lightness);
                  }}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                  }}
                />
              </div>

              {/* Brightness Slider */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block">Яркость: {lightness}%</label>
                <input
                  type="range"
                  min={30}
                  max={75}
                  value={lightness}
                  onChange={e => {
                    const l = parseInt(e.target.value);
                    setLightness(l);
                    updateHslColor(hue, l);
                  }}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>

            {/* Streamer Mode Toggle (Smooth animated toggle) */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div>
                  <p className="text-zinc-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                    {settings.streamerMode ? <EyeOff size={14} className="text-purple-400" /> : <Eye size={14} className="text-zinc-400" />}
                    Режим стримера (OBS Stealth)
                  </p>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    Аппаратное скрытие оверлея от захвата экрана в OBS Studio, Discord и скриншотов
                  </p>
                </div>
                
                {settings.isPremium ? (
                  <button
                    type="button"
                    onClick={() => {
                      const v = !settings.streamerMode;
                      updateSettings({ streamerMode: v });
                      api?.setContentProtection(v);
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                      settings.streamerMode ? 'bg-purple-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        settings.streamerMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    Premium
                  </span>
                )}
              </div>
            </div>

            {/* ─── CMS Gameplay Automation ─── */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <h4 className="text-xs font-semibold text-zinc-300">Автоматизация геймплея (CMS)</h4>
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div>
                  <p className="text-zinc-200 text-xs font-medium">Авто-скриншот F8 при задержании</p>
                  <p className="text-zinc-500 text-[11px]">Автоматический снимок экрана при наручниках, аресте и штрафе</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoScreenshot}
                  onChange={e => updateSettings({ autoScreenshot: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div>
                  <p className="text-zinc-200 text-xs font-medium">Сортировка скриншотов по датам</p>
                  <p className="text-zinc-500 text-[11px]">Создавать папки /screens/YYYY-MM-DD для отчётов</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoScreenshotSort}
                  onChange={e => updateSettings({ autoScreenshotSort: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div>
                  <p className="text-zinc-200 text-xs font-medium">Авто-надевание маски (/mask)</p>
                  <p className="text-zinc-500 text-[11px]">Автоматически скрывать никнейм при начале спецопераций</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoMask}
                  onChange={e => updateSettings({ autoMask: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── PREMIUM ─── */}
        {section === 'premium' && (
          <div className="space-y-4">
            <h3 className="text-white text-sm font-medium">
              {settings.isPremium ? '✨ Лицензия Premium активна' : 'Активация Premium'}
            </h3>
            {settings.isPremium ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900/80 to-indigo-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-400" />
                    Пожизненная лицензия (1 999 ₽)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Активна навсегда
                  </span>
                </div>
                <p className="text-zinc-300 text-xs font-mono">
                  Ключ: <span className="text-zinc-400">{settings.premiumKey || 'KEYAUTH-AMAZING-PRO-FOREVER'}</span>
                </p>
                <p className="text-emerald-400 text-xs flex items-center gap-1">
                  <Check size={13} /> Все функции разблокированы: ИИ-Юрист, Доклады, OBS Stealth, 10 профилей.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {[
                    'ИИ-Юрист AmazingAI (все законы 12 серверов)',
                    'Авто-доклады в рацию Amazing Online',
                    'Режим стримера (OBS/Discord Stealth)',
                    'Импорт AutoHotkey (.ahk) скриптов',
                    'До 10 профилей персонажей',
                    'Эксклюзивные палитры и спектральные темы',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2 text-zinc-300 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="relative pt-2">
                  <Key size={14} className="absolute left-3 top-5 text-zinc-500" />
                  <input
                    value={premiumKey}
                    onChange={e => { setPremiumKey(e.target.value); setKeyStatus('idle'); }}
                    placeholder="Введи ключ Premium..."
                    className="w-full pl-8 pr-28 py-2.5 rounded-xl text-xs sm:text-sm text-white bg-zinc-800 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
                  />
                  <button
                    onClick={checkKey}
                    disabled={!premiumKey.trim() || keyStatus === 'checking'}
                    className="absolute right-1.5 top-3.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shadow"
                    style={{ background: 'var(--accent,#7C3AED)' }}
                  >
                    {keyStatus === 'checking' ? '...' : 'Активировать'}
                  </button>
                </div>
                {keyStatus === 'ok' && <p className="text-emerald-400 text-xs">✓ Premium успешно активирован!</p>}
                {keyStatus === 'fail' && <p className="text-red-400 text-xs">Недействительный ключ</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
