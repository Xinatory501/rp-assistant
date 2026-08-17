import { create } from 'zustand';

export interface Profile {
  id: string;
  name: string;       // Ник персонажа (Ivan_Ivanov)
  nameRu?: string;    // Фамилия / Имя на русском для докладов (Иванов)
  server: string;     // Red, Yellow, Green...
  org: string;        // УГИБДД, УМВД, УФСБ, ВЧ, УФСИН, ЕСС, ПР...
  dept: string;       // Отдел (ОРЛС, ОСБ, ОБ ДПС...)
  rank: string;       // Звание
  callsign: string;   // Позывной
  post: string;       // Пост (Мост г. Южный, КПП-1...)
}

export interface Hint {
  id: string;
  title: string;
  content: string;
  hotkey: string;
}

export interface Bind {
  id: string;
  title: string;
  key: string;
  lines: Array<{ text: string; delay: number }>;
}

export interface ReportTemplate {
  id: string;
  title: string;
  template: string; // {rank}, {name}, {org}, {dept}, {post}, {callsign}, {count}
}

export interface AppSettings {
  hotkey: string;
  hotkeyAlt: string;
  opacity: number;
  accentColor: string;
  streamerMode: boolean;
  isPremium: boolean;
  premiumKey: string;
  firstRun: boolean;
  deepseekApiKey: string;  // Официальный API ключ DeepSeek (platform.deepseek.com)
  // CMS Features:
  autoScreenshot: boolean;       // Авто-скриншот F8 при задержаниях/арестах
  autoScreenshotSort: boolean;   // Сортировка скриншотов по датам
  autoMask: boolean;             // Авто-надевание маски
  megCooldown: number;           // Кулдаун мегафона в секундах
  partnerId: string;             // ID напарника
}

export interface SavedConfig {
  id: string;
  title: string;
  description: string;
  server: string;
  org: string;
  createdAt: number;
  isPreset?: boolean;
  data: {
    profiles: Profile[];
    activeProfileId: string | null;
    hints: Hint[];
    binds: Bind[];
    reportTemplates: ReportTemplate[];
    settings?: Partial<AppSettings>;
  };
}

