import React, { useState, useRef } from 'react';
import {
  Plus, Trash2, Edit2, Copy, Check, Hash, Crosshair,
  Heart, Zap, Siren, Radio, Upload, Send
} from 'lucide-react';
import { useAppStore, Bind } from '../store';
import { parseAhkScript } from '../lib/ahkParser';
import { parseChatlogLine } from '../lib/chatlogParser';
import { sendToGameChat, sendLinesToGameChat } from '../lib/gameSender';
import { getShortOrgTag, getShortDeptTag, getCleanRank } from '../constants';
import { getRadioRussianSurname, transliterateNickToRussian } from '../lib/nameTranslit';
import HotkeyRecorder from './HotkeyRecorder';

export default function BinderTab() {
  const {
    binds, addBind, updateBind, deleteBind,
    targetId, targetType, setTargetId, setTargetType, getActiveProfile,
    addProfile, saveCurrentAsConfig
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<Bind, 'id'>>({
    title: '',
    key: '',
    lines: [{ text: '', delay: 0 }],
  });

  const profile = getActiveProfile();

  const showToast = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(null), 2200);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseAhkScript(text, file.name);

    addProfile({
      name: parsed.profileName,
      server: parsed.server,
      org: parsed.org,
      dept: parsed.dept,
      rank: parsed.rank,
      callsign: 'Сокол-1',
      post: 'Мост г. Южный',
    });

    parsed.binds.forEach(b => addBind(b));
    saveCurrentAsConfig(`Импорт: ${parsed.title}`, `Импортировано из ${file.name}`);
    showToast(`Импортировано ${parsed.binds.length} биндов из ${file.name}!`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => setForm({ title: '', key: '', lines: [{ text: '', delay: 0 }] });

  const openCreate = () => { resetForm(); setEditingId(null); setCreating(true); };
  const openEdit = (b: Bind) => {
    setForm({ title: b.title, key: b.key, lines: [...b.lines] });
    setEditingId(b.id);
    setCreating(true);
  };

  const save = () => {
    const lines = form.lines.filter(l => l.text.trim());
    if (!form.title.trim() || !form.key.trim() || lines.length === 0) return;
    if (editingId) updateBind(editingId, { ...form, lines });
    else addBind({ ...form, lines });
    setCreating(false);
    setEditingId(null);
  };

  const copyBind = async (b: Bind, id: string) => {
    const orgTag = getShortOrgTag(profile?.org);
    const deptTag = getShortDeptTag(profile?.dept) || orgTag;
    const tid = targetId || '0';
    const rawName = profile?.name || 'Ivan_Ivanov';
    const ruSurname = getRadioRussianSurname(rawName, profile?.nameRu);
    const ruFullName = transliterateNickToRussian(rawName);

    const renderedLines = b.lines.map(l => {
      let t = l.text;
      t = t.replace(/\{id\}/g, tid);
      t = t.replace(/\{rank\}/g, getCleanRank(profile?.rank || 'Лейтенант'));
      t = t.replace(/\{name\}/g, ruSurname);
      t = t.replace(/\{surname\}/g, ruSurname);
      t = t.replace(/\{fullname\}/g, ruFullName);
      t = t.replace(/\{nick\}/g, rawName);
      t = t.replace(/\{org\}/g, orgTag);
      t = t.replace(/\{dept\}/g, deptTag);
      return { text: t, delay: l.delay || 1000 };
    });

    // Auto-send directly into game chat + clipboard
    await sendLinesToGameChat(renderedLines);

    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
    showToast(`⚡ Отправлено в чат игры (F6+Enter): ${b.title}`);
  };

  const execQuickCmd = async (cmd: string, label: string) => {
    const tid = targetId || '0';
    const orgTag = getShortOrgTag(profile?.org);
    let full = cmd.replace(/\{id\}/g, tid);
    full = full.replace(/\{org\}/g, orgTag);

    // Auto-send directly into game chat + clipboard
    await sendToGameChat(full);
    showToast(`⚡ Отправлено в игру: ${full}`);
  };

  if (creating) {
    return (
      <div className="flex flex-col h-full p-4 gap-3 bg-zinc-950/40">
        <h3 className="text-white text-sm font-semibold">{editingId ? 'Редактировать бинд' : 'Новый бинд'}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-zinc-400 text-xs mb-1">Название бинда</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-zinc-800/80 border border-white/10 focus:outline-none focus:border-white/30 placeholder:text-zinc-600"
              placeholder="Задержание"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs mb-1">Клавиша</label>
            <HotkeyRecorder
              value={form.key}
              onChange={k => setForm(f => ({ ...f, key: k }))}
              placeholder="Нажмите клавишу..."
              className="w-full"
            />
          </div>
        </div>

        {/* Lines editor */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          <div className="flex items-center justify-between">
            <label className="text-zinc-400 text-xs">Строки RP-отыгровки ({form.lines.length})</label>
            <button
              onClick={() => setForm(f => ({ ...f, lines: [...f.lines, { text: '', delay: 1000 }] }))}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <Plus size={12} /> Добавить строку
            </button>
          </div>

          {form.lines.map((l, i) => (
            <div key={i} className="flex gap-2 items-center bg-white/[0.02] p-1.5 rounded-xl border border-white/5">
              <span className="text-zinc-500 text-xs w-4 font-mono text-center">{i + 1}</span>
              <input
                value={l.text}
                onChange={e => {
                  const lines = [...form.lines];
                  lines[i].text = e.target.value;
                  setForm(f => ({ ...f, lines }));
                }}
                className="flex-1 px-2.5 py-1 rounded-lg text-xs text-white bg-zinc-800 border border-white/10 focus:outline-none font-mono"
                placeholder="/me резким движением достал наручники"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={l.delay}
                  onChange={e => {
                    const lines = [...form.lines];
                    lines[i].delay = parseInt(e.target.value) || 0;
                    setForm(f => ({ ...f, lines }));
                  }}
                  className="w-14 px-1.5 py-1 rounded-lg text-xs text-center text-zinc-300 bg-zinc-800 border border-white/10 focus:outline-none"
                  placeholder="мс"
                  min={0}
                  step={100}
                />
                <span className="text-zinc-500 text-[10px]">мс</span>
              </div>
              {form.lines.length > 1 && (
                <button
                  onClick={() => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))}
                  className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button
            onClick={() => { setCreating(false); setEditingId(null); }}
            className="flex-1 py-1.5 rounded-xl text-xs text-zinc-400 border border-white/10 hover:border-white/20 transition-all"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={!form.title.trim() || !form.key.trim()}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 shadow-md"
            style={{ background: 'var(--accent,#7C3AED)' }}
          >
            {editingId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Row A: Target ──────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-black/20">
        {/* ID / Mask toggle */}
        <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.07] text-[10px] shrink-0">
          <button
            type="button"
            onClick={() => setTargetType('id')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              targetType === 'id' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => setTargetType('mask')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
              targetType === 'mask' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Маска
          </button>
        </div>

        {/* Number input */}
        <div className="flex items-center gap-1.5 flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 h-7">
          <Crosshair size={12} className="text-purple-400 shrink-0" />
          <input
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            placeholder={targetType === 'mask' ? 'Номер маски...' : 'ID игрока...'}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none font-mono"
          />
        </div>

        {/* Paste from chat */}
        <button
          type="button"
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              const detected = parseChatlogLine(text);
              if (detected) {
                setTargetId(detected.id, detected.type);
                showToast(`Захвачено: ${detected.name || detected.id}`);
              } else if (/^\d+$/.test(text.trim())) {
                setTargetId(text.trim());
                showToast(`Цель: ${text.trim()}`);
              } else {
                showToast('В буфере нет ID');
              }
            } catch {
              showToast('Буфер недоступен');
            }
          }}
          className="shrink-0 h-7 px-2 rounded-lg text-[11px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-zinc-300 transition-colors"
          title="Вставить из скопированной строки чата"
        >
          Из чата
        </button>

        {/* Import & New */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".ahk,.txt,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 h-7 px-2 rounded-lg text-[11px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-zinc-300 transition-colors flex items-center gap-1"
          title="Импорт .ahk"
        >
          <Upload size={12} /> .ahk
        </button>
        <button
          onClick={openCreate}
          className="shrink-0 h-7 px-3 rounded-lg text-[11px] font-semibold text-white transition-colors flex items-center gap-1"
          style={{ background: 'var(--accent,#7C3AED)' }}
        >
          <Plus size={12} /> Бинд
        </button>
      </div>

      {/* ── Row B: Quick Commands ─────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.06] bg-black/10 flex-wrap">
        <span className="text-[10px] text-zinc-500 shrink-0">Цель:</span>
        <button onClick={() => execQuickCmd(targetType === 'mask' ? '/chaseid {id}' : '/chase {id}', 'Погоня')}
          className="flex items-center gap-1 h-6 px-2 rounded-lg text-[11px] bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/20 transition-colors">
          <Crosshair size={10} />/chase
        </button>
        <button onClick={() => execQuickCmd('/cuff {id}', 'Наручники')}
          className="h-6 px-2 rounded-lg text-[11px] text-zinc-300 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors">
          /cuff
        </button>
        <button onClick={() => execQuickCmd('/incar {id}', 'В авто')}
          className="h-6 px-2 rounded-lg text-[11px] text-zinc-300 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors">
          /incar
        </button>
        <button onClick={() => execQuickCmd('/frisk {id}', 'Обыск')}
          className="h-6 px-2 rounded-lg text-[11px] text-zinc-300 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors">
          /frisk
        </button>
        <button onClick={() => execQuickCmd(targetType === 'mask' ? '/dejectid {id}' : '/deject {id}', 'Высадить')}
          className="h-6 px-2 rounded-lg text-[11px] text-zinc-300 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors">
          /deject
        </button>

        <div className="mx-1 w-px h-4 bg-white/10 shrink-0" />

        <button onClick={() => execQuickCmd('/healme', 'Аптечка')}
          className="flex items-center gap-1 h-6 px-2 rounded-lg text-[11px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 transition-colors">
          <Heart size={10} /> Аптечка
        </button>
        <button onClick={() => execQuickCmd('/sos', 'SOS')}
          className="flex items-center gap-1 h-6 px-2 rounded-lg text-[11px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 transition-colors">
          <Siren size={10} /> SOS
        </button>
        <button onClick={() => execQuickCmd('/m Водитель ТС, прижмитесь к обочине и заглушите двигатель!', 'Мегафон')}
          className="flex items-center gap-1 h-6 px-2 rounded-lg text-[11px] text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/15 transition-colors">
          <Radio size={10} /> Мегафон
        </button>

        {quickNotice && (
          <span className="ml-auto text-[10px] text-purple-300 font-medium animate-in fade-in shrink-0">
            ✓ {quickNotice}
          </span>
        )}
      </div>

      {/* ─── Binds List ─── */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {binds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center opacity-50">
            <Hash size={24} className="text-zinc-500" />
            <p className="text-xs text-zinc-400">Список биндов пуст</p>
          </div>
        ) : (
          binds.map(b => (
            <div
              key={b.id}
              className="p-2.5 rounded-xl bg-white/[0.025] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-2 group"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white truncate">{b.title}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20">
                    {b.key}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono truncate">
                  {b.lines[0]?.text || ''}
                  {b.lines.length > 1 && <span className="text-zinc-600 font-sans ml-1">(+{b.lines.length - 1})</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyBind(b, b.id)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Скопировать"
                >
                  {copied === b.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Редактировать"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => deleteBind(b.id)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Удалить"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
