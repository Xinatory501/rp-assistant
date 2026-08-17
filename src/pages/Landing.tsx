import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Download, Sparkles, Check, ChevronRight,
  MessageSquare, Radio, Hash, BookOpen, EyeOff, Layers,
  Terminal, ShieldCheck, HelpCircle, ExternalLink, Laptop,
  Tag, ArrowRight, Bot, Mic, Cpu, Lock, Zap, ChevronDown,
  Clock, Award, Star, Copy, Send, Sparkle, Globe, UserCheck,
  CheckCircle2, Sliders, Volume2, ShieldAlert, Loader2, HardDrive,
  CheckCircle, X
} from 'lucide-react';
import { SERVERS, SERVER_COLORS, ORGS } from '../constants';

interface LandingProps {
  onOpenApp: () => void;
}

// Payment links placeholder — ready to be replaced with your real checkout links
export const PAYMENT_LINKS = {
  day1: '',       // Ссылка на оплату 1 дня (49 ₽)
  week1: '',      // Ссылка на оплату 1 недели (199 ₽)
  month1: '',     // Ссылка на оплату 1 месяца (490 ₽)
  year1: '',      // Ссылка на оплату 1 года (1 490 ₽)
  lifetime: '',   // Ссылка на оплату Навсегда (1 999 ₽)
  contact: 'https://t.me/', // Telegram поддержка / продажа
};

// Official GitHub Releases Downloads
export const GITHUB_DOWNLOADS = {
  portableZip: 'https://github.com/Xinatory501/rp-assistant-releases/releases/download/v1.1.0-flutter/RP-Assistant-Flutter-Portable.zip',
  setupExe: 'https://github.com/Xinatory501/rp-assistant-releases/releases/download/v1.1.0-flutter/RP-Assistant-Flutter-Setup.exe',
  releasesPage: 'https://github.com/Xinatory501/rp-assistant-releases/releases/tag/v1.1.0-flutter',
};

