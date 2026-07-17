export type MissionLevel = 'foundation' | 'junior' | 'middle' | 'advanced';

export type AssessmentDimension =
  | 'correctness'
  | 'evidence'
  | 'method'
  | 'coverage'
  | 'efficiency'
  | 'communication'
  | 'judgment'
  | 'autonomy';

export type MissionEventType =
  | 'mission.started'
  | 'artifact.opened'
  | 'command.executed'
  | 'python.executed'
  | 'query.executed'
  | 'hypothesis.created'
  | 'hypothesis.updated'
  | 'evidence.linked'
  | 'decision.committed'
  | 'hint.used'
  | 'report.submitted'
  | 'mission.completed'
  | 'mission.reset';

export type Scalar = string | number | boolean | null;
export type EventPayload = Record<string, Scalar | Scalar[] | Record<string, Scalar>>;

export interface MissionEvent {
  id: string;
  missionId: string;
  sequence: number;
  type: MissionEventType;
  at: string;
  source: string;
  payload: EventPayload;
}

export interface MissionArtifactDefinition {
  id: string;
  title: string;
  format: string;
  origin: string;
  description: string;
  containsNoise: boolean;
  integrity?: string;
}

export interface MissionOutcomeDefinition {
  id: string;
  skillId: string;
  statement: string;
  evidenceType: 'recognition' | 'guided' | 'independent' | 'transfer' | 'design' | 'review';
  criticalErrors?: string[];
}

export interface MissionHypothesisDefinition {
  id: string;
  title: string;
  description: string;
  allowedStatuses: Array<'open' | 'supported' | 'rejected' | 'unknown'>;
}

export interface MissionDecisionDefinition {
  id: string;
  title: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
}

export type ConditionOperator = 'eq' | 'includes' | 'exists' | 'oneOf' | 'gte' | 'lte';

export interface EventCondition {
  path: string;
  operator: ConditionOperator;
  value?: Scalar | Scalar[];
}

export type AssessmentMatcher =
  | {
      kind: 'event';
      eventType: MissionEventType;
      minCount?: number;
      where?: EventCondition[];
    }
  | {
      kind: 'sequence';
      eventTypes: MissionEventType[];
    }
  | {
      kind: 'evidence-link';
      claimId: string;
      evidenceIds?: string[];
      minLinks?: number;
    }
  | {
      kind: 'hypothesis';
      hypothesisId: string;
      statuses: Array<'open' | 'supported' | 'rejected' | 'unknown'>;
    }
  | {
      kind: 'decision';
      decisionIds: string[];
    }
  | {
      kind: 'report';
      requiredSections: string[];
    }
  | {
      kind: 'hint-ceiling';
      maxTier: number;
    };

export interface AssessmentRuleDefinition {
  id: string;
  title: string;
  dimension: AssessmentDimension;
  weight: number;
  critical?: boolean;
  matcher: AssessmentMatcher;
}

export interface MissionSolutionFamily {
  id: string;
  title: string;
  description: string;
  requiredRuleIds: string[];
}

export interface MissionConsequenceDefinition {
  id: string;
  trigger: 'success' | 'critical-error' | 'decision';
  decisionId?: string;
  summary: string;
  effects: Record<string, number | string | boolean>;
}

export interface MissionDefinition {
  schemaVersion: 1;
  id: string;
  chapterId: string;
  title: string;
  level: MissionLevel;
  faction: string;
  durationMinutes: number;
  skills: string[];
  briefing: {
    summary: string;
    objective: string;
    constraints: string[];
    hiddenTruth: string;
  };
  artifacts: MissionArtifactDefinition[];
  outcomes: MissionOutcomeDefinition[];
  hypotheses: MissionHypothesisDefinition[];
  decisions: MissionDecisionDefinition[];
  assessmentRules: AssessmentRuleDefinition[];
  solutionFamilies: MissionSolutionFamily[];
  completion: {
    coreRuleIds: string[];
    minDimensionScores?: Partial<Record<AssessmentDimension, number>>;
  };
  consequences: MissionConsequenceDefinition[];
  replay: {
    seeded: boolean;
    variables: string[];
  };
  safety: {
    sandboxed: true;
    externalNetwork: false;
    allowedActions: string[];
    resettable: true;
  };
}

export interface PlayerHypothesis {
  id: string;
  hypothesisId: string;
  status: 'open' | 'supported' | 'rejected' | 'unknown';
  confidence: 'low' | 'medium' | 'high';
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceLink {
  id: string;
  claimId: string;
  evidenceId: string;
  note: string;
  createdAt: string;
}

export interface PlayerDecision {
  id: string;
  decisionId: string;
  rationale: string;
  committedAt: string;
}

export interface PlayerReport {
  sections: Record<string, string>;
  submittedAt: string;
}

export interface RuleAssessmentResult {
  ruleId: string;
  passed: boolean;
  critical: boolean;
  detail: string;
}

export interface MissionAssessmentResult {
  evaluatedAt: string;
  eligibleForCompletion: boolean;
  matchedSolutionFamilyId: string | null;
  dimensionScores: Record<AssessmentDimension, number>;
  rules: RuleAssessmentResult[];
  criticalErrors: string[];
  autonomy: {
    highestHintTier: number;
    hintCount: number;
  };
}

export interface MissionRuntimeState {
  schemaVersion: 1;
  missionId: string;
  seed: number;
  status: 'not-started' | 'active' | 'eligible' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  openedArtifacts: string[];
  actionLog: MissionEvent[];
  hypotheses: PlayerHypothesis[];
  evidenceLinks: EvidenceLink[];
  decisions: PlayerDecision[];
  report: PlayerReport | null;
  assessment: MissionAssessmentResult | null;
}

export interface MissionActionInput {
  type: MissionEventType;
  source: string;
  payload?: EventPayload;
  at?: string;
}
