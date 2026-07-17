import { describe, expect, it } from 'vitest';
import { clinic01Definition } from '../src/content/missions/clinic01/definition';
import {
  appendMissionAction,
  attemptMissionCompletion,
  commitDecision,
  createMissionRuntime,
  linkEvidence,
  openArtifact,
  submitReport,
  upsertHypothesis,
  useHint,
} from '../src/core/scenario/engine';
import { validateMissionDefinition } from '../src/core/scenario/validation';

const T0 = '2026-07-17T10:00:00.000Z';

function buildSolvedState(decisionId: 'decision.clinic.preserve-restrict' | 'decision.clinic.isolate-transfer') {
  let state = createMissionRuntime(clinic01Definition, 42, T0);
  for (const artifactId of ['artifact.clinic.brief','artifact.clinic.auth-log','artifact.clinic.processes','artifact.clinic.network','artifact.clinic.events']) {
    state = openArtifact(clinic01Definition, state, artifactId, 'test');
  }
  state = appendMissionAction(clinic01Definition, state, { type: 'command.executed', source: 'shell', payload: { finding: 'clinic-process-correlated', success: true, destructive: false, externalNetwork: false } });
  state = appendMissionAction(clinic01Definition, state, { type: 'command.executed', source: 'shell', payload: { finding: 'clinic-network-correlated', success: true, destructive: false, externalNetwork: false } });
  state = appendMissionAction(clinic01Definition, state, { type: 'python.executed', source: 'python', payload: { finding: 'clinic-python-hidden-tests', success: true, testsPassed: 2, testsTotal: 2 } });
  for (const [hypothesisId, status] of [
    ['hypothesis.clinic.password-spray','supported'],
    ['hypothesis.clinic.account-compromise','unknown'],
    ['hypothesis.clinic.local-process','supported'],
    ['hypothesis.clinic.shared-cause','unknown'],
  ] as const) state = upsertHypothesis(clinic01Definition, state, { hypothesisId, status, confidence: 'medium', note: 'evidence-based' });
  for (const [claimId,evidenceId] of [
    ['hypothesis.clinic.password-spray','artifact.clinic.auth-log'],
    ['hypothesis.clinic.local-process','artifact.clinic.processes'],
    ['outcome.clinic.network','artifact.clinic.network'],
    ['outcome.clinic.python','artifact.clinic.events'],
  ] as const) state = linkEvidence(clinic01Definition, state, { claimId, evidenceId, note: 'linked' });
  state = commitDecision(clinic01Definition, state, { decisionId, rationale: 'Сохранение evidence и контроль риска.' });
  state = submitReport(clinic01Definition, state, {
    facts: 'Spray и отдельный локальный процесс подтверждены.',
    evidence: 'auth.log, processes.csv, connections.csv, hidden-tested analyzer.',
    limitations: 'Причинная связь двух линий не подтверждена.',
    decision: 'Сохранить evidence и ограничить риск.',
    nextSteps: 'Проверить происхождение процесса и соседние узлы.',
  });
  return state;
}

describe('mission definition', () => {
  it('accepts CLINIC-01 as a safe multi-path mission', () => {
    const result = validateMissionDefinition(clinic01Definition);
    expect(result).toEqual({ valid: true, errors: [] });
    expect(clinic01Definition.solutionFamilies).toHaveLength(2);
    expect(clinic01Definition.safety.externalNetwork).toBe(false);
  });
});

describe('scenario engine', () => {
  it('creates an ordered action history starting with mission.started', () => {
    const state = createMissionRuntime(clinic01Definition, 42, T0);
    expect(state.actionLog[0]).toMatchObject({ type: 'mission.started', sequence: 1, payload: { seed: 42 } });
  });

  it.each(['decision.clinic.preserve-restrict','decision.clinic.isolate-transfer'] as const)('accepts valid solution family %s', (decisionId) => {
    const state = buildSolvedState(decisionId);
    expect(state.assessment?.eligibleForCompletion).toBe(true);
    const attempt = attemptMissionCompletion(clinic01Definition, state);
    expect(attempt.completed).toBe(true);
    expect(attempt.state.status).toBe('completed');
  });

  it('blocks completion after destructive evidence handling', () => {
    let state = buildSolvedState('decision.clinic.preserve-restrict');
    state = appendMissionAction(clinic01Definition, state, { type: 'command.executed', source: 'terminal', payload: { destructive: true, externalNetwork: false, success: false } });
    const attempt = attemptMissionCompletion(clinic01Definition, state);
    expect(attempt.completed).toBe(false);
    expect(attempt.reasons).toContain('critical.clinic.destructive');
  });

  it('records graded hints without erasing the attempt', () => {
    let state = createMissionRuntime(clinic01Definition, 42, T0);
    state = useHint(clinic01Definition, state, 2, 'hint-2');
    state = useHint(clinic01Definition, state, 5, 'hint-5');
    expect(state.assessment?.autonomy).toEqual({ highestHintTier: 5, hintCount: 2 });
    expect(state.assessment?.rules.find((rule) => rule.ruleId === 'rule.clinic.autonomy')?.passed).toBe(false);
  });

  it('rejects evidence links to unknown artifacts', () => {
    const state = createMissionRuntime(clinic01Definition, 42, T0);
    const next = linkEvidence(clinic01Definition, state, { claimId: 'hypothesis.clinic.password-spray', evidenceId: 'artifact.missing', note: 'invalid' });
    expect(next).toBe(state);
  });
});
