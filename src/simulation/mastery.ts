import type { SimulationSkillId, SimulationState, SkillTrackState } from './types';

export interface MasteryRequirement {
  id: SimulationSkillId;
  theory: number;
  guided: number;
  independent: number;
  production: number;
}

export const middleReadinessRequirements: MasteryRequirement[] = [
  { id: 'linux', theory: 75, guided: 70, independent: 65, production: 45 },
  { id: 'networking', theory: 75, guided: 70, independent: 60, production: 45 },
  { id: 'python', theory: 70, guided: 65, independent: 60, production: 40 },
  { id: 'soc', theory: 80, guided: 75, independent: 65, production: 55 },
  { id: 'windows', theory: 70, guided: 65, independent: 55, production: 40 },
  { id: 'web', theory: 65, guided: 60, independent: 55, production: 35 },
  { id: 'forensics', theory: 65, guided: 60, independent: 50, production: 35 },
  { id: 'communication', theory: 60, guided: 65, independent: 60, production: 50 },
];

function ratio(value: number, target: number) {
  return Math.min(1, value / target);
}

export function getTrackReadiness(track: SkillTrackState, requirement: MasteryRequirement) {
  return Math.round((
    ratio(track.theory, requirement.theory) * 0.2
    + ratio(track.guided, requirement.guided) * 0.2
    + ratio(track.independent, requirement.independent) * 0.3
    + ratio(track.production, requirement.production) * 0.3
  ) * 100);
}

export function getMiddleReadiness(simulation: SimulationState) {
  const rows = middleReadinessRequirements.map((requirement) => ({
    id: requirement.id,
    value: getTrackReadiness(simulation.skills[requirement.id], requirement),
  }));
  return {
    total: Math.round(rows.reduce((sum, row) => sum + row.value, 0) / rows.length),
    rows,
    ready: rows.every((row) => row.value >= 100),
  };
}
