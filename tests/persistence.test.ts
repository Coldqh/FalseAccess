import { describe, expect, it } from 'vitest';
import { createMissionRuntime } from '../src/core/scenario/engine';
import { clinic01Definition } from '../src/content/missions/clinic01/definition';
import { missionRegistry } from '../src/content/missions/registry';
import {
  createLearningRuntimeStore,
  migrateLearningRuntime,
} from '../src/persistence/learningRuntime';

describe('learning runtime migration', () => {
  it('returns a clean store for unknown data', () => {
    expect(migrateLearningRuntime('broken', missionRegistry)).toEqual(createLearningRuntimeStore());
    expect(migrateLearningRuntime({ schemaVersion: 99 }, missionRegistry)).toEqual(createLearningRuntimeStore());
  });

  it('keeps known missions and drops unknown missions', () => {
    const clinic = createMissionRuntime(clinic01Definition, 7, '2026-07-17T10:00:00.000Z');
    const migrated = migrateLearningRuntime({
      schemaVersion: 1,
      activeMissionId: 'clinic-01',
      missions: {
        'clinic-01': clinic,
        'unknown-mission': { missionId: 'unknown-mission' },
      },
      mastery: {},
    }, missionRegistry);
    expect(migrated.activeMissionId).toBe('clinic-01');
    expect(Object.keys(migrated.missions)).toEqual(['clinic-01']);
  });

  it('caps imported action logs and removes unknown artifact ids', () => {
    const clinic = createMissionRuntime(clinic01Definition, 7, '2026-07-17T10:00:00.000Z');
    const oversized = Array.from({ length: 620 }, (_, index) => ({
      ...clinic.actionLog[0],
      id: `event-${index}`,
      sequence: index + 1,
    }));
    const migrated = migrateLearningRuntime({
      schemaVersion: 1,
      activeMissionId: 'clinic-01',
      missions: {
        'clinic-01': {
          ...clinic,
          openedArtifacts: ['artifact.clinic.brief', 'artifact.unknown'],
          actionLog: oversized,
        },
      },
      mastery: {},
    }, missionRegistry);
    expect(migrated.missions['clinic-01'].actionLog).toHaveLength(500);
    expect(migrated.missions['clinic-01'].openedArtifacts).toEqual(['artifact.clinic.brief']);
  });
});
