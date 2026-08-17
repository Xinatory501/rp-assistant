// Mapping categories to specific law documents
export const TOPIC_DOC_PATTERNS: Record<string, string[]> = {
  "МВД": [
    "о полиции",
    "административный регламент мвд",
    "устав полиции",
    "внутренний устав органов внутренних дел",
    "правила дорожного движения",
    "общий устав государственных структур",
    "федеральное постановление",
    "кодекс об административных правонарушениях",
    "уголовно-процессуальный",
    "уголовный кодекс",
    "территориях",
    "охраняемых",
  ],
  "УК": [
    "уголовный кодекс",
    "уголовно-процессуальный кодекс",
    "общий устав государственных структур",
    "федеральное постановление",
  ],
  "КоАП": [
    "кодекс об административных правонарушениях",
    "правила дорожного движения",
    "административный регламент",
    "о полиции",
  ],
  "ОУГ": [
    "общий устав государственных структур",
    "федеральное постановление",
    "вертикали власти",
    "трудовой кодекс",
    "о порядке рассмотрения обращений",
  ],
  "УПК": [
    "уголовно-процессуальный кодекс",
    "уголовный кодекс",
    "о полиции",
    "о правительстве",
    "территориях",
    "кодекс административного судопроизводства",
  ],
  "ФСБ": [
    "о федеральной службе безопасности",
    "о службе в оперативных",
    "общий устав государственных структур",
    "федеральное постановление",
    "уголовный кодекс",
    "уголовно-процессуальный кодекс",
    "территориях",
  ],
  "ПР": [
    "о правительстве",
    "правительство",
    "территориях с ограниченным",
    "служебных и охраняемых",
    "вертикали власти",
    "общий устав государственных структур",
    "федеральное постановление",
    "уголовно-процессуальный",
    "о частных охранных",
  ],
  "АРМИЯ": [
    "строевой устав",
    "устав вооруженных сил",
    "воинская часть",
    "о статусе военнослужащих",
    "о военной службе",
    "территориях",
    "общий устав государственных структур",
    "федеральное постановление",
  ],
  "ФСИН": [
    "фсин",
    "кодекс о тюремных",
    "об уголовно-исполнительной",
    "территориях",
    "общий устав государственных структур",
    "федеральное постановление",
  ],
  "СУД": [
    "суд",
    "адвокат",
    "судейский",
    "о судебной системе",
    "кодекс административного судопроизводства",
  ],
  "ЕСС": [
    "есс",
    "единой службы спасения",
    "общий устав государственных структур",
  ],
  "ТРК": [
    "о средствах массовой информации",
    "общий устав государственных структур",
  ],
  "ПДД": [
    "правила дорожного движения",
    "кодекс об административных правонарушениях",
    "эвакуации",
  ],
  "ТЕРРИТОРИИ": [
    "территориях",
    "охраняемых",
    "о правительстве",
    "о полиции",
    "воинская часть",
    "фсин",
  ],
};

/**
 * Fast client-side keyword heuristics to guess topic immediately
 */
