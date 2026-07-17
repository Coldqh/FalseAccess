import type { ContractDifficulty, ContractSkill, GeneratedContract, ProgressState } from '../types';
import type {
  ProgressionStageId, SimulationSkillId, SkillTrackState, SpecializationId,
} from './types';

export type TrackKey = keyof SkillTrackState;
export type TrackRequirement = Partial<Record<TrackKey, number>>;
export type SkillRequirementMap = Partial<Record<SimulationSkillId, TrackRequirement>>;

export interface ProgressionStageDefinition {
  id: ProgressionStageId;
  title: string;
  shortTitle: string;
  description: string;
  examId?: string;
  examTitle?: string;
  requirements: SkillRequirementMap;
}

export interface ProgressionGap {
  id: string;
  label: string;
  current: number;
  required: number;
  complete: boolean;
  kind: 'skill' | 'exam' | 'story';
}

export const skillLabels: Record<SimulationSkillId, string> = {
  computer: 'Основы компьютера',
  linux: 'Linux',
  bash: 'Bash',
  windows: 'Windows',
  powershell: 'PowerShell',
  networking: 'Сети',
  python: 'Python',
  web: 'Web',
  sql: 'SQL',
  soc: 'SOC',
  siem: 'SIEM',
  incidentResponse: 'Incident Response',
  forensics: 'DFIR',
  threatHunting: 'Threat Hunting',
  detectionEngineering: 'Detection Engineering',
  threatIntelligence: 'Threat Intelligence',
  cryptography: 'Cryptography / PKI',
  malwareAnalysis: 'Malware Analysis',
  securityEngineering: 'Security Engineering',
  appsec: 'AppSec',
  mobileSecurity: 'Mobile Security',
  cloud: 'Cloud Security',
  activeDirectory: 'Active Directory',
  emailSecurity: 'Email Security',
  communication: 'Коммуникация',
  operationalPlanning: 'Планирование операций',
};

export const trackLabels: Record<TrackKey, string> = {
  theory: 'теория',
  guided: 'практика с подсказками',
  independent: 'самостоятельная практика',
  production: 'рабочий опыт',
};

export const progressionStages: ProgressionStageDefinition[] = [
  {
    id: 0,
    title: 'Абсолютный ноль',
    shortTitle: 'Новичок',
    description: 'Файлы, пути, терминал, процессы, логи и первые строки Python.',
    requirements: {},
  },
  {
    id: 1,
    title: 'Начинающий IT-специалист',
    shortTitle: 'IT Basics',
    description: 'Игрок умеет работать с файлами, читать простые журналы и объяснять найденные факты.',
    examId: 'clinic-01',
    examTitle: 'CLINIC-01 · разбор рабочей станции',
    requirements: {
      computer: { theory: 10, guided: 10 },
      linux: { theory: 12, guided: 12 },
      bash: { theory: 6, guided: 8 },
      python: { theory: 10, guided: 12 },
      soc: { theory: 8, guided: 8 },
    },
  },
  {
    id: 2,
    title: 'Junior SOC',
    shortTitle: 'Junior SOC',
    description: 'Фишинг, Windows-события, DNS, triage и первая рабочая смена.',
    examId: 'first-shift',
    examTitle: 'Первая смена · три связанных тикета',
    requirements: {
      soc: { theory: 10, guided: 12, production: 4 },
      windows: { theory: 8, guided: 8 },
      networking: { theory: 8, guided: 8 },
      communication: { guided: 6 },
    },
  },
  {
    id: 3,
    title: 'Автоматизация и Web',
    shortTitle: 'Web + Python',
    description: 'Самостоятельные скрипты, HTTP, API, SQL и связанные ошибки веб-приложений.',
    examId: 'stage-2-capstone',
    examTitle: 'Самостоятельное расследование веб-инцидента',
    requirements: {
      linux: { independent: 20 },
      networking: { theory: 30, guided: 24, independent: 15 },
      python: { theory: 35, guided: 30, independent: 18 },
      web: { theory: 28, guided: 22, independent: 12 },
      sql: { theory: 15, guided: 12 },
      soc: { independent: 18, production: 10 },
    },
  },
  {
    id: 4,
    title: 'Корпоративная инфраструктура',
    shortTitle: 'Enterprise',
    description: 'Active Directory, VPN, MFA, EDR, сегментация и корпоративные доступы.',
    examId: 'stage-3-capstone',
    examTitle: 'Компрометация подрядчика и движение по сети',
    requirements: {
      windows: { theory: 45, guided: 38, independent: 25 },
      powershell: { theory: 30, guided: 25, independent: 15 },
      activeDirectory: { theory: 35, guided: 30, independent: 18 },
      networking: { theory: 45, independent: 28 },
      siem: { theory: 35, guided: 30, production: 18 },
      securityEngineering: { theory: 25, guided: 20 },
    },
  },
  {
    id: 5,
    title: 'Самостоятельный специалист',
    shortTitle: 'Independent',
    description: 'Incident Response, форензика, охота за угрозами и работа с неполными данными.',
    examId: 'stage-4-capstone',
    examTitle: 'Многодневное расследование утечки',
    requirements: {
      incidentResponse: { theory: 50, guided: 45, independent: 35, production: 25 },
      forensics: { theory: 45, guided: 38, independent: 30 },
      threatHunting: { theory: 40, guided: 35, independent: 28 },
      soc: { independent: 40, production: 30 },
      communication: { independent: 35, production: 25 },
    },
  },
  {
    id: 6,
    title: 'Продвинутый offensive и defensive',
    shortTitle: 'Advanced',
    description: 'Облако, контейнеры, CI/CD, AppSec и противодействие активному противнику.',
    examId: 'stage-5-capstone',
    examTitle: 'Атака и защита одной инфраструктуры',
    requirements: {
      appsec: { theory: 50, guided: 42, independent: 35 },
      cloud: { theory: 45, guided: 38, independent: 28 },
      securityEngineering: { theory: 52, independent: 38, production: 25 },
      web: { independent: 45, production: 25 },
      operationalPlanning: { theory: 35, guided: 30 },
    },
  },
  {
    id: 7,
    title: 'Операции уровня Middle',
    shortTitle: 'Middle Ops',
    description: 'Полноценные инфраструктуры, команда, подготовка, активный SOC и последствия.',
    examId: 'stage-6-capstone',
    examTitle: 'Крупная операция без готовой последовательности',
    requirements: {
      operationalPlanning: { theory: 55, guided: 48, independent: 40, production: 25 },
      incidentResponse: { independent: 55, production: 42 },
      securityEngineering: { independent: 52, production: 38 },
      communication: { independent: 50, production: 42 },
    },
  },
  {
    id: 8,
    title: 'Финальная сложность',
    shortTitle: 'Expert Campaign',
    description: 'Банк, государственная платформа и противники, которые знают методы игрока.',
    examId: 'stage-7-capstone',
    examTitle: 'Банковская или государственная операция',
    requirements: {
      soc: { theory: 80, guided: 75, independent: 65, production: 55 },
      networking: { theory: 75, guided: 70, independent: 60, production: 45 },
      incidentResponse: { theory: 75, independent: 65, production: 55 },
      securityEngineering: { theory: 72, independent: 60, production: 48 },
      operationalPlanning: { theory: 70, independent: 60, production: 45 },
    },
  },
];

