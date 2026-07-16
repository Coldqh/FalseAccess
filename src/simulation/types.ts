export type DayPeriod = 'morning' | 'workday' | 'evening' | 'night';
export type FoodPlanId = 'economy' | 'normal' | 'balanced';
export type CareerStatus = 'unemployed' | 'employed';
export type SimulationEventType = 'time' | 'expense' | 'income' | 'housing' | 'career' | 'risk' | 'purchase';

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
  | 'linux'
  | 'networking'
  | 'python'
  | 'soc'
  | 'windows'
  | 'web'
  | 'forensics'
  | 'communication';

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
  world: WorldState;
  events: SimulationEvent[];
  settledThroughDay: number;
}
