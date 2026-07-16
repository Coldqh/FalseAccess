import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CompletedContract, GeneratedContract, ProgressState } from '../types';
import type { DailyActivityId, DayPeriod, FoodPlanId, SimulationSkillId, SpecializationId, TravelModeId } from '../simulation/types';
import type { RouteCaseChoice } from '../missions/route01';
import { createInitialProgress } from '../data/content';
import { generateContractOffers } from '../data/contracts';
import { jobsCatalog, storeItems } from '../simulation/catalog';
import { getContractAccess, getJobAccess } from '../simulation/progression';
import {
  advanceSlots, buyStoreItem, calculateWantedLevel, completeCityScene as completeCitySceneState, markContractBoardDay, moveToHousing,
  normalizeSimulation, performDailyActivity, quitCurrentJob, recordSimulationEvent,
  reduceDigitalRisk, resolveDailyEvent, restUntilMorning, setPlannedActivity,
  syncStoryProgress, takeJob, travelToCityLocation, workCompanyShift,
} from '../simulation/engine';

interface ProgressContextValue {
  progress: ProgressState;
  completeAcademyLesson: (id: string) => void;
  completeTerminalObjective: (id: string) => void;
  setFlag: <K extends keyof ProgressState>(key: K, value: ProgressState[K]) => void;
  markMailRead: (id: string) => void;
  markMessageRead: (id: string) => void;
  acknowledgeTransition: (id: string) => void;
  completeInterview: (score: number) => void;
  completeFirstShift: (mistakes: number) => void;
  acceptContract: (contract: GeneratedContract) => void;
  abandonContract: () => void;
  completeContract: (clean: boolean) => void;
  refreshContracts: () => void;
  advanceTime: () => void;
  rest: () => void;
  setFoodPlan: (id: FoodPlanId) => void;
  buyItem: (id: string) => void;
  changeHousing: (id: string) => void;
  workShift: () => void;
  acceptJob: (id: string) => void;
  quitJob: () => void;
  secureDevices: () => void;
  setDayPlan: (period: DayPeriod, activityId: DailyActivityId) => void;
  performActivity: (activityId: DailyActivityId) => void;
  resolveDayEvent: (choiceId: string) => void;
  travelTo: (locationId: string, modeId: TravelModeId) => void;
  completeCityScene: (sceneId: string) => void;
  completeRouteCase: (choice: RouteCaseChoice) => void;
  completeWindowsCase: () => void;
  completeLinuxCase: () => void;
  toggleSpecialization: (id: SpecializationId) => void;
  completeProgressionExam: (id: string) => void;
  saveNow: () => string;
  importProgress: (value: unknown) => boolean;
  resetProgress: () => void;
}

const STORAGE_KEY = 'false-access-progress-v10';
const SAVE_TIME_KEY = 'false-access-last-saved-at';
const ProgressContext = createContext<ProgressContextValue | null>(null);

function normalizeContract(contract: GeneratedContract, day: number): GeneratedContract {
  const difficulty = contract.difficulty ?? 'STANDARD';
  return {
    ...contract,
    postedDay: Number.isFinite(Number(contract.postedDay)) ? Number(contract.postedDay) : day,
    deadlineDay: Number.isFinite(Number(contract.deadlineDay)) ? Number(contract.deadlineDay) : day + (difficulty === 'HARD' ? 3 : 2),
    durationSlots: Number.isFinite(Number(contract.durationSlots)) ? Math.max(1, Number(contract.durationSlots)) : difficulty === 'HARD' ? 2 : 1,
    risk: contract.risk ?? (contract.factionId === 'north' ? 'HIGH' : difficulty === 'HARD' ? 'MEDIUM' : 'LOW'),
    acceptedDay: contract.acceptedDay === undefined ? undefined : Number(contract.acceptedDay),
  };
}

