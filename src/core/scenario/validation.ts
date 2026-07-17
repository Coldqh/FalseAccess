import type { MissionDefinition } from './types';

export interface DefinitionValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMissionDefinition(definition: MissionDefinition): DefinitionValidationResult {
  const errors: string[] = [];
  const ids = new Set<string>();
  const claim = (id: string, label: string) => {
    if (!id.trim()) errors.push(`${label}: пустой id`);
    if (ids.has(id)) errors.push(`${label}: дубликат id ${id}`);
    ids.add(id);
  };

  if (definition.schemaVersion !== 1) errors.push('Поддерживается только schemaVersion=1.');
  if (!definition.id.trim()) errors.push('Mission id обязателен.');
  if (!definition.skills.length) errors.push('Миссия должна развивать минимум один навык.');
  if (definition.durationMinutes <= 0) errors.push('durationMinutes должен быть больше нуля.');
  if (!definition.briefing.constraints.length) errors.push('Нужно минимум одно ограничение.');
  if (!definition.artifacts.length) errors.push('Нужен минимум один артефакт.');
  if (!definition.outcomes.length) errors.push('Нужен минимум один observable outcome.');
  if (definition.solutionFamilies.length < 2) errors.push('Нужно минимум два допустимых пути решения.');
  if (!definition.safety.sandboxed || definition.safety.externalNetwork) errors.push('Лаборатория должна быть локальной и изолированной.');
  if (!definition.safety.resettable) errors.push('Лаборатория должна поддерживать reset.');

  definition.artifacts.forEach((item) => claim(item.id, 'artifact'));
  definition.outcomes.forEach((item) => claim(item.id, 'outcome'));
  definition.hypotheses.forEach((item) => claim(item.id, 'hypothesis'));
  definition.decisions.forEach((item) => claim(item.id, 'decision'));
  definition.assessmentRules.forEach((item) => claim(item.id, 'assessment rule'));
  definition.solutionFamilies.forEach((item) => claim(item.id, 'solution family'));
  definition.consequences.forEach((item) => claim(item.id, 'consequence'));

  const ruleIds = new Set(definition.assessmentRules.map((rule) => rule.id));
  for (const ruleId of definition.completion.coreRuleIds) {
    if (!ruleIds.has(ruleId)) errors.push(`Completion: неизвестное core-правило ${ruleId}.`);
  }

  for (const family of definition.solutionFamilies) {
    if (!family.requiredRuleIds.length) errors.push(`Solution family ${family.id} не содержит правил.`);
    for (const ruleId of family.requiredRuleIds) {
      if (!ruleIds.has(ruleId)) errors.push(`Solution family ${family.id}: неизвестное правило ${ruleId}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
