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
  if (!progress.clinicIntroComplete) return {
    id: 'intro', app: 'messenger', title: 'Входящий звонок',
    objective: 'Ответить Максиму и получить материалы клиники.',
    dialogue: 'Максим Белов, системный администратор клиники №4, просит проверить очищенную копию журналов.',
    action: 'Открыть Messenger',
  };
  if (!terminalDone(progress)) return {
    id: 'terminal', app: 'terminal', title: 'Осмотр файлов',
    objective: 'Открыть дело, найти неудачные входы и подозрительный процесс.',
    dialogue: 'Максим остаётся на линии и даёт по одной команде.',
    action: 'Открыть Terminal',
  };
  if (!progress.pythonComplete) return {
    id: 'code', app: 'code', title: 'analyze_auth.py',
    objective: 'Собрать скрипт, который посчитает строки Failed password.',
    dialogue: 'Максим объясняет строку до того, как ты её вводишь.',
    action: 'Открыть Code Editor',
  };
  if (!progress.alertReviewed) return {
    id: 'siem', app: 'siem', title: 'Алерт WT-2026-0314-01',
    objective: 'Выбрать вывод, который подтверждают события.',
    dialogue: 'Скрипт дал число. Теперь нужно проверить источник и результат входов.',
    action: 'Открыть SIEM',
  };
  if (!progress.reportSubmitted) return {
    id: 'report', app: 'notes', title: 'Отчёт CLINIC-01',
    objective: 'Собрать отчёт из подтверждённых фактов и правильных действий.',
    dialogue: 'Каждая строка отчёта выбирается отдельно. Ошибочные выводы не принимаются.',
    action: 'Открыть Notes',
  };
  if (!progress.clinicWrapupComplete) return {
    id: 'wrapup', app: 'messenger', title: 'Завершить звонок',
    objective: 'Передать Максиму итог и закрыть дело.',
    dialogue: 'Максим ждёт короткий итог по журналам и процессу.',
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
  { id: 'intro', label: 'Получить дело' },
  { id: 'terminal', label: 'Проверить файлы' },
  { id: 'code', label: 'Написать скрипт' },
  { id: 'siem', label: 'Разобрать алерт' },
  { id: 'report', label: 'Сдать отчёт' },
  { id: 'wrapup', label: 'Закрыть звонок' },
];

export function clinicStageDone(progress: ProgressState, id: Exclude<ClinicStageId, 'complete'>) {
  if (id === 'intro') return progress.clinicIntroComplete;
  if (id === 'terminal') return terminalDone(progress);
  if (id === 'code') return progress.pythonComplete;
  if (id === 'siem') return progress.alertReviewed;
  if (id === 'report') return progress.reportSubmitted;
  return progress.clinicWrapupComplete;
}

export const clinicTransitions = {
  terminal: {
    id: 'clinic-terminal-complete', title: 'Осмотр закончен',
    facts: ['6 неудачных попыток входа', 'источник 185.44.17.92', 'PID 911 запущен из /tmp/.cache'],
    nextApp: 'code' as AppId, button: 'Открыть Code Editor',
  },
  code: {
    id: 'clinic-code-complete', title: 'Скрипт отработал',
    facts: ['auth.log прочитан построчно', 'найдено 6 совпадений', 'вывод Failed logins: 6'],
    nextApp: 'siem' as AppId, button: 'Открыть SIEM',
  },
  siem: {
    id: 'clinic-siem-complete', title: 'Алерт разобран',
    facts: ['серия входов подтверждена', 'внешний успешный вход не найден', 'компрометация не доказана'],
    nextApp: 'notes' as AppId, button: 'Составить отчёт',
  },
  report: {
    id: 'clinic-report-complete', title: 'Отчёт принят',
    facts: ['факты отделены от предположений', 'рекомендации записаны', 'черновик сохранён'],
    nextApp: 'messenger' as AppId, button: 'Вернуться к Максиму',
  },
} as const;
