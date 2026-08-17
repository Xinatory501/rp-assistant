import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Loader2, Lock, AlertTriangle, Sparkles, BookOpen,
  History, Plus, Trash2, MessageSquare, ChevronRight, X, Clock, Check,
  Paperclip, FileText
} from 'lucide-react';
import { useAppStore } from '../store';
import { findMatchingLaw } from '../lib/lawsKnowledge';
import { fastClassifyTopic, buildTargetedLawContext } from '../lib/targetedLaws';
import MarkdownView from './MarkdownView';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  server: string;
  createdAt: number;
  messages: Message[];
}

export default function ChatTab() {
  const { settings, getActiveProfile } = useAppStore();
  const profile = getActiveProfile();
  const currentServer = profile?.server || 'Red';

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from persistent storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rp_chat_sessions');
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          const lastActive = localStorage.getItem('rp_active_session_id');
          const valid = parsed.find(s => s.id === lastActive) ? lastActive : parsed[0].id;
          setActiveSessionId(valid);
        }
      }
    } catch (e) {
      console.warn('Error loading chat sessions', e);
    }
  }, []);

  // Get active session and its messages
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const currentMessages = activeSession ? activeSession.messages : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, loading]);

  // Save sessions to storage helper
  const saveSessions = (newSessions: ChatSession[], newActiveId?: string | null) => {
    setSessions(newSessions);
    try {
      localStorage.setItem('rp_chat_sessions', JSON.stringify(newSessions));
      if (newActiveId !== undefined) {
        setActiveSessionId(newActiveId);
        if (newActiveId) {
          localStorage.setItem('rp_active_session_id', newActiveId);
        } else {
          localStorage.removeItem('rp_active_session_id');
        }
      }
    } catch (e) {}
  };

  // Create new conversation
  const createNewChat = () => {
    const newId = 'chat-' + Math.random().toString(36).slice(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: 'Новый диалог',
      server: currentServer,
      createdAt: Date.now(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated, newId);
    setShowHistory(false);
    setInput('');
    setAiError('');
  };

  // Delete specific session
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    const nextActive = activeSessionId === id ? (updated[0]?.id || null) : activeSessionId;
    saveSessions(updated, nextActive);
    // Reset session in DeepSeek proxy
    fetch(`http://localhost:9655/reset-session?agent=${encodeURIComponent(id)}`, { method: 'POST' }).catch(() => {});
  };

  // Clear all history
  const clearAllHistory = () => {
    if (window.confirm('Очистить всю историю диалогов?')) {
      saveSessions([], null);
      fetch('http://localhost:9655/reset-session?agent=all', { method: 'POST' }).catch(() => {});
    }
  };

  if (!settings.isPremium) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <MessageSquare size={22} className="text-purple-400" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-medium mb-1">ИИ-Юрист AmazingAI — Premium</h3>
          <p className="text-zinc-400 text-sm max-w-xs">
            Задавай любые вопросы по законодательству Amazing Online и получай мгновенные ответы от AmazingAI с сохранением истории диалогов.
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 shadow-lg shadow-purple-600/30"
          style={{ background: 'var(--accent,#7C3AED)' }}
        >
          Активировать Premium (1 999 ₽)
        </button>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setAiError('');

    let targetSessionId = activeSessionId;
    let targetSession = activeSession;

    // If no active session, create one
    if (!targetSessionId || !targetSession) {
      targetSessionId = 'chat-' + Math.random().toString(36).slice(2, 9);
      targetSession = {
        id: targetSessionId,
        title: userMsg.slice(0, 32) + (userMsg.length > 32 ? '...' : ''),
        server: currentServer,
        createdAt: Date.now(),
        messages: [],
      };
      const updated = [targetSession, ...sessions];
      saveSessions(updated, targetSessionId);
    }

    const updatedUserMessages: Message[] = [
      ...targetSession.messages,
      { role: 'user', content: userMsg, timestamp: Date.now() },
    ];

    const sessionTitle = targetSession.messages.length === 0
      ? userMsg.slice(0, 32) + (userMsg.length > 32 ? '...' : '')
      : targetSession.title;

    const sessionWithUserMsg: ChatSession = {
      ...targetSession,
      title: sessionTitle,
      server: currentServer,
      messages: updatedUserMessages,
    };

    const intermediateSessions = sessions.map(s => s.id === targetSessionId ? sessionWithUserMsg : s);
    if (!sessions.some(s => s.id === targetSessionId)) {
      intermediateSessions.unshift(sessionWithUserMsg);
    }
    saveSessions(intermediateSessions, targetSessionId);

    setLoading(true);

    try {
      const server = currentServer;
      const org = profile?.org || 'УГИБДД';
      const rank = profile?.rank || 'Лейтенант';
      const name = profile?.name || 'Гражданин';

      // 1. Determine categories for the user's question
      const categories = fastClassifyTopic(userMsg, org);

      let targetedLawsText = '';
      let loadedDocNames: string[] = [];

      try {
        const resp = await fetch(`/laws_indexed/${server.toLowerCase()}.json`);
        if (resp.ok) {
          const indexedDocs = await resp.json();
          const targeted = buildTargetedLawContext(indexedDocs, categories, 110000);
          targetedLawsText = targeted.contextText;
          loadedDocNames = targeted.loadedFiles;
        }
      } catch (e) {}

      // Fallback to full laws file if indexed JSON is not available
      if (!targetedLawsText) {
        try {
          const resp = await fetch(`/laws/${server.toLowerCase()}.txt`);
          if (resp.ok) {
            targetedLawsText = (await resp.text()).slice(0, 110000);
          }
        } catch (e) {}
      }

      const fileName = `laws_${server.toLowerCase()}_${categories.join('_').toLowerCase()}.txt`;
      const fileKb = Math.round(targetedLawsText.length / 1024);

      // Prepare messages for DeepSeek
      const isFirstTurn = targetSession.messages.length === 0;
      let requestMessages: Array<{ role: string; content: string }> = [];

      if (isFirstTurn) {
        // First message in chat: attach the targeted law documents
        const fileContextPrompt = `[ПРИКРЕПЛЕННЫЙ ФАЙЛ БАЗЫ ЗНАНИЙ: ${fileName}]
Имя документа: ${fileName}
Сервер Amazing Online: ${server.toUpperCase()}
Сферы вопроса: ${categories.join(', ')}
Подключенные законы: ${loadedDocNames.length > 0 ? loadedDocNames.join(', ') : 'Нормативная база сервера ' + server}
Пользователь: ${name} (организация: ${org}, звание/должность: ${rank})

<file name="${fileName}">
=== ЦЕЛЕВАЯ ЗАКОНОДАТЕЛЬНАЯ БАЗА СЕРВЕРА ${server.toUpperCase()} (${categories.join(', ')}) ===
${targetedLawsText || 'База нормативно-правовых актов сервера ' + server}
=== КОНЕЦ ДОКУМЕНТА ===
</file>

ИНСТРУКЦИИ ДЛЯ ОТВЕТА (СТРОГО БЕЗ ВОДЫ И ВСТУПЛЕНИЙ):
1. ЗАПРЕЩЕНО писать любые вступительные и приветственные фразы («Здравствуйте», «Отвечу как юрист», «Проанализировав файл», «Основываясь на нормах»). Сразу переходи к сути.
2. В САМОЙ ПЕРВОЙ СТРОКЕ напиши точную статью/пункт закона жирным шрифтом и краткий четкий вердикт:
   📌 **[Кодекс/Закон, Статья/Пункт]** — [Прямой краткий ответ].
3. Далее краткими тезисами (списком) распиши:
   • **Суть нормы:** что именно гласит статья или пункт.
   • **Наказание / Санкция:** штраф, уровень розыска, срок в ИК, выговор или увольнение (если применимо).
   • **Порядок действий сотрудника / Исключения:** как правильно действовать по правилам сервера.
4. Отвечай кратко, чётко, только факты и конкретные статьи из прикрепленного файла базы знаний.

Вопрос пользователя:
${userMsg}`;

        requestMessages = [
          { role: 'user', content: fileContextPrompt }
        ];
      } else {
        // Subsequent messages in existing chat: just send conversation history
        requestMessages = updatedUserMessages.map(m => ({
          role: m.role,
          content: m.content
        }));
      }

      let reply = '';

      // Try local DeepSeek proxy with isolated chat session
      try {
        const response = await fetch('http://localhost:9655/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-agent-session': targetSessionId,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            user: targetSessionId,
            session: targetSessionId,
            messages: requestMessages,
            stream: false,
            max_tokens: 1024,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices?.[0]?.message?.content) {
            reply = data.choices[0].message.content;
          } else if (data.error) {
            setAiError(`AmazingAI: ${data.error.message || JSON.stringify(data.error)}`);
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('AmazingAI API HTTP error:', response.status, errData);
          if (errData?.error?.message) {
            setAiError(`AmazingAI: ${errData.error.message}`);
          }
        }
      } catch (fetchErr: any) {
        console.warn('AmazingAI proxy error:', fetchErr);
        if (fetchErr?.message) {
          setAiError(`AmazingAI: ${fetchErr.message}`);
        }
      }

      // Step 2: Semantic Law Knowledge Engine Fallback
      if (!reply) {
        await new Promise(r => setTimeout(r, 450));
        
        const directMatch = findMatchingLaw(userMsg, server);
        if (directMatch) {
          reply = directMatch;
        } else {
          reply = `По вашему запросу («${userMsg}») для сервера **${server}**:

Все юридические и процессуальные действия на сервере регулируются:
1. **Уголовным кодексом (УК)** и **КоАП** — в части квалификации правонарушений и назначения санкций.
2. **Уголовно-процессуальным кодексом (УПК)** — в части порядка задержания, следственных действий и досмотра.
3. **Общим уставом государственных структур (ОУГ)** — в части субординации, служебных полномочий и проверок.

Уточните, пожалуйста, конкретную ситуацию или интересующую статью (например: *«основания проверок правительством»*, *«применение оружия»*, *«статья за неподчинение»*, *«правило Миранды»*).`;
        }
      }

      const finalMessages: Message[] = [
        ...updatedUserMessages,
        { role: 'assistant', content: reply, timestamp: Date.now() },
      ];

      const finalizedSession: ChatSession = {
        ...sessionWithUserMsg,
        messages: finalMessages,
      };

      const finalSessions = sessions.map(s => s.id === targetSessionId ? finalizedSession : s);
      if (!sessions.some(s => s.id === targetSessionId)) {
        finalSessions.unshift(finalizedSession);
      }
      saveSessions(finalSessions, targetSessionId);

    } catch (e: any) {
      setAiError('Ошибка обработки юридического запроса. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full relative overflow-hidden">
      
      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Control Bar with History Toggle */}
        <div className="px-3 py-2 bg-black/30 border-b border-white/5 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs ${
                showHistory
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300'
              }`}
              title="Открыть историю всех диалогов"
            >
              <History size={13} className={showHistory ? 'text-purple-400' : 'text-zinc-400'} />
              <span>История</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-white/10 text-zinc-400 font-mono">
                {sessions.length}
              </span>
            </button>

            <button
              onClick={createNewChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition-all text-xs"
              title="Создать новый чистый диалог"
            >
              <Plus size={13} />
              <span>Новый диалог</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-200 font-semibold flex items-center gap-1">
              <Sparkles size={12} className="text-purple-400" />
              AmazingAI
            </span>
            <span className="text-[10px] text-purple-300 font-mono px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 font-medium">
              {currentServer}
            </span>
          </div>
        </div>

        {/* Messages Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center opacity-80">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--accent,#7C3AED)' }}>
                <BookOpen size={16} className="text-white" />
              </div>
              <div>
                <p className="text-zinc-200 text-sm font-semibold">ИИ-Юрист AmazingAI</p>
                <p className="text-zinc-400 text-xs mt-0.5 max-w-xs">
                  Задай вопрос по любой статье УК, КоАП, УПК, уставу или проверкам сервера {currentServer}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center max-w-sm mt-2">
                {[
                  'На каком основании правительство проводит проверки?',
                  'Когда разрешено применять оружие?',
                  'Какая статья за неподчинение?',
                  'Порядок задержания и Миранда',
                ].map(suggest => (
                  <button
                    key={suggest}
                    onClick={() => {
                      setInput(suggest);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition-all text-left"
                  >
                    {suggest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'user' ? (
                <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                  <div
                    className="px-3.5 py-2.5 rounded-2xl rounded-br-md text-xs sm:text-sm text-white leading-relaxed shadow-md select-text"
                    style={{ background: 'var(--accent,#7C3AED)' }}
                  >
                    {m.content}
                  </div>
                </div>
              ) : (
                <div className="max-w-[92%] px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/10 shadow-lg select-text">
                  <MarkdownView content={m.content} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/10 flex items-center gap-2 text-xs text-zinc-300">
                <Loader2 size={13} className="text-purple-400 animate-spin" />
                <span>AmazingAI анализирует законодательство сервера {currentServer}...</span>
              </div>
            </div>
          )}

          {aiError && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs text-red-400 bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              {aiError}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/5 bg-black/20">

          <div className="flex items-end gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 focus-within:border-purple-500/50 transition-all">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Задай вопрос по законам, статьям или проверкам..."
              rows={1}
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none resize-none"
              style={{ maxHeight: '80px', overflowY: 'auto' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0 shadow-md"
              style={{ background: 'var(--accent,#7C3AED)' }}
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Slide-out Chat History Drawer ─── */}
      {showHistory && (
        <div className="w-64 border-l border-white/10 bg-[#13141a] flex flex-col h-full z-40 animate-in slide-in-from-right duration-200 shadow-2xl">
          {/* Header */}
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <History size={14} className="text-purple-400" />
              <span className="text-xs font-semibold text-white">История диалогов</span>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <X size={13} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-2 border-b border-white/5">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all"
            >
              <Plus size={13} />
              <span>Создать новый диалог</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-4 opacity-50">
                <Clock size={20} className="text-zinc-500" />
                <p className="text-xs text-zinc-400">История пуста</p>
              </div>
            ) : (
              sessions.map(s => {
                const isActive = s.id === activeSessionId;
                const date = new Date(s.createdAt);
                const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      localStorage.setItem('rp_active_session_id', s.id);
                      setShowHistory(false);
                    }}
                    className={`group w-full p-2 rounded-xl text-left transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-white/10 border-purple-500/40 text-white shadow'
                        : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-xs font-medium text-zinc-200 truncate flex-1">
                        {s.title}
                      </span>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Удалить диалог"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        {s.server}
                      </span>
                      <span>{timeStr} · {s.messages.length} сообщ.</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Clear All */}
          {sessions.length > 0 && (
            <div className="p-2 border-t border-white/5">
              <button
                onClick={clearAllHistory}
                className="w-full py-1 rounded-lg text-[11px] text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-center"
              >
                Очистить всю историю
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
