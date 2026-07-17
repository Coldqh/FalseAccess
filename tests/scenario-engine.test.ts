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
  state = openArtifact(clinic01Definition, state, 'artifact.clinic.brief', 'terminal', '2026-07-17T10:01:00.000Z');
  state = appendMissionAction(clinic01Definition, state, {
    type: 'command.executed',
    source: 'terminal',
    at: '2026-07-17T10:02:00.000Z',
    payload: {
      tool: 'grep',
      targetArtifactId: 'artifact.clinic.auth-log',
      readOnly: true,
      success: true,
      destructive: false,
      externalNetwork: false,
    },
  });
  state = appendMissionAction(clinic01Definition, state, {
    type: 'command.executed',
    source: 'terminal',
    at: '2026-07-17T10:03:00.000Z',
    payload: {
      tool: 'ps',
      targetArtifactId: 'artifact.clinic.processes',
      readOnly: true,
      success: true,
      destructive: false,
      externalNetwork: false,
    },
  });
  state = upsertHypothesis(clinic01Definition, state, {
    hypothesisId: 'hypothesis.clinic.password-spray',
    status: 'supported',
    confidence: 'high',
    note: 'Несколько отказов с одного внешнего источника.',
  }, '2026-07-17T10:04:00.000Z');
  state = upsertHypothesis(clinic01Definition, state, {
    hypothesisId: 'hypothesis.clinic.account-compromise',
    status: 'unknown',
    confidence: 'medium',
    note: 'Доступного окна журналов недостаточно для утверждения о компрометации.',
  }, '2026-07-17T10:05:00.000Z');
  state = upsertHypothesis(clinic01Definition, state, {
    hypothesisId: 'hypothesis.clinic.local-process',
    status: 'open',
    confidence: 'medium',
    note: 'Происхождение процесса ещё не установлено.',
  }, '2026-07-17T10:06:00.000Z');
  state = linkEvidence(clinic01Definition, state, {
    claimId: 'hypothesis.clinic.password-spray',
    evidenceId: 'artifact.clinic.auth-log',
    note: 'Серия Failed password.',
  }, '2026-07-17T10:07:00.000Z');
  state = linkEvidence(clinic01Definition, state, {
    claimId: 'hypothesis.clinic.local-process',
    evidenceId: 'artifact.clinic.processes',
    note: 'Процесс запущен из временного каталога.',
  }, '2026-07-17T10:08:00.000Z');
  state = commitDecision(clinic01Definition, state, {
    decisionId,
    rationale: 'Решение учитывает сохранение evidence и доступность регистратуры.',
  }, '2026-07-17T10:09:00.000Z');
  state = submitReport(clinic01Definition, state, {
    facts: 'Подтверждена серия неудачных входов.',
    evidence: 'auth.log и process snapshot.',
    limitations: 'Нет полного окна телеметрии и runtime-данных процесса.',
    decision: 'Сохранить данные и ограничить риск.',
    nextSteps: 'Проверить происхождение процесса и соседние узлы.',
  }, '2026-07-17T10:10:00.000Z');
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
  it('creates an idempotent, ordered action history starting with mission.started', () => {
    const state = createMissionRuntime(clinic01Definition, 42, T0);
    expect(state.status).toBe('active');
    expect(state.actionLog).toHaveLength(1);
    expect(state.actionLog[0]).toMatchObject({
      type: 'mission.started',
      sequence: 1,
      payload: { seed: 42 },
    });
  });

  it.each([
    'decision.clinic.preserve-restrict',
    'decision.clinic.isolate-transfer',
  ] as const)('accepts valid solution family %s', (decisionId) => {
    const state = buildSolvedState(decisionId);
    expect(state.assessment?.eligibleForCompletion).toBe(true);
    const attempt = attemptMissionCompletion(clinic01Definition, state, '2026-07-17T10:11:00.000Z');
    expect(attempt.completed).toBe(true);
    expect(attempt.reasons).toEqual([]);
    expect(attempt.state.status).toBe('completed');
    expect(attempt.state.assessment?.matchedSolutionFamilyId).toContain(decisionId.split('.').slice(-1)[0]);
  });

  it('blocks completion after destructive evidence handling', () => {
    let state = buildSolvedState('decision.clinic.preserve-restrict');
    state = appendMissionAction(clinic01Definition, state, {
      type: 'command.executed',
      source: 'terminal',
      payload: {
        tool: 'rm',
        destructive: true,
        externalNetwork: false,
        success: true,
      },
      at: '2026-07-17T10:10:30.000Z',
    });
    const attempt = attemptMissionCompletion(clinic01Definition, state, '2026-07-17T10:11:00.000Z');
    expect(attempt.completed).toBe(false);
    expect(attempt.reasons).toContain('critical.clinic.destructive-action');
  });

  it('records graded hints without erasing the learning attempt', () => {
    let state = createMissionRuntime(clinic01Definition, 42, T0);
    state = useHint(clinic01Definition, state, 2, 'hint.find-log', '2026-07-17T10:01:00.000Z');
    state = useHint(clinic01Definition, state, 5, 'hint.full-method', '2026-07-17T10:02:00.000Z');
    expect(state.assessment?.autonomy).toEqual({ highestHintTier: 5, hintCount: 2 });
    expect(state.assessment?.rules.find((rule) => rule.ruleId === 'rule.clinic.autonomy')?.passed).toBe(false);
  });

  it('rejects evidence links to unknown artifacts', () => {
    const state = createMissionRuntime(clinic01Definition, 42, T0);
    const next = linkEvidence(clinic01Definition, state, {
      claimId: 'hypothesis.clinic.password-spray',
      evidenceId: 'artifact.missing',
      note: 'invalid',
    });
    expect(next).toBe(state);
  });
});
