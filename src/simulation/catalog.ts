import type { FoodPlanId, ProgressionStageId, SimulationSkillId, SkillTrackState } from './types';

export interface CityDefinition {
  id: string;
  name: string;
  country: string;
  rentIndex: number;
  salaryIndex: number;
  pressure: number;
  unlocked: boolean;
}

export interface FoodPlanDefinition {
  id: FoodPlanId;
  name: string;
  dailyCost: number;
  description: string;
  energyRecovery: number;
  stressRecovery: number;
  healthDelta: number;
}

export interface HousingDefinition {
  id: string;
  cityId: string;
  name: string;
  rent: number;
  deposit: number;
  security: number;
  privacy: number;
  internet: number;
  workspace: number;
  description: string;
  requirement?: string;
}

export interface StoreItemDefinition {
  id: string;
  category: 'computer' | 'component' | 'network' | 'phone' | 'safety';
  name: string;
  price: number;
  description: string;
  bonuses: string[];
}

export interface JobDefinition {
  id: string;
  employerId: string;
  employer: string;
  cityId: string;
  title: string;
  monthlySalary: number;
  schedule: string;
  description: string;
  requiredProfessional: number;
  requiredSkills?: Partial<Record<SimulationSkillId, number>>;
  requiredStage?: ProgressionStageId;
  requiredTracks?: Partial<Record<SimulationSkillId, Partial<SkillTrackState>>>;
  storyOnly?: boolean;
}

export const cities: CityDefinition[] = [
  { id: 'ostrogorsk', name: 'Острогорск', country: 'Россия', rentIndex: 1, salaryIndex: 1, pressure: 1, unlocked: true },
  { id: 'moscow', name: 'Москва', country: 'Россия', rentIndex: 2.8, salaryIndex: 2.2, pressure: 2, unlocked: false },
];

export const foodPlans: FoodPlanDefinition[] = [
  { id: 'economy', name: 'Экономия', dailyCost: 260, description: 'Крупы, дешёвая столовая, готовка дома.', energyRecovery: 5, stressRecovery: 0, healthDelta: -1 },
  { id: 'normal', name: 'Обычный рацион', dailyCost: 520, description: 'Нормальная еда без постоянной экономии.', energyRecovery: 10, stressRecovery: 2, healthDelta: 0 },
  { id: 'balanced', name: 'Сбалансированный', dailyCost: 900, description: 'Хорошая еда, меньше усталости после тяжёлых смен.', energyRecovery: 14, stressRecovery: 4, healthDelta: 1 },
];

export const housingCatalog: HousingDefinition[] = [
  {
    id: 'family-room', cityId: 'ostrogorsk', name: 'Комната у матери', rent: 0, deposit: 0,
    security: 1, privacy: 0, internet: 2, workspace: 1,
    description: 'Бесплатно. Мало места, никакой приватности, техника постоянно на виду.',
  },
  {
    id: 'shared-flat', cityId: 'ostrogorsk', name: 'Комната в двушке', rent: 9_000, deposit: 9_000,
    security: 1, privacy: 2, internet: 2, workspace: 2,
    description: 'Сосед работает по сменам. Можно поставить второй монитор и небольшой сервер.',
  },
  {
    id: 'studio-ostro', cityId: 'ostrogorsk', name: 'Студия у промзоны', rent: 18_000, deposit: 18_000,
    security: 2, privacy: 3, internet: 3, workspace: 3,
    description: 'Отдельная квартира, стабильный проводной интернет, документы арендатора известны хозяину.',
  },
  {
    id: 'cash-room', cityId: 'ostrogorsk', name: 'Комната без договора', rent: 13_000, deposit: 6_000,
    security: 1, privacy: 3, internet: 1, workspace: 2,
    description: 'Оплата наличными. Плохой интернет, хозяин может прийти без предупреждения.',
    requirement: 'Подпольная репутация 6',
  },
  {
    id: 'moscow-hostel', cityId: 'moscow', name: 'Комната у МЦК', rent: 32_000, deposit: 32_000,
    security: 1, privacy: 1, internet: 3, workspace: 1,
    description: 'Дорого и тесно. Зато рядом крупные работодатели и собеседования.',
    requirement: 'Город пока закрыт',
  },
];