export interface AppState {
  // Profiles
  profiles: Profile[];
  activeProfileId: string | null;
  addProfile: (p: Omit<Profile, 'id'>) => void;
  updateProfile: (id: string, data: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  getActiveProfile: () => Profile | null;

  // Target system (from CMS)
  targetId: string;
  targetType: 'id' | 'mask';
  setTargetId: (val: string, forcedType?: 'id' | 'mask') => void;
  setTargetType: (type: 'id' | 'mask') => void;

  // Hints
  hints: Hint[];
  addHint: (h: Omit<Hint, 'id'>) => void;
  updateHint: (id: string, data: Partial<Hint>) => void;
  deleteHint: (id: string) => void;

  // Binds
  binds: Bind[];
  addBind: (b: Omit<Bind, 'id'>) => void;
  updateBind: (id: string, data: Partial<Bind>) => void;
  deleteBind: (id: string) => void;

  // Report templates
  reportTemplates: ReportTemplate[];
  addReportTemplate: (r: Omit<ReportTemplate, 'id'>) => void;
  updateReportTemplate: (id: string, data: Partial<ReportTemplate>) => void;
  deleteReportTemplate: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  // Config Management
  savedConfigs: SavedConfig[];
  activeConfigId: string | null;
  saveCurrentAsConfig: (title: string, description?: string) => void;
  loadConfig: (configId: string) => void;
  deleteConfig: (configId: string) => void;
  importConfig: (jsonString: string) => boolean;
  exportConfig: (configId: string) => string;

  // Persistence helpers
  loadFromStore: () => Promise<void>;
  saveToStore: () => Promise<void>;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export const DEFAULT_REPORTS: ReportTemplate[] = [
  { id: '1', title: 'Заступление на пост', template: '[{org}] Докладывает: {rank} {name}. Заступил на пост «{post}». Состав: {count}. Состояние: {status}.' },
  { id: '2', title: 'Несение службы (состояние)', template: '[{org}] Докладывает: {rank} {name}. Продолжаю несение службы на посту «{post}». Состав: {count}. Состояние: {status}.' },
  { id: '3', title: 'Сход с поста', template: '[{org}] Докладывает: {rank} {name}. Покинул пост «{post}». Состав: 0. Причина: {reason}.' },
  { id: '4', title: 'Начало патруля', template: '[{org}] Докладывает: {rank} {name}. Начал патрулирование Нижегородской области. Напарник: {partner}. Состояние: {status}.' },
  { id: '5', title: 'Преследование / Погоня', template: '[{org}] Докладывает: {rank} {name}. Ведем преследование а/м {car}, г/н: {number}. Направление: {post}.' },
  { id: '6', title: 'Задержание подозреваемого', template: '[{org}] Докладывает: {rank} {name}. Задержан подозреваемый за нарушение ст. {article}. Доставляем в отдел {org}.' },
  { id: '7', title: 'Поставки БП (для ВЧ)', template: '[{org}] Докладывает: {rank} {name}. Начал поставку боеприпасов в {targetOrg}. Состав колонны: {count}.' },
  { id: '8', title: 'Департамент: Вызов на связь', template: '/d [{org}/] {rank} {name}, вызываю на связь руководство {targetOrg}.' },
  { id: '9', title: 'Помехи в рации', template: '[{org}] Докладывает: {rank} {name}. Помехи в рации от нас.' },
];

export const DEFAULT_HINTS: Hint[] = [
  { id: '1', title: 'Правило Миранды (УПК)', content: 'Вы имеете право хранить молчание. Всё, что вы скажете, может и будет использовано против вас в суде. Вы имеете право на адвоката и один телефонный звонок. Если вы не можете оплатить услуги адвоката, он будет предоставлен государством. Вам ясны ваши права?', hotkey: 'Alt+1' },
  { id: '2', title: 'Основания применения спецсредств (ст. 14 ФЗ)', content: '1. Для пресечения преступлений и административных правонарушений.\n2. Для задержания лица, застигнутого при совершении преступления.\n3. Для преодоления противодействия законным требованиям сотрудника.\n4. Для освобождения захваченных зданий, помещений, сооружений.', hotkey: 'Alt+2' },
  { id: '3', title: 'Порядок остановки ТС (УГИБДД)', content: '1. Подать требование об остановке через мегафон (/m Водитель а/м [Марка], сбавьте скорость и прижмитесь к обочине!).\n2. Представиться, назвать звание и подразделение.\n3. Сообщить причину остановки.\n4. Потребовать ВУ и документы на ТС (/carpass).', hotkey: 'Alt+3' },
  { id: '4', title: 'Навигатор GPS (Номера домов)', content: 'Быстрый поиск домов (/gps -> 15 пункт -> Номер дома 1-541).\nПоиск особняков (/gps -> 16 пункт -> Номер особняка 1-53).', hotkey: 'Alt+4' },
];

export const DEFAULT_CMS_BINDS: Bind[] = [
  {
    id: 'b1',
    title: 'Задержание и наручники',
    key: 'Num 1',
    lines: [
      { text: '/me резким движением снял наручники БРС с тактического пояса', delay: 1000 },
      { text: '/cuff {id}', delay: 1200 },
      { text: '/me заломал руки подозреваемому за спину и зафиксировал замок наручников', delay: 1000 },
      { text: '/escort {id}', delay: 1000 },
      { text: 'Вы задержаны по подозрению в совершении правонарушения! Не оказывайте сопротивления.', delay: 0 }
    ]
  },
  {
    id: 'b2',
    title: 'Снятие наручников',
    key: 'Num 2',
    lines: [
      { text: '/me достал ключ из кармана, вставил в замок наручников и провернул его', delay: 1000 },
      { text: '/uncuff {id}', delay: 800 },
      { text: '/me снял наручники с гражданина и закрепил их на тактическом поясе', delay: 0 }
    ]
  },
  {
    id: 'b3',
    title: 'Посадка преступника в авто',
    key: 'Num 3',
    lines: [
      { text: '/me открыл заднюю дверь патрульного автомобиля и пригнул голову задержанного', delay: 1000 },
      { text: '/incar {id}', delay: 1000 },
      { text: '/me захлопнул заднюю дверь служебного автомобиля на замок', delay: 0 }
    ]
  },
  {
    id: 'b4',
    title: 'Высадка преступника из авто',
    key: 'Num 4',
    lines: [
      { text: '/me открыл дверь служебного автомобиля и схватил задержанного за плечо', delay: 1000 },
      { text: '/deject {id}', delay: 800 },
      { text: '/me аккуратно вывел гражданина наружу и зафиксировал захват', delay: 0 }
    ]
  },
  {
    id: 'b5',
    title: 'Личный досмотр под протокол',
    key: 'Num 5',
    lines: [
      { text: '/me надел одноразовые резиновые перчатки и включил нагрудную боди-камеру «Дозор-3»', delay: 1200 },
      { text: '/do Видео и аудиофиксация процессуального действия начата.', delay: 1000 },
      { text: '/me провел руками по верхней одежде, карманам и поясу задержанного', delay: 1200 },
      { text: '/frisk {id}', delay: 0 }
    ]
  },
  {
    id: 'b6',
    title: 'Проверка документов и удостоверение',
    key: 'Num 6',
    lines: [
      { text: 'Здравия желаю! {rank} {org} по Нижегородской области, {name}.', delay: 1200 },
      { text: '/me достал служебное удостоверение из нагрудного кармана и предъявил гражданину в развернутом виде', delay: 1500 },
      { text: '/do В удостоверении: {rank} {name}, подразделение {dept}.', delay: 1200 },
      { text: 'Прошу предъявить ваше водительское удостоверение и паспорт для проверки.', delay: 0 }
    ]
  },
  {
    id: 'b7',
    title: 'Мегафон об остановке ТС',
    key: 'Num 7',
    lines: [
      { text: '/m Водитель транспортного средства, сбавьте скорость, прижмитесь к обочине и заглушите двигатель!', delay: 1500 },
      { text: '/m В случае неподчинения законным требованиям будет открыт огонь по колесам согласно ФЗ «О полиции»!', delay: 0 }
    ]
  },
  {
    id: 'b8',
    title: 'Снятие маски с задержанного',
    key: 'Num 8',
    lines: [
      { text: '/me протянул руку к лицу задержанного, аккуратно подцепил маску и стянул её', delay: 1200 },
      { text: '/frac {id}', delay: 800 },
      { text: '/do Лицо гражданина открыто для установления личности.', delay: 0 }
    ]
  },
  {
    id: 'b9',
    title: 'Выдача розыска по КПК',
    key: 'Num 9',
    lines: [
      { text: '/me достал служебный планшет «КПК», вошел в единую базу данных МВД', delay: 1200 },
      { text: '/me ввел данные правонарушителя, указал статью и объявил в розыск', delay: 1200 },
      { text: '/su {id}', delay: 0 }
    ]
  },
  {
    id: 'b10',
    title: 'Проверка на алкотестере',
    key: 'Num 0',
    lines: [
      { text: '/me достал из подсумка одноразовый мундштук и портативный алкотестер', delay: 1200 },
      { text: '/me распечатал мундштук, установил в прибор и протянул гражданину', delay: 1200 },
      { text: 'Сделайте глубокий выдох в мундштук до звукового сигнала.', delay: 1000 },
      { text: '/alko {id}', delay: 0 }
    ]
  },
  {
    id: 'b11',
    title: 'Быстрая аптечка (Heal)',
    key: 'F2',
    lines: [
      { text: '/healme', delay: 0 }
    ]
  },
  {
    id: 'b12',
    title: 'Кнопка экстренной тревоги SOS',
    key: 'F3',
    lines: [
      { text: '/sos', delay: 500 },
      { text: '/r [{org}] Докладывает: {name}. Нападение! Запросил подкрепление через кнопку SOS!', delay: 0 }
    ]
  }
];

export const PREMADE_CONFIGS: SavedConfig[] = [
  {
    id: 'preset-gibdd',
    title: 'Пак УГИБДД (ДПС / Батальон)',
    description: 'Полный комплект биндов остановки ТС, алкотестера, протоколов, погони и докладов на мосту Южный',
    server: 'Red',
    org: 'УГИБДД',
    createdAt: 1700000000000,
    isPreset: true,
    data: {
      profiles: [{
        id: 'prof-gibdd',
        name: 'Alexander_Smirnov',
        server: 'Red',
        org: 'УГИБДД',
        dept: 'ОБ ДПС',
        rank: 'Лейтенант',
        callsign: 'Сокол-1',
        post: 'Мост г. Южный'
      }],
      activeProfileId: 'prof-gibdd',
      hints: DEFAULT_HINTS,
      binds: DEFAULT_CMS_BINDS,
      reportTemplates: DEFAULT_REPORTS,
      settings: { accentColor: '#2563EB' }
    }
  },
  {
    id: 'preset-mvd',
    title: 'Пак УМВД (ОУР / ППСП / СОБР)',
    description: 'Отыгровки задержания, наручников, Миранды, досмотра, посадки в КПЗ и патруля города',
    server: 'Red',
    org: 'УМВД',
    createdAt: 1700000000000,
    isPreset: true,
    data: {
      profiles: [{
        id: 'prof-mvd',
        name: 'Dmitry_Volkov',
        server: 'Red',
        org: 'УМВД',
        dept: 'ОУР',
        rank: 'Капитан',
        callsign: 'Гром-2',
        post: 'КПП-1'
      }],
      activeProfileId: 'prof-mvd',
      hints: DEFAULT_HINTS,
      binds: DEFAULT_CMS_BINDS,
      reportTemplates: DEFAULT_REPORTS,
      settings: { accentColor: '#7C3AED' }
    }
  },
  {
    id: 'preset-army',
    title: 'Пак Воинская часть №20115 (ВЧ)',
    description: 'Отыгровки караульной службы на КПП, колонны поставок боеприпасов и предупредительного огня',
    server: 'Red',
    org: 'ВЧ (Воинская часть №20115)',
    createdAt: 1700000000000,
    isPreset: true,
    data: {
      profiles: [{
        id: 'prof-army',
        name: 'Sergey_Kuznetsov',
        server: 'Red',
        org: 'ВЧ (Воинская часть №20115)',
        dept: 'РМТО',
        rank: 'Прапорщик',
        callsign: 'Бастион-1',
        post: 'КПП-1'
      }],
      activeProfileId: 'prof-army',
      hints: DEFAULT_HINTS,
      binds: DEFAULT_CMS_BINDS,
      reportTemplates: DEFAULT_REPORTS,
      settings: { accentColor: '#059669' }
    }
  }
];

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  targetId: '',
  targetType: 'id',
  hints: DEFAULT_HINTS,
  binds: DEFAULT_CMS_BINDS,
  reportTemplates: DEFAULT_REPORTS,
  savedConfigs: PREMADE_CONFIGS,
  activeConfigId: 'preset-gibdd',
  settings: {
    hotkey: 'Insert',
    hotkeyAlt: 'Alt+X',
    opacity: 1,
    accentColor: '#d97757',
    streamerMode: false,
    isPremium: false,
    premiumKey: '',
    firstRun: true,
    deepseekApiKey: '',
    autoScreenshot: true,
    autoScreenshotSort: true,
    autoMask: false,
    megCooldown: 3,
    partnerId: '',
  },

  setTargetId: (val: string, forcedType?: 'id' | 'mask') => {
    const trimmed = val.trim();
    if (forcedType) {
      set({ targetId: trimmed, targetType: forcedType });
    } else {
      set({ targetId: trimmed });
    }
  },
  setTargetType: (type: 'id' | 'mask') => set({ targetType: type }),

  addProfile: (p) => {
    const profile = { ...p, id: uid() };
    set(s => ({ profiles: [...s.profiles, profile] }));
    if (get().activeProfileId === null) set({ activeProfileId: profile.id });
    get().saveToStore();
  },
  updateProfile: (id, data) => {
    set(s => ({ profiles: s.profiles.map(p => p.id === id ? { ...p, ...data } : p) }));
    get().saveToStore();
  },
  deleteProfile: (id) => {
    const { profiles, activeProfileId } = get();
    const next = profiles.filter(p => p.id !== id);
    const nextActive = activeProfileId === id ? (next[0]?.id ?? null) : activeProfileId;
    set({ profiles: next, activeProfileId: nextActive });
    get().saveToStore();
  },
  setActiveProfile: (id) => { set({ activeProfileId: id }); get().saveToStore(); },
  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find(p => p.id === activeProfileId) ?? null;
  },

