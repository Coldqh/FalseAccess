import type { FoundationModule, FoundationTask } from '../data/foundationPractice';

export interface CommandAssessment {
  passed: boolean;
  reason: string;
}

export interface WrittenAssessment {
  passed: boolean;
  wordCount: number;
  covered: string[];
  missing: string[];
  forbidden: string[];
}

const normalize = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/\s+/g, ' ');

const commandStart = (value: string) => normalize(value).match(/^([a-z0-9_.-]+)/)?.[1] ?? '';

export function validateFoundationCommand(task: FoundationTask, raw: string): CommandAssessment {
  const value = normalize(raw);
  if (!value) return { passed: false, reason: 'Команда пустая.' };

  const start = commandStart(value);
  const allowedStarts = task.allowedStarts.map((item) => item.toLowerCase());
  if (!allowedStarts.includes(start)) {
    return { passed: false, reason: `Ожидается инструмент: ${task.allowedStarts.join(' / ')}.` };
  }

  const rejected = (task.rejectPatterns ?? []).find((pattern) => new RegExp(pattern, 'i').test(value));
  if (rejected) return { passed: false, reason: 'Команда использует запрещённый для этой read-only задачи параметр.' };

  const matches = task.commandPatterns.some((pattern) => new RegExp(pattern, 'i').test(value));
  if (!matches) {
    return {
      passed: false,
      reason: 'Структура команды не закрывает задачу. Набора правильных слов недостаточно.',
    };
  }

  return { passed: true, reason: task.evidence };
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term.toLowerCase()));
}

export function assessFoundationAnswer(module: FoundationModule, raw: string): WrittenAssessment {
  const value = normalize(raw);
  const words = value.match(/[a-zа-яё0-9_.=-]+/gi) ?? [];
  const covered: string[] = [];
  const missing: string[] = [];

  for (const group of module.finalRubric.requiredGroups) {
    if (hasAny(value, group.terms)) covered.push(group.label);
    else missing.push(group.label);
  }

  const forbidden = (module.finalRubric.forbiddenClaims ?? []).filter((claim) => value.includes(claim.toLowerCase()));
  const passed = words.length >= module.finalRubric.minWords && missing.length === 0 && forbidden.length === 0;

  return {
    passed,
    wordCount: words.length,
    covered,
    missing,
    forbidden,
  };
}

export function answerStatusText(result: WrittenAssessment, minWords: number) {
  if (result.passed) return 'Ответ закрывает рубрику этапа.';
  const reasons: string[] = [];
  if (result.wordCount < minWords) reasons.push(`нужно не меньше ${minWords} содержательных слов`);
  if (result.missing.length) reasons.push(`не хватает: ${result.missing.join(', ')}`);
  if (result.forbidden.length) reasons.push(`есть опасные утверждения: ${result.forbidden.join(', ')}`);
  return reasons.join(' · ');
}
