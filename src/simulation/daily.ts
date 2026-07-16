import type { DailyActivityId, DailyEventState, DayPeriod, SimulationSkillId, SimulationState } from './types';

export interface DailyActivityDefinition {
  id: DailyActivityId;
  label: string;
  shortLabel: string;
  description: string;
  kind: 'life' | 'career' | 'study' | 'navigation';
  skillId?: SimulationSkillId;
}

export const dayPeriods: DayPeriod[] = ['morning', 'workday', 'evening', 'night'];

export const dailyActivities: DailyActivityDefinition[] = [
  { id: 'free', label: 'Свободное время', shortLabel: 'Свободно', description: 'Пропустить период без отдельной цели.', kind: 'life' },
  { id: 'sleep', label: 'Отдых', shortLabel: 'Отдых', description: 'Восстановить энергию и концентрацию.', kind: 'life' },
  { id: 'work', label: 'Рабочая смена', shortLabel: 'Работа', description: 'Отработать обязательный рабочий период.', kind: 'career' },
  { id: 'maintenance', label: 'Безопасность устройств', shortLabel: 'Устройства', description: 'Проверить аккаунты, сессии и резервные копии.', kind: 'life' },
  { id: 'contract', label: 'Активный контракт', shortLabel: 'Контракт', description: 'Открыть Work Queue и закончить принятую работу.', kind: 'navigation' },
  { id: 'story', label: 'Основная история', shortLabel: 'Сюжет', description: 'Продолжить текущий сюжетный этап.', kind: 'navigation' },
  { id: 'study-linux', label: 'Практика Linux', shortLabel: 'Linux', description: 'Файлы, процессы, права и системные команды.', kind: 'study', skillId: 'linux' },
  { id: 'study-networking', label: 'Практика сетей', shortLabel: 'Сети', description: 'IP, порты, DNS и соединения.', kind: 'study', skillId: 'networking' },
  { id: 'study-python', label: 'Практика Python', shortLabel: 'Python', description: 'Код, файлы, JSON и автоматизация.', kind: 'study', skillId: 'python' },
  { id: 'study-soc', label: 'Практика SOC', shortLabel: 'SOC', description: 'Логи, triage и фиксация фактов.', kind: 'study', skillId: 'soc' },
  { id: 'study-windows', label: 'Практика Windows', shortLabel: 'Windows', description: 'События, процессы и PowerShell.', kind: 'study', skillId: 'windows' },
  { id: 'study-web', label: 'Практика Web', shortLabel: 'Web', description: 'HTTP, сессии, API и доступы.', kind: 'study', skillId: 'web' },
];

export interface DailyEventChoiceDefinition {
  id: string;
  label: string;
  result: string;
}

export interface DailyEventDefinition {
  id: string;
  title: string;
  text: string;
  choices: DailyEventChoiceDefinition[];
  available: (simulation: SimulationState, balance: number) => boolean;
}

export const dailyEventCatalog: DailyEventDefinition[] = [
  {
    id: 'account-alert',
    title: 'Новый вход в аккаунт',
    text: 'Почта показывает вход с незнакомого устройства. Сессия ещё активна.',
    choices: [
      { id: 'secure', label: 'Закрыть сессию и сменить пароль · 250 ₽', result: 'Сессия закрыта. Цифровой след снижен.' },
      { id: 'ignore', label: 'Оставить до вечера', result: 'Неизвестная сессия осталась активной.' },
    ],
    available: (_simulation, balance) => balance >= 250,
  },
  {
    id: 'extra-shift',
    title: 'Нужен человек на вечер',
    text: 'Кирилл просит закрыть часть очереди после смены. Доплата придёт сразу.',
    choices: [
      { id: 'accept', label: 'Взять переработку · +900 ₽', result: 'Переработка подтверждена. Доплата начислена, энергия снизилась.' },
      { id: 'decline', label: 'Отказаться', result: 'Смену забрал другой аналитик.' },
    ],
    available: (simulation) => simulation.career.status === 'employed',
  },
  {
    id: 'router-failure',
    title: 'Роутер снова режет соединение',
    text: 'Домашняя сеть теряет пакеты. Для длинной лаборатории этого недостаточно.',
    choices: [
      { id: 'repair', label: 'Купить блок питания · 500 ₽', result: 'Связь восстановлена.' },
      { id: 'postpone', label: 'Отложить', result: 'Проблема осталась. Концентрация снизилась.' },
    ],
    available: (_simulation, balance) => balance >= 500,
  },
  {
    id: 'family-errand',
    title: 'Нужно забрать документы',
    text: 'Мама просит заехать в МФЦ до закрытия. Это займёт часть сил, но дома станет спокойнее.',
    choices: [
      { id: 'help', label: 'Съездить', result: 'Документы забраны.' },
      { id: 'refuse', label: 'Не ехать', result: 'Разговор закончился плохо.' },
    ],
    available: () => true,
  },
];

export function activityById(id: DailyActivityId) {
  return dailyActivities.find((item) => item.id === id) ?? dailyActivities[0];
}

export function getDailyEvent(id: string) {
  return dailyEventCatalog.find((item) => item.id === id);
}

export function createDailyEvent(simulation: SimulationState, balance: number): DailyEventState | null {
  const available = dailyEventCatalog.filter((item) => item.available(simulation, balance));
  if (available.length === 0 || simulation.clock.day % 3 === 0) return null;
  const index = (simulation.clock.day * 17 + simulation.clock.elapsedSlots) % available.length;
  return { id: available[index].id, day: simulation.clock.day, resolvedChoiceId: '' };
}

export function periodKey(day: number, period: DayPeriod) {
  return `${day}:${period}`;
}

export function isWeekday(dateIso: string) {
  const day = new Date(`${dateIso}T12:00:00`).getDay();
  return day !== 0 && day !== 6;
}

export function isScheduledWorkPeriod(simulation: SimulationState, period = simulation.clock.period) {
  return simulation.career.status === 'employed' && period === 'workday' && isWeekday(simulation.clock.dateIso);
}