export const storeItems: StoreItemDefinition[] = [
  { id: 'used-ssd', category: 'component', name: 'SSD 1 ТБ', price: 4_200, description: 'Больше места под дампы, логи и виртуальные стенды.', bonuses: ['Хранилище +1'] },
  { id: 'ram-16', category: 'component', name: 'Комплект RAM 16 ГБ', price: 5_900, description: 'Позволяет держать больше учебных узлов одновременно.', bonuses: ['Вычисления +1'] },
  { id: 'usb-nic', category: 'network', name: 'USB-сетевой адаптер', price: 3_400, description: 'Отдельный интерфейс для сетевых лабораторий и захвата трафика.', bonuses: ['Сеть +1'] },
  { id: 'backup-drive', category: 'safety', name: 'Внешний диск', price: 6_800, description: 'Резервная копия проектов и доказательств.', bonuses: ['Сохранность данных +1'] },
  { id: 'ups', category: 'safety', name: 'ИБП', price: 8_900, description: 'Компьютер не выключится при коротком скачке питания.', bonuses: ['Надёжность +1'] },
  { id: 'used-laptop', category: 'computer', name: 'Б/у бизнес-ноутбук', price: 24_000, description: 'Запасная рабочая машина. Можно работать вне дома.', bonuses: ['Мобильная работа', 'Резервное устройство'] },
  { id: 'second-phone', category: 'phone', name: 'Второй смартфон', price: 7_500, description: 'Отдельное устройство для рабочих аккаунтов и MFA.', bonuses: ['Разделение аккаунтов +1'] },
];

export const jobsCatalog: JobDefinition[] = [
  {
    id: 'sfera-junior-soc', employerId: 'sfera', employer: 'Сфера-Интеграция', cityId: 'ostrogorsk',
    title: 'Младший аналитик SOC', monthlySalary: 52_000, schedule: '5/2 · 09:00–18:00',
    description: 'Очередь алертов, отчёты, звонки клиентам и постоянный контроль Анны.',
    requiredProfessional: 0, requiredStage: 1, requiredTracks: { soc: { guided: 8 }, communication: { guided: 4 } }, storyOnly: true,
  },
  {
    id: 'helpdesk-techline', employerId: 'techline', employer: 'ТехЛиния', cityId: 'ostrogorsk',
    title: 'Специалист поддержки', monthlySalary: 38_000, schedule: '2/2 · 08:00–20:00',
    description: 'Пользователи, учётные записи, принтеры, сеть и первые задачи системного администратора.',
    requiredProfessional: 0, requiredStage: 0, requiredTracks: { computer: { guided: 6 } },
  },
  {
    id: 'factory-admin-trainee', employerId: 'promservis', employer: 'ПромСервис', cityId: 'ostrogorsk',
    title: 'Стажёр системного администратора', monthlySalary: 45_000, schedule: '5/2 · 08:00–17:00',
    description: 'Рабочие станции, домен, резервные копии и старые серверы предприятия.',
    requiredProfessional: 4, requiredStage: 1,
    requiredSkills: { linux: 5, networking: 4 },
    requiredTracks: { linux: { guided: 10 }, networking: { theory: 6 } },
  },
  {
    id: 'sfera-soc-analyst', employerId: 'sfera', employer: 'Сфера-Интеграция', cityId: 'ostrogorsk',
    title: 'Аналитик SOC', monthlySalary: 78_000, schedule: '2/2 · 08:00–20:00',
    description: 'Самостоятельный triage, расследования, запросы клиентам и контроль младших аналитиков.',
    requiredProfessional: 14, requiredStage: 3,
    requiredTracks: { soc: { independent: 22, production: 12 }, siem: { guided: 20 }, communication: { independent: 12 } },
  },
  {
    id: 'regional-security-engineer', employerId: 'volna', employer: 'Волна Телеком', cityId: 'ostrogorsk',
    title: 'Инженер ИБ', monthlySalary: 92_000, schedule: '5/2 · 09:00–18:00',
    description: 'Доступы, сегментация, VPN, мониторинг и безопасные конфигурации региональной сети.',
    requiredProfessional: 20, requiredStage: 4,
    requiredTracks: { networking: { independent: 28 }, securityEngineering: { guided: 25 }, windows: { independent: 18 } },
  },
];

export const periodLabels = {
  morning: 'Утро',
  workday: 'Рабочее время',
  evening: 'Вечер',
  night: 'Ночь',
} as const;
