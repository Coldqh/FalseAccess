import type { LucideIcon } from 'lucide-react';

export type AppId = 'missions' | 'contracts' | 'terminal' | 'code' | 'mail' | 'messenger' | 'browser' | 'siem' | 'skills' | 'notes';

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

export type ContractSkill = 'linux' | 'networking' | 'python' | 'soc' | 'web';
export type ContractDifficulty = 'STARTER' | 'STANDARD' | 'HARD';

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
}

export interface CompletedContract {
  id: string;
  title: string;
  factionId: string;
  skill?: ContractSkill;
  pay: number;
  completedAt: string;
  clean: boolean;
}

export interface ProgressState {
  booted: boolean;
  onboardingDone: boolean;
  terminalObjectives: string[];
  pythonComplete: boolean;
  alertReviewed: boolean;
  reportSubmitted: boolean;
  jobOfferUnlocked: boolean;
  readMail: string[];
  readMessages: string[];
  notes: string;
  balance: number;
  contractOffers: GeneratedContract[];
  activeContract: GeneratedContract | null;
  completedContracts: CompletedContract[];
  factionRep: Record<string, number>;
  contractRefreshes: number;
}

export interface ShellResult {
  lines: string[];
  clear?: boolean;
  cwd?: string;
  objective?: string;
}
