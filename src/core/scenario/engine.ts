import { assessMission } from '../assessment/assessment';
import { uniqueEvidenceLinks, validateEvidenceLink } from '../evidence/evidence';
import type {
  EvidenceLink,
  MissionActionInput,
  MissionDefinition,
  MissionRuntimeState,
  PlayerDecision,
  PlayerHypothesis,
  PlayerReport,
} from './types';

const MAX_ACTION_LOG = 500;

function nextId(state: MissionRuntimeState, prefix: string): string {
  return `${prefix}-${state.missionId}-${state.actionLog.length + 1}`;
}

export function createMissionRuntime(
  definition: MissionDefinition,
  seed: number,
  startedAt = new Date().toISOString(),
): MissionRuntimeState {
  const base: MissionRuntimeState = {
    schemaVersion: 1,
    missionId: definition.id,
    seed,
    status: 'active',
    startedAt,
    completedAt: null,
    openedArtifacts: [],
    actionLog: [],
    hypotheses: [],
    evidenceLinks: [],
    decisions: [],
    report: null,
    assessment: null,
  };
  return appendMissionAction(definition, base, {
    type: 'mission.started',
    source: 'runtime',
    payload: { seed },
    at: startedAt,
  });
}

export function appendMissionAction(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  input: MissionActionInput,
): MissionRuntimeState {
  if (state.status === 'completed' && input.type !== 'mission.reset') return state;
  const at = input.at ?? new Date().toISOString();
  const event = {
    id: nextId(state, 'event'),
    missionId: state.missionId,
    sequence: state.actionLog.length + 1,
    type: input.type,
    at,
    source: input.source,
    payload: input.payload ?? {},
  } as const;
  const actionLog = [...state.actionLog, event].slice(-MAX_ACTION_LOG);
  const next = { ...state, actionLog };
  const assessment = assessMission(definition, next, at);
  return {
    ...next,
    status: assessment.eligibleForCompletion ? 'eligible' : next.status === 'completed' ? 'completed' : 'active',
    assessment,
  };
}

export function openArtifact(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  artifactId: string,
  source = 'workspace',
  at = new Date().toISOString(),
): MissionRuntimeState {
  if (!definition.artifacts.some((artifact) => artifact.id === artifactId)) return state;
  const openedArtifacts = state.openedArtifacts.includes(artifactId)
    ? state.openedArtifacts
    : [...state.openedArtifacts, artifactId];
  return appendMissionAction(definition, { ...state, openedArtifacts }, {
    type: 'artifact.opened',
    source,
    payload: { artifactId },
    at,
  });
}

export function upsertHypothesis(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  input: Omit<PlayerHypothesis, 'id' | 'createdAt' | 'updatedAt'>,
  at = new Date().toISOString(),
): MissionRuntimeState {
  const allowed = definition.hypotheses.find((hypothesis) => hypothesis.id === input.hypothesisId);
  if (!allowed || !allowed.allowedStatuses.includes(input.status)) return state;
  const existing = state.hypotheses.find((hypothesis) => hypothesis.hypothesisId === input.hypothesisId);
  const nextHypothesis: PlayerHypothesis = existing
    ? { ...existing, ...input, updatedAt: at }
    : { ...input, id: `hypothesis-${state.missionId}-${state.hypotheses.length + 1}`, createdAt: at, updatedAt: at };
  const hypotheses = existing
    ? state.hypotheses.map((hypothesis) => hypothesis.id === existing.id ? nextHypothesis : hypothesis)
    : [...state.hypotheses, nextHypothesis];
  return appendMissionAction(definition, { ...state, hypotheses }, {
    type: existing ? 'hypothesis.updated' : 'hypothesis.created',
    source: 'evidence-board',
    payload: {
      hypothesisId: input.hypothesisId,
      status: input.status,
      confidence: input.confidence,
    },
    at,
  });
}

export function linkEvidence(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  input: Omit<EvidenceLink, 'id' | 'createdAt'>,
  at = new Date().toISOString(),
): MissionRuntimeState {
  const validation = validateEvidenceLink(definition, state, input);
  if (!validation.valid) return state;
  const link: EvidenceLink = {
    ...input,
    id: `evidence-link-${state.missionId}-${state.evidenceLinks.length + 1}`,
    createdAt: at,
  };
  const evidenceLinks = uniqueEvidenceLinks([...state.evidenceLinks, link]);
  if (evidenceLinks.length === state.evidenceLinks.length) return state;
  return appendMissionAction(definition, { ...state, evidenceLinks }, {
    type: 'evidence.linked',
    source: 'evidence-board',
    payload: { claimId: input.claimId, evidenceId: input.evidenceId },
    at,
  });
}

export function commitDecision(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  input: Omit<PlayerDecision, 'id' | 'committedAt'>,
  at = new Date().toISOString(),
): MissionRuntimeState {
  if (!definition.decisions.some((decision) => decision.id === input.decisionId)) return state;
  const decision: PlayerDecision = {
    ...input,
    id: `decision-${state.missionId}-${state.decisions.length + 1}`,
    committedAt: at,
  };
  return appendMissionAction(definition, { ...state, decisions: [...state.decisions, decision] }, {
    type: 'decision.committed',
    source: 'decision-panel',
    payload: { decisionId: input.decisionId, hasRationale: Boolean(input.rationale.trim()) },
    at,
  });
}

export function submitReport(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  sections: PlayerReport['sections'],
  at = new Date().toISOString(),
): MissionRuntimeState {
  const report: PlayerReport = { sections, submittedAt: at };
  return appendMissionAction(definition, { ...state, report }, {
    type: 'report.submitted',
    source: 'notes',
    payload: { sectionIds: Object.keys(sections), sectionCount: Object.keys(sections).length },
    at,
  });
}

export function useHint(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  tier: number,
  hintId: string,
  at = new Date().toISOString(),
): MissionRuntimeState {
  const safeTier = Math.max(1, Math.min(5, Math.trunc(tier)));
  return appendMissionAction(definition, state, {
    type: 'hint.used',
    source: 'hint-system',
    payload: { tier: safeTier, hintId },
    at,
  });
}

export interface CompletionAttempt {
  completed: boolean;
  state: MissionRuntimeState;
  reasons: string[];
}

export function attemptMissionCompletion(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  at = new Date().toISOString(),
): CompletionAttempt {
  const assessment = assessMission(definition, state, at);
  if (!assessment.eligibleForCompletion) {
    const reasons = [
      ...assessment.rules.filter((rule) => !rule.passed && !rule.critical).map((rule) => rule.ruleId),
      ...assessment.criticalErrors,
    ];
    return { completed: false, state: { ...state, assessment, status: 'active' }, reasons };
  }
  const completed = appendMissionAction(definition, { ...state, assessment, status: 'eligible' }, {
    type: 'mission.completed',
    source: 'runtime',
    payload: { solutionFamilyId: assessment.matchedSolutionFamilyId },
    at,
  });
  return {
    completed: true,
    reasons: [],
    state: { ...completed, status: 'completed', completedAt: at },
  };
}

export function resetMission(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  at = new Date().toISOString(),
): MissionRuntimeState {
  const reset = createMissionRuntime(definition, state.seed, at);
  return appendMissionAction(definition, reset, {
    type: 'mission.reset',
    source: 'runtime',
    payload: { previousEventCount: state.actionLog.length },
    at,
  });
}
