/// Helper for automatic transliteration of CRMP character names (Ivan_Ivanov -> Иван Иванов, Savely_Gerov -> Геров)
class TranslitHelper {
  static const Map<String, String> _commonNames = {
    'savely': 'Савелий',
    'saveliy': 'Савелий',
    'savva': 'Савва',
    'ivan': 'Иван',
    'dmitriy': 'Дмитрий',
    'dmitry': 'Дмитрий',
    'alexandr': 'Александр',
    'aleksandr': 'Александр',
    'alexander': 'Александр',
    'sergey': 'Сергей',
    'sergei': 'Сергей',
    'andrey': 'Андрей',
    'andrei': 'Андрей',
    'mikhail': 'Михаил',
    'maksim': 'Максим',
    'maxim': 'Максим',
    'artem': 'Артём',
    'artyom': 'Артём',
    'egor': 'Егор',
    'nikita': 'Никита',
    'kirill': 'Кирилл',
    'danil': 'Данил',
    'danila': 'Данила',
    'daniil': 'Даниил',
    'vladislav': 'Владислав',
    'vlad': 'Влад',
    'vladimir': 'Владимир',
    'pavel': 'Павел',
    'denis': 'Денис',
    'roman': 'Роман',
    'ilya': 'Илья',
    'ilia': 'Илья',
    'timofey': 'Тимофей',
    'timofei': 'Тимофей',
    'yaroslav': 'Ярослав',
    'matvey': 'Матвей',
    'matvei': 'Матвей',
    'gleb': 'Глеб',
    'bogdan': 'Богдан',
    'semen': 'Семён',
    'semyon': 'Семён',
    'vadim': 'Вадим',
    'ruslan': 'Руслан',
    'anton': 'Антон',
    'oleg': 'Олег',
    'igor': 'Игорь',
    'viktor': 'Виктор',
    'victor': 'Виктор',
    'konstantin': 'Константин',
    'stanislav': 'Станислав',
    'anna': 'Анна',
    'ekaterina': 'Екатерина',
    'polina': 'Полина',
    'daria': 'Дарья',
    'darya': 'Дарья',
    'alina': 'Алина',
    'viktoria': 'Виктория',
    'victoria': 'Виктория',
    'yulia': 'Юлия',
    'julia': 'Юлия',
    'ksenia': 'Ксения',
    'olga': 'Ольга',
    'tatyana': 'Татьяна',
    'tatiana': 'Татьяна',
    'natalia': 'Наталья',
    'natalya': 'Наталья',
    'elena': 'Елена',
    'marina': 'Марина',
    'svetlana': 'Светлана',
    'irina': 'Ирина',
    'veronika': 'Вероника',
    'diana': 'Диана',
    'kristina': 'Кристина',
    'sofia': 'София',
    'sofya': 'Софья',
    'arina': 'Арина',
    'alisa': 'Алиса',
    'valeria': 'Валерия',
    'milana': 'Милана',
    'margarita': 'Маргарита',
    'yana': 'Яна',
    'eva': 'Ева',
    'ulyana': 'Ульяна',
    'aleksandra': 'Александра',
    'alexandra': 'Александра',
    'vera': 'Вера',
    'vasilisa': 'Василиса',
    'gerov': 'Геров',
    'morozov': 'Морозов',
    'morozova': 'Морозова',
    'ivanov': 'Иванов',
    'ivanova': 'Иванова',
    'smirnov': 'Смирнов',
    'smirnova': 'Смирнова',
    'petrov': 'Петров',
    'petrova': 'Петрова',
    'kuznetsov': 'Кузнецов',
    'kuznetsova': 'Кузнецова',
    'popov': 'Попов',
    'popova': 'Попова',
    'sokolov': 'Соколов',
    'sokolova': 'Соколова',
    'lebedev': 'Лебедев',
    'lebedeva': 'Лебедева',
    'kozlov': 'Козлов',
    'kozlova': 'Козлова',
    'novikov': 'Новиков',
    'novikova': 'Новикова',
    'volkov': 'Волков',
    'volkova': 'Волкова',
  };

  /// Transliterates a single English word to Russian using rules
  static String transliterateWord(String word) {
    if (word.isEmpty) return '';
    final lower = word.toLowerCase();
    if (_commonNames.containsKey(lower)) {
      return _commonNames[lower]!;
    }

    String s = lower;

    // Multi-char replacements
    s = s.replaceAll('shch', 'щ');
    s = s.replaceAll('sch', 'щ');
    s = s.replaceAll('yo', 'ё');
    s = s.replaceAll('jo', 'ё');
    s = s.replaceAll('zh', 'ж');
    s = s.replaceAll('ch', 'ч');
    s = s.replaceAll('sh', 'ш');
    s = s.replaceAll('ts', 'ц');
    s = s.replaceAll('tc', 'ц');
    s = s.replaceAll('yu', 'ю');
    s = s.replaceAll('ju', 'ю');
    s = s.replaceAll('ya', 'я');
    s = s.replaceAll('ja', 'я');
    s = s.replaceAll('kh', 'х');
    s = s.replaceAll('iy', 'ий');
    s = s.replaceAll('yy', 'ый');
    s = s.replaceAll('ay', 'ай');
    s = s.replaceAll('ey', 'ей');
    s = s.replaceAll('oy', 'ой');
    s = s.replaceAll('uy', 'уй');
    s = s.replaceAll('ij', 'ий');
    s = s.replaceAll('yj', 'ый');
    s = s.replaceAll('ph', 'ф');
    s = s.replaceAll('th', 'т');
    s = s.replaceAll('ck', 'к');
    s = s.replaceAll('qu', 'кв');

    // Single-char map
    final map = {
      'a': 'а', 'b': 'б', 'v': 'в', 'w': 'в', 'g': 'г', 'd': 'д', 'e': 'е',
      'z': 'з', 'i': 'и', 'j': 'й', 'y': 'ы', 'k': 'к', 'l': 'л', 'm': 'м',
      'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у',
      'f': 'ф', 'h': 'х', 'c': 'к', 'x': 'кс', 'q': 'к'
    };

    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      final char = s[i];
      if (map.containsKey(char)) {
        buf.write(map[char]);
      } else {
        buf.write(char);
      }
    }

    final res = buf.toString();
    if (res.isEmpty) return '';
    return res[0].toUpperCase() + res.substring(1);
  }

  /// Converts 'Savely_Gerov' -> 'Геров' (only surname!)
  static String transliterateSurname(String nick) {
    if (nick.trim().isEmpty) return '';
    final parts = nick.trim().split(RegExp(r'[_\s]+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '';
    // If nickname is Nick_Name, always extract the surname (second / last part)
    final surnamePart = parts.length > 1 ? parts.last : parts.first;
    return transliterateWord(surnamePart);
  }

  /// Converts 'Ivan_Ivanov' or 'Ivan Ivanov' to 'Иван Иванов'
  static String transliterateNickname(String nick) {
    if (nick.trim().isEmpty) return '';
    final parts = nick.trim().split(RegExp(r'[_\s]+')).where((p) => p.isNotEmpty).toList();
    final result = parts.map(transliterateWord).join(' ');
    return result;
  }
}

