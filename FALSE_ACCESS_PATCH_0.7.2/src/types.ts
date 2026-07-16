import type { LucideIcon } from 'lucide-react';
import type { SimulationState } from './simulation/types';

export type AppId = 'life' | 'city' | 'career' | 'missions' | 'contracts' | 'terminal' | 'code' | 'mail' | 'messenger' | 'browser' | 'tor' | 'siem' | 'interview' | 'firstshift' | 'routecase' | 'windowscase' | 'linuxcase' | 'networkcase' | 'webcase' | 'mobilecase' | 'adcase' | 'mailcase' | 'skills' | 'notes' | 'settings';

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

export type ContractSkill = 'linux' | 'windows' | 'networking' | 'python' | 'soc' | 'web' | 'mobile' | 'activeDirectory' | 'email';
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
  mobileCaseStage: number;
  mobileCaseFoundationAnswers: Record<string, string>;
  mobileCaseObjectives: string[];
  mobileCaseSessionAnswers: Record<string, string>;
  mobileCaseBackupObjectives: string[];
  mobileCaseTokenAnswers: Record<string, string>;
  mobileCasePatch: string;
  mobileCaseCodeAnswers: Record<string, string>;
  mobileCaseContainmentSelections: Record<string, string>;
  mobileCaseIndependentObjectives: string[];
  mobileCaseIndependentAnswers: Record<string, string>;
  mobileCaseFindingSelections: Record<string, string>;
  mobileCaseReportSelections: Record<string, string>;
  mobileCaseHintUses: number;
  mobileCaseComplete: boolean;
  adCaseStage: number;
  adCaseFoundationAnswers: Record<string, string>;
  adCaseIdentityObjectives: string[];
  adCaseIdentityAnswers: Record<string, string>;
  adCaseKerberosObjectives: string[];
  adCaseKerberosAnswers: Record<string, string>;
  adCaseGpoObjectives: string[];
  adCasePatch: string;
  adCaseCodeAnswers: Record<string, string>;
  adCaseContainmentSelections: Record<string, string>;
  adCaseIndependentObjectives: string[];
  adCaseIndependentAnswers: Record<string, string>;
  adCaseFindingSelections: Record<string, string>;
  adCaseReportSelections: Record<string, string>;
  adCaseHintUses: number;
  adCaseComplete: boolean;
  mailCaseStage: number;
  mailCaseFoundationAnswers: Record<string, string>;
  mailCaseHeaderObjectives: string[];
  mailCaseHeaderAnswers: Record<string, string>;
  mailCaseAttachmentObjectives: string[];
  mailCaseAttachmentAnswers: Record<string, string>;
  mailCaseGatewayObjectives: string[];
  mailCasePolicy: string;
  mailCasePolicyAnswers: Record<string, string>;
  mailCaseContainmentSelections: Record<string, string>;
  mailCaseIndependentObjectives: string[];
  mailCaseIndependentAnswers: Record<string, string>;
  mailCaseFindingSelections: Record<string, string>;
  mailCaseReportSelections: Record<string, string>;
  mailCaseHintUses: number;
  mailCaseComplete: boolean;
  darknetStage: number;
  darknetConnected: boolean;
  darknetAlias: string;
  darknetIdentityCreated: boolean;
  darknetVisited: string[];
  darknetBookmarks: string[];
  darknetMirrorVerified: boolean;
  darknetInboxRead: string[];
  darknetChoice: 'accept' | 'ignore' | '';
  darknetReputation: number;
  darknetComplete: boolean;
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