function normalizeProgress(value: unknown, legacy = false): ProgressState | null {
  if (!value || typeof value !== 'object') return null;
  const parsed = value as Partial<ProgressState>;
  const fallback = createInitialProgress();
  const terminalObjectives = Array.isArray(parsed.terminalObjectives) ? parsed.terminalObjectives.filter((item): item is string => typeof item === 'string') : [];
  const pythonComplete = Boolean(parsed.pythonComplete);
  const alertReviewed = Boolean(parsed.alertReviewed);
  const reportSubmitted = Boolean(parsed.reportSubmitted);
  const progressedIntoCase = terminalObjectives.length > 0 || pythonComplete || alertReviewed || reportSubmitted;
  const legacyShortShift = Boolean(parsed.firstShiftComplete) && parsed.firstShiftStage === undefined;
  const jobAccepted = legacy ? false : Boolean(parsed.jobAccepted);
  const firstShiftComplete = legacy || legacyShortShift ? false : Boolean(parsed.firstShiftComplete);
  const simulation = normalizeSimulation(parsed.simulation, jobAccepted, firstShiftComplete);
  const offers = Array.isArray(parsed.contractOffers) ? parsed.contractOffers.map((item) => normalizeContract(item, simulation.clock.day)) : [];
  const activeContract = parsed.activeContract ? normalizeContract(parsed.activeContract, simulation.clock.day) : null;

  return {
    ...fallback,
    ...parsed,
    booted: Boolean(parsed.booted),
    onboardingDone: Boolean(parsed.onboardingDone),
    clinicIntroComplete: Boolean(parsed.clinicIntroComplete) || progressedIntoCase,
    clinicWrapupComplete: Boolean(parsed.clinicWrapupComplete),
    acknowledgedTransitions: Array.isArray(parsed.acknowledgedTransitions) ? parsed.acknowledgedTransitions.filter((item): item is string => typeof item === 'string') : [],
    reportSelections: parsed.reportSelections && typeof parsed.reportSelections === 'object' ? parsed.reportSelections as Record<string, string> : {},
    interviewComplete: legacy ? false : Boolean(parsed.interviewComplete),
    interviewScore: legacy ? 0 : Number(parsed.interviewScore ?? 0),
    jobOfferUnlocked: legacy ? false : Boolean(parsed.jobOfferUnlocked),
    jobAccepted,
    firstShiftComplete,
    firstShiftMistakes: legacy || legacyShortShift ? 0 : Number(parsed.firstShiftMistakes ?? 0),
    firstShiftStage: legacy || legacyShortShift ? 0 : (firstShiftComplete ? 5 : Number(parsed.firstShiftStage ?? 0)),
    phishingComplete: legacy || legacyShortShift ? false : Boolean(parsed.phishingComplete),
    powershellComplete: legacy || legacyShortShift ? false : Boolean(parsed.powershellComplete),
    dnsComplete: legacy || legacyShortShift ? false : Boolean(parsed.dnsComplete),
    shiftReportChoice: legacyShortShift ? '' : (parsed.shiftReportChoice === 'full' || parsed.shiftReportChoice === 'soft' ? parsed.shiftReportChoice : ''),
    criminalContactUnlocked: legacy || legacyShortShift ? false : (Boolean(parsed.criminalContactUnlocked) || firstShiftComplete),
    criminalContactResponse: legacyShortShift ? '' : (parsed.criminalContactResponse === 'interested' || parsed.criminalContactResponse === 'declined' ? parsed.criminalContactResponse : ''),
    routeCaseAccepted: Boolean(parsed.routeCaseAccepted) || simulation.world.citySceneIds.includes('igor-cafe'),
    routeCaseStage: Number.isFinite(Number(parsed.routeCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.routeCaseStage))) : 0,
    routeCaseTerminalObjectives: Array.isArray(parsed.routeCaseTerminalObjectives) ? parsed.routeCaseTerminalObjectives.filter((item): item is string => typeof item === 'string') : [],
    routeCaseCode: typeof parsed.routeCaseCode === 'string' ? parsed.routeCaseCode : '',
    routeCaseCodeStep: Number.isFinite(Number(parsed.routeCaseCodeStep)) ? Math.max(0, Number(parsed.routeCaseCodeStep)) : 0,
    routeCaseBrowserAnswers: parsed.routeCaseBrowserAnswers && typeof parsed.routeCaseBrowserAnswers === 'object' ? parsed.routeCaseBrowserAnswers as Record<string, string> : {},
    routeCaseFindingSelections: parsed.routeCaseFindingSelections && typeof parsed.routeCaseFindingSelections === 'object' ? parsed.routeCaseFindingSelections as Record<string, string> : {},
    routeCaseReportSelections: parsed.routeCaseReportSelections && typeof parsed.routeCaseReportSelections === 'object' ? parsed.routeCaseReportSelections as Record<string, string> : {},
    routeCaseChoice: ['full', 'safe', 'lie', 'refuse', 'owner', 'anna'].includes(String(parsed.routeCaseChoice)) ? parsed.routeCaseChoice as ProgressState['routeCaseChoice'] : '',
    routeCaseComplete: Boolean(parsed.routeCaseComplete),
    windowsCaseStage: Number.isFinite(Number(parsed.windowsCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.windowsCaseStage))) : 0,
    windowsCaseObjectives: Array.isArray(parsed.windowsCaseObjectives) ? parsed.windowsCaseObjectives.filter((item): item is string => typeof item === 'string') : [],
    windowsCaseProcessAnswers: parsed.windowsCaseProcessAnswers && typeof parsed.windowsCaseProcessAnswers === 'object' ? parsed.windowsCaseProcessAnswers as Record<string, string> : {},
    windowsCaseScript: typeof parsed.windowsCaseScript === 'string' ? parsed.windowsCaseScript : '',
    windowsCaseScriptStep: Number.isFinite(Number(parsed.windowsCaseScriptStep)) ? Math.max(0, Number(parsed.windowsCaseScriptStep)) : 0,
    windowsCaseIndependentObjectives: Array.isArray(parsed.windowsCaseIndependentObjectives) ? parsed.windowsCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    windowsCaseIndependentAnswers: parsed.windowsCaseIndependentAnswers && typeof parsed.windowsCaseIndependentAnswers === 'object' ? parsed.windowsCaseIndependentAnswers as Record<string, string> : {},
    windowsCaseFindingSelections: parsed.windowsCaseFindingSelections && typeof parsed.windowsCaseFindingSelections === 'object' ? parsed.windowsCaseFindingSelections as Record<string, string> : {},
    windowsCaseReportSelections: parsed.windowsCaseReportSelections && typeof parsed.windowsCaseReportSelections === 'object' ? parsed.windowsCaseReportSelections as Record<string, string> : {},
    windowsCaseHintUses: Number.isFinite(Number(parsed.windowsCaseHintUses)) ? Math.max(0, Number(parsed.windowsCaseHintUses)) : 0,
    windowsCaseComplete: Boolean(parsed.windowsCaseComplete),
    linuxCaseStage: Number.isFinite(Number(parsed.linuxCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.linuxCaseStage))) : 0,
    linuxCaseObjectives: Array.isArray(parsed.linuxCaseObjectives) ? parsed.linuxCaseObjectives.filter((item): item is string => typeof item === 'string') : [],
    linuxCaseArchitectureAnswers: parsed.linuxCaseArchitectureAnswers && typeof parsed.linuxCaseArchitectureAnswers === 'object' ? parsed.linuxCaseArchitectureAnswers as Record<string, string> : {},
    linuxCaseScript: typeof parsed.linuxCaseScript === 'string' ? parsed.linuxCaseScript : '',
    linuxCaseScriptStep: Number.isFinite(Number(parsed.linuxCaseScriptStep)) ? Math.max(0, Number(parsed.linuxCaseScriptStep)) : 0,
    linuxCaseContainmentSelections: parsed.linuxCaseContainmentSelections && typeof parsed.linuxCaseContainmentSelections === 'object' ? parsed.linuxCaseContainmentSelections as Record<string, string> : {},
    linuxCaseIndependentObjectives: Array.isArray(parsed.linuxCaseIndependentObjectives) ? parsed.linuxCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    linuxCaseIndependentAnswers: parsed.linuxCaseIndependentAnswers && typeof parsed.linuxCaseIndependentAnswers === 'object' ? parsed.linuxCaseIndependentAnswers as Record<string, string> : {},
    linuxCaseFindingSelections: parsed.linuxCaseFindingSelections && typeof parsed.linuxCaseFindingSelections === 'object' ? parsed.linuxCaseFindingSelections as Record<string, string> : {},
    linuxCaseReportSelections: parsed.linuxCaseReportSelections && typeof parsed.linuxCaseReportSelections === 'object' ? parsed.linuxCaseReportSelections as Record<string, string> : {},
    linuxCaseHintUses: Number.isFinite(Number(parsed.linuxCaseHintUses)) ? Math.max(0, Number(parsed.linuxCaseHintUses)) : 0,
    linuxCaseComplete: Boolean(parsed.linuxCaseComplete),
    pythonLessonStep: Number(parsed.pythonLessonStep ?? 0),
    academyLessons: Array.isArray(parsed.academyLessons) ? parsed.academyLessons.filter((item): item is string => typeof item === 'string') : [],
    terminalObjectives,
    pythonComplete,
    alertReviewed,
    reportSubmitted,
    readMail: Array.isArray(parsed.readMail) ? parsed.readMail.filter((item): item is string => typeof item === 'string') : [],
    readMessages: Array.isArray(parsed.readMessages) ? parsed.readMessages.filter((item): item is string => typeof item === 'string') : [],
    contractOffers: offers,
    activeContract,
    completedContracts: Array.isArray(parsed.completedContracts) ? parsed.completedContracts : [],
    factionRep: { ...fallback.factionRep, ...(parsed.factionRep ?? {}) },
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    balance: Number.isFinite(Number(parsed.balance)) ? Number(parsed.balance) : fallback.balance,
    contractRefreshes: Number.isFinite(Number(parsed.contractRefreshes)) ? Number(parsed.contractRefreshes) : 0,
    simulation,
  };
}