export const specializations: Array<{
  id: SpecializationId;
  title: string;
  description: string;
  skills: SimulationSkillId[];
}> = [
  { id: 'blue-team', title: 'Blue Team', description: 'SOC, SIEM, Detection, IR и Threat Hunting.', skills: ['soc', 'siem', 'incidentResponse', 'threatHunting', 'emailSecurity'] },
  { id: 'red-team', title: 'Red Team', description: 'Web, инфраструктура, анализ доступов и планирование атак в стендах.', skills: ['web', 'networking', 'activeDirectory', 'operationalPlanning'] },
  { id: 'dfir', title: 'DFIR', description: 'Диски, события, временные линии и расследования.', skills: ['forensics', 'incidentResponse', 'windows', 'linux'] },
  { id: 'security-engineering', title: 'Security Engineering', description: 'Архитектура, сегментация, доступы и мониторинг.', skills: ['securityEngineering', 'networking', 'cloud', 'activeDirectory'] },
  { id: 'appsec', title: 'AppSec', description: 'Код, API, зависимости, secrets и CI/CD.', skills: ['appsec', 'web', 'python', 'sql', 'mobileSecurity'] },
  { id: 'cloud-security', title: 'Cloud Security', description: 'Облачные роли, контейнеры, токены и журналы.', skills: ['cloud', 'securityEngineering', 'appsec', 'networking'] },
];

function storyExamComplete(stage: ProgressionStageId, progress: ProgressState) {
  if (stage === 1) return progress.clinicWrapupComplete;
  if (stage === 2) return progress.firstShiftComplete;
  const examId = progressionStages.find((item) => item.id === stage)?.examId;
  return Boolean(examId && progress.simulation.progression.passedExamIds.includes(examId));
}

export function trackRequirementMet(track: SkillTrackState, requirement: TrackRequirement) {
  return (Object.entries(requirement) as Array<[TrackKey, number]>).every(([key, target]) => track[key] >= target);
}

export function skillRequirementGaps(progress: ProgressState, requirements: SkillRequirementMap): ProgressionGap[] {
  return (Object.entries(requirements) as Array<[SimulationSkillId, TrackRequirement]>).flatMap(([skillId, requirement]) =>
    (Object.entries(requirement) as Array<[TrackKey, number]>).map(([track, required]) => {
      const current = progress.simulation.skills[skillId]?.[track] ?? 0;
      return {
        id: `${skillId}-${track}`,
        label: `${skillLabels[skillId]} · ${trackLabels[track]}`,
        current,
        required,
        complete: current >= required,
        kind: 'skill' as const,
      };
    }),
  );
}