  addHint: (h) => { set(s => ({ hints: [...s.hints, { ...h, id: uid() }] })); get().saveToStore(); },
  updateHint: (id, data) => { set(s => ({ hints: s.hints.map(h => h.id === id ? { ...h, ...data } : h) })); get().saveToStore(); },
  deleteHint: (id) => { set(s => ({ hints: s.hints.filter(h => h.id !== id) })); get().saveToStore(); },

  addBind: (b) => { set(s => ({ binds: [...s.binds, { ...b, id: uid() }] })); get().saveToStore(); },
  updateBind: (id, data) => { set(s => ({ binds: s.binds.map(b => b.id === id ? { ...b, ...data } : b) })); get().saveToStore(); },
  deleteBind: (id) => { set(s => ({ binds: s.binds.filter(b => b.id !== id) })); get().saveToStore(); },

  addReportTemplate: (r) => { set(s => ({ reportTemplates: [...s.reportTemplates, { ...r, id: uid() }] })); get().saveToStore(); },
  updateReportTemplate: (id, data) => { set(s => ({ reportTemplates: s.reportTemplates.map(r => r.id === id ? { ...r, ...data } : r) })); get().saveToStore(); },
  deleteReportTemplate: (id) => { set(s => ({ reportTemplates: s.reportTemplates.filter(r => r.id !== id) })); get().saveToStore(); },