function loadProgress(): ProgressState {
  const fallback = createInitialProgress();
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const v9Raw = localStorage.getItem('false-access-progress-v9');
    const v8Raw = localStorage.getItem('false-access-progress-v8');
    const v7Raw = localStorage.getItem('false-access-progress-v7');
    const v6Raw = localStorage.getItem('false-access-progress-v6');
    const v5Raw = localStorage.getItem('false-access-progress-v5');
    const v4Raw = localStorage.getItem('false-access-progress-v4');
    const v3Raw = localStorage.getItem('false-access-progress-v3');
    const raw = currentRaw
      ?? v9Raw
      ?? v8Raw
      ?? v7Raw
      ?? v6Raw
      ?? v5Raw
      ?? v4Raw
      ?? v3Raw
      ?? localStorage.getItem('false-access-progress-v2')
      ?? localStorage.getItem('false-access-progress-v1');
    if (!raw) return fallback;
    return normalizeProgress(JSON.parse(raw), !currentRaw && !v9Raw && !v8Raw && !v7Raw && !v6Raw && !v5Raw && !v4Raw && !v3Raw) ?? fallback;
  } catch {
    return fallback;
  }
}

function persist(progress: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  const timestamp = new Date().toISOString();
  localStorage.setItem(SAVE_TIME_KEY, timestamp);
  return timestamp;
}