export function fastClassifyTopic(query: string, userOrg?: string): string[] {
  const q = query.toLowerCase();
  const matched = new Set<string>();

  // Government & Guard powers
  if (q.includes("правительств") || q.includes("губернатор") || q.includes("министр") || q.includes("депутат") || q.includes("инспектор") || q.includes("ревизор") || q.includes("мэри") || q.includes("администраци")) {
    matched.add("ПР");
  }
  if (q.includes("охран") || q.includes("кпп") || q.includes("пропуск") || q.includes("досмотр") || q.includes("обыск") || q.includes("турникет") || q.includes("холл")) {
    matched.add("ПР");
    matched.add("ТЕРРИТОРИИ");
    matched.add("УПК");
    matched.add("МВД");
  }

  // Police & Law enforcement
  if (q.includes("полиц") || q.includes("гибдд") || q.includes("умвд") || q.includes("мвд") || q.includes("дпс") || q.includes("ппс") || q.includes("удостоверен") || q.includes("задержан") || q.includes("миранд") || q.includes("погоня") || q.includes("патрул")) {
    matched.add("МВД");
  }

  // Criminal code
  if (q.includes("ук") || q.includes("статья") || q.includes("преступлен") || q.includes("убийств") || q.includes("краж") || q.includes("взятк") || q.includes("нападен") || q.includes("оружи") || q.includes("срок") || q.includes("розыск")) {
    matched.add("УК");
  }

  // Administrative / Traffic
  if (q.includes("коап") || q.includes("штраф") || q.includes("прав") || q.includes("пдд") || q.includes("скорост") || q.includes("газон") || q.includes("парковк") || q.includes("тонировк") || q.includes("встречк") || q.includes("эвакуац")) {
    matched.add("КоАП");
    matched.add("ПДД");
  }

  // State organizations charter / hierarchy
  if (q.includes("оуг") || q.includes("фп") || q.includes("постановлен") || q.includes("субординац") || q.includes("выговор") || q.includes("увольнен") || q.includes("рация") || q.includes("департамент") || q.includes("дресс-код") || q.includes("форма") || q.includes("прогул") || q.includes("вертикал")) {
    matched.add("ОУГ");
  }

  // Criminal procedure
  if (q.includes("упк") || q.includes("обыск") || q.includes("допрос") || q.includes("досмотр") || q.includes("арест") || q.includes("понятые") || q.includes("следств")) {
    matched.add("УПК");
  }

  // FSB
  if (q.includes("фсб") || q.includes("следственн") || q.includes("уфсб") || q.includes("шпионаж") || q.includes("госизмен") || q.includes("теракт") || q.includes("облава")) {
    matched.add("ФСБ");
  }

  // Army
  if (q.includes("арми") || q.includes("воинск") || q.includes("строй") || q.includes("шеренг") || q.includes("колонн") || q.includes("склад") || q.includes("поставк") || q.includes("присяг") || q.includes("вч")) {
    matched.add("АРМИЯ");
  }

  // FSIN
  if (q.includes("фсин") || q.includes("тюрьм") || q.includes("колони") || q.includes("ик") || q.includes("карцер") || q.includes("зек") || q.includes("заключен") || q.includes("удо") || q.includes("котп")) {
    matched.add("ФСИН");
  }

  // Court
  if (q.includes("суд") || q.includes("судь") || q.includes("иск") || q.includes("адвокат") || q.includes("защитник") || q.includes("кас") || q.includes("заседан")) {
    matched.add("СУД");
  }

  // ESS
  if (q.includes("есс") || q.includes("мчс") || q.includes("больниц") || q.includes("врач") || q.includes("лечен") || q.includes("пожар") || q.includes("таблетк") || q.includes("скорая")) {
    matched.add("ЕСС");
  }

  // TRK
  if (q.includes("трк") || q.includes("сми") || q.includes("объявлен") || q.includes("эфир") || q.includes("про") || q.includes("ппэ") || q.includes("газет")) {
    matched.add("ТРК");
  }

  // Fallback to user organization if no direct match
  if (matched.size === 0 && userOrg) {
    if (userOrg.includes("ГИБДД") || userOrg.includes("МВД") || userOrg.includes("Полиция")) matched.add("МВД");
    else if (userOrg.includes("ФСБ")) matched.add("ФСБ");
    else if (userOrg.includes("ВЧ") || userOrg.includes("Армия")) matched.add("АРМИЯ");
    else if (userOrg.includes("ФСИН")) matched.add("ФСИН");
    else if (userOrg.includes("Правительство")) matched.add("ПР");
    else if (userOrg.includes("Суд")) matched.add("СУД");
    else if (userOrg.includes("ЕСС")) matched.add("ЕСС");
    else if (userOrg.includes("ТРК")) matched.add("ТРК");
  }

  if (matched.size === 0) {
    matched.add("МВД");
    matched.add("ПР");
    matched.add("УК");
    matched.add("КоАП");
  }

  return Array.from(matched);
}

/**
 * Extracts targeted sections from the indexed law database
 */
export function buildTargetedLawContext(
  indexedDocs: Record<string, string>,
  categories: string[],
  maxChars = 90000
): { contextText: string; loadedFiles: string[]; totalChars: number } {
  const selectedDocKeys = new Set<string>();

  for (const cat of categories) {
    const patterns = TOPIC_DOC_PATTERNS[cat] || [];
    for (const pattern of patterns) {
      const lowerPat = pattern.toLowerCase();
      for (const docKey of Object.keys(indexedDocs)) {
        if (docKey.toLowerCase().includes(lowerPat)) {
          selectedDocKeys.add(docKey);
        }
      }
    }
  }

  // Always ensure core state structure rules (ОУГ / ФП / Правительство / Полиция) are included if space allows
  if (selectedDocKeys.size === 0) {
    for (const docKey of Object.keys(indexedDocs)) {
      const lk = docKey.toLowerCase();
      if (lk.includes("уголовный") || lk.includes("административ") || lk.includes("устав государств") || lk.includes("постановлен") || lk.includes("правительств") || lk.includes("полици")) {
        selectedDocKeys.add(docKey);
      }
    }
  }

  let combined = "";
  const loadedFiles: string[] = [];

  for (const key of selectedDocKeys) {
    const text = indexedDocs[key];
    if (!text) continue;
    if (combined.length + text.length > maxChars) {
      const remaining = maxChars - combined.length;
      if (remaining > 2000) {
        combined += "\n\n--- [РАЗДЕЛ: " + key + "] ---\n" + text.slice(0, remaining) + "\n...[сокращено для компактности]";
        loadedFiles.push(key);
      }
      break;
    }
    combined += "\n\n--- [РАЗДЕЛ: " + key + "] ---\n" + text;
    loadedFiles.push(key);
  }

  return {
    contextText: combined.trim(),
    loadedFiles,
    totalChars: combined.length,
  };
}
