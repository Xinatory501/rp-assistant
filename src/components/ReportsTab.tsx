import React, { useState, useMemo } from 'react';
import { Copy, Check, Edit2, Trash2, Plus, Radio, Lock, RefreshCw, Send, Zap } from 'lucide-react';
import { useAppStore, ReportTemplate } from '../store';
import { renderTemplate } from '../constants';
import { sendToGameChat } from '../lib/gameSender';
import { getReportsForOrg, getPostsForOrg } from '../lib/orgReports';

export default function ReportsTab() {
  const { reportTemplates, addReportTemplate, updateReportTemplate, deleteReportTemplate, getActiveProfile, settings } = useAppStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [count, setCount] = useState('2');
  const [status, setStatus] = useState('стабильное');
  const [currentPost, setCurrentPost] = useState('');
  const [partner, setPartner] = useState('Иванов');
  const [reason, setReason] = useState('окончание смены');
  const [targetOrg, setTargetOrg] = useState('УМВД');
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', template: '' });

  const profile = getActiveProfile();
  const org = profile?.org || 'УГИБДД';
  const isGov = org.startsWith('ПР');
  const isEss = org.startsWith('ЕСС');
  const defaultPosts = useMemo(() => getPostsForOrg(org), [org]);
  const activeReports = useMemo(() => {
    return getReportsForOrg(org);
  }, [org]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const copy = async (text: string, id: string) => {
    // Send directly into game chat + clipboard
    await sendToGameChat(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
    showToast('⚡ Отправлено в чат игры (F6 + Enter)!');
  };

  const renderReport = (template: string) => {
    if (!profile) return template;
    return renderTemplate(template, profile, {
      count,
      status,
      post: currentPost || profile.post || defaultPosts[0] || 'Мост г. Южный',
      partner,
      reason,
      targetOrg
    });
  };

  if (creating) {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        <h3 className="text-white text-sm font-medium">{editing ? 'Редактировать шаблон' : 'Новый шаблон доклада'}</h3>
        <div>
          <label className="block text-zinc-400 text-xs mb-1">Название</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm text-white bg-zinc-800/80 border border-white/10 focus:outline-none focus:border-white/25"
            placeholder="Заступление на пост" />
        </div>
        <div className="flex-1">
          <label className="block text-zinc-400 text-xs mb-1">Шаблон доклада в рацию</label>
          <textarea value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-xs text-white bg-zinc-800/80 border border-white/10 focus:outline-none focus:border-white/25 resize-none font-mono leading-relaxed"
            rows={4} placeholder="[{org}] Докладывает: {rank} {name}. Заступил на пост «{post}». Состояние: {status}." />
          <p className="text-zinc-500 text-[11px] mt-1.5 leading-normal">
            Доступные теги: <code className="text-purple-300 font-mono">{'{org}'}</code>, <code className="text-purple-300 font-mono">{'{rank}'}</code>, <code className="text-purple-300 font-mono">{'{name}'}</code>, <code className="text-purple-300 font-mono">{'{post}'}</code>, <code className="text-purple-300 font-mono">{'{status}'}</code>, <code className="text-purple-300 font-mono">{'{count}'}</code>, <code className="text-purple-300 font-mono">{'{partner}'}</code>, <code className="text-purple-300 font-mono">{'{reason}'}</code>
          </p>
        </div>
        {form.template && profile && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-zinc-500 text-[11px] mb-1">Предпросмотр в чате рации:</p>
            <p className="text-zinc-200 text-xs font-mono">{renderReport(form.template)}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => { setCreating(false); setEditing(null); }}
            className="flex-1 py-2 rounded-lg text-xs text-zinc-400 border border-white/10 hover:border-white/20 transition-all">
            Отмена
          </button>
          <button onClick={() => {
            if (!form.title.trim() || !form.template.trim()) return;
            if (editing) updateReportTemplate(editing.id, form);
            else addReportTemplate(form);
            setCreating(false); setEditing(null);
          }} disabled={!form.title.trim() || !form.template.trim()}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-40"
            style={{ background: 'var(--accent,#7C3AED)' }}>
            {editing ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar with variables */}
      <div className="p-3 border-b border-white/5 bg-black/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-purple-400" />
            <h3 className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
              Доклады в рацию • {org}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setForm({ title: '', template: '' }); setEditing(null); setCreating(true); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all">
              <Plus size={13} />
              Шаблон
            </button>
          </div>
        </div>

        {/* Quick Post Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[10px] text-zinc-500 font-medium flex-shrink-0">Посты:</span>
          {defaultPosts.slice(0, 5).map(p => {
            const shortP = p.split(' ')[0];
            const isSelected = (currentPost || profile?.post || defaultPosts[0]) === p;
            return (
              <button
                key={p}
                onClick={() => setCurrentPost(p)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-purple-500/25 border border-purple-400/40 text-purple-200 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
                title={p}
              >
                {shortP}
              </button>
            );
          })}
        </div>

        {/* Dynamic controls for report */}
        <div className={`grid ${isGov ? 'grid-cols-3' : 'grid-cols-4'} gap-2 text-xs`}>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-0.5">Пост</label>
            <input
              value={currentPost}
              onChange={e => setCurrentPost(e.target.value)}
              placeholder={profile?.post || defaultPosts[0] || 'В-1'}
              className="w-full px-2 py-1 rounded bg-zinc-800 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none font-mono"
            />
          </div>

          {!isGov && !isEss && (
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Состав (чел)</label>
              <input
                type="number"
                value={count}
                onChange={e => setCount(e.target.value)}
                min={1}
                max={20}
                className="w-full px-2 py-1 rounded bg-zinc-800 border border-white/10 text-white text-xs text-center focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] text-zinc-500 block mb-0.5">Состояние</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-1.5 py-1 rounded bg-zinc-800 border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="стабильное">стабильное</option>
              <option value="спокойное">спокойное</option>
              <option value="напряженное">напряженное</option>
              <option value="нападение!">нападение!</option>
            </select>
          </div>

          {isGov ? (
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Причина схода</label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="окончание смены"
                className="w-full px-2 py-1 rounded bg-zinc-800 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Напарник</label>
              <input
                value={partner}
                onChange={e => setPartner(e.target.value)}
                placeholder="Фамилия"
                className="w-full px-2 py-1 rounded bg-zinc-800 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {!profile && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20">
          ⚠️ Нет активного профиля. Выберите или создайте профиль в настройках.
        </div>
      )}

      {toast && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse font-medium">
          <Zap size={13} className="text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {activeReports.map(r => {
          const rendered = profile ? renderReport(r.template) : r.template;
          const isCopied = copied === r.id;

          return (
            <div
              key={r.id}
              onClick={() => copy(rendered, r.id)}
              className="p-2.5 rounded-xl bg-white/[0.025] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-200 text-xs font-semibold group-hover:text-purple-300 transition-colors">
                  {r.title}
                </span>
                
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => copy(rendered, r.id)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Скопировать"
                  >
                    {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => { setForm({ title: r.title, template: r.template }); setEditing(r); setCreating(true); }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    title="Редактировать"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => deleteReportTemplate(r.id)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Удалить"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Rendered Text */}
              <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 font-mono text-[11px] text-zinc-400 group-hover:text-zinc-200 leading-relaxed select-text transition-colors">
                {rendered}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
