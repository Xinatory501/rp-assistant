import React, { useState, useEffect, useRef } from "react";
import {
  Mic, MicOff, Send, Sparkles, Check, Copy, UserCheck,
  Zap, MessageSquare, Trash2, Plus, ArrowDown, Bot, User, Radio,
  Building2, Keyboard
} from "lucide-react";
import { useAppStore } from "../store";
import { sendToGameChat } from "../lib/gameSender";
import MarkdownView from "./MarkdownView";
import { verifyKeyWithKeyAuth } from "../lib/keyauth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "voice" | "text";
  timestamp: string;
}

const AVAILABLE_ORGS = [
  { id: "ЕСС", name: "ЕСС (ОКЦ / МЧС)", desc: "ОКЦ (Областной клинический центр), ЦП, устав" },
  { id: "УГИБДД", name: "УГИБДД (ДПС)", desc: "КоАП, ПДД, трафик-стоп, радары" },
  { id: "УМВД", name: "УМВД (Полиция / ППС)", desc: "УК РФ, задержание, КПЗ, Миранда" },
  { id: "ПР", name: "Правительство (ПР)", desc: "Охрана, устав, проверки, субординация" },
  { id: "ВЧ", name: "Воинская часть (ВЧ)", desc: "Присяга, устав караула, поставки БП" },
  { id: "ТРК", name: "ТРК Амазинг (СМИ)", desc: "ПРО, ППЭ, объявления, радиоэфиры" },
  { id: "УФСИН", name: "УФСИН (ИК Кресты)", desc: "Режим, обыск, конвой, карцер" },
  { id: "УФСБ", name: "УФСБ", desc: "УПК, ФЗ о ФСБ, спецоперации, ОРО" },
  { id: "Суд", name: "Областной Суд", desc: "Судебный кодекс, заседания, приговоры" },
];

/**
 * Phonetic normalizer for Russian speech recognition in CRMP/SAMP
 */
function normalizeSpeechText(text: string): string {
  let s = text;
  // Fix abbreviations
  s = s.replace(/\b(ессс|е\s*с\s*с|yes|ес|ясс|с с с|сс)\b/gi, "ЕСС");
  s = s.replace(/\b(д\s*м|де эм|ди эм|дм)\b/gi, "ДМ");
  s = s.replace(/\b(д\s*б|де бе|ди би|дб)\b/gi, "ДБ");
  s = s.replace(/\b(с\s*к|эс ка|эс к|ск)\b/gi, "СК");
  s = s.replace(/\b(т\s*к|тэ ка|ти кей|тк)\b/gi, "ТК");
  s = s.replace(/\b(м\s*г|эм гэ|эм джи|мг)\b/gi, "МГ");
  s = s.replace(/\b(п\s*г|пэ гэ|пи джи|пг)\b/gi, "ПГ");
  s = s.replace(/\b(р\s*п|эр пэ|ар пи|рп)\b/gi, "РП");
  s = s.replace(/\b(з\s*з|зэ зэ|зз)\b/gi, "ЗЗ");
  s = s.replace(/\b(ц\s*к|це ка|цк)\b/gi, "ЦК");
  s = s.replace(/\b(у\s*гибдд|гибдд|дпс)\b/gi, "УГИБДД");
  s = s.replace(/\b(у\s*мвд|мвд|ппс|ппсм)\b/gi, "УМВД");
  s = s.replace(/\b(фсин|у\s*фсин)\b/gi, "УФСИН");
  s = s.replace(/\b(фсб|у\s*фсб)\b/gi, "УФСБ");
  s = s.replace(/\b(в\s*ч|армия|воинская часть)\b/gi, "ВЧ");
  s = s.replace(/\b(т\s*р\s*к|сми|радио)\b/gi, "ТРК");
  return s;
}