export default function Landing({ onOpenApp }: LandingProps) {
  const [selectedServer, setSelectedServer] = useState('Red');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Банят ли за использование RP Assistant на серверах Amazing?',
      a: 'Нет. RP Assistant работает как полностью внешний прозрачный оверлей (Direct3D overlay / Electron), не внедряется в память процесса игры и не модифицирует файлы клиента Amazing Online. Запрещенных функций в программе нет.'
    },
    {
      q: 'Как работает режим скрытия от стрима (OBS / Discord Stealth)?',
      a: 'Используется системный Windows Graphics Capture API (WDA_EXCLUDEFROMCAPTURE). Программа визуально отображается на вашем мониторе поверх игры, но захваты экрана в OBS Studio, Discord и GeForce Experience видят только чистую игру.'
    },
    {
      q: 'Как активировать ключ после покупки?',
      a: 'Сразу после оплаты вы получаете ключ вида AMAZING-PRO-XXXX-XXXX. При первом запуске программы (или во вкладке «Настройки» ➔ «Premium») вставьте этот ключ — он мгновенно активирует лицензию через официальный KeyAuth.'
    },
    {
      q: 'Работает ли база законов на всех серверах Amazing?',
      a: 'Да. В программу встроена актуальная база всех 12 официальных серверов (Red, Yellow, Green, Azure, Silver, Rose, Black, Titan, Lime, Fire, Sky, X). При переключении сервера законы и уставы моментально адаптируются.'
    },
    {
      q: 'Можно ли импортировать свои старые бинды из AutoHotkey (.ahk)?',
      a: 'Да, во вкладке «Биндер» есть кнопка импорта любого `.ahk` файла. Программа автоматически распознает хоткеи, текст и команды `/me`, `/do`, `/todo` и задержки `Sleep`.'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#171615] text-[#ede5dc] font-sans selection:bg-[#d97757]/30 selection:text-[#fbf7ee] pb-24">
      
      {/* ─── Top Promo Bar ─── */}
      <div className="bg-[#211e1c] border-b border-[#332f2b] py-2.5 px-4 text-center text-xs text-[#c5bcaf] flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d97757]" />
        <span>Лимитированное предложение: <b>Premium навсегда за 1 999 ₽</b> <span className="line-through text-[#8e8579] ml-1">3 490 ₽</span></span>
        <a href="#pricing" className="text-[#d97757] hover:text-[#e58a6d] font-semibold underline ml-1.5 transition-colors">
          Выбрать тариф →
        </a>
      </div>

      {/* ─── Header Navigation ─── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#171615]/90 border-b border-[#2d2925]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#28231f] border border-[#44372e] flex items-center justify-center text-[#d97757] shadow-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-[#fbf7ee] text-sm sm:text-base flex items-center gap-2">
                RP Assistant
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a241f] text-[#d97757] border border-[#44372e] font-mono">v1.0</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm text-[#a39a8e]">
            <a href="#features" className="hover:text-[#fbf7ee] transition-colors">Возможности</a>
            <a href="#orgs" className="hover:text-[#fbf7ee] transition-colors">Фракции</a>
            <a href="#pricing" className="hover:text-[#fbf7ee] transition-colors">Тарифы</a>
            <a href="#servers" className="hover:text-[#fbf7ee] transition-colors">Серверы</a>
            <a href="#faq" className="hover:text-[#fbf7ee] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={GITHUB_DOWNLOADS.portableZip}
              download="RP-Assistant-v1.0-Portable.zip"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#24211e] hover:bg-[#2c2825] text-[#ede5dc] border border-[#38332d] transition-all cursor-pointer"
            >
              <Download size={13} />
              Скачать .zip (GitHub)
            </a>

            <a
              href="#pricing"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#d97757] hover:bg-[#c96545] text-white shadow-sm transition-all"
            >
              Купить Premium
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-20 pb-16 px-6 max-w-4xl mx-auto text-center">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#24211e] border border-[#38332d] text-xs text-[#d97757] mb-8 font-medium"
        >
          <Sparkles size={13} />
          <span>Персональный ИИ-ассистент для Amazing Online</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-serif tracking-tight text-[#fbf7ee] leading-[1.15] mb-6 font-normal"
        >
          Интеллектуальный оверлей <br />
          <span className="text-[#d97757] italic">нового поколения</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-[#a89f92] max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
        >
          ИИ-юрист AmazingAI с базой 409 кодексов, распознавание речи на собеседованиях, регламентированные доклады в рацию и аппаратная невидимость на стримах.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3.5"
        >
          <a
            href={GITHUB_DOWNLOADS.portableZip}
            download="RP-Assistant-Flutter-Portable.zip"
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-[#d97757] hover:bg-[#c96545] text-white shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Download size={16} />
            Скачать Portable .zip (12.3 МБ)
          </a>
          
          <a
            href={GITHUB_DOWNLOADS.setupExe}
            download="RP-Assistant-Flutter-Setup.exe"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[#24211e] hover:bg-[#2c2825] text-[#ede5dc] border border-[#38332d] transition-all"
          >
            <Download size={15} className="text-[#a39a8e]" />
            Скачать Setup .exe (10.5 МБ)
          </a>

          <a
            href="#pricing"
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-[#24211e] hover:bg-[#2c2825] text-[#ede5dc] border border-[#38332d] transition-all"
          >
            Тарифы от 49 ₽
          </a>
        </motion.div>

        {/* Clean Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-16 text-left"
        >
          <div className="p-4 rounded-2xl bg-[#1f1d1b] border border-[#2d2925]">
            <div className="text-[#d97757] text-lg font-semibold mb-0.5">12 серверов</div>
            <p className="text-xs text-[#8e8579]">УК, КоАП, Уставы всех фракций</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#1f1d1b] border border-[#2d2925]">
            <div className="text-[#fbf7ee] text-lg font-semibold mb-0.5">По ГОСТу RP</div>
            <p className="text-xs text-[#8e8579]">Регламентированные доклады</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#1f1d1b] border border-[#2d2925]">
            <div className="text-[#52a472] text-lg font-semibold mb-0.5">0 банов</div>
            <p className="text-xs text-[#8e8579]">Внешний безопасный оверлей</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#1f1d1b] border border-[#2d2925]">
            <div className="text-[#e29377] text-lg font-semibold mb-0.5">OBS Stealth</div>
            <p className="text-xs text-[#8e8579]">Невидим на демках в Discord</p>
          </div>
        </motion.div>

      </section>

      {/* ─── ALTERNATING FEATURE SHOWCASE SECTIONS (Zig-Zag Screens) ─── */}
      <div id="features" className="max-w-6xl mx-auto px-6 py-12 space-y-24">

        {/* ─── 1. AmazingAI Lawyer (Screen LEFT, Text RIGHT) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Left: Real In-Game UI Screen */}
          <div className="lg:col-span-7 rounded-3xl bg-[#1d1b18] border border-[#332e29] p-5 sm:p-6 shadow-2xl">
            {/* Header HUD Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2d2824] text-xs text-[#8e8579]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3e3832]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3e3832]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3e3832]" />
                <span className="font-mono text-[#8e8579] ml-2">ИИ-Юрист • Red Server [01]</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#28221d] text-[#d97757] font-mono border border-[#443328]">409 Кодексов</span>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3.5">
              {/* User Bubble */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#2e2a25] border border-[#443d35] flex items-center justify-center text-xs font-medium text-[#ede5dc] flex-shrink-0">
                  Вы
                </div>
                <div className="p-3 rounded-2xl bg-[#24211e] text-xs text-[#ede5dc] border border-[#332e29] max-w-[85%]">
                  Какая статья за хранение наркотических веществ в крупном размере на сервере Red?
                </div>
              </div>

              {/* Claude AI Response */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#3d271f] border border-[#643d2c] flex items-center justify-center text-xs font-bold text-[#d97757] flex-shrink-0">
                  <Sparkles size={13} />
                </div>
                <div className="p-4 rounded-2xl bg-[#24211e] text-xs text-[#ede5dc] border border-[#3d362f] max-w-[90%] space-y-2">
                  <div className="font-semibold text-[#d97757] flex items-center justify-between">
                    <span>Статья 45 Уголовного кодекса (УК)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#2d241f] text-[#d97757] border border-[#44352b] font-mono">4 года л/с</span>
                  </div>
                  <p className="text-xs text-[#c5bcaf] leading-relaxed">
                    Незаконные приобретение, хранение, перевозка наркотических средств в крупном размере влечет наложение уголовного штрафа и лишение свободы сроком на <b>4 года</b> с конфискацией.
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#2d2824] flex items-center justify-between text-[11px] text-[#8e8579]">
                    <span>Команда: <kbd className="px-1.5 py-0.5 bg-[#1b1917] rounded text-[#d97757] font-mono">/su [ID] 45</kbd></span>
                    <span className="text-[#d97757] font-medium flex items-center gap-1">
                      <Copy size={11} /> Скопировать в чат
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input simulation */}
            <div className="mt-4 pt-3 border-t border-[#2d2824] flex items-center gap-2">
              <input 
                disabled 
                placeholder="Задайте любой вопрос по УК, КоАП, ФП, Уставу..." 
                className="flex-1 bg-[#1b1917] border border-[#2d2925] rounded-xl px-3.5 py-2 text-xs text-[#8e8579]"
              />
              <div className="p-2 rounded-xl bg-[#d97757] text-white">
                <Send size={13} />
              </div>
            </div>
          </div>

          {/* Right: Text Description */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a221d] border border-[#443328] text-xs text-[#d97757]">
              <Bot size={13} />
              AmazingAI v2.0
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] font-normal leading-snug">
              Персональный ИИ-юрист с базой 409 кодексов
            </h3>
            <p className="text-sm text-[#a39a8e] leading-relaxed">
              Больше не нужно судорожно искать статьи на форуме во время погони или задержания. Задайте вопрос своими словами — ассистент мгновенно назовет нужную статью, срок и команду розыска.
            </p>
            <ul className="space-y-2.5 text-xs text-[#c5bcaf] pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>База адаптируется под любой из 12 серверов в 1 клик</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Мгновенная вставка команды <code className="text-[#d97757]">/su</code> в буфер обмена</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Поддержка УК, КоАП, Федерального постановления и Уставов</span>
              </li>
            </ul>
          </div>
        </motion.div>


        {/* ─── 2. Voice AI Interview (Text LEFT, Screen RIGHT) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Left: Text Description */}
          <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a221d] border border-[#443328] text-xs text-[#d97757]">
              <Mic size={13} />
              Live Voice AI
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] font-normal leading-snug">
              Голосовые подсказки на собеседованиях и обзвонах
            </h3>
            <p className="text-sm text-[#a39a8e] leading-relaxed">
              Ассистент слушает голос проверяющего в Discord или голосовом чате игры, моментально распознает термины (ДМ, ДБ, СК, ТК, ЕСС, ОКЦ) и выводит краткий ответ за 0.2 секунды.
            </p>
            <ul className="space-y-2.5 text-xs text-[#c5bcaf] pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Ответы в 1-2 строки без воды для уверенного голосового ответа</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Специализированные профили для Лидеров, Заместителей и МВД/ЕСС</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Включение по горячей клавише <kbd className="px-1.5 py-0.5 bg-[#201d1b] rounded border border-[#332e29] text-[#ede5dc]">Alt+V</kbd> или <kbd className="px-1.5 py-0.5 bg-[#201d1b] rounded border border-[#332e29] text-[#ede5dc]">F3</kbd></span>
              </li>
            </ul>
          </div>

          {/* Right: Real In-Game Voice Screen */}
          <div className="lg:col-span-7 rounded-3xl bg-[#1d1b18] border border-[#332e29] p-5 sm:p-6 shadow-2xl order-1 lg:order-2">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2d2824] text-xs text-[#8e8579]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#52a472] animate-pulse" />
                <span className="font-mono text-[#ede5dc]">Микрофон активен • Discord Voice</span>
              </div>
              <span className="text-[11px] text-[#8e8579]">Задержка: 0.2с</span>
            </div>

            <div className="space-y-3.5">
              {/* Voice recognition card */}
              <div className="p-3.5 rounded-2xl bg-[#24211e] border border-[#332e29] text-xs text-[#c5bcaf]">
                <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#d97757]">
                  <span className="font-mono">Распознанный вопрос проверяющего:</span>
                  <Volume2 size={13} />
                </div>
                <p className="text-[#ede5dc] font-medium">«Что такое ДМ, ДБ и СК? И как расшифровывается ОКЦ в нашей больнице?»</p>
              </div>

              {/* Instant Answer */}
              <div className="p-4 rounded-2xl bg-[#24211e] border border-[#3d342c] space-y-2">
                <div className="text-xs font-semibold text-[#d97757] flex items-center justify-between">
                  <span>⚡ Подсказка для ответа:</span>
                  <span className="text-[10px] text-[#7a7266] font-mono">ЕСС (Больница)</span>
                </div>
                <div className="text-xs text-[#ede5dc] space-y-1.5 leading-relaxed">
                  <p>• <b>ДМ</b> — Убийство без причины. <b>ДБ</b> — Убийство машиной. <b>СК</b> — Спавн килл.</p>
                  <p>• <b>ОКЦ</b> — Областной клинический центр (официальное название больницы ЕСС).</p>
                </div>
                <div className="pt-2 border-t border-[#2d2824] flex items-center justify-between text-[11px] text-[#7a7266]">
                  <span>Формат: кратко и чётко</span>
                  <span className="text-[#52a472]">● 100% готов к ответу</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>


        {/* ─── 3. GOST Reports (Screen LEFT, Text RIGHT) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Left: Real Radio Reports Grid Screen */}
          <div className="lg:col-span-7 rounded-3xl bg-[#1d1b18] border border-[#332e29] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2d2824] text-xs text-[#8e8579]">
              <span className="font-mono text-[#ede5dc]">Доклады в рацию • УГИБДД / УМВД</span>
              <span className="text-[#d97757]">Авто-время & Пост</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { title: 'Заступил на пост', code: '[УГИБДД] Докладывает: Прапорщик Иванов. Заступил на пост: Мост г. Южный. Состав: 2. Состояние: Стабильное.', key: 'Num 1' },
                { title: 'Продолжаю дежурство', code: '[УГИБДД] Докладывает: Прапорщик Иванов. Продолжаю дежурство на посту: Мост г. Южный. Состав: 2. Состояние: Стабильное.', key: 'Num 2' },
                { title: 'Покинул пост (Смена)', code: '[УГИБДД] Докладывает: Прапорщик Иванов. Покинул пост: Мост г. Южный. Причина: Окончание смены.', key: 'Num 3' },
                { title: 'Погоня за авто', code: '[УГИБДД] Докладывает: Прапорщик Иванов. Ведем преследование а/м BMW M5 с г/н А777АА. Требуется перекрытие!', key: 'Num 4' },
              ].map((rep, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#24211e] border border-[#332e29] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[#ede5dc]">{rep.title}</span>
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[#1b1917] text-[#d97757] font-mono border border-[#38322b]">{rep.key}</kbd>
                    </div>
                    <p className="text-[11px] text-[#a39a8e] font-mono leading-relaxed bg-[#1b1917] p-2 rounded-xl border border-[#2d2824]">
                      {rep.code}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] text-[#d97757] font-medium text-right">
                    Отправить в /r →
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Text Description */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a221d] border border-[#443328] text-xs text-[#d97757]">
              <Radio size={13} />
              ГОСТ Amazing
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] font-normal leading-snug">
              Регламентированные доклады в рацию
            </h3>
            <p className="text-sm text-[#a39a8e] leading-relaxed">
              Забудьте про ручной ввод шаблонных докладов в чат. Программа автоматически подставляет вашу фамилию, звание, отдел, название поста и текущее время.
            </p>
            <ul className="space-y-2.5 text-xs text-[#c5bcaf] pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Быстрая отправка по клавишам Numpad 1–6</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Полное соответствие правилам всех государственных фракций</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Поддержка каналов рации <code className="text-[#d97757]">/r</code> и департамента <code className="text-[#d97757]">/d</code></span>
              </li>
            </ul>
          </div>
        </motion.div>


        {/* ─── 4. Smart Binder (Text LEFT, Screen RIGHT) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Left: Text Description */}
          <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a221d] border border-[#443328] text-xs text-[#d97757]">
              <Zap size={13} />
              Zero Delay Binder
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] font-normal leading-snug">
              Умный биндер с паузами и поддержкой AHK
            </h3>
            <p className="text-sm text-[#a39a8e] leading-relaxed">
              Создавайте сложные цепочки отыгровок с миллисекундными паузами <code className="text-[#d97757]">Sleep</code>. Никаких киков за флуд в чат и пропущенных строк.
            </p>
            <ul className="space-y-2.5 text-xs text-[#c5bcaf] pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Импорт любых готовых скриптов <code className="text-[#d97757]">.ahk</code> в 1 клик</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Динамическая подстановка ID нарушителя <code className="text-[#d97757]">{"{targetId}"}</code></span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Визуальный редактор строк и горячих клавиш</span>
              </li>
            </ul>
          </div>

          {/* Right: Real Smart Binder Screen */}
          <div className="lg:col-span-7 rounded-3xl bg-[#1d1b18] border border-[#332e29] p-5 sm:p-6 shadow-2xl order-1 lg:order-2">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2d2824] text-xs text-[#8e8579]">
              <span className="font-mono text-[#ede5dc]">Редактор биндов • Zero-Delay</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#28221d] text-[#d97757] font-mono border border-[#443328]">AHK v1/v2 Ready</span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#24211e] border border-[#332e29]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#ede5dc]">Задержание нарушителя (Наручники)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1b1917] font-mono text-[#d97757]">Numpad 1</span>
                </div>
                <div className="space-y-1 text-xs text-[#a39a8e] font-mono bg-[#1b1917] p-3 rounded-xl border border-[#2d2824]">
                  <div>/me резким движением снял наручники с тактического пояса</div>
                  <div className="text-[#7a7266] text-[10px]">• Пауза 1200 мс •</div>
                  <div>/cuff {"{targetId}"}</div>
                  <div className="text-[#7a7266] text-[10px]">• Пауза 1000 мс •</div>
                  <div>/me защелкнул наручники на запястьях подозреваемого</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>


        {/* ─── 5. OBS & Discord Stealth (Screen LEFT, Text RIGHT) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Left: Real Stealth Comparison Screen */}
          <div className="lg:col-span-7 rounded-3xl bg-[#1d1b18] border border-[#332e29] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2d2824] text-xs text-[#8e8579]">
              <span className="font-mono text-[#ede5dc]">WGC API Защита видеопотока</span>
              <span className="text-[#52a472]">● Защита активна</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-center">
              <div className="p-4 rounded-2xl bg-[#24211e] border border-[#3d342c]">
                <div className="text-xs font-semibold text-[#d97757] mb-1">Ваш монитор</div>
                <p className="text-xs text-[#a39a8e] mb-3">Игра + видимый оверлей со статьями и подсказками</p>
                <div className="p-2.5 rounded-xl bg-[#1b1917] border border-[#2d2824] text-[11px] text-[#ede5dc] font-mono">
                  [HUD: Статья 45 УК РФ]
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#24211e] border border-[#332e29]">
                <div className="text-xs font-semibold text-[#52a472] mb-1">OBS / Discord Стрим</div>
                <p className="text-xs text-[#a39a8e] mb-3">Только чистая игра Amazing Online без следов оверлея</p>
                <div className="p-2.5 rounded-xl bg-[#1b1917] border border-[#2d2824] text-[11px] text-[#52a472] font-mono">
                  [Чистый захват игры]
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text Description */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a221d] border border-[#443328] text-xs text-[#d97757]">
              <EyeOff size={13} />
              OBS Stealth
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] font-normal leading-snug">
              Абсолютная невидимость на стримах и демках
            </h3>
            <p className="text-sm text-[#a39a8e] leading-relaxed">
              Мы используем системный Windows Graphics Capture API. Оверлей отображается прямо перед вашими глазами на мониторе, но аппаратно исключается из захвата видеокарты.
            </p>
            <ul className="space-y-2.5 text-xs text-[#c5bcaf] pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Невидим в Discord при демонстрации экрана</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Невидим в OBS Studio, GeForce ShadowPlay и Bandicam</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-[#d97757] flex-shrink-0" />
                <span>Включается в один клик в меню настроек</span>
              </li>
            </ul>
          </div>
        </motion.div>

      </div>

      {/* ─── Supported Factions ─── */}
      <section id="orgs" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] mb-2 font-normal">
            Поддержка государственных организаций
          </h2>
          <p className="text-sm text-[#9c9386]">
            Специализированные отделы, доклады и статьи под каждую фракцию
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ORGS.filter(o => o !== 'Гражданский').map((org) => (
            <div
              key={org}
              className="p-4 rounded-2xl bg-[#201d1b] border border-[#2d2925] hover:border-[#443c34] transition-all"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d97757]" />
                <h4 className="text-sm font-medium text-[#ede5dc] truncate">{org}</h4>
              </div>
              <p className="text-[11px] text-[#7a7266]">Внутренний устав + доклады по ГОСТу</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5 SUBSCRIPTION TIERS & PRICING TABLE (Claude Clean Theme) ─── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif text-[#fbf7ee] mb-2 font-normal">
            Тарифные планы и цены
          </h2>
          <p className="text-sm text-[#9c9386]">
            Честные условия и выбор удобного периода
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch mb-12">
          
          {/* Tier 1: 1 Day */}
          <div className="rounded-3xl p-5 bg-[#201d1b] border border-[#302b26] flex flex-col justify-between hover:border-[#443d34] transition-all">
            <div>
              <div className="text-xs font-medium text-[#8e8579] mb-1">1 День</div>
              <div className="text-2xl font-semibold text-[#fbf7ee] mb-1">49 ₽</div>
              <p className="text-[11px] text-[#7a7266] mb-4">Для срочной сдачи 1 обзвона или собеседования</p>
              
              <ul className="space-y-2 text-xs text-[#a39a8e] pt-3 border-t border-[#2d2824]">
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> ИИ-Юрист 24 часа</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Собеседования Voice AI</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> OBS Stealth</li>
              </ul>
            </div>
            
            <a
              href={PAYMENT_LINKS.day1 || '#pricing'}
              onClick={e => { if (!PAYMENT_LINKS.day1) { alert("Ссылка на оплату тарифа скоро будет добавлена!"); } }}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-medium text-center bg-[#282420] hover:bg-[#d97757] text-[#ede5dc] hover:text-white border border-[#38322c] transition-all"
            >
              Купить за 49 ₽
            </a>
          </div>

          {/* Tier 2: 1 Week */}
          <div className="rounded-3xl p-5 bg-[#201d1b] border border-[#302b26] flex flex-col justify-between hover:border-[#443d34] transition-all">
            <div>
              <div className="text-xs font-medium text-[#8e8579] mb-1">1 Неделя</div>
              <div className="text-2xl font-semibold text-[#fbf7ee] mb-1">199 ₽</div>
              <p className="text-[11px] text-[#7a7266] mb-4">28 ₽ в день • Для комфортной службы на неделе</p>
              
              <ul className="space-y-2 text-xs text-[#a39a8e] pt-3 border-t border-[#2d2824]">
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> 7 дней полного доступа</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Все 12 серверов</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> До 10 профилей</li>
              </ul>
            </div>
            
            <a
              href={PAYMENT_LINKS.week1 || '#pricing'}
              onClick={e => { if (!PAYMENT_LINKS.week1) { alert("Ссылка на оплату тарифа скоро будет добавлена!"); } }}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-medium text-center bg-[#282420] hover:bg-[#d97757] text-[#ede5dc] hover:text-white border border-[#38322c] transition-all"
            >
              Купить за 199 ₽
            </a>
          </div>

          {/* Tier 3: 1 Month (HIT) */}
          <div className="rounded-3xl p-5 bg-[#25211d] border-2 border-[#d97757]/80 flex flex-col justify-between relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#d97757] text-[10px] font-semibold text-white uppercase tracking-wider shadow">
              Хит продаж
            </div>
            <div>
              <div className="text-xs font-medium text-[#d97757] mb-1 mt-1">1 Месяц (Срок)</div>
              <div className="text-2xl font-semibold text-[#fbf7ee] mb-1">490 ₽</div>
              <p className="text-[11px] text-[#9e9486] mb-4">16 ₽ в день • Стандартный срок лидера или зама (30 дней)</p>
              
              <ul className="space-y-2 text-xs text-[#c5bcaf] pt-3 border-t border-[#38322c]">
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> 30 дней Premium</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> ИИ-Юрист + Voice AI</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Скрытие на стримах OBS</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Поддержка 24/7</li>
              </ul>
            </div>
            
            <a
              href={PAYMENT_LINKS.month1 || '#pricing'}
              onClick={e => { if (!PAYMENT_LINKS.month1) { alert("Ссылка на оплату тарифа скоро будет добавлена!"); } }}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-medium text-center bg-[#d97757] hover:bg-[#c96545] text-white shadow-sm transition-all"
            >
              Купить за 490 ₽
            </a>
          </div>

          {/* Tier 4: 1 Year */}
          <div className="rounded-3xl p-5 bg-[#201d1b] border border-[#302b26] flex flex-col justify-between hover:border-[#443d34] transition-all">
            <div>
              <div className="text-xs font-medium text-[#8e8579] mb-1">1 Год (Про)</div>
              <div className="text-2xl font-semibold text-[#fbf7ee] mb-1">1 490 ₽</div>
              <p className="text-[11px] text-[#7a7266] mb-4">4 ₽ в день • Экономия 75% для постоянных игроков</p>
              
              <ul className="space-y-2 text-xs text-[#a39a8e] pt-3 border-t border-[#2d2824]">
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> 365 дней лицензии</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Все обновления кодексов</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Все 12 серверов</li>
              </ul>
            </div>
            
            <a
              href={PAYMENT_LINKS.year1 || '#pricing'}
              onClick={e => { if (!PAYMENT_LINKS.year1) { alert("Ссылка на оплату тарифа скоро будет добавлена!"); } }}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-medium text-center bg-[#282420] hover:bg-[#d97757] text-[#ede5dc] hover:text-white border border-[#38322c] transition-all"
            >
              Купить за 1 490 ₽
            </a>
          </div>

          {/* Tier 5: Lifetime VIP */}
          <div className="rounded-3xl p-5 bg-[#25211d] border border-[#524436] flex flex-col justify-between relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#3a2d22] text-[10px] font-medium text-[#d97757] border border-[#524436] uppercase tracking-wider">
              Навсегда (Lifetime)
            </div>
            <div>
              <div className="text-xs font-medium text-[#d97757] mb-1 mt-1">Пожизненный доступ</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-semibold text-[#fbf7ee]">1 999 ₽</span>
                <span className="text-xs line-through text-[#7a7266]">3 490 ₽</span>
              </div>
              <p className="text-[11px] text-[#8e8579] mb-4">Один платёж навсегда • Все будущие версии и обновления</p>
              
              <ul className="space-y-2 text-xs text-[#c5bcaf] pt-3 border-t border-[#38322c]">
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Бессрочный доступ (Lifetime)</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Все будущие ИИ модели</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-[#d97757] flex-shrink-0" /> Личный VIP статус</li>
              </ul>
            </div>
            
            <a
              href={PAYMENT_LINKS.lifetime || '#pricing'}
              onClick={e => { if (!PAYMENT_LINKS.lifetime) { alert("Ссылка на оплату тарифа скоро будет добавлена!"); } }}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-medium text-center bg-[#d97757] hover:bg-[#c96545] text-white shadow-sm transition-all"
            >
              Купить Навсегда
            </a>
          </div>

        </div>
      </section>

      {/* ─── Supported Servers (12) ─── */}
      <section id="servers" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] mb-2 font-normal">
            Поддержка всех 12 серверов Amazing
          </h2>
          <p className="text-sm text-[#9c9386] max-w-lg mx-auto">
            Для каждого сервера собрана собственная актуальная база законов и уставов
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {SERVERS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedServer(s)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedServer === s
                  ? 'bg-[#282420] border-[#d97757]/60 shadow-sm'
                  : 'bg-[#201d1b] border-[#2d2925] hover:border-[#3d3731]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: SERVER_COLORS[s] || '#d97757' }} />
                <span className="text-sm font-medium text-[#ede5dc]">{s}</span>
              </div>
              <span className="text-[11px] text-[#7a7266] block">30+ кодексов и законов</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── FAQ Accordion (Claude Minimal Style) ─── */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif text-[#fbf7ee] mb-2 font-normal">
            Часто задаваемые вопросы
          </h2>
          <p className="text-sm text-[#9c9386]">
            Ответы на популярные вопросы перед началом работы
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#201d1b] border border-[#2d2925] overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-medium text-[#ede5dc]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={17}
                  className={`text-[#d97757] transition-transform duration-200 flex-shrink-0 ${
                    activeFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#a39a8e] leading-relaxed border-t border-[#2a2622] pt-3"
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer (Claude Minimal Style) ─── */}
      <footer className="max-w-6xl mx-auto px-6 pt-12 border-t border-[#2d2925] text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7a7266]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#d97757]" />
          <span>© 2026 RP Assistant. Для игроков Amazing Online.</span>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <a href="#features" className="hover:text-[#ede5dc] transition-colors">Возможности</a>
          <a href="#orgs" className="hover:text-[#ede5dc] transition-colors">Фракции</a>
          <a href="#pricing" className="hover:text-[#ede5dc] transition-colors">Тарифы</a>
          <a href="#faq" className="hover:text-[#ede5dc] transition-colors">FAQ</a>
        </div>
      </footer>

    </div>
  );
}
