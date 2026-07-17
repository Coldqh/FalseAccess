import type { AssessmentDimension, MissionAssessmentResult } from '../scenario/types';

export type SkillEvidenceType = 'recognition' | 'guided' | 'independent' | 'transfer' | 'design' | 'review';

export interface SkillEvidenceRecord {
  id: string;
  skillId: string;
  missionId: string;
  outcomeId: string;
  type: SkillEvidenceType;
  recordedAt: string;
  dimensionScores: Record<AssessmentDimension, number>;
  highestHintTier: number;
  criticalErrors: string[];
}

export interface SkillMasteryState {
  skillId: string;
  level: 0 | 1 | 2 | 3 | 4 | 5;
  evidence: SkillEvidenceRecord[];
  lastReviewedAt: string | null;
}

export function createSkillMastery(skillId: string): SkillMasteryState {
  return { skillId, level: 0, evidence: [], lastReviewedAt: null };
}

function valid(records: SkillEvidenceRecord[], type: SkillEvidenceType): SkillEvidenceRecord[] {
  return records.filter((record) => record.type === type && record.criticalErrors.length === 0);
}

export function deriveMasteryLevel(records: SkillEvidenceRecord[]): SkillMasteryState['level'] {
  const recognition = valid(records, 'recognition').length;
  const guided = valid(records, 'guided').length;
  const independentMissions = new Set(valid(records, 'independent').map((record) => record.missionId)).size;
  const transfer = valid(records, 'transfer').length;
  const design = valid(records, 'design').length;
  const review = valid(records, 'review').length;

  if ((design >= 1 && review >= 1) || design >= 2 || review >= 2) return 5;
  if (independentMissions >= 2 && transfer >= 1) return 4;
  if (independentMissions >= 2) return 3;
  if (guided >= 1 || independentMissions >= 1 || transfer >= 1) return 2;
  if (recognition >= 1) return 1;
  return 0;
}

export function addSkillEvidence(
  state: SkillMasteryState,
  record: SkillEvidenceRecord,
): SkillMasteryState {
  if (state.evidence.some((item) => item.id === record.id)) return state;
  const evidence = [...state.evidence, record];
  return {
    ...state,
    evidence,
    level: deriveMasteryLevel(evidence),
    lastReviewedAt: record.recordedAt,
  };
}

export function evidenceFromAssessment(input: {
  skillId: string;
  missionId: string;
  outcomeId: string;
  type: SkillEvidenceType;
  assessment: MissionAssessmentResult;
  recordedAt?: string;
}): SkillEvidenceRecord {
  const recordedAt = input.recordedAt ?? input.assessment.evaluatedAt;
  return {
    id: `${input.missionId}:${input.outcomeId}:${input.type}:${recordedAt}`,
    skillId: input.skillId,
    missionId: input.missionId,
    outcomeId: input.outcomeId,
    type: input.type,
    recordedAt,
    dimensionScores: input.assessment.dimensionScores,
    highestHintTier: input.assessment.autonomy.highestHintTier,
    criticalErrors: input.assessment.criticalErrors,
  };
}