  updateSettings: (s) => {
    set(st => ({ settings: { ...st.settings, ...s } }));
    get().saveToStore();
  },

  // ─── CONFIG MANAGER ───
  saveCurrentAsConfig: (title, description = '') => {
    const { profiles, activeProfileId, hints, binds, reportTemplates, settings, savedConfigs } = get();
    const activeProf = profiles.find(p => p.id === activeProfileId);
    const newConfig: SavedConfig = {
      id: 'cfg-' + uid(),
      title: title.trim() || 'Пользовательский конфиг',
      description: description.trim() || `Конфигурация для ${activeProf?.org || 'Amazing Online'}`,
      server: activeProf?.server || 'Red',
      org: activeProf?.org || 'УГИБДД',
      createdAt: Date.now(),
      isPreset: false,
      data: {
        profiles: JSON.parse(JSON.stringify(profiles)),
        activeProfileId,
        hints: JSON.parse(JSON.stringify(hints)),
        binds: JSON.parse(JSON.stringify(binds)),
        reportTemplates: JSON.parse(JSON.stringify(reportTemplates)),
        settings: {
          accentColor: settings.accentColor,
          opacity: settings.opacity,
          hotkey: settings.hotkey,
          hotkeyAlt: settings.hotkeyAlt,
        }
      }
    };
    const updated = [newConfig, ...savedConfigs];
    set({ savedConfigs: updated, activeConfigId: newConfig.id });
    get().saveToStore();
  },

