// Common SAMP / Amazing Online names & surnames dictionary
const KNOWN_WORDS: Record<string, string> = {
  "alexander": "Александр",
  "aleksandr": "Александр",
  "alexey": "Алексей",
  "aleksey": "Алексей",
  "andrey": "Андрей",
  "anton": "Антон",
  "artem": "Артем",
  "artur": "Артур",
  "bogdan": "Богдан",
  "boris": "Борис",
  "vadim": "Вадим",
  "valeriy": "Валерий",
  "valery": "Валерий",
  "vasiliy": "Василий",
  "vasily": "Василий",
  "victor": "Виктор",
  "viktor": "Виктор",
  "vitaliy": "Виталий",
  "vitaly": "Виталий",
  "vladimir": "Владимир",
  "vladislav": "Владислав",
  "vyacheslav": "Вячеслав",
  "gennadiy": "Геннадий",
  "gennady": "Геннадий",
  "georgiy": "Георгий",
  "gleb": "Глеб",
  "grigoriy": "Григорий",
  "danil": "Данил",
  "danila": "Данила",
  "daniil": "Даниил",
  "denis": "Денис",
  "dmitriy": "Дмитрий",
  "dmitry": "Дмитрий",
  "dima": "Дима",
  "evgeniy": "Евгений",
  "evgeny": "Евгений",
  "egor": "Егор",
  "ivan": "Иван",
  "igor": "Игорь",
  "ilya": "Илья",
  "kirill": "Кирилл",
  "konstantin": "Константин",
  "leonid": "Леонид",
  "lev": "Лев",
  "maksim": "Максим",
  "maxim": "Максим",
  "mark": "Марк",
  "matvey": "Матвей",
  "mikhail": "Михаил",
  "nikita": "Никита",
  "nikolay": "Николай",
  "oleg": "Олег",
  "pavel": "Павел",
  "petr": "Петр",
  "pyotr": "Петр",
  "roman": "Роман",
  "rostislav": "Ростислав",
  "ruslan": "Руслан",
  "svyatoslav": "Святослав",
  "sergey": "Сергей",
  "stanislav": "Станислав",
  "stepan": "Степан",
  "timofey": "Тимофей",
  "timur": "Тимур",
  "fedor": "Федор",
  "fyodor": "Федор",
  "eduard": "Эдуард",
  "yuriy": "Юрий",
  "yury": "Юрий",
  "yaroslav": "Ярослав",
  "ivanov": "Иванов",
  "ivanova": "Иванова",
  "smirnov": "Смирнов",
  "smirnova": "Смирнова",
  "kuznetsov": "Кузнецов",
  "kuznetsova": "Кузнецова",
  "popov": "Попов",
  "popova": "Попова",
  "vasiliev": "Васильев",
  "vasilyev": "Васильев",
  "petrov": "Петров",
  "petrova": "Петрова",
  "sokolov": "Соколов",
  "sokolova": "Соколова",
  "mikhailov": "Михайлов",
  "novikov": "Новиков",
  "fedorov": "Федоров",
  "morozov": "Морозов",
  "volkov": "Волков",
  "volkova": "Волкова",
  "alekseev": "Алексеев",
  "lebedev": "Лебедев",
  "semenov": "Семенов",
  "egorov": "Егоров",
  "pavlov": "Павлов",
  "kozlov": "Козлов",
  "stepanov": "Степанов",
  "nikolaev": "Николаев",
  "orlov": "Орлов",
  "andreev": "Андреев",
  "makarov": "Макаров",
  "nikitin": "Никитин",
  "zakharov": "Захаров",
  "zaytsev": "Зайцев",
  "soloviev": "Соловьев",
  "solovyov": "Соловьев",
  "borisov": "Борисов",
  "yakovlev": "Яковлев",
  "grigoriev": "Григорьев",
  "romanov": "Романов",
  "vorobiev": "Воробьев",
  "sergeev": "Сергеев",
  "kuzmin": "Кузьмин",
  "frolov": "Фролов",
  "aleksandrov": "Александров",
  "dmitriev": "Дмитриев",
  "korolev": "Королев",
  "gusev": "Гусев",
  "kiselev": "Киселев",
  "kiselyov": "Киселев",
  "ilyin": "Ильин",
  "maksimov": "Максимов",
  "polyakov": "Поляков",
  "sorokin": "Сорокин",
  "vinogradov": "Виноградов",
  "kovalev": "Ковалев",
  "belov": "Белов",
  "medvedev": "Медведев",
  "antonov": "Антонов",
  "tarasov": "Тарасов",
  "zhukov": "Жуков",
  "baranov": "Баранов",
  "filippov": "Филиппов",
  "komarov": "Комаров",
  "davydov": "Давыдов",
  "belyaev": "Беляев",
  "gerasimov": "Герасимов",
  "bogdanov": "Богданов",
  "osipov": "Осипов",
  "sidorov": "Сидоров",
  "matveev": "Матвеев",
  "titov": "Титов",
  "markov": "Марков",
  "mironov": "Миронов",
  "krylov": "Крылов",
  "kulikov": "Куликов",
  "gromov": "Громов",
};

