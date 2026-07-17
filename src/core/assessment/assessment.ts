import type {
  AssessmentDimension,
  AssessmentMatcher,
  EventCondition,
  MissionAssessmentResult,
  MissionDefinition,
  MissionEvent,
  MissionRuntimeState,
  RuleAssessmentResult,
  Scalar,
} from '../scenario/types';

const dimensions: AssessmentDimension[] = [
  'correctness',
  'evidence',
  'method',
  'coverage',
  'efficiency',
  'communication',
  'judgment',
  'autonomy',
];

function valueAtPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function scalarEquals(left: unknown, right: Scalar): boolean {
  if (typeof left === 'string' && typeof right === 'string') return left.toLowerCase() === right.toLowerCase();
  return left === right;
}

function conditionMatches(event: MissionEvent, condition: EventCondition): boolean {
  const actual = condition.path.startsWith('payload.')
    ? valueAtPath(event.payload, condition.path.slice('payload.'.length))
    : valueAtPath(event, condition.path);

  switch (condition.operator) {
    case 'exists': return actual !== undefined && actual !== null && actual !== '';
    case 'eq': return scalarEquals(actual, condition.value as Scalar);
    case 'includes': {
      if (typeof actual === 'string') return actual.toLowerCase().includes(String(condition.value ?? '').toLowerCase());
      if (Array.isArray(actual)) return actual.some((item) => scalarEquals(item, condition.value as Scalar));
      return false;
    }
    case 'oneOf': return Array.isArray(condition.value)
      && condition.value.some((candidate) => scalarEquals(actual, candidate));
    case 'gte': return typeof actual === 'number' && actual >= Number(condition.value);
    case 'lte': return typeof actual === 'number' && actual <= Number(condition.value);
    default: return false;
  }
}

function eventMatches(event: MissionEvent, where: EventCondition[] | undefined): boolean {
  return !where?.length || where.every((condition) => conditionMatches(event, condition));
}

function evaluateMatcher(matcher: AssessmentMatcher, state: MissionRuntimeState): { passed: boolean; detail: string } {
  switch (matcher.kind) {
    case 'event': {
      const count = state.actionLog.filter((event) => event.type === matcher.eventType && eventMatches(event, matcher.where)).length;
      const required = matcher.minCount ?? 1;
      return { passed: count >= required, detail: `${count}/${required} подходящих событий` };
    }
    case 'sequence': {
      let cursor = 0;
      for (const event of state.actionLog) {
        if (event.type === matcher.eventTypes[cursor]) cursor += 1;
        if (cursor === matcher.eventTypes.length) break;
      }
      return { passed: cursor === matcher.eventTypes.length, detail: `${cursor}/${matcher.eventTypes.length} шагов последовательности` };
    }
    case 'evidence-link': {
      const links = state.evidenceLinks.filter((link) => link.claimId === matcher.claimId
        && (!matcher.evidenceIds?.length || matcher.evidenceIds.includes(link.evidenceId)));
      const required = matcher.minLinks ?? 1;
      return { passed: links.length >= required, detail: `${links.length}/${required} связей evidence` };
    }
    case 'hypothesis': {
      const hypothesis = state.hypotheses.find((item) => item.hypothesisId === matcher.hypothesisId);
      return {
        passed: Boolean(hypothesis && matcher.statuses.includes(hypothesis.status)),
        detail: hypothesis ? `статус: ${hypothesis.status}` : 'гипотеза не создана',
      };
    }
    case 'decision': {
      const decision = state.decisions.find((item) => matcher.decisionIds.includes(item.decisionId));
      return { passed: Boolean(decision), detail: decision ? `решение: ${decision.decisionId}` : 'решение не принято' };
    }
    case 'report': {
      const missing = matcher.requiredSections.filter((section) => !state.report?.sections[section]?.trim());
      return { passed: missing.length === 0, detail: missing.length ? `не заполнено: ${missing.join(', ')}` : 'обязательные секции заполнены' };
    }
    case 'hint-ceiling': {
      const tiers = state.actionLog
        .filter((event) => event.type === 'hint.used')
        .map((event) => Number(event.payload.tier ?? 0));
      const highest = tiers.length ? Math.max(...tiers) : 0;
      return { passed: highest <= matcher.maxTier, detail: `максимальная подсказка: ${highest}/${matcher.maxTier}` };
    }
    default: return { passed: false, detail: 'неизвестное правило' };
  }
}

function emptyScores(): Record<AssessmentDimension, number> {
  return Object.fromEntries(dimensions.map((dimension) => [dimension, 0])) as Record<AssessmentDimension, number>;
}

export function assessMission(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  evaluatedAt = new Date().toISOString(),
): MissionAssessmentResult {
  const ruleResults: RuleAssessmentResult[] = definition.assessmentRules.map((rule) => {
    const result = evaluateMatcher(rule.matcher, state);
    const passed = rule.critical ? !result.passed : result.passed;
    return {
      ruleId: rule.id,
      passed,
      critical: Boolean(rule.critical),
      detail: rule.critical && result.passed ? `Критическая ошибка: ${result.detail}` : result.detail,
    };
  });

  const dimensionScores = emptyScores();
  for (const dimension of dimensions) {
    const rules = definition.assessmentRules.filter((rule) => rule.dimension === dimension && !rule.critical);
    const totalWeight = rules.reduce((sum, rule) => sum + Math.max(0, rule.weight), 0);
    const earned = rules.reduce((sum, rule) => {
      const result = ruleResults.find((item) => item.ruleId === rule.id);
      return sum + (result?.passed ? Math.max(0, rule.weight) : 0);
    }, 0);
    dimensionScores[dimension] = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
  }

  const criticalErrors = ruleResults.filter((result) => result.critical && !result.passed).map((result) => result.ruleId);
  const matchedFamily = definition.solutionFamilies.find((family) => family.requiredRuleIds.every(
    (ruleId) => ruleResults.find((result) => result.ruleId === ruleId)?.passed,
  ));
  const requiredCore = definition.completion.coreRuleIds.every(
    (ruleId) => ruleResults.find((result) => result.ruleId === ruleId)?.passed,
  );
  const dimensionsMeetMinimum = Object.entries(definition.completion.minDimensionScores ?? {}).every(
    ([dimension, minimum]) => dimensionScores[dimension as AssessmentDimension] >= Number(minimum),
  );

  const hintEvents = state.actionLog.filter((event) => event.type === 'hint.used');
  const highestHintTier = hintEvents.reduce((highest, event) => Math.max(highest, Number(event.payload.tier ?? 0)), 0);

  return {
    evaluatedAt,
    eligibleForCompletion: Boolean(matchedFamily) && requiredCore && dimensionsMeetMinimum && criticalErrors.length === 0,
    matchedSolutionFamilyId: matchedFamily?.id ?? null,
    dimensionScores,
    rules: ruleResults,
    criticalErrors,
    autonomy: {
      highestHintTier,
      hintCount: hintEvents.length,
    },
  };
}
