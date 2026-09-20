import { CampusInfo } from '../types/schedule';

export interface DetailedCampusInfo extends CampusInfo {
  floors?: number;
  pdfPlanUrl?: string;
}

export const CAMPUSES: Record<string, DetailedCampusInfo> = {
  'У': {
    letter: 'У',
    name: 'Ульянка (Корпус У)',
    fullName: 'Учебно-лабораторный корпус «Ульянка» (Корпус У)',
    address: 'Ленинский проспект, д. 101, Санкт-Петербург',
    metro: 'м. Ленинский проспект / Проспект Ветеранов / Автово',
    description: 'Главный научно-образовательный кампус СПбГМТУ, Передовая инженерная школа «Судостроение 4.0», спорткомплекс, бассейн и учебные лаборатории.',
    mapsUrl: 'https://yandex.ru/maps/?text=' + encodeURIComponent('СПбГМТУ, Санкт-Петербург, Ленинский проспект, 101'),
    floors: 5,
    pdfPlanUrl: 'https://isu.smtu.ru/doc_tree_file/50c1eeb37e952c41b6737c1acccdc1c1b39cea4a604e750df94649707029de15/'
  },
  'А': {
    letter: 'А',
    name: 'Лоцманская (Корпус А)',
    fullName: 'Главный исторический корпус (Корпус А)',
    address: 'ул. Лоцманская, д. 3, Санкт-Петербург',
    metro: 'м. Сенная площадь / Садовая / Балтийская',
    description: 'Историческое сердце Корабелки: ректорат, Актовый зал, музей истории кораблестроения, библиотека и кафедры.',
    mapsUrl: 'https://yandex.ru/maps/?text=' + encodeURIComponent('СПбГМТУ, Санкт-Петербург, Лоцманская улица, 3'),
    floors: 5,
    pdfPlanUrl: 'https://isu.smtu.ru/doc_tree_file/9340022def0eb135cfe16946c8e678a262a93545ddb0ddbfa3cfcabeec27ce4a/'
  },
  'Б': {
    letter: 'Б',
    name: 'Лоцманская (Корпус Б)',
    fullName: 'Учебный корпус на Лоцманской (Корпус Б)',
    address: 'ул. Лоцманская, д. 10-14, Санкт-Петербург',
    metro: 'м. Сенная площадь / Садовая / Спасская',
    description: 'Учебный корпус кораблестроительных и инженерных факультетов.',
    mapsUrl: 'https://yandex.ru/maps/?text=' + encodeURIComponent('СПбГМТУ, Санкт-Петербург, Лоцманская улица, 10-14'),
    floors: 6,
    pdfPlanUrl: 'https://isu.smtu.ru/doc_tree_file/e556fc798afbfcab2900f2966edc78ad69a1d7660e1f00c381cdd8d7a73b4551/'
  },
  'Г': {
    letter: 'Г',
    name: 'Горьковская (Корпус Г)',
    fullName: 'Учебный корпус на Горьковской (Корпус Г)',
    address: 'Кронверкский пр., д. 5, Санкт-Петербург',
    metro: 'м. Горьковская',
    description: 'Учебный корпус в историческом центре Петроградской стороны рядом с Петропавловской крепостью.',
    mapsUrl: 'https://yandex.ru/maps/?text=' + encodeURIComponent('СПбГМТУ, Санкт-Петербург, Кронверкский проспект, 5'),
    floors: 5
  },
  'М': {
    letter: 'М',
    name: 'Псковская (Корпус М)',
    fullName: 'Учебно-производственный корпус на Псковской (Корпус М)',
    address: 'ул. Псковская, д. 23, Санкт-Петербург',
    metro: 'м. Балтийская / Сенная площадь',
    description: 'Учебно-лабораторный комплекс и опытно-производственные мастерские университета.',
    mapsUrl: 'https://yandex.ru/maps/?text=' + encodeURIComponent('СПбГМТУ, Санкт-Петербург, Псковская улица, 23')
  },
  'С': {
    letter: 'С',
    name: 'Колледж СПбГМТУ (СТФ)',
    fullName: 'Среднетехнический факультет / Колледж СПбГМТУ',
    address: 'пр. Стачек, д. 111, Санкт-Петербург',
    metro: 'м. Автово',
    description: 'Колледж морского приборостроения и среднетехнический факультет СПбГМТУ.',
    mapsUrl: 'https://yandex.ru/maps/?text=' + encodeURIComponent('СПбГМТУ, Санкт-Петербург, проспект Стачек, 111')
  }
};

/**
 * Accurately extracts campus info from any room string:
 * - "У 167", "У Спортзал", "У 101" -> Корпус У (Ленинский, 101)
 * - "167 Корпус У" -> Корпус У
 * - "А Актовый зал", "А 407" -> Корпус А (Лоцманская, 3)
 * - "Б 401" -> Корпус Б (Лоцманская, 10-14)
 * - "Г 502" -> Корпус Г (Кронверкский, 5)
 * - "Конгресс-Центр Конференц-зал" -> Корпус У (Ленинский, 101)
 */
export function getCampusByRoom(room: string): DetailedCampusInfo | undefined {
  if (!room) return undefined;
  const str = room.trim();

  // 1. Check for "Корпус X" anywhere in the room string
  const corpusMatch = str.match(/Корпус\s+([А-ЯЁA-Z])/i);
  if (corpusMatch) {
    const letter = corpusMatch[1].toUpperCase();
    if (CAMPUSES[letter]) return CAMPUSES[letter];
  }

  // 2. Check if room starts with letter followed by space: "У 167", "А 407", "Б 401", "Г 502"
  const startLetterMatch = str.match(/^([А-ЯЁA-Z])(?:\s+|$)/i);
  if (startLetterMatch) {
    const letter = startLetterMatch[1].toUpperCase();
    if (CAMPUSES[letter]) return CAMPUSES[letter];
  }

  // 3. Check for keywords like "Конгресс", "Спортзал", "Бассейн" (all on campus Ульянка)
  const lower = str.toLowerCase();
  if (lower.includes('конгресс') || lower.includes('спортзал') || lower.includes('бассейн')) {
    return CAMPUSES['У'];
  }

  // 4. Fallback to first letter if known
  const firstChar = str.charAt(0).toUpperCase();
  if (CAMPUSES[firstChar]) {
    return CAMPUSES[firstChar];
  }

  return undefined;
}