/**
 * Transliterates Latin SAMP nick like "Ivan_Ivanov" to Russian "Иван Иванов"
 */
export function transliterateNickToRussian(latin: string): string {
  if (!latin) return "";
  // If already Cyrillic, return cleaned string
  if (/[а-яА-ЯёЁ]/.test(latin)) {
    return latin.replace(/_/g, " ").trim();
  }

  const str = latin.trim();
  const parts = str.split(/[_s]+/);

  const converted = parts.map(part => {
    const low = part.toLowerCase();
    if (KNOWN_WORDS[low]) return KNOWN_WORDS[low];

    // General phonetics fallback
    let p = low
      .replace(/shch/g, "щ")
      .replace(/yo/g, "е")
      .replace(/zh/g, "ж")
      .replace(/ch/g, "ч")
      .replace(/sh/g, "ш")
      .replace(/kh/g, "х")
      .replace(/ts/g, "ц")
      .replace(/ya/g, "я")
      .replace(/yu/g, "ю")
      .replace(/ye/g, "е")
      .replace(/iy$/g, "ий")
      .replace(/yy$/g, "ый")
      .replace(/ey$/g, "ей")
      .replace(/ay$/g, "ай")
      .replace(/oy$/g, "ой")
      .replace(/uy$/g, "уй")
      .replace(/y$/g, "ий")
      .replace(/a/g, "а")
      .replace(/b/g, "б")
      .replace(/v/g, "в")
      .replace(/w/g, "в")
      .replace(/g/g, "г")
      .replace(/d/g, "д")
      .replace(/e/g, "е")
      .replace(/z/g, "з")
      .replace(/i/g, "и")
      .replace(/j/g, "й")
      .replace(/k/g, "к")
      .replace(/l/g, "л")
      .replace(/m/g, "м")
      .replace(/n/g, "н")
      .replace(/o/g, "о")
      .replace(/p/g, "п")
      .replace(/r/g, "р")
      .replace(/s/g, "с")
      .replace(/t/g, "т")
      .replace(/u/g, "у")
      .replace(/f/g, "ф")
      .replace(/h/g, "х")
      .replace(/c/g, "к")
      .replace(/y/g, "ы")
      .replace(/x/g, "кс");

    return p.charAt(0).toUpperCase() + p.slice(1);
  });

  return converted.join(" ");
}

/**
 * Gets proper Russian surname for radio reports (e.g. "Ivan_Ivanov" -> "Иванов")
 */
export function getRadioRussianSurname(rawName?: string, customRu?: string): string {
  if (customRu && customRu.trim()) {
    return customRu.trim();
  }
  if (!rawName) return "Смирнов";

  const ruFull = transliterateNickToRussian(rawName);
  const parts = ruFull.split(/\s+/);

  // In Russian police/military radio reports: "Докладывает: Лейтенант Иванов"
  if (parts.length >= 2) {
    return parts[parts.length - 1]; // Surname
  }
  return parts[0] || "Смирнов";
}
