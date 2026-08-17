import React, { useState } from 'react';
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronUp, Copy, Check,
  Navigation, Home, Building2, MapPin, Send
} from 'lucide-react';
import { useAppStore, Hint } from '../store';
import { sendToGameChat } from '../lib/gameSender';
import HotkeyRecorder from './HotkeyRecorder';
import MarkdownView from './MarkdownView';

export default function HintsTab() {
  const { hints, addHint, updateHint, deleteHint } = useAppStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Hint | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', hotkey: '' });

  // CMS GPS Tool State
  const [showGpsTool, setShowGpsTool] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [estateNumber, setEstateNumber] = useState('');
  const [gpsResult, setGpsResult] = useState<string | null>(null);

  const openCreate = () => { setForm({ title: '', content: '', hotkey: '' }); setEditing(null); setCreating(true); };
  const openEdit = (h: Hint) => { setForm({ title: h.title, content: h.content, hotkey: h.hotkey }); setEditing(h); setCreating(true); };

  const save = () => {
    if (!form.title.trim()) return;
    if (editing) {
      updateHint(editing.id, form);
    } else {
      addHint(form);
    }
    setCreating(false);
    setEditing(null);
  };

  const copy = async (text: string, id: string) => {
    await sendToGameChat(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  // CMS GPS Calculator
  const calcGpsHouse = () => {
    const n = parseInt(houseNumber);
    if (isNaN(n) || n < 1 || n > 541) {
      setGpsResult('Номер дома должен быть от 1 до 541');
      return;
    }
    const cmd = `/gps > Пункт 15 (Дома) > №${n}`;
    navigator.clipboard.writeText(`/gps`);
    setGpsResult(`Маршрут к дому №${n} скопирован в буфер!`);
    setTimeout(() => setGpsResult(null), 2500);
  };

  const calcGpsEstate = () => {
    const n = parseInt(estateNumber);
    if (isNaN(n) || n < 1 || n > 53) {
      setGpsResult('Номер особняка должен быть от 1 до 53');
      return;
    }
    navigator.clipboard.writeText(`/gps`);
    setGpsResult(`Маршрут к особняку №${n} скопирован в буфер!`);
    setTimeout(() => setGpsResult(null), 2500);
  };

  if (creating) {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-medium">{editing ? 'Редактировать' : 'Новая шпаргалка'}</h3>
        </div>
        <div className="space-y-3 flex-1">
          <div>
            <label className="block text-zinc-400 text-xs mb-1">Название</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-zinc-800/80 border border-white/10 focus:outline-none focus:border-white/25 placeholder:text-zinc-600"
              placeholder="Например: Миранда или Статьи КоАП"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs mb-1">Горячая клавиша (нажмите для записи)</label>
            <HotkeyRecorder
              value={form.hotkey}
              onChange={key => setForm(f => ({ ...f, hotkey: key }))}
              placeholder="Нажмите комбинацию клавиш..."
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-zinc-400 text-xs mb-1">Текст шпаргалки</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-zinc-800/80 border border-white/10 focus:outline-none focus:border-white/25 placeholder:text-zinc-600 resize-none"
              placeholder="Текст шпаргалки (поддерживает Markdown списки, статьи)..."
              rows={8}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setCreating(false); setEditing(null); }}
            className="flex-1 py-2 rounded-lg text-xs text-zinc-400 border border-white/10 hover:border-white/20"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={!form.title.trim()}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 shadow-md"
            style={{ background: 'var(--accent,#7C3AED)' }}
          >
            {editing ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar with GPS navigator button */}
      <div className="p-3 bg-black/30 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGpsTool(!showGpsTool)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
              showGpsTool
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <Navigation size={13} className={showGpsTool ? 'text-purple-400' : 'text-zinc-400'} />
            <span>GPS Навигатор</span>
          </button>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all"
          style={{ background: 'var(--accent,#7C3AED)' }}
        >
          <Plus size={13} />
          Шпаргалка
        </button>
      </div>

      {/* CMS Fast GPS Navigator Tool Drawer */}
      {showGpsTool && (
        <div className="p-3 bg-zinc-900/90 border-b border-white/10 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <MapPin size={13} className="text-purple-400" />
              Быстрый GPS навигатор Amazing Online
            </span>
            <button onClick={() => setShowGpsTool(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* House Search */}
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <label className="text-[11px] text-zinc-300 flex items-center gap-1">
                <Home size={11} className="text-purple-400" />
                Номер дома (1 - 541):
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min={1}
                  max={541}
                  value={houseNumber}
                  onChange={e => setHouseNumber(e.target.value)}
                  placeholder="№ дома"
                  className="w-full px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white text-xs focus:outline-none"
                />
                <button
                  onClick={calcGpsHouse}
                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                >
                  GPS
                </button>
              </div>
            </div>

            {/* Estate Search */}
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <label className="text-[11px] text-zinc-300 flex items-center gap-1">
                <Building2 size={11} className="text-purple-400" />
                Номер особняка (1 - 53):
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min={1}
                  max={53}
                  value={estateNumber}
                  onChange={e => setEstateNumber(e.target.value)}
                  placeholder="№ особняка"
                  className="w-full px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white text-xs focus:outline-none"
                />
                <button
                  onClick={calcGpsEstate}
                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                >
                  GPS
                </button>
              </div>
            </div>
          </div>

          {gpsResult && (
            <p className="text-xs text-emerald-400 text-center font-medium animate-in fade-in">
              ✓ {gpsResult}
            </p>
          )}
        </div>
      )}

      {/* Hints List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {hints.map(h => {
          const isExp = expanded === h.id;
          return (
            <div
              key={h.id}
              className="rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all overflow-hidden"
            >
              <div
                className="p-3 flex items-center gap-2 cursor-pointer"
                onClick={() => setExpanded(isExp ? null : h.id)}
              >
                <span className="text-xs sm:text-sm font-semibold text-white flex-1">{h.title}</span>
                {h.hotkey && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20">
                    {h.hotkey}
                  </span>
                )}
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => copy(h.content, h.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Скопировать текст"
                  >
                    {copied === h.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={() => openEdit(h)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Редактировать"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteHint(h.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Удалить"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-zinc-500">
                  {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {isExp && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 text-xs text-zinc-300 select-text">
                  <MarkdownView content={h.content} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