function addContractSkill(progress: ProgressState, skill: SimulationSkillId, clean: boolean) {
  const current = progress.simulation.skills[skill];
  return {
    ...progress.simulation.skills,
    [skill]: {
      ...current,
      independent: Math.min(100, current.independent + (clean ? 3 : 1)),
      production: Math.min(100, current.production + (clean ? 2 : 1)),
    },
  };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => { persist(progress); }, [progress]);

  useEffect(() => {
    if (progress.interviewComplete && !progress.jobOfferUnlocked) setProgress((current) => ({ ...current, jobOfferUnlocked: true }));
  }, [progress.interviewComplete, progress.jobOfferUnlocked]);

  useEffect(() => {
    const day = progress.simulation.clock.day;
    const boardDay = progress.simulation.daily.lastContractBoardDay;
    if (boardDay >= day && progress.contractOffers.length > 0) return;
    setProgress((current) => {
      const currentDay = current.simulation.clock.day;
      if (current.simulation.daily.lastContractBoardDay >= currentDay && current.contractOffers.length > 0) return current;
      const offers = generateContractOffers(current, current.contractRefreshes + currentDay * 13);
      return {
        ...current,
        contractOffers: offers,
        simulation: markContractBoardDay(current.simulation, currentDay),
      };
    });
  }, [progress.simulation.clock.day, progress.simulation.daily.lastContractBoardDay, progress.contractOffers.length, progress.contractRefreshes]);

  useEffect(() => {
    const synced = syncStoryProgress(progress.simulation, {
      jobAccepted: progress.jobAccepted,
      firstShiftComplete: progress.firstShiftComplete,
      terminalObjectives: progress.terminalObjectives,
      pythonComplete: progress.pythonComplete,
      alertReviewed: progress.alertReviewed,
      interviewScore: progress.interviewScore,
      phishingComplete: progress.phishingComplete,
      powershellComplete: progress.powershellComplete,
      dnsComplete: progress.dnsComplete,
    });
    if (JSON.stringify(synced) !== JSON.stringify(progress.simulation)) setProgress((current) => ({ ...current, simulation: synced }));
  }, [progress.jobAccepted, progress.firstShiftComplete, progress.terminalObjectives, progress.pythonComplete, progress.alertReviewed, progress.interviewScore, progress.phishingComplete, progress.powershellComplete, progress.dnsComplete, progress.simulation]);

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
    completeAcademyLesson: (id) => setProgress((current) => current.academyLessons.includes(id) ? current : { ...current, academyLessons: [...current.academyLessons, id] }),
    completeTerminalObjective: (id) => setProgress((current) => current.terminalObjectives.includes(id) ? current : { ...current, terminalObjectives: [...current.terminalObjectives, id], contractOffers: [] }),
    setFlag: (key, value) => setProgress((current) => ({
      ...current,
      [key]: value,
      ...(key === 'pythonComplete' || key === 'alertReviewed' || key === 'reportSubmitted' ? { contractOffers: [] } : {}),
    })),
    markMailRead: (id) => setProgress((current) => current.readMail.includes(id) ? current : { ...current, readMail: [...current.readMail, id] }),
    markMessageRead: (id) => setProgress((current) => current.readMessages.includes(id) ? current : { ...current, readMessages: [...current.readMessages, id] }),
    acknowledgeTransition: (id) => setProgress((current) => current.acknowledgedTransitions.includes(id) ? current : { ...current, acknowledgedTransitions: [...current.acknowledgedTransitions, id] }),
    completeInterview: (score) => setProgress((current) => {
      const result = advanceSlots(current.simulation, current.balance, 1, 'study');
      return {
        ...current,
        interviewComplete: true,
        interviewScore: Math.max(current.interviewScore, score),
        jobOfferUnlocked: true,
        balance: result.balance,
        simulation: {
          ...result.simulation,
          reputation: { ...result.simulation.reputation, professional: Math.min(100, result.simulation.reputation.professional + Math.max(1, score)) },
          skills: {
            ...result.simulation.skills,
            communication: {
              ...result.simulation.skills.communication,
              guided: Math.min(100, result.simulation.skills.communication.guided + score * 2),
            },
          },
        },
      };
    }),
    completeFirstShift: (mistakes) => setProgress((current) => ({
      ...current,
      firstShiftComplete: true,
      firstShiftStage: 5,
      firstShiftMistakes: mistakes,
      criminalContactUnlocked: true,
      balance: current.balance + Math.max(500, 1200 - mistakes * 150),
      factionRep: { ...current.factionRep, sfera: (current.factionRep.sfera ?? 0) + Math.max(1, 3 - mistakes) },
      contractOffers: [],
    })),
    acceptContract: (contract) => setProgress((current) => getContractAccess(contract, current).available ? ({
      ...current,
      activeContract: { ...normalizeContract(contract, current.simulation.clock.day), acceptedDay: current.simulation.clock.day },
      contractOffers: current.contractOffers.filter((item) => item.id !== contract.id),
      simulation: recordSimulationEvent(current.simulation, 'contract', 'Контракт принят', `${contract.title}. Срок: день ${contract.deadlineDay ?? current.simulation.clock.day + 2}.`),
    }) : current),
    abandonContract: () => setProgress((current) => {
      if (!current.activeContract) return current;
      const factionId = current.activeContract.factionId;
      return {
        ...current,
        activeContract: null,
        factionRep: { ...current.factionRep, [factionId]: Math.max(0, (current.factionRep[factionId] ?? 0) - 1) },
        simulation: recordSimulationEvent({
          ...current.simulation,
          reputation: { ...current.simulation.reputation, reliability: Math.max(0, current.simulation.reputation.reliability - 2) },
        }, 'contract', 'Контракт отменён', 'Заказчик запомнил отказ после принятия.'),
      };
    }),
    completeContract: (clean) => setProgress((current) => {
      const contract = current.activeContract;
      if (!contract) return current;
      const duration = contract.durationSlots ?? 1;
      const advanced = advanceSlots(current.simulation, current.balance, duration, 'contract');
      const deadline = contract.deadlineDay ?? advanced.simulation.clock.day;
      const late = advanced.simulation.clock.day > deadline;
      const actualPay = late ? Math.round(contract.pay * 0.5 / 100) * 100 : contract.pay;
      const record: CompletedContract = {
        id: contract.id,
        title: contract.title,
        factionId: contract.factionId,
        skill: contract.skill,
        pay: actualPay,
        completedAt: new Date().toISOString(),
        clean,
        completedDay: advanced.simulation.clock.day,
        deadlineDay: deadline,
        late,
      };
      const underground = contract.factionId === 'north' || contract.factionId === 'line';
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: Math.min(100, advanced.simulation.heat.digitalTrace + (clean ? 1 : 5)),
        criminalExposure: Math.min(100, advanced.simulation.heat.criminalExposure + (underground ? 3 : 0)),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          reliability: Math.max(0, Math.min(100, advanced.simulation.reputation.reliability + (late ? -2 : clean ? 2 : 1))),
          underground: Math.min(100, advanced.simulation.reputation.underground + (underground && !late ? 1 : 0)),
        },
        skills: addContractSkill({ ...current, simulation: advanced.simulation }, contract.skill, clean && !late),
      };
      simulation = recordSimulationEvent(simulation, 'contract', late ? 'Контракт сдан поздно' : 'Контракт закрыт', late ? `Оплата снижена до ${actualPay.toLocaleString('ru-RU')} ₽.` : `Получено ${actualPay.toLocaleString('ru-RU')} ₽.`, actualPay);
      return {
        ...current,
        balance: advanced.balance + actualPay,
        activeContract: null,
        completedContracts: [record, ...current.completedContracts].slice(0, 50),
        factionRep: { ...current.factionRep, [contract.factionId]: Math.max(0, (current.factionRep[contract.factionId] ?? 0) + (late ? -1 : clean ? 2 : 1)) },
        simulation,
      };
    }),
    refreshContracts: () => setProgress((current) => {
      const day = current.simulation.clock.day;
      if (current.simulation.daily.lastContractBoardDay >= day) return current;
      return {
        ...current,
        contractRefreshes: current.contractRefreshes + 1,
        contractOffers: generateContractOffers(current, current.contractRefreshes + 1),
        simulation: markContractBoardDay(current.simulation, day),
      };
    }),
    advanceTime: () => setProgress((current) => {
      const result = performDailyActivity(current.simulation, current.balance, 'free');
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    rest: () => setProgress((current) => {
      const result = restUntilMorning(current.simulation, current.balance);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    setFoodPlan: (id) => setProgress((current) => ({ ...current, simulation: { ...current.simulation, foodPlanId: id } })),
    buyItem: (id) => setProgress((current) => {
      const item = storeItems.find((entry) => entry.id === id);
      if (!item) return current;
      const result = buyStoreItem(current.simulation, current.balance, id, item.price);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    changeHousing: (id) => setProgress((current) => {
      const result = moveToHousing(current.simulation, current.balance, id);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    workShift: () => setProgress((current) => {
      const result = workCompanyShift(current.simulation, current.balance);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    acceptJob: (id) => setProgress((current) => {
      const job = jobsCatalog.find((entry) => entry.id === id);
      if (!job || !getJobAccess(current, job).available) return current;
      return { ...current, simulation: takeJob(current.simulation, id) };
    }),
    quitJob: () => setProgress((current) => ({ ...current, simulation: quitCurrentJob(current.simulation) })),
    secureDevices: () => setProgress((current) => {
      const result = reduceDigitalRisk(current.simulation, current.balance);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    setDayPlan: (period, activityId) => setProgress((current) => ({ ...current, simulation: setPlannedActivity(current.simulation, period, activityId) })),
    performActivity: (activityId) => setProgress((current) => {
      const result = performDailyActivity(current.simulation, current.balance, activityId);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    resolveDayEvent: (choiceId) => setProgress((current) => {
      const result = resolveDailyEvent(current.simulation, current.balance, choiceId);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    travelTo: (locationId, modeId) => setProgress((current) => {
      const result = travelToCityLocation(current.simulation, current.balance, locationId, modeId);
      return { ...current, simulation: result.simulation, balance: result.balance };
    }),
    completeCityScene: (sceneId) => setProgress((current) => ({
      ...current,
      ...(sceneId === 'igor-cafe' ? { routeCaseAccepted: true, routeCaseStage: Math.max(0, current.routeCaseStage) } : {}),
      simulation: completeCitySceneState(current.simulation, sceneId),
    })),
    completeRouteCase: (choice) => setProgress((current) => {
      if (current.routeCaseComplete) return current;
      const config = {
        full: { pay: 8000, igor: 4, sfera: 0, professional: 0, reliability: 2, underground: 5, digital: 8, corporate: 0, criminal: 10 },
        safe: { pay: 5000, igor: 2, sfera: 0, professional: 1, reliability: 2, underground: 2, digital: 2, corporate: 0, criminal: 3 },
        lie: { pay: 3500, igor: 1, sfera: 0, professional: 0, reliability: -1, underground: 2, digital: 2, corporate: 0, criminal: 4 },
        refuse: { pay: 0, igor: -2, sfera: 0, professional: 1, reliability: 1, underground: 0, digital: 0, corporate: 0, criminal: 0 },
        owner: { pay: 2500, igor: -3, sfera: 0, professional: 4, reliability: 3, underground: 0, digital: 1, corporate: 0, criminal: 1 },
        anna: { pay: 0, igor: -3, sfera: 4, professional: 4, reliability: 2, underground: 0, digital: 1, corporate: 5, criminal: 1 },
      }[choice];
      const advanced = advanceSlots(current.simulation, current.balance, 2, 'contract');
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: Math.min(100, advanced.simulation.heat.digitalTrace + config.digital),
        corporateSuspicion: Math.min(100, advanced.simulation.heat.corporateSuspicion + config.corporate),
        criminalExposure: Math.min(100, advanced.simulation.heat.criminalExposure + config.criminal),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, config.professional),
          reliability: bump(advanced.simulation.reputation.reliability, config.reliability),
          underground: bump(advanced.simulation.reputation.underground, config.underground),
        },
        progression: {
          ...advanced.simulation.progression,
          passedExamIds: advanced.simulation.progression.passedExamIds.includes('stage-2-capstone')
            ? advanced.simulation.progression.passedExamIds
            : [...advanced.simulation.progression.passedExamIds, 'stage-2-capstone'],
        },
        skills: {
          ...advanced.simulation.skills,
          web: { ...advanced.simulation.skills.web, theory: bump(advanced.simulation.skills.web.theory, 10), guided: bump(advanced.simulation.skills.web.guided, 12), independent: bump(advanced.simulation.skills.web.independent, 7) },
          python: { ...advanced.simulation.skills.python, theory: bump(advanced.simulation.skills.python.theory, 9), guided: bump(advanced.simulation.skills.python.guided, 12), independent: bump(advanced.simulation.skills.python.independent, 6) },
          networking: { ...advanced.simulation.skills.networking, theory: bump(advanced.simulation.skills.networking.theory, 6), guided: bump(advanced.simulation.skills.networking.guided, 5) },
          soc: { ...advanced.simulation.skills.soc, independent: bump(advanced.simulation.skills.soc.independent, 5), production: bump(advanced.simulation.skills.soc.production, 2) },
          communication: { ...advanced.simulation.skills.communication, production: bump(advanced.simulation.skills.communication.production, 3) },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'MARSHRUT-01 закрыт', `Решение: ${choice}. Получено ${config.pay.toLocaleString('ru-RU')} ₽.`, config.pay);
      return {
        ...current,
        routeCaseComplete: true,
        routeCaseChoice: choice,
        balance: advanced.balance + config.pay,
        factionRep: {
          ...current.factionRep,
          north: Math.max(0, (current.factionRep.north ?? 0) + config.igor),
          sfera: Math.max(0, (current.factionRep.sfera ?? 0) + config.sfera),
        },
        contractOffers: [],
        simulation,
      };
    }),
    completeWindowsCase: () => setProgress((current) => {
      if (current.windowsCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 2, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 1),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 2),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 2),
          reliability: bump(advanced.simulation.reputation.reliability, current.windowsCaseHintUses > 8 ? 1 : 3),
          underground: bump(advanced.simulation.reputation.underground, 3),
        },
        progression: {
          ...advanced.simulation.progression,
          passedExamIds: advanced.simulation.progression.passedExamIds.includes('windows-workstation')
            ? advanced.simulation.progression.passedExamIds
            : [...advanced.simulation.progression.passedExamIds, 'windows-workstation'],
        },
        skills: {
          ...advanced.simulation.skills,
          windows: {
            ...advanced.simulation.skills.windows,
            theory: bump(advanced.simulation.skills.windows.theory, 18),
            guided: bump(advanced.simulation.skills.windows.guided, 20),
            independent: bump(advanced.simulation.skills.windows.independent, 12),
            production: bump(advanced.simulation.skills.windows.production, 5),
          },
          powershell: {
            ...advanced.simulation.skills.powershell,
            theory: bump(advanced.simulation.skills.powershell.theory, 16),
            guided: bump(advanced.simulation.skills.powershell.guided, 18),
            independent: bump(advanced.simulation.skills.powershell.independent, 10),
            production: bump(advanced.simulation.skills.powershell.production, 4),
          },
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 10),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 12),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 8),
            production: bump(advanced.simulation.skills.incidentResponse.production, 4),
          },
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 7),
            guided: bump(advanced.simulation.skills.forensics.guided, 8),
            independent: bump(advanced.simulation.skills.forensics.independent, 5),
          },
          networking: {
            ...advanced.simulation.skills.networking,
            guided: bump(advanced.simulation.skills.networking.guided, 5),
            independent: bump(advanced.simulation.skills.networking.independent, 4),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'NORTHLINE-07 закрыт', `Две Windows-машины разобраны. Подсказок: ${current.windowsCaseHintUses}.`, 6500);
      return {
        ...current,
        windowsCaseComplete: true,
        windowsCaseStage: 7,
        balance: advanced.balance + 6500,
        factionRep: { ...current.factionRep, north: (current.factionRep.north ?? 0) + 3 },
        contractOffers: [],
        simulation,
      };
    }),
    completeLinuxCase: () => setProgress((current) => {
      if (current.linuxCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 2, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 2),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 3),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 2),
          reliability: bump(advanced.simulation.reputation.reliability, current.linuxCaseHintUses > 9 ? 1 : 4),
          underground: bump(advanced.simulation.reputation.underground, 4),
        },
        progression: {
          ...advanced.simulation.progression,
          passedExamIds: advanced.simulation.progression.passedExamIds.includes('linux-server')
            ? advanced.simulation.progression.passedExamIds
            : [...advanced.simulation.progression.passedExamIds, 'linux-server'],
        },
        skills: {
          ...advanced.simulation.skills,
          linux: {
            ...advanced.simulation.skills.linux,
            theory: bump(advanced.simulation.skills.linux.theory, 22),
            guided: bump(advanced.simulation.skills.linux.guided, 24),
            independent: bump(advanced.simulation.skills.linux.independent, 15),
            production: bump(advanced.simulation.skills.linux.production, 7),
          },
          bash: {
            ...advanced.simulation.skills.bash,
            theory: bump(advanced.simulation.skills.bash.theory, 18),
            guided: bump(advanced.simulation.skills.bash.guided, 20),
            independent: bump(advanced.simulation.skills.bash.independent, 12),
            production: bump(advanced.simulation.skills.bash.production, 5),
          },
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 12),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 14),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 10),
            production: bump(advanced.simulation.skills.incidentResponse.production, 5),
          },
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 8),
            guided: bump(advanced.simulation.skills.forensics.guided, 10),
            independent: bump(advanced.simulation.skills.forensics.independent, 7),
          },
          networking: {
            ...advanced.simulation.skills.networking,
            theory: bump(advanced.simulation.skills.networking.theory, 7),
            guided: bump(advanced.simulation.skills.networking.guided, 7),
            independent: bump(advanced.simulation.skills.networking.independent, 5),
          },
          operationalPlanning: {
            ...advanced.simulation.skills.operationalPlanning,
            guided: bump(advanced.simulation.skills.operationalPlanning.guided, 6),
            independent: bump(advanced.simulation.skills.operationalPlanning.independent, 5),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'REDTABLE-02 закрыт', `Два Linux-сервера очищены и восстановлены. Подсказок: ${current.linuxCaseHintUses}.`, 8000);
      return {
        ...current,
        linuxCaseComplete: true,
        linuxCaseStage: 7,
        balance: advanced.balance + 8000,
        factionRep: { ...current.factionRep, north: (current.factionRep.north ?? 0) + 4 },
        contractOffers: [],
        simulation,
      };
    }),
    toggleSpecialization: (id) => setProgress((current) => {
      const selected = current.simulation.progression.selectedSpecializations;
      const next = selected.includes(id)
        ? selected.filter((item) => item !== id)
        : selected.length < 2 ? [...selected, id] : selected;
      return {
        ...current,
        simulation: {
          ...current.simulation,
          progression: { ...current.simulation.progression, selectedSpecializations: next },
        },
      };
    }),
    completeProgressionExam: (id) => setProgress((current) => current.simulation.progression.passedExamIds.includes(id) ? current : ({
      ...current,
      simulation: {
        ...current.simulation,
        progression: {
          ...current.simulation.progression,
          passedExamIds: [...current.simulation.progression.passedExamIds, id],
        },
      },
    })),
    saveNow: () => persist(progress),
    importProgress: (raw) => {
      const next = normalizeProgress(raw);
      if (!next) return false;
      setProgress(next);
      persist(next);
      return true;
    },
    resetProgress: () => {
      const next = { ...createInitialProgress(), booted: true };
      setProgress(next);
      persist(next);
    },
  }), [progress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used inside ProgressProvider');
  return context;
}
