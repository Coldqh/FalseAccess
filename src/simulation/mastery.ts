import type { SimulationSkillId, SimulationState, SkillTrackState } from './types';

export interface MasteryRequirement {
  id: SimulationSkillId;
  theory: number;
  guided: number;
  independent: number;
  production: number;
}

export const middleReadinessRequirements: MasteryRequirement[] = [
  { id: 'computer', theory: 80, guided: 75, independent: 65, production: 40 },
  { id: 'linux', theory: 75, guided: 70, independent: 65, production: 45 },
  { id: 'bash', theory: 65, guided: 60, independent: 55, production: 35 },
  { id: 'windows', theory: 70, guided: 65, independent: 55, production: 40 },
  { id: 'powershell', theory: 60, guided: 55, independent: 50, production: 30 },
  { id: 'networking', theory: 75, guided: 70, independent: 60, production: 45 },
  { id: 'python', theory: 70, guided: 65, independent: 60, production: 40 },
  { id: 'web', theory: 65, guided: 60, independent: 55, production: 35 },
  { id: 'sql', theory: 55, guided: 50, independent: 45, production: 25 },
  { id: 'soc', theory: 80, guided: 75, independent: 65, production: 55 },
  { id: 'siem', theory: 70, guided: 65, independent: 55, production: 45 },
  { id: 'incidentResponse', theory: 70, guided: 65, independent: 55, production: 45 },
  { id: 'forensics', theory: 65, guided: 60, independent: 50, production: 35 },
  { id: 'threatHunting', theory: 60, guided: 55, independent: 50, production: 35 },
  { id: 'detectionEngineering', theory: 55, guided: 50, independent: 45, production: 30 },
  { id: 'threatIntelligence', theory: 45, guided: 40, independent: 35, production: 25 },
  { id: 'cryptography', theory: 55, guided: 50, independent: 45, production: 25 },
  { id: 'malwareAnalysis', theory: 50, guided: 45, independent: 40, production: 25 },
  { id: 'securityEngineering', theory: 65, guided: 60, independent: 55, production: 40 },
  { id: 'appsec', theory: 55, guided: 50, independent: 45, production: 30 },
  { id: 'mobileSecurity', theory: 50, guided: 50, independent: 45, production: 25 },
  { id: 'cloud', theory: 55, guided: 50, independent: 45, production: 30 },
  { id: 'containerSecurity', theory: 55, guided: 50, independent: 45, production: 30 },
  { id: 'devsecops', theory: 55, guided: 50, independent: 45, production: 30 },
  { id: 'vulnerabilityManagement', theory: 50, guided: 45, independent: 40, production: 30 },
  { id: 'architecture', theory: 60, guided: 55, independent: 50, production: 35 },
  { id: 'governanceRisk', theory: 50, guided: 45, independent: 40, production: 30 },
  { id: 'businessContinuity', theory: 45, guided: 40, independent: 35, production: 25 },
  { id: 'activeDirectory', theory: 60, guided: 55, independent: 50, production: 35 },
  { id: 'emailSecurity', theory: 60, guided: 55, independent: 50, production: 35 },
  { id: 'communication', theory: 60, guided: 65, independent: 60, production: 50 },
  { id: 'operationalPlanning', theory: 60, guided: 55, independent: 50, production: 35 },
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