  loadConfig: (configId) => {
    const { savedConfigs } = get();
    const target = savedConfigs.find(c => c.id === configId);
    if (!target) return;

    set(state => ({
      activeConfigId: configId,
      profiles: target.data.profiles || state.profiles,
      activeProfileId: target.data.activeProfileId || (target.data.profiles?.[0]?.id ?? state.activeProfileId),
      hints: target.data.hints || state.hints,
      binds: target.data.binds || state.binds,
      reportTemplates: target.data.reportTemplates || state.reportTemplates,
      settings: {
        ...state.settings,
        ...(target.data.settings || {})
      }
    }));
    get().saveToStore();
  },

  deleteConfig: (configId) => {
    const { savedConfigs, activeConfigId } = get();
    const updated = savedConfigs.filter(c => c.id !== configId);
    const nextActive = activeConfigId === configId ? (updated[0]?.id || null) : activeConfigId;
    set({ savedConfigs: updated, activeConfigId: nextActive });
    get().saveToStore();
  },

  importConfig: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) return false;
      const importedConfig: SavedConfig = {
        id: 'cfg-' + uid(),
        title: parsed.title || 'Импортированный конфиг',
        description: parsed.description || 'Импортирован из файла',
        server: parsed.server || 'Red',
        org: parsed.org || 'УГИБДД',
        createdAt: Date.now(),
        isPreset: false,
        data: parsed.data,
      };
      set(s => ({
        savedConfigs: [importedConfig, ...s.savedConfigs],
        activeConfigId: importedConfig.id,
      }));
      get().loadConfig(importedConfig.id);
      return true;
    } catch (e) {
      console.warn('Import error', e);
      return false;
    }
  },

  exportConfig: (configId) => {
    const { savedConfigs } = get();
    const target = savedConfigs.find(c => c.id === configId);
    if (!target) return '';
    return JSON.stringify(target, null, 2);
  },

  loadFromStore: async () => {
    const api = (window as any).electronAPI;
    if (api && api.storeGet) {
      try {
        const profiles = await api.storeGet('profiles', []);
        const activeProfileId = await api.storeGet('activeProfileId', null);
        const hints = await api.storeGet('hints', DEFAULT_HINTS);
        const binds = await api.storeGet('binds', DEFAULT_CMS_BINDS);
        const reportTemplates = await api.storeGet('reportTemplates', DEFAULT_REPORTS);
        const settings = await api.storeGet('settings', get().settings);
        const savedConfigs = await api.storeGet('savedConfigs', PREMADE_CONFIGS);
        const activeConfigId = await api.storeGet('activeConfigId', 'preset-gibdd');
        set({ profiles, activeProfileId, hints, binds, reportTemplates, settings, savedConfigs, activeConfigId });
        return;
      } catch (e) {
        console.warn('Electron store read error, using localStorage fallback', e);
      }
    }
    // Browser fallback
    try {
      const p = localStorage.getItem('rp_profiles');
      const a = localStorage.getItem('rp_activeProfileId');
      const h = localStorage.getItem('rp_hints');
      const b = localStorage.getItem('rp_binds');
      const r = localStorage.getItem('rp_reportTemplates');
      const s = localStorage.getItem('rp_settings');
      const sc = localStorage.getItem('rp_saved_configs');
      const ac = localStorage.getItem('rp_active_config_id');

      let loadedProfiles: Profile[] = p ? JSON.parse(p) : [];
      if (loadedProfiles.length === 0) {
        loadedProfiles = [
          {
            id: 'demo-1',
            name: 'Alexander_Smirnov',
            server: 'Red',
            org: 'УГИБДД',
            dept: 'ОБ ДПС',
            rank: 'Лейтенант',
            callsign: 'Сокол-1',
            post: 'Мост г. Южный'
          },
          {
            id: 'demo-2',
            name: 'Dmitry_Volkov',
            server: 'Yellow',
            org: 'УМВД',
            dept: 'ОУР',
            rank: 'Капитан',
            callsign: 'Гром-2',
            post: 'КПП-1'
          }
        ];
      } else {
        loadedProfiles = loadedProfiles.map(prof => {
          let org = prof.org;
          let dept = prof.dept;
          let post = prof.post;
          if (org.includes('Полиция') || org.includes('МВД') || !org) {
            org = 'УГИБДД';
            dept = 'ОБ ДПС';
          }
          if (post === 'Ю-2' || post === 'К-1' || !post) {
            post = 'Мост г. Южный';
          }
          return { ...prof, org, dept, post };
        });
      }

      let loadedReports = r ? JSON.parse(r) : [];
      if (!loadedReports || loadedReports.length < 5) {
        loadedReports = DEFAULT_REPORTS;
      } else {
        loadedReports = loadedReports.map((rt: any) => {
          let tmpl = (rt.template || '').replace(/\{dept\}/g, '{org}');
          if (rt.id === '9' || rt.title === 'Помехи в рации' || tmpl.includes('повторите последнее')) {
            tmpl = '[{org}] Докладывает: {rank} {name}. Помехи в рации от нас.';
          }
          return {
            ...rt,
            template: tmpl
          };
        });
      }

      let loadedConfigs: SavedConfig[] = sc ? JSON.parse(sc) : PREMADE_CONFIGS;
      if (!loadedConfigs || loadedConfigs.length === 0) {
        loadedConfigs = PREMADE_CONFIGS;
      }

      let loadedBinds: Bind[] = b ? JSON.parse(b) : DEFAULT_CMS_BINDS;
      if (!loadedBinds || loadedBinds.length === 0) {
        loadedBinds = DEFAULT_CMS_BINDS;
      }

      set({
        profiles: loadedProfiles,
        activeProfileId: a ? JSON.parse(a) : loadedProfiles[0]?.id || 'demo-1',
        hints: h ? JSON.parse(h) : DEFAULT_HINTS,
        binds: loadedBinds,
        reportTemplates: loadedReports,
        savedConfigs: loadedConfigs,
        activeConfigId: ac ? JSON.parse(ac) : 'preset-gibdd',
        settings: s ? JSON.parse(s) : {
          ...get().settings,
          firstRun: false,
          isPremium: true,
          premiumKey: 'RP-PRO-PREMIUM-AMAZING',
          autoScreenshot: true,
          autoScreenshotSort: true,
          autoMask: false,
          megCooldown: 3,
          partnerId: '',
        }
      });
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  },

  saveToStore: async () => {
    const api = (window as any).electronAPI;
    const { profiles, activeProfileId, hints, binds, reportTemplates, settings, savedConfigs, activeConfigId } = get();
    if (api && api.storeSet) {
      try {
        await api.storeSet('profiles', profiles);
        await api.storeSet('activeProfileId', activeProfileId);
        await api.storeSet('hints', hints);
        await api.storeSet('binds', binds);
        await api.storeSet('reportTemplates', reportTemplates);
        await api.storeSet('settings', settings);
        await api.storeSet('savedConfigs', savedConfigs);
        await api.storeSet('activeConfigId', activeConfigId);
        return;
      } catch (e) {}
    }
    // Browser fallback
    try {
      localStorage.setItem('rp_profiles', JSON.stringify(profiles));
      localStorage.setItem('rp_activeProfileId', JSON.stringify(activeProfileId));
      localStorage.setItem('rp_hints', JSON.stringify(hints));
      localStorage.setItem('rp_binds', JSON.stringify(binds));
      localStorage.setItem('rp_reportTemplates', JSON.stringify(reportTemplates));
      localStorage.setItem('rp_settings', JSON.stringify(settings));
      localStorage.setItem('rp_saved_configs', JSON.stringify(savedConfigs));
      localStorage.setItem('rp_active_config_id', JSON.stringify(activeConfigId));
    } catch (e) {}
  },
}));
