import { assessMission } from '../core/assessment/assessment';
import { createSkillMastery, deriveMasteryLevel, type SkillEvidenceRecord, type SkillMasteryState } from '../core/progression/mastery';
import type {
  EvidenceLink,
  EventPayload,
  MissionDefinition,
  MissionEvent,
  MissionEventType,
  MissionRuntimeState,
  PlayerDecision,
  PlayerHypothesis,
  PlayerReport,
  Scalar,
} from '../core/scenario/types';

export const LEARNING_RUNTIME_STORAGE_KEY = 'false-access-learning-runtime-v1';
export const LEARNING_RUNTIME_SCHEMA_VERSION = 1 as const;

export interface LearningRuntimeStore {
  schemaVersion: 1;
  activeMissionId: string | null;
  missions: Record<string, MissionRuntimeState>;
  mastery: Record<string, SkillMasteryState>;
}

const eventTypes = new Set<MissionEventType>([
  'mission.started',
  'artifact.opened',
  'command.executed',
  'python.executed',
  'query.executed',
  'hypothesis.created',
  'hypothesis.updated',
  'evidence.linked',
  'decision.committed',
  'hint.used',
  'report.submitted',
  'mission.completed',
  'mission.reset',
]);

export function createLearningRuntimeStore(): LearningRuntimeStore {
  return {
    schemaVersion: LEARNING_RUNTIME_SCHEMA_VERSION,
    activeMissionId: null,
    missions: {},
    mastery: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isScalar(value: unknown): value is Scalar {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function sanitizePayload(value: unknown): EventPayload {
  if (!isRecord(value)) return {};
  const payload: EventPayload = {};
  for (const [key, item] of Object.entries(value).slice(0, 40)) {
    if (isScalar(item)) payload[key] = item;
    else if (Array.isArray(item) && item.length <= 100 && item.every(isScalar)) payload[key] = item;
    else if (isRecord(item)) {
      const nested = Object.fromEntries(Object.entries(item).slice(0, 40).filter(([, nestedValue]) => isScalar(nestedValue)));
      payload[key] = nested as Record<string, Scalar>;
    }
  }
  return payload;
}

function sanitizeEvents(value: unknown, missionId: string): MissionEvent[] {
  if (!Array.isArray(value)) return [];
  const events: MissionEvent[] = [];
  for (const raw of value.slice(-500)) {
    if (!isRecord(raw) || raw.missionId !== missionId || !eventTypes.has(raw.type as MissionEventType)) continue;
    if (typeof raw.id !== 'string' || typeof raw.at !== 'string' || typeof raw.source !== 'string') continue;
    events.push({
      id: raw.id.slice(0, 160),
      missionId,
      sequence: events.length + 1,
      type: raw.type as MissionEventType,
      at: raw.at,
      source: raw.source.slice(0, 80),
      payload: sanitizePayload(raw.payload),
    });
  }
  return events;
}

function sanitizeHypotheses(value: unknown, definition: MissionDefinition): PlayerHypothesis[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw, index) => {
    if (!isRecord(raw) || typeof raw.hypothesisId !== 'string') return [];
    const hypothesis = definition.hypotheses.find((item) => item.id === raw.hypothesisId);
    const status = String(raw.status) as PlayerHypothesis['status'];
    const confidence = String(raw.confidence) as PlayerHypothesis['confidence'];
    if (!hypothesis?.allowedStatuses.includes(status) || !['low', 'medium', 'high'].includes(confidence)) return [];
    const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString();
    return [{
      id: typeof raw.id === 'string' ? raw.id.slice(0, 160) : `hypothesis-${definition.id}-${index + 1}`,
      hypothesisId: hypothesis.id,
      status,
      confidence,
      note: typeof raw.note === 'string' ? raw.note.slice(0, 4000) : '',
      createdAt,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
    }];
  });
}

function sanitizeEvidenceLinks(value: unknown, definition: MissionDefinition, events: MissionEvent[]): EvidenceLink[] {
  if (!Array.isArray(value)) return [];
  const claims = new Set([
    ...definition.hypotheses.map((item) => item.id),
    ...definition.outcomes.map((item) => item.id),
  ]);
  const evidence = new Set([
    ...definition.artifacts.map((item) => item.id),
    ...events.map((item) => item.id),
  ]);
  const seen = new Set<string>();
  return value.flatMap((raw, index) => {
    if (!isRecord(raw) || typeof raw.claimId !== 'string' || typeof raw.evidenceId !== 'string') return [];
    if (!claims.has(raw.claimId) || !evidence.has(raw.evidenceId)) return [];
    const key = `${raw.claimId}:${raw.evidenceId}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      id: typeof raw.id === 'string' ? raw.id.slice(0, 160) : `evidence-link-${definition.id}-${index + 1}`,
      claimId: raw.claimId,
      evidenceId: raw.evidenceId,
      note: typeof raw.note === 'string' ? raw.note.slice(0, 4000) : '',
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
    }];
  });
}

function sanitizeDecisions(value: unknown, definition: MissionDefinition): PlayerDecision[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(definition.decisions.map((item) => item.id));
  return value.flatMap((raw, index) => {
    if (!isRecord(raw) || typeof raw.decisionId !== 'string' || !allowed.has(raw.decisionId)) return [];
    return [{
      id: typeof raw.id === 'string' ? raw.id.slice(0, 160) : `decision-${definition.id}-${index + 1}`,
      decisionId: raw.decisionId,
      rationale: typeof raw.rationale === 'string' ? raw.rationale.slice(0, 8000) : '',
      committedAt: typeof raw.committedAt === 'string' ? raw.committedAt : new Date(0).toISOString(),
    }];
  });
}

function sanitizeReport(value: unknown): PlayerReport | null {
  if (!isRecord(value) || !isRecord(value.sections)) return null;
  const sections = Object.fromEntries(
    Object.entries(value.sections)
      .slice(0, 30)
      .filter(([, content]) => typeof content === 'string')
      .map(([key, content]) => [key.slice(0, 80), String(content).slice(0, 12000)]),
  );
  return {
    sections,
    submittedAt: typeof value.submittedAt === 'string' ? value.submittedAt : new Date(0).toISOString(),
  };
}

function sanitizeMissionRuntime(value: unknown, definition: MissionDefinition): MissionRuntimeState | null {
  if (!isRecord(value) || value.missionId !== definition.id) return null;
  const actionLog = sanitizeEvents(value.actionLog, definition.id);
  const openedArtifacts = Array.isArray(value.openedArtifacts)
    ? value.openedArtifacts.filter((item): item is string => typeof item === 'string'
      && definition.artifacts.some((artifact) => artifact.id === item))
    : [];
  const importedStatus = ['not-started', 'active', 'eligible', 'completed', 'failed'].includes(String(value.status))
    ? value.status as MissionRuntimeState['status']
    : 'active';

  const base: MissionRuntimeState = {
    schemaVersion: 1,
    missionId: definition.id,
    seed: Number.isFinite(Number(value.seed)) ? Number(value.seed) : 1,
    status: importedStatus,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : null,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
    openedArtifacts: Array.from(new Set(openedArtifacts)),
    actionLog,
    hypotheses: sanitizeHypotheses(value.hypotheses, definition),
    evidenceLinks: [],
    decisions: sanitizeDecisions(value.decisions, definition),
    report: sanitizeReport(value.report),
    assessment: null,
  };
  base.evidenceLinks = sanitizeEvidenceLinks(value.evidenceLinks, definition, actionLog);
  const assessment = assessMission(definition, base);
  return {
    ...base,
    assessment,
    status: importedStatus === 'completed' ? 'completed' : assessment.eligibleForCompletion ? 'eligible' : 'active',
  };
}

function sanitizeEvidenceRecord(raw: unknown, skillId: string): SkillEvidenceRecord | null {
  if (!isRecord(raw) || raw.skillId !== skillId || typeof raw.id !== 'string' || typeof raw.missionId !== 'string') return null;
  const type = String(raw.type) as SkillEvidenceRecord['type'];
  if (!['recognition', 'guided', 'independent', 'transfer', 'design', 'review'].includes(type)) return null;
  const scores = isRecord(raw.dimensionScores) ? raw.dimensionScores : {};
  const dimensionScores = {
    correctness: Number(scores.correctness ?? 0),
    evidence: Number(scores.evidence ?? 0),
    method: Number(scores.method ?? 0),
    coverage: Number(scores.coverage ?? 0),
    efficiency: Number(scores.efficiency ?? 0),
    communication: Number(scores.communication ?? 0),
    judgment: Number(scores.judgment ?? 0),
    autonomy: Number(scores.autonomy ?? 0),
  };
  return {
    id: raw.id.slice(0, 200),
    skillId,
    missionId: raw.missionId.slice(0, 160),
    outcomeId: typeof raw.outcomeId === 'string' ? raw.outcomeId.slice(0, 160) : '',
    type,
    recordedAt: typeof raw.recordedAt === 'string' ? raw.recordedAt : new Date(0).toISOString(),
    dimensionScores,
    highestHintTier: Math.max(0, Math.min(5, Number(raw.highestHintTier ?? 0))),
    criticalErrors: Array.isArray(raw.criticalErrors)
      ? raw.criticalErrors.filter((item): item is string => typeof item === 'string').slice(0, 30)
      : [],
  };
}

function sanitizeMastery(value: unknown): Record<string, SkillMasteryState> {
  if (!isRecord(value)) return {};
  const result: Record<string, SkillMasteryState> = {};
  for (const [skillId, raw] of Object.entries(value)) {
    if (!isRecord(raw)) continue;
    const fallback = createSkillMastery(skillId);
    const evidence = Array.isArray(raw.evidence)
      ? raw.evidence.map((item) => sanitizeEvidenceRecord(item, skillId)).filter((item): item is SkillEvidenceRecord => Boolean(item)).slice(-200)
      : [];
    result[skillId] = {
      ...fallback,
      level: deriveMasteryLevel(evidence),
      evidence,
      lastReviewedAt: typeof raw.lastReviewedAt === 'string' ? raw.lastReviewedAt : null,
    };
  }
  return result;
}

export function migrateLearningRuntime(
  value: unknown,
  definitions: Readonly<Record<string, MissionDefinition>>,
): LearningRuntimeStore {
  if (!isRecord(value) || Number(value.schemaVersion) !== 1) return createLearningRuntimeStore();
  const missions: Record<string, MissionRuntimeState> = {};
  if (isRecord(value.missions)) {
    for (const [missionId, rawMission] of Object.entries(value.missions)) {
      const definition = definitions[missionId];
      if (!definition) continue;
      const sanitized = sanitizeMissionRuntime(rawMission, definition);
      if (sanitized) missions[missionId] = sanitized;
    }
  }
  const requestedActive = typeof value.activeMissionId === 'string' ? value.activeMissionId : null;
  return {
    schemaVersion: 1,
    activeMissionId: requestedActive && missions[requestedActive] ? requestedActive : null,
    missions,
    mastery: sanitizeMastery(value.mastery),
  };
}

export function loadLearningRuntime(
  definitions: Readonly<Record<string, MissionDefinition>>,
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): LearningRuntimeStore {
  try {
    const raw = storage.getItem(LEARNING_RUNTIME_STORAGE_KEY);
    return raw ? migrateLearningRuntime(JSON.parse(raw), definitions) : createLearningRuntimeStore();
  } catch {
    return createLearningRuntimeStore();
  }
}

export function persistLearningRuntime(
  store: LearningRuntimeStore,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
): boolean {
  try {
    storage.setItem(LEARNING_RUNTIME_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}
