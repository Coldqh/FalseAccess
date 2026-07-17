import { describe, expect, it } from 'vitest';
import {
  addSkillEvidence,
  createSkillMastery,
  deriveMasteryLevel,
  type SkillEvidenceRecord,
} from '../src/core/progression/mastery';

const scores = {
  correctness: 100,
  evidence: 100,
  method: 100,
  coverage: 100,
  efficiency: 80,
  communication: 100,
  judgment: 100,
  autonomy: 100,
};

function record(id: string, missionId: string, type: SkillEvidenceRecord['type']): SkillEvidenceRecord {
  return {
    id,
    skillId: 'shell.linux-basics',
    missionId,
    outcomeId: id,
    type,
    recordedAt: '2026-07-17T10:00:00.000Z',
    dimensionScores: scores,
    highestHintTier: 0,
    criticalErrors: [],
  };
}

describe('mastery evidence', () => {
  it('requires two independent missions before level 3', () => {
    expect(deriveMasteryLevel([record('a', 'mission-a', 'independent')])).toBe(2);
    expect(deriveMasteryLevel([
      record('a', 'mission-a', 'independent'),
      record('b', 'mission-b', 'independent'),
    ])).toBe(3);
  });

  it('requires transfer after independent evidence for level 4', () => {
    expect(deriveMasteryLevel([
      record('a', 'mission-a', 'independent'),
      record('b', 'mission-b', 'independent'),
      record('c', 'mission-c', 'transfer'),
    ])).toBe(4);
  });

  it('does not count evidence with critical errors', () => {
    const broken = { ...record('a', 'mission-a', 'guided'), criticalErrors: ['destroyed-evidence'] };
    expect(deriveMasteryLevel([broken])).toBe(0);
  });

  it('deduplicates evidence records', () => {
    const initial = createSkillMastery('shell.linux-basics');
    const evidence = record('a', 'mission-a', 'guided');
    const once = addSkillEvidence(initial, evidence);
    const twice = addSkillEvidence(once, evidence);
    expect(twice.evidence).toHaveLength(1);
    expect(twice.level).toBe(2);
  });
});
