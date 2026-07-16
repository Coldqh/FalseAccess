export type DayPeriod = 'morning' | 'workday' | 'evening' | 'night';
export type TravelModeId = 'walk' | 'bus' | 'taxi';
export type FoodPlanId = 'economy' | 'normal' | 'balanced';
export type CareerStatus = 'unemployed' | 'employed';
export type SimulationEventType = 'time' | 'expense' | 'income' | 'housing' | 'career' | 'risk' | 'purchase' | 'progression' | 'daily' | 'contract';
export type ProgressionStageId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type SpecializationId = 'blue-team' | 'red-team' | 'dfir' | 'security-engineering' | 'appsec' | 'cloud-security';

export type DailyActivityId =
  | 'free'
  | 'sleep'
  | 'work'
  | 'maintenance'
  | 'contract'
  | 'story'
  | 'study-linux'
  | 'study-networking'
  | 'study-python'
  | 'study-soc'
  | 'study-windows'
  | 'study-web';

export interface GameClock {
  day: number;
  dateIso: string;
  period: DayPeriod;
  elapsedSlots: number;
}

export interface NeedsState {
  energy: number;
  stress: number;
  health: number;
  focus: number;
}

export interface HousingState {
  currentHousingId: string;
  nextRentDay: number;
  movedAtDay: number;
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
  condition: number;
}

export interface CareerState {
  status: CareerStatus;
  jobId: string;
  employerId: string;
  title: string;
  monthlySalary: number;
  nextPayDay: number;
  shiftsWorked: number;
  performance: number;
  warnings: number;
  storyJobProcessed: boolean;
  storyShiftProcessed: boolean;
}

export interface ReputationState {
  professional: number;
  reliability: number;
  underground: number;
  notoriety: number;
}

export interface HeatState {
  digitalTrace: number;
  corporateSuspicion: number;
  lawAttention: number;
  criminalExposure: number;
  wantedLevel: number;
}

export interface SkillTrackState {
  theory: number;
  guided: number;
  independent: number;
  production: number;
}

export type SimulationSkillId =
  | 'computer'
  | 'linux'
  | 'bash'
  | 'windows'
  | 'powershell'
  | 'networking'
  | 'python'
  | 'web'
  | 'sql'
  | 'soc'
  | 'siem'
  | 'incidentResponse'
  | 'forensics'
  | 'threatHunting'
  | 'securityEngineering'
  | 'appsec'
  | 'mobileSecurity'
  | 'cloud'
  | 'activeDirectory'
  | 'communication'
  | 'operationalPlanning';

export interface ProgressionState {
  passedExamIds: string[];
  selectedSpecializations: SpecializationId[];
}

export interface DailyEventState {
  id: string;
  day: number;
  resolvedChoiceId: string;
}

export interface DailyLoopState {
  planDay: number;
  plan: Partial<Record<DayPeriod, DailyActivityId>>;
  completedKeys: string[];
  missedShifts: number;
  lastContractBoardDay: number;
  event: DailyEventState | null;
  resolvedEventIds: string[];
}

export interface SimulationEvent {
  id: string;
  day: number;
  period: DayPeriod;
  type: SimulationEventType;
  title: string;
  text: string;
  amount?: number;
}

export interface WorldState {
  currentCityId: string;
  unlockedCityIds: string[];
  currentLocationId: string;
  visitedLocationIds: string[];
  travelMinutesToday: number;
  travelDay: number;
  citySceneIds: string[];
}

export interface SimulationState {
  schemaVersion: number;
  clock: GameClock;
  needs: NeedsState;
  foodPlanId: FoodPlanId;
  housing: HousingState;
  inventory: InventoryEntry[];
  career: CareerState;
  reputation: ReputationState;
  heat: HeatState;
  skills: Record<SimulationSkillId, SkillTrackState>;
  progression: ProgressionState;
  daily: DailyLoopState;
  world: WorldState;
  events: SimulationEvent[];
  settledThroughDay: number;
}
