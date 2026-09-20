import { CampusInfo } from '../types/schedule';

export const CAMPUSES: Record<string, CampusInfo> = {
  'У': {
    letter: 'У',
    name: 'Ульянка',
    fullName: 'Учебно-лабораторный корпус «Ульянка»',
    address: 'Ленинский проспект, д. 101, Санкт-Петербург',
    metro: 'м. Ленинский проспект / Автово',
    description: 'Главный современный учебный кампус СПбГМТУ, Передовая инженерная школа, спорткомплекс и бассейн.',
    mapsUrl: 'https://yandex.ru/maps/-/CDuWqG7q'
  },
  'Г': {
    letter: 'Г',
    name: 'Горьковская',
    fullName: 'Корпус на Горьковской (Кронверкский)',
    address: 'Кронверкский пр., д. 5, Санкт-Петербург',
    metro: 'м. Горьковская',
    description: 'Учебный корпус в историческом центре Петроградской стороны.',
    mapsUrl: 'https://yandex.ru/maps/-/CDuWqK2b'
  },
  'Л': {
    letter: 'Л',
    name: 'Лоцманская',
    fullName: 'Исторический комплекс на Лоцманской',
    address: 'ул. Лоцманская, д. 3 / д. 10, Санкт-Петербург',
    metro: 'м. Сенная площадь / Садовая',
    description: 'Историческое сердце Корабелки, ректорат, музей истории кораблестроения и библиотека.',
    mapsUrl: 'https://yandex.ru/maps/-/CDuWqO6E'
  },
  'С': {
    letter: 'С',
    name: 'Стачек / Колледж',
    fullName: 'Колледж СПбГМТУ (СТФ)',
    address: 'пр. Стачек, д. 111, Санкт-Петербург',
    metro: 'м. Автово',
    description: 'Среднетехнический факультет / колледж морского приборостроения.',
    mapsUrl: 'https://yandex.ru/maps/-/CDuWq89Y'
  }
};

export function getCampusByRoom(room: string): CampusInfo | undefined {
  if (!room) return undefined;
  const trimmed = room.trim();
  const firstLetter = trimmed.charAt(0).toUpperCase();
  return CAMPUSES[firstLetter];
}