export default function InterviewTab() {
  const { getActiveProfile, settings, updateSettings } = useAppStore();
  const profile = getActiveProfile();
  const server = profile?.server || "Red";

  // Selected target organization for interview
  const [targetOrg, setTargetOrg] = useState<string>(profile?.org || "ЕСС");
  const [showOrgPicker, setShowOrgPicker] = useState<boolean>(false);
  const [premiumKeyInput, setPremiumKeyInput] = useState<string>("");

  // Hotkey for microphone (default: Alt+V)
  const [micHotkey, setMicHotkey] = useState<string>("Alt+V");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `Привет! Выбери организацию для собеседования выше или задай вопрос.

Сейчас выбрана: **${targetOrg}** (сервер ${server}).

Нажми **«Слушать игру»** (или **${micHotkey}** / **F3**), чтобы ассистент слушал голосовой чат игры и давал максимально краткие ответы.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, liveTranscript, loading]);

  if (!settings.isPremium) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 bg-[#0d0e12]">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <UserCheck size={22} className="text-purple-400" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-medium mb-1">Помощник в собеседованиях — Premium</h3>
          <p className="text-zinc-400 text-sm max-w-xs">
            Интерактивный голосовой ассистент Live Voice AI и моментальные подсказки ответов на собеседованиях в любую организацию.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="flex gap-2">
            <input
              value={premiumKeyInput}
              onChange={e => setPremiumKeyInput(e.target.value)}
              placeholder="Введи ключ активации..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-purple-500"
            />
            <button
              onClick={async () => {
                const res = await verifyKeyWithKeyAuth(premiumKeyInput);
                if (res.success) {
                  updateSettings({ isPremium: true, premiumKey: premiumKeyInput.trim() });
                  showToast("Premium успешно активирован!");
                } else {
                  alert(res.message || "Неверный ключ активации!");
                }
              }}
              disabled={!premiumKeyInput.trim()}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 transition-all"
            >
              Активировать
            </button>
          </div>
          <div className="text-[11px] text-zinc-500 text-center">
            Лицензия навсегда: 1 999 ₽
          </div>
        </div>
      </div>
    );
  }

  // Global & local keyboard shortcut listener for Mic toggle (Alt+V and F3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check Alt+V or F3
      const isAltV = e.altKey && (e.key === "v" || e.key === "V" || e.key === "м" || e.key === "М");
      const isF3 = e.key === "F3";

      if (isAltV || isF3) {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening]);

  // Speech Recognition with Continuous Auto-Restart and Normalization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ru-RU";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const raw = (final || interim).trim();
      const normalized = normalizeSpeechText(raw);

      if (normalized) {
        setLiveTranscript(normalized);

        // Debounce sending to AI upon speech pause
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (normalized.length >= 2 && isListeningRef.current) {
            handleSendUserMessage(normalized, "voice");
            setLiveTranscript("");
          }
        }, 1700);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition warning:", e.error);
      if (isListeningRef.current && e.error !== "not-allowed") {
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch (err) {}
          }
        }, 300);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch (err) {}
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      try { recognition.stop(); } catch (e) {}
    };
  }, [targetOrg]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Распознавание речи не поддерживается в данном браузере.");
      return;
    }

    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      setLiveTranscript("");
      try { recognitionRef.current?.stop(); } catch (e) {}
      showToast("🎙️ Прослушивание игры отключено");
    } else {
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current?.start();
        showToast("🎙️ Слушаю голосовой чат игры (Alt+V / F3)...");
      } catch (e) {
        console.error("Speech start error", e);
      }
    }
  };

  const handleSelectOrg = (newOrg: string) => {
    setTargetOrg(newOrg);
    setShowOrgPicker(false);
    setMessages(prev => [
      ...prev,
      {
        id: "org-select-" + Date.now(),
        role: "assistant",
        content: `🎯 Организация для собеседования изменена на: **${newOrg}**.\n\nЗадавай вопрос проверяющего — ответ будет сгенерирован строго под правила и устав ${newOrg}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    showToast(`Выбрана организация: ${newOrg}`);
  };

  const handleSendUserMessage = async (userText: string, source: "voice" | "text" = "text") => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: "u-" + Date.now(),
      role: "user",
      content: trimmed,
      source,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const prompt = `Ты — эксперт по собеседованиям в Amazing Online (организация: ${targetOrg}, сервер: ${server}).
Вопрос проверяющего: "${trimmed}"

СТРОГИЕ ПРАВИЛА ОТВЕТА:
1. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать любые эмодзи, смайлики, стикеры и иконки. Пиши только чистым текстом.
2. Отвечай МАКСИМАЛЬНО КРАТКО (1-2 строки), сухо, строго по делу, БЕЗ лишних вступительных слов, приветствий и докладов.
3. Специфика для ${targetOrg}:
   - Если ЕСС: больница официально называется ОКЦ (Областной клинический центр). Учитывай устав, субординацию, оказание помощи и отыгровки препаратов (/heal, /med).
   - Если УГИБДД/УМВД: учитывай КоАП/УК РФ, трафик-стоп и Миранду.
   - Если ВЧ: учитывай устав, присягу и субординацию.
   - Если ПР: учитывай устав правительства и сопровождение.
   - Если ТРК: учитывай ПРО и ППЭ.
4. Если вопрос про RP термин или псих-тест с подвохом:
   - В чат: краткий ответ без МГ
   - /b: краткая серверная формулировка
5. Если отыгровка документов: дай только короткие строки /do, /me, /pass.`;

      const resp = await fetch("http://localhost:9655/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "Ты даёшь максимально краткие и точные ответы на собеседованиях Amazing Online. Запрещено использовать любые эмодзи и смайлики." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1
        })
      });

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || "";

      const aiMsg: Message = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: content || "Отвечай строго по RP без МГ.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: "ai-err-" + Date.now(),
          role: "assistant",
          content: "Отвечай строго по RP: в обычный чат без МГ, термины — в /b чат.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendToGame = async (text: string) => {
    await sendToGameChat(text);
    showToast("⚡ Отправлено в чат игры (F6 + Enter)!");
  };

  const clearChat = () => {
    if (window.confirm("Очистить историю собеседования?")) {
      setMessages([
        {
          id: "welcome-2",
          role: "assistant",
          content: `Диалог очищен. Выбрана организация: **${targetOrg}**. Задавай вопрос или включи прослушивание (${micHotkey}).`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0e12]">
      {/* Top Header with Org Picker & Mic Controls */}
      <div className="p-2.5 border-b border-white/5 bg-black/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={15} className="text-purple-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">
                Собеседование в:
              </span>
              <button
                onClick={() => setShowOrgPicker(v => !v)}
                className="px-2 py-0.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Нажми, чтобы сменить организацию"
              >
                <Building2 size={12} />
                <span>{targetOrg}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mic Toggle Button with Hotkey Badge */}
            <button
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-lg ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30"
                  : "bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200"
              }`}
              title="Включить/выключить прослушивание игры (Горячая клавиша: Alt+V или F3)"
            >
              {isListening ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{isListening ? "Слушаю..." : "Слушать игру"}</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/30 text-purple-200/90 border border-white/10">
                {micHotkey}
              </span>
            </button>

            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              title="Очистить чат собеседования"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Interactive Org Selector Drawer */}
        {showOrgPicker && (
          <div className="p-2 rounded-xl bg-zinc-900/95 border border-purple-500/30 space-y-1.5 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-1">
              <span>Выбери организацию, в которую проходишь собеседование:</span>
              <button onClick={() => setShowOrgPicker(false)} className="text-zinc-500 hover:text-zinc-300">
                Закрыть
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {AVAILABLE_ORGS.map(o => (
                <button
                  key={o.id}
                  onClick={() => handleSelectOrg(o.id)}
                  className={`p-1.5 rounded-lg text-left text-xs transition-all border ${
                    targetOrg === o.id
                      ? "bg-purple-600 border-purple-400 text-white font-semibold shadow-md shadow-purple-600/30"
                      : "bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300"
                  }`}
                >
                  <div className="font-semibold">{o.id}</div>
                  <div className="text-[9px] text-zinc-400 truncate">{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Voice AI Streaming Bar */}
      {isListening && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-red-950/40 via-purple-950/40 to-black border-b border-red-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
            <span className="text-zinc-400 text-[11px]">Слышу ({targetOrg}):</span>
            <span className="font-mono text-purple-200 font-medium truncate">
              {liveTranscript || "Слушаю речь проверяющего в игре (Alt+V / F3)..."}
            </span>
          </div>
          <span className="text-[10px] text-red-400 font-mono flex-shrink-0 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
            Voice Stream LIVE
          </span>
        </div>
      )}

      {toast && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse font-medium">
          <Zap size={13} className="text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map(m => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] space-y-1.5 ${isUser ? "items-end" : "items-start"}`}>
                {/* Message Bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg select-text ${
                    isUser
                      ? "rounded-br-md text-white font-medium"
                      : "rounded-bl-md bg-white/[0.04] border border-white/10 text-zinc-200"
                  }`}
                  style={isUser ? { background: "var(--accent,#7C3AED)" } : {}}
                >
                  {isUser ? (
                    <div className="whitespace-pre-line leading-relaxed">{m.content}</div>
                  ) : (
                    <MarkdownView content={m.content} />
                  )}
                </div>

                {/* Quick Game Chat Button */}
                {!isUser && m.id !== "welcome-1" && (
                  <div className="pt-0.5">
                    <button
                      onClick={() => sendToGame(m.content)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/30 text-zinc-300 hover:text-purple-200 text-[11px] font-mono flex items-center gap-1.5 shadow-sm transition-all"
                      title="Вставить ответ в чат игры"
                    >
                      <Send size={10} className="text-purple-400" />
                      <span>Вставить в чат (F6)</span>
                    </button>
                  </div>
                )}

                <div className={`text-[10px] text-zinc-500 px-1 ${isUser ? "text-right" : "text-left"}`}>
                  {m.source === "voice" && "🎙️ Голос • "} {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/10 flex items-center gap-2 text-xs text-zinc-300">
              <Sparkles size={13} className="text-purple-400 animate-spin" />
              <span>AmazingAI генерирует ответ для {targetOrg}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 focus-within:border-purple-500/40 transition-all">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendUserMessage(input);
              }
            }}
            placeholder={`Введи вопрос проверяющего (${targetOrg}: например, ЦП, ДМ, устав, паспорт)... `}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
          />

          <button
            onClick={() => handleSendUserMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0 shadow-md"
            style={{ background: "var(--accent,#7C3AED)" }}
            title="Отправить вопрос нейросети"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
