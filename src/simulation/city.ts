import type { DayPeriod, TravelModeId } from './types';

export type CityLocationKind = 'home' | 'office' | 'shop' | 'service' | 'food' | 'transport' | 'public';

export interface CityDistrictDefinition {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CityLocationDefinition {
  id: string;
  cityId: string;
  districtId: string;
  name: string;
  shortName: string;
  kind: CityLocationKind;
  x: number;
  y: number;
  openPeriods: DayPeriod[];
  description: string;
  address: string;
  services: string[];
}

export interface TravelModeDefinition {
  id: TravelModeId;
  name: string;
  description: string;
  baseCost: number;
  costPerDistance: number;
  timeFactor: number;
  waitMinutes: number;
  energyFactor: number;
}

export interface TravelRoute {
  fromId: string;
  toId: string;
  distance: number;
  minutes: number;
  cost: number;
  energyCost: number;
  modeId: TravelModeId;
}

export const ostrogorskDistricts: CityDistrictDefinition[] = [
  { id: 'old-town', name: 'Старый центр', description: 'Пятиэтажки, клиника, банк и остановки.', x: 7, y: 11, width: 40, height: 43 },
  { id: 'center', name: 'Центр', description: 'Офисы, магазины и кафе.', x: 45, y: 9, width: 37, height: 43 },
  { id: 'industrial', name: 'Промзона', description: 'Склады, заводские корпуса и дешёвое жильё.', x: 48, y: 51, width: 43, height: 34 },
  { id: 'station', name: 'Вокзальный', description: 'Рынок, сервисы и выезд из города.', x: 72, y: 67, width: 22, height: 25 },
  { id: 'south', name: 'Южный', description: 'Спальный район и частный сектор.', x: 8, y: 55, width: 42, height: 36 },
];

const allPeriods: DayPeriod[] = ['morning', 'workday', 'evening', 'night'];

export const cityLocations: CityLocationDefinition[] = [
  {
    id: 'family-home', cityId: 'ostrogorsk', districtId: 'south', name: 'Дом матери', shortName: 'Дом', kind: 'home',
    x: 20, y: 73, openPeriods: allPeriods, address: 'ул. Южная, 11',
    description: 'Комната Ильи, старый системный блок и домашний роутер.',
    services: ['Сон', 'Учёба', 'Работа за компьютером'],
  },
  {
    id: 'shared-flat-home', cityId: 'ostrogorsk', districtId: 'old-town', name: 'Съёмная комната', shortName: 'Комната', kind: 'home',
    x: 28, y: 47, openPeriods: allPeriods, address: 'ул. Коммунальная, 8',
    description: 'Комната в двушке. Сосед часто работает ночью.',
    services: ['Сон', 'Учёба', 'Небольшой сервер'],
  },
  {
    id: 'studio-home', cityId: 'ostrogorsk', districtId: 'industrial', name: 'Студия у промзоны', shortName: 'Студия', kind: 'home',
    x: 68, y: 58, openPeriods: allPeriods, address: 'Промышленный проезд, 17',
    description: 'Отдельная квартира со стабильным проводным интернетом.',
    services: ['Сон', 'Удалённая работа', 'Лаборатории'],
  },
  {
    id: 'cash-room-home', cityId: 'ostrogorsk', districtId: 'industrial', name: 'Комната без договора', shortName: 'Комната', kind: 'home',
    x: 57, y: 77, openPeriods: allPeriods, address: 'Гаражный переулок, 4',
    description: 'Наличные, плохой интернет и хозяин без предупреждения.',
    services: ['Сон', 'Хранение техники'],
  },
  {
    id: 'sfera-office', cityId: 'ostrogorsk', districtId: 'center', name: 'Сфера-Интеграция', shortName: 'Сфера', kind: 'office',
    x: 60, y: 27, openPeriods: ['workday', 'evening'], address: 'ул. Промышленная, 18',
    description: 'Офис интегратора. Здесь находится смена SOC.',
    services: ['Рабочая смена', 'Собеседования', 'Корпоративные тикеты'],
  },
  {
    id: 'clinic-4', cityId: 'ostrogorsk', districtId: 'old-town', name: 'Городская клиника №4', shortName: 'Клиника', kind: 'service',
    x: 34, y: 27, openPeriods: ['morning', 'workday', 'evening'], address: 'ул. Медицинская, 6',
    description: 'Клиника, где работает Максим Белов.',
    services: ['Максим', 'Сервисные работы', 'Сюжетные встречи'],
  },
  {
    id: 'promservice-factory', cityId: 'ostrogorsk', districtId: 'industrial', name: 'ПромСервис', shortName: 'Завод', kind: 'office',
    x: 80, y: 54, openPeriods: ['workday'], address: 'Промышленное шоссе, 42',
    description: 'Старые корпуса, доменная сеть и серверная без окон.',
    services: ['Рабочая смена', 'Системное администрирование'],
  },
  {
    id: 'volna-office', cityId: 'ostrogorsk', districtId: 'center', name: 'Волна Телеком', shortName: 'Волна', kind: 'office',
    x: 79, y: 38, openPeriods: ['workday', 'evening'], address: 'ул. Связистов, 7',
    description: 'Региональный узел связи и инженерный офис.',
    services: ['Рабочая смена', 'Сетевая инфраструктура'],
  },
  {
    id: 'tech-store', cityId: 'ostrogorsk', districtId: 'center', name: 'Байт', shortName: 'Байт', kind: 'shop',
    x: 51, y: 44, openPeriods: ['morning', 'workday', 'evening'], address: 'Торговая площадь, 2',
    description: 'Новые комплектующие, сетевое оборудование и гарантия.',
    services: ['Комплектующие', 'Сетевое оборудование', 'ИБП'],
  },
  {
    id: 'radio-market', cityId: 'ostrogorsk', districtId: 'industrial', name: 'Радиорынок', shortName: 'Рынок', kind: 'shop',
    x: 74, y: 66, openPeriods: ['morning', 'workday'], address: 'Рыночный проезд, 1',
    description: 'Б/у ноутбуки, телефоны и детали без долгих вопросов.',
    services: ['Б/у техника', 'Запчасти', 'Наличные'],
  },
  {
    id: 'supermarket', cityId: 'ostrogorsk', districtId: 'south', name: 'Северный', shortName: 'Магазин', kind: 'food',
    x: 31, y: 71, openPeriods: ['morning', 'workday', 'evening'], address: 'ул. Южная, 24',
    description: 'Продукты, бытовые мелочи и готовая еда.',
    services: ['Продукты', 'Быт'],
  },
  {
    id: 'signal-cafe', cityId: 'ostrogorsk', districtId: 'center', name: 'Кафе «Сигнал»', shortName: 'Сигнал', kind: 'food',
    x: 58, y: 48, openPeriods: ['morning', 'evening', 'night'], address: 'ул. Центральная, 31',
    description: 'Круглосуточное окно, дешёвый кофе и столики у стены.',
    services: ['Еда', 'Встречи', 'Работа с ноутбуком'],
  },
  {
    id: 'service-center', cityId: 'ostrogorsk', districtId: 'south', name: 'Сервис «Контакт»', shortName: 'Сервис', kind: 'service',
    x: 42, y: 80, openPeriods: ['workday', 'evening'], address: 'ул. Южная, 43',
    description: 'Ремонт ноутбуков, телефонов и блоков питания.',
    services: ['Ремонт', 'Диагностика'],
  },
  {
    id: 'bank-branch', cityId: 'ostrogorsk', districtId: 'center', name: 'Волжский региональный банк', shortName: 'Банк', kind: 'service',
    x: 70, y: 34, openPeriods: ['workday'], address: 'ул. Центральная, 12',
    description: 'Обычное отделение регионального банка.',
    services: ['Счета', 'Документы', 'Будущие сюжетные события'],
  },
  {
    id: 'railway-station', cityId: 'ostrogorsk', districtId: 'station', name: 'Железнодорожный вокзал', shortName: 'Вокзал', kind: 'transport',
    x: 85, y: 81, openPeriods: allPeriods, address: 'Вокзальная площадь, 1',
    description: 'Поезда в Москву и соседние города.',
    services: ['Междугородние поездки', 'Камеры хранения'],
  },
  {
    id: 'city-square', cityId: 'ostrogorsk', districtId: 'old-town', name: 'Городская площадь', shortName: 'Площадь', kind: 'public',
    x: 42, y: 39, openPeriods: allPeriods, address: 'пл. Советская',
    description: 'Остановки, администрация и поток людей днём.',
    services: ['Пересадка', 'Городские события'],
  },
];

export const travelModes: TravelModeDefinition[] = [
  {
    id: 'walk', name: 'Пешком', description: 'Бесплатно, медленно и утомительно.',
    baseCost: 0, costPerDistance: 0, timeFactor: 0.92, waitMinutes: 0, energyFactor: 0.22,
  },
  {
    id: 'bus', name: 'Автобус', description: 'Дешевле такси, но нужно ждать остановку.',
    baseCost: 55, costPerDistance: 0, timeFactor: 0.42, waitMinutes: 9, energyFactor: 0.04,
  },
  {
    id: 'taxi', name: 'Такси', description: 'Быстро, дорого, доступно почти в любое время.',
    baseCost: 170, costPerDistance: 7, timeFactor: 0.2, waitMinutes: 5, energyFactor: 0.01,
  },
];

export function getCityLocation(id: string) {
  return cityLocations.find((location) => location.id === id);
}

export function getCityLocations(cityId: string) {
  return cityLocations.filter((location) => location.cityId === cityId);
}

export function isLocationOpen(location: CityLocationDefinition, period: DayPeriod) {
  return location.openPeriods.includes(period);
}

export function calculateTravelRoute(fromId: string, toId: string, modeId: TravelModeId): TravelRoute | null {
  const from = getCityLocation(fromId);
  const to = getCityLocation(toId);
  const mode = travelModes.find((item) => item.id === modeId);
  if (!from || !to || !mode || from.cityId !== to.cityId || from.id === to.id) return null;
  const mapDistance = Math.sqrt((from.x - to.x) ** 2 + (from.y - to.y) ** 2);
  const distance = Math.max(1, Math.round(mapDistance / 7));
  const minutes = Math.max(6, Math.round(mapDistance * mode.timeFactor + mode.waitMinutes));
  const cost = Math.round((mode.baseCost + distance * mode.costPerDistance) / 5) * 5;
  const energyCost = Math.max(1, Math.round(minutes * mode.energyFactor));
  return { fromId, toId, distance, minutes, cost, energyCost, modeId };
}
