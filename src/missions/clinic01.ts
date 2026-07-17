import type { AppId, ProgressState } from '../types';
import { terminalObjectiveDefinitions } from '../data/content';

export type ClinicStageId = 'intro' | 'terminal' | 'code' | 'siem' | 'report' | 'wrapup' | 'complete';

export interface ClinicStageRuntime {
  id: ClinicStageId;
  app: AppId;
  title: string;
  objective: string;
  dialogue: string;
  action: string;
}

const terminalDone = (progress: ProgressState) => terminalObjectiveDefinitions.every((item) => progress.terminalObjectives.includes(item.id));

export function getClinicStage(progress: ProgressState): ClinicStageRuntime {
  if (!progress.onboardingDone) return {
    id: 'intro', app: 'missions', title: 'Акт 0 / обязательное обучение',
    objective: 'Пройти главы 0.1 и 0.2: рабочее место, shell, форматы и время.',
    dialogue: 'До CLINIC-01 нужно доказать базовую работу с локальными данными.',
    action: 'Открыть Missions',
  };
  if (!terminalDone(progress)) return {
    id: 'terminal', app: 'terminal', title: 'Глава 0.3 / CLINIC-01: процессы',
    objective: 'Исследовать process snapshot как отдельную линию после доказанного разбора auth.log.',
    dialogue: 'Отказы входа уже разобраны. Теперь проверь процесс и не связывай линии без evidence.',
    action: 'Открыть Terminal',
  };
  if (!progress.pythonComplete) return {
    id: 'code', app: 'code', title: 'Глава 0.3 / Автоматизация',
    objective: 'Собрать работающий анализатор журнала, затем проверить его на изменённом наборе данных.',
    dialogue: 'Ручной разбор уже сделан. Код нужен для повторяемого результата.',
    action: 'Открыть Code Editor',
  };
  if (!progress.alertReviewed) return {
    id: 'siem', app: 'siem', title: 'CLINIC-01 / Проверка алерта',
    objective: 'Сопоставить сырой журнал, результат анализатора и события SIEM.',
    dialogue: 'Алерт — это сигнал. Вывод должен опираться на исходные события.',
    action: 'Открыть SIEM',
  };
  if (!progress.reportSubmitted) return {
    id: 'report', app: 'notes', title: 'CLINIC-01 / Evidence report',
    objective: 'Связать подтверждённые факты, ограничения и безопасное следующее действие.',
    dialogue: 'Каждый вывод должен указывать, откуда он взят.',
    action: 'Открыть Notes',
  };
  if (!progress.clinicWrapupComplete) return {
    id: 'wrapup', app: 'messenger', title: 'CLINIC-01 / Передача результата',
    objective: 'Передать Максиму короткий воспроизводимый итог и закрыть операцию.',
    dialogue: 'Мне нужны факты, ограничения и что делать дальше.',
    action: 'Вернуться в Messenger',
  };
  return {
    id: 'complete', app: 'missions', title: 'CLINIC-01 закрыто',
    objective: 'Перейти к техническому собеседованию в «Сфере».',
    dialogue: 'Максим передал твой отчёт Анне Соколовой.',
    action: 'Открыть Missions',
  };
}

export function isClinicStageActive(progress: ProgressState, stage: ClinicStageId) {
  return getClinicStage(progress).id === stage;
}

export const clinicStageOrder: Array<{ id: Exclude<ClinicStageId, 'complete'>; label: string }> = [
  { id: 'intro', label: 'Главы 0.1–0.2' },
  { id: 'terminal', label: 'Процессы' },
  { id: 'code', label: 'Автоматизация' },
  { id: 'siem', label: 'Проверить алерт' },
  { id: 'report', label: 'Связать evidence' },
  { id: 'wrapup', label: 'Передать результат' },
];

export function clinicStageDone(progress: ProgressState, id: Exclude<ClinicStageId, 'complete'>) {
  if (id === 'intro') return progress.onboardingDone;
  if (id === 'terminal') return terminalDone(progress);
  if (id === 'code') return progress.pythonComplete;
  if (id === 'siem') return progress.alertReviewed;
  if (id === 'report') return progress.reportSubmitted;
  return progress.clinicWrapupComplete;
}

export const clinicTransitions = {
  terminal: {
    id: 'clinic-terminal-complete', title: 'Первичный осмотр закончен',
    facts: ['события входа выделены отдельно от успешных сессий', 'источник 185.44.17.92 зафиксирован', 'PID 911 исследуется как отдельная линия'],
    nextApp: 'code' as AppId, button: 'Перейти к автоматизации',
  },
  code: {
    id: 'clinic-code-complete', title: 'Анализатор отработал',
    facts: ['auth.log прочитан программой', 'результат воспроизводим', 'ошибки Python показаны как ошибки среды'],
    nextApp: 'siem' as AppId, button: 'Открыть SIEM',
  },
  siem: {
    id: 'clinic-siem-complete', title: 'Алерт сопоставлен с журналом',
    facts: ['серия отказов подтверждена', 'внешняя успешная сессия не подтверждена', 'локальный процесс требует отдельного анализа'],
    nextApp: 'notes' as AppId, button: 'Собрать evidence report',
  },
  report: {
    id: 'clinic-report-complete', title: 'Evidence report сохранён',
    facts: ['факты связаны с источниками', 'ограничения указаны', 'следующее действие записано'],
    nextApp: 'messenger' as AppId, button: 'Вернуться к Максиму',
  },
} as const;