export function getStageAccess(progress: ProgressState, stageId: ProgressionStageId) {
  if (stageId === 0) return { unlocked: true, gaps: [] as ProgressionGap[] };
  const definition = progressionStages.find((item) => item.id === stageId)!;
  const gaps = skillRequirementGaps(progress, definition.requirements);
  const examComplete = storyExamComplete(stageId, progress);
  gaps.push({
    id: definition.examId ?? `stage-${stageId}-exam`,
    label: definition.examTitle ?? 'Итоговая проверка',
    current: examComplete ? 1 : 0,
    required: 1,
    complete: examComplete,
    kind: stageId <= 2 ? 'story' : 'exam',
  });
  return { unlocked: gaps.every((gap) => gap.complete), gaps };
}

export function getCurrentStage(progress: ProgressState): ProgressionStageId {
  let stage: ProgressionStageId = 0;
  for (let next = 1; next <= 8; next += 1) {
    if (!getStageAccess(progress, next as ProgressionStageId).unlocked) break;
    stage = next as ProgressionStageId;
  }
  return stage;
}

export function getNextStage(progress: ProgressState) {
  const current = getCurrentStage(progress);
  if (current === 8) return null;
  const id = (current + 1) as ProgressionStageId;
  const definition = progressionStages.find((item) => item.id === id)!;
  return { definition, ...getStageAccess(progress, id) };
}

export function getSkillTotal(track: SkillTrackState) {
  return Math.round(track.theory * 0.2 + track.guided * 0.2 + track.independent * 0.3 + track.production * 0.3);
}

export function getJobAccess(progress: ProgressState, job: {
  storyOnly?: boolean;
  requiredProfessional: number;
  requiredStage?: ProgressionStageId;
  requiredTracks?: SkillRequirementMap;
}) {
  const reasons: string[] = [];
  if (job.storyOnly && !progress.jobAccepted) reasons.push('Доступно только через сюжет');
  if (progress.simulation.reputation.professional < job.requiredProfessional) reasons.push(`Профессиональная репутация ${job.requiredProfessional}`);
  if (job.requiredStage !== undefined && getCurrentStage(progress) < job.requiredStage) reasons.push(`Нужен этап ${job.requiredStage}`);
  skillRequirementGaps(progress, job.requiredTracks ?? {}).filter((gap) => !gap.complete).forEach((gap) => reasons.push(`${gap.label}: ${gap.current}/${gap.required}`));
  return { available: reasons.length === 0, reasons };
}

const contractRequirements: Record<ContractSkill, { stage: ProgressionStageId; tracks: SkillRequirementMap }> = {
  linux: { stage: 0, tracks: { linux: { guided: 6 } } },
  windows: { stage: 1, tracks: { windows: { guided: 12 }, powershell: { guided: 8 } } },
  networking: { stage: 1, tracks: { networking: { theory: 6, guided: 6 } } },
  python: { stage: 1, tracks: { python: { guided: 12 } } },
  soc: { stage: 1, tracks: { soc: { guided: 8 } } },
  web: { stage: 2, tracks: { web: { theory: 5 }, python: { guided: 12 } } },
  mobile: { stage: 2, tracks: { mobileSecurity: { theory: 8, guided: 8 }, networking: { guided: 10 } } },
  activeDirectory: { stage: 3, tracks: { activeDirectory: { theory: 15, guided: 15 }, windows: { guided: 25 }, powershell: { guided: 18 } } },
  email: { stage: 3, tracks: { emailSecurity: { theory: 15, guided: 15 }, soc: { guided: 25 }, networking: { guided: 20 } } },
  forensics: { stage: 3, tracks: { forensics: { theory: 20, guided: 18 }, incidentResponse: { guided: 24 }, windows: { guided: 25 } } },
  incidentResponse: { stage: 4, tracks: { incidentResponse: { theory: 30, guided: 28 }, siem: { guided: 24 }, soc: { independent: 18 } } },
  threatHunting: { stage: 4, tracks: { threatHunting: { theory: 20, guided: 18 }, detectionEngineering: { guided: 12 }, siem: { independent: 18 } } },
  cryptography: { stage: 4, tracks: { cryptography: { theory: 20, guided: 16 }, networking: { theory: 30 } } },
  malwareAnalysis: { stage: 4, tracks: { malwareAnalysis: { theory: 18, guided: 16 }, forensics: { guided: 25 } } },
};

const difficultyStage: Record<ContractDifficulty, number> = { STARTER: 0, STANDARD: 1, HARD: 2 };

export function getContractAccess(contract: GeneratedContract, progress: ProgressState) {
  const base = contractRequirements[contract.skill];
  const requiredStage = Math.min(8, base.stage + difficultyStage[contract.difficulty]) as ProgressionStageId;
  const reasons: string[] = [];
  const currentStage = getCurrentStage(progress);
  if (currentStage < requiredStage) reasons.push(`Нужен этап ${requiredStage}`);
  skillRequirementGaps(progress, base.tracks).filter((gap) => !gap.complete).forEach((gap) => reasons.push(`${gap.label}: ${gap.current}/${gap.required}`));
  return { available: reasons.length === 0, reasons, requiredStage };
}
