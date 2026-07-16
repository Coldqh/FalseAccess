import type { LucideIcon } from 'lucide-react';
import type { SimulationState } from './simulation/types';

export type AppId = 'life' | 'city' | 'career' | 'missions' | 'contracts' | 'terminal' | 'code' | 'mail' | 'messenger' | 'browser' | 'siem' | 'interview' | 'firstshift' | 'routecase' | 'windowscase' | 'linuxcase' | 'networkcase' | 'webcase' | 'skills' | 'notes' | 'settings';

export interface AppDefinition {
  id: AppId;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  width: number;
  height: number;
  accent: string;
}

export interface WindowState {
  id: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

export interface Objective {
  id: string;
  label: string;
  hint: string;
  complete: boolean;
}

export type ContractSkill = 'linux' | 'windows' | 'networking' | 'python' | 'soc' | 'web';
export type ContractDifficulty = 'STARTER' | 'STANDARD' | 'HARD';
export type ContractRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ContractFile {
  name: string;
  content: string;
}

export interface ContractQuestion {
  id: string;
  label: string;
  placeholder: string;
  answers: string[];
}

export interface GeneratedContract {
  id: string;
  seed: number;
  type: string;
  title: string;
  client: string;
  factionId: string;
  factionName: string;
  skill: ContractSkill;
  difficulty: ContractDifficulty;
  pay: number;
  summary: string;
  constraint: string;
  files: ContractFile[];
  questions: ContractQuestion[];
  hint: string;
  starterCode?: string;
  expectedOutput?: string;
  postedDay?: number;
  deadlineDay?: number;
  durationSlots?: number;
  risk?: ContractRisk;
  acceptedDay?: number;
}

export interface CompletedContract {
  id: string;
  title: string;
  factionId: string;
  skill?: ContractSkill;
  pay: number;
  completedAt: string;
  clean: boolean;
  completedDay?: number;
  deadlineDay?: number;
  late?: boolean;
}

export interface ProgressState {
  booted: boolean;
  onboardingDone: boolean;
  clinicIntroComplete: boolean;
  clinicWrapupComplete: boolean;
  acknowledgedTransitions: string[];
  reportSelections: Record<string, string>;
  academyLessons: string[];
  terminalObjectives: string[];
  pythonLessonStep: number;
  pythonComplete: boolean;
  alertReviewed: boolean;
  reportSubmitted: boolean;
  interviewComplete: boolean;
  interviewScore: number;
  jobOfferUnlocked: boolean;
  jobAccepted: boolean;
  firstShiftComplete: boolean;
  firstShiftMistakes: number;
  firstShiftStage: number;
  phishingComplete: boolean;
  powershellComplete: boolean;
  dnsComplete: boolean;
  shiftReportChoice: 'full' | 'soft' | '';
  criminalContactUnlocked: boolean;
  criminalContactResponse: 'interested' | 'declined' | '';
  routeCaseAccepted: boolean;
  routeCaseStage: number;
  routeCaseTerminalObjectives: string[];
  routeCaseCode: string;
  routeCaseCodeStep: number;
  routeCaseBrowserAnswers: Record<string, string>;
  routeCaseFindingSelections: Record<string, string>;
  routeCaseReportSelections: Record<string, string>;
  routeCaseChoice: 'full' | 'safe' | 'lie' | 'refuse' | 'owner' | 'anna' | '';
  routeCaseComplete: boolean;
  windowsCaseStage: number;
  windowsCaseObjectives: string[];
  windowsCaseProcessAnswers: Record<string, string>;
  windowsCaseScript: string;
  windowsCaseScriptStep: number;
  windowsCaseIndependentObjectives: string[];
  windowsCaseIndependentAnswers: Record<string, string>;
  windowsCaseFindingSelections: Record<string, string>;
  windowsCaseReportSelections: Record<string, string>;
  windowsCaseHintUses: number;
  windowsCaseComplete: boolean;
  linuxCaseStage: number;
  linuxCaseObjectives: string[];
  linuxCaseArchitectureAnswers: Record<string, string>;
  linuxCaseScript: string;
  linuxCaseScriptStep: number;
  linuxCaseContainmentSelections: Record<string, string>;
  linuxCaseIndependentObjectives: string[];
  linuxCaseIndependentAnswers: Record<string, string>;
  linuxCaseFindingSelections: Record<string, string>;
  linuxCaseReportSelections: Record<string, string>;
  linuxCaseHintUses: number;
  linuxCaseComplete: boolean;
  networkCaseStage: number;
  networkCaseObjectives: string[];
  networkCaseFoundationAnswers: Record<string, string>;
  networkCaseCaptureObjectives: string[];
  networkCaseProtocolAnswers: Record<string, string>;
  networkCaseContainmentSelections: Record<string, string>;
  networkCaseIndependentObjectives: string[];
  networkCaseIndependentAnswers: Record<string, string>;
  networkCaseFindingSelections: Record<string, string>;
  networkCaseReportSelections: Record<string, string>;
  networkCaseHintUses: number;
  networkCaseComplete: boolean;
  webCaseStage: number;
  webCaseFoundationAnswers: Record<string, string>;
  webCaseHttpObjectives: string[];
  webCaseSessionAnswers: Record<string, string>;
  webCasePatch: string;
  webCaseCodeAnswers: Record<string, string>;
  webCaseSqlObjectives: string[];
  webCaseIndependentObjectives: string[];
  webCaseIndependentAnswers: Record<string, string>;
  webCaseFindingSelections: Record<string, string>;
  webCaseReportSelections: Record<string, string>;
  webCaseHintUses: number;
  webCaseComplete: boolean;
  readMail: string[];
  readMessages: string[];
  notes: string;
  balance: number;
  contractOffers: GeneratedContract[];
  activeContract: GeneratedContract | null;
  completedContracts: CompletedContract[];
  factionRep: Record<string, number>;
  contractRefreshes: number;
  simulation: SimulationState;
}

export interface ShellResult {
  lines: string[];
  clear?: boolean;
  cwd?: string;
  objective?: string;
}
