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
  completeNetworkCase: () => void;
  completeWebCase: () => void;
  completeMobileCase: () => void;
  completeAdCase: () => void;
  completeMailCase: () => void;
  completeDarknetCore: (choice: 'accept' | 'ignore') => void;
  completeForensicsCase: () => void;
  completeIncidentCase: () => void;
  completeHuntCase: () => void;
  completeCryptoCase: () => void;
  toggleSpecialization: (id: SpecializationId) => void;
  completeProgressionExam: (id: string) => void;
  saveNow: () => string;
  importProgress: (value: unknown) => boolean;
  resetProgress: () => void;
}

const STORAGE_KEY = 'false-access-progress-v21';
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
    networkCaseStage: Number.isFinite(Number(parsed.networkCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.networkCaseStage))) : 0,
    networkCaseObjectives: Array.isArray(parsed.networkCaseObjectives) ? parsed.networkCaseObjectives.filter((item): item is string => typeof item === 'string') : [],
    networkCaseFoundationAnswers: parsed.networkCaseFoundationAnswers && typeof parsed.networkCaseFoundationAnswers === 'object' ? parsed.networkCaseFoundationAnswers as Record<string, string> : {},
    networkCaseCaptureObjectives: Array.isArray(parsed.networkCaseCaptureObjectives) ? parsed.networkCaseCaptureObjectives.filter((item): item is string => typeof item === 'string') : [],
    networkCaseProtocolAnswers: parsed.networkCaseProtocolAnswers && typeof parsed.networkCaseProtocolAnswers === 'object' ? parsed.networkCaseProtocolAnswers as Record<string, string> : {},
    networkCaseContainmentSelections: parsed.networkCaseContainmentSelections && typeof parsed.networkCaseContainmentSelections === 'object' ? parsed.networkCaseContainmentSelections as Record<string, string> : {},
    networkCaseIndependentObjectives: Array.isArray(parsed.networkCaseIndependentObjectives) ? parsed.networkCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    networkCaseIndependentAnswers: parsed.networkCaseIndependentAnswers && typeof parsed.networkCaseIndependentAnswers === 'object' ? parsed.networkCaseIndependentAnswers as Record<string, string> : {},
    networkCaseFindingSelections: parsed.networkCaseFindingSelections && typeof parsed.networkCaseFindingSelections === 'object' ? parsed.networkCaseFindingSelections as Record<string, string> : {},
    networkCaseReportSelections: parsed.networkCaseReportSelections && typeof parsed.networkCaseReportSelections === 'object' ? parsed.networkCaseReportSelections as Record<string, string> : {},
    networkCaseHintUses: Number.isFinite(Number(parsed.networkCaseHintUses)) ? Math.max(0, Number(parsed.networkCaseHintUses)) : 0,
    networkCaseComplete: Boolean(parsed.networkCaseComplete),
    webCaseStage: Number.isFinite(Number(parsed.webCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.webCaseStage))) : 0,
    webCaseFoundationAnswers: parsed.webCaseFoundationAnswers && typeof parsed.webCaseFoundationAnswers === 'object' ? parsed.webCaseFoundationAnswers as Record<string, string> : {},
    webCaseHttpObjectives: Array.isArray(parsed.webCaseHttpObjectives) ? parsed.webCaseHttpObjectives.filter((item): item is string => typeof item === 'string') : [],
    webCaseSessionAnswers: parsed.webCaseSessionAnswers && typeof parsed.webCaseSessionAnswers === 'object' ? parsed.webCaseSessionAnswers as Record<string, string> : {},
    webCasePatch: typeof parsed.webCasePatch === 'string' ? parsed.webCasePatch : '',
    webCaseCodeAnswers: parsed.webCaseCodeAnswers && typeof parsed.webCaseCodeAnswers === 'object' ? parsed.webCaseCodeAnswers as Record<string, string> : {},
    webCaseSqlObjectives: Array.isArray(parsed.webCaseSqlObjectives) ? parsed.webCaseSqlObjectives.filter((item): item is string => typeof item === 'string') : [],
    webCaseIndependentObjectives: Array.isArray(parsed.webCaseIndependentObjectives) ? parsed.webCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    webCaseIndependentAnswers: parsed.webCaseIndependentAnswers && typeof parsed.webCaseIndependentAnswers === 'object' ? parsed.webCaseIndependentAnswers as Record<string, string> : {},
    webCaseFindingSelections: parsed.webCaseFindingSelections && typeof parsed.webCaseFindingSelections === 'object' ? parsed.webCaseFindingSelections as Record<string, string> : {},
    webCaseReportSelections: parsed.webCaseReportSelections && typeof parsed.webCaseReportSelections === 'object' ? parsed.webCaseReportSelections as Record<string, string> : {},
    webCaseHintUses: Number.isFinite(Number(parsed.webCaseHintUses)) ? Math.max(0, Number(parsed.webCaseHintUses)) : 0,
    webCaseComplete: Boolean(parsed.webCaseComplete),
    mobileCaseStage: Number.isFinite(Number(parsed.mobileCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.mobileCaseStage))) : 0,
    mobileCaseFoundationAnswers: parsed.mobileCaseFoundationAnswers && typeof parsed.mobileCaseFoundationAnswers === 'object' ? parsed.mobileCaseFoundationAnswers as Record<string, string> : {},
    mobileCaseObjectives: Array.isArray(parsed.mobileCaseObjectives) ? parsed.mobileCaseObjectives.filter((item): item is string => typeof item === 'string') : [],
    mobileCaseSessionAnswers: parsed.mobileCaseSessionAnswers && typeof parsed.mobileCaseSessionAnswers === 'object' ? parsed.mobileCaseSessionAnswers as Record<string, string> : {},
    mobileCaseBackupObjectives: Array.isArray(parsed.mobileCaseBackupObjectives) ? parsed.mobileCaseBackupObjectives.filter((item): item is string => typeof item === 'string') : [],
    mobileCaseTokenAnswers: parsed.mobileCaseTokenAnswers && typeof parsed.mobileCaseTokenAnswers === 'object' ? parsed.mobileCaseTokenAnswers as Record<string, string> : {},
    mobileCasePatch: typeof parsed.mobileCasePatch === 'string' ? parsed.mobileCasePatch : '',
    mobileCaseCodeAnswers: parsed.mobileCaseCodeAnswers && typeof parsed.mobileCaseCodeAnswers === 'object' ? parsed.mobileCaseCodeAnswers as Record<string, string> : {},
    mobileCaseContainmentSelections: parsed.mobileCaseContainmentSelections && typeof parsed.mobileCaseContainmentSelections === 'object' ? parsed.mobileCaseContainmentSelections as Record<string, string> : {},
    mobileCaseIndependentObjectives: Array.isArray(parsed.mobileCaseIndependentObjectives) ? parsed.mobileCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    mobileCaseIndependentAnswers: parsed.mobileCaseIndependentAnswers && typeof parsed.mobileCaseIndependentAnswers === 'object' ? parsed.mobileCaseIndependentAnswers as Record<string, string> : {},
    mobileCaseFindingSelections: parsed.mobileCaseFindingSelections && typeof parsed.mobileCaseFindingSelections === 'object' ? parsed.mobileCaseFindingSelections as Record<string, string> : {},
    mobileCaseReportSelections: parsed.mobileCaseReportSelections && typeof parsed.mobileCaseReportSelections === 'object' ? parsed.mobileCaseReportSelections as Record<string, string> : {},
    mobileCaseHintUses: Number.isFinite(Number(parsed.mobileCaseHintUses)) ? Math.max(0, Number(parsed.mobileCaseHintUses)) : 0,
    mobileCaseComplete: Boolean(parsed.mobileCaseComplete),
    adCaseStage: Number.isFinite(Number(parsed.adCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.adCaseStage))) : 0,
    adCaseFoundationAnswers: parsed.adCaseFoundationAnswers && typeof parsed.adCaseFoundationAnswers === 'object' ? parsed.adCaseFoundationAnswers as Record<string, string> : {},
    adCaseIdentityObjectives: Array.isArray(parsed.adCaseIdentityObjectives) ? parsed.adCaseIdentityObjectives.filter((item): item is string => typeof item === 'string') : [],
    adCaseIdentityAnswers: parsed.adCaseIdentityAnswers && typeof parsed.adCaseIdentityAnswers === 'object' ? parsed.adCaseIdentityAnswers as Record<string, string> : {},
    adCaseKerberosObjectives: Array.isArray(parsed.adCaseKerberosObjectives) ? parsed.adCaseKerberosObjectives.filter((item): item is string => typeof item === 'string') : [],
    adCaseKerberosAnswers: parsed.adCaseKerberosAnswers && typeof parsed.adCaseKerberosAnswers === 'object' ? parsed.adCaseKerberosAnswers as Record<string, string> : {},
    adCaseGpoObjectives: Array.isArray(parsed.adCaseGpoObjectives) ? parsed.adCaseGpoObjectives.filter((item): item is string => typeof item === 'string') : [],
    adCasePatch: typeof parsed.adCasePatch === 'string' ? parsed.adCasePatch : '',
    adCaseCodeAnswers: parsed.adCaseCodeAnswers && typeof parsed.adCaseCodeAnswers === 'object' ? parsed.adCaseCodeAnswers as Record<string, string> : {},
    adCaseContainmentSelections: parsed.adCaseContainmentSelections && typeof parsed.adCaseContainmentSelections === 'object' ? parsed.adCaseContainmentSelections as Record<string, string> : {},
    adCaseIndependentObjectives: Array.isArray(parsed.adCaseIndependentObjectives) ? parsed.adCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    adCaseIndependentAnswers: parsed.adCaseIndependentAnswers && typeof parsed.adCaseIndependentAnswers === 'object' ? parsed.adCaseIndependentAnswers as Record<string, string> : {},
    adCaseFindingSelections: parsed.adCaseFindingSelections && typeof parsed.adCaseFindingSelections === 'object' ? parsed.adCaseFindingSelections as Record<string, string> : {},
    adCaseReportSelections: parsed.adCaseReportSelections && typeof parsed.adCaseReportSelections === 'object' ? parsed.adCaseReportSelections as Record<string, string> : {},
    adCaseHintUses: Number.isFinite(Number(parsed.adCaseHintUses)) ? Math.max(0, Number(parsed.adCaseHintUses)) : 0,
    adCaseComplete: Boolean(parsed.adCaseComplete),
    mailCaseStage: Number.isFinite(Number(parsed.mailCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.mailCaseStage))) : 0,
    mailCaseFoundationAnswers: parsed.mailCaseFoundationAnswers && typeof parsed.mailCaseFoundationAnswers === 'object' ? parsed.mailCaseFoundationAnswers as Record<string, string> : {},
    mailCaseHeaderObjectives: Array.isArray(parsed.mailCaseHeaderObjectives) ? parsed.mailCaseHeaderObjectives.filter((item): item is string => typeof item === 'string') : [],
    mailCaseHeaderAnswers: parsed.mailCaseHeaderAnswers && typeof parsed.mailCaseHeaderAnswers === 'object' ? parsed.mailCaseHeaderAnswers as Record<string, string> : {},
    mailCaseAttachmentObjectives: Array.isArray(parsed.mailCaseAttachmentObjectives) ? parsed.mailCaseAttachmentObjectives.filter((item): item is string => typeof item === 'string') : [],
    mailCaseAttachmentAnswers: parsed.mailCaseAttachmentAnswers && typeof parsed.mailCaseAttachmentAnswers === 'object' ? parsed.mailCaseAttachmentAnswers as Record<string, string> : {},
    mailCaseGatewayObjectives: Array.isArray(parsed.mailCaseGatewayObjectives) ? parsed.mailCaseGatewayObjectives.filter((item): item is string => typeof item === 'string') : [],
    mailCasePolicy: typeof parsed.mailCasePolicy === 'string' ? parsed.mailCasePolicy : '',
    mailCasePolicyAnswers: parsed.mailCasePolicyAnswers && typeof parsed.mailCasePolicyAnswers === 'object' ? parsed.mailCasePolicyAnswers as Record<string, string> : {},
    mailCaseContainmentSelections: parsed.mailCaseContainmentSelections && typeof parsed.mailCaseContainmentSelections === 'object' ? parsed.mailCaseContainmentSelections as Record<string, string> : {},
    mailCaseIndependentObjectives: Array.isArray(parsed.mailCaseIndependentObjectives) ? parsed.mailCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    mailCaseIndependentAnswers: parsed.mailCaseIndependentAnswers && typeof parsed.mailCaseIndependentAnswers === 'object' ? parsed.mailCaseIndependentAnswers as Record<string, string> : {},
    mailCaseFindingSelections: parsed.mailCaseFindingSelections && typeof parsed.mailCaseFindingSelections === 'object' ? parsed.mailCaseFindingSelections as Record<string, string> : {},
    mailCaseReportSelections: parsed.mailCaseReportSelections && typeof parsed.mailCaseReportSelections === 'object' ? parsed.mailCaseReportSelections as Record<string, string> : {},
    mailCaseHintUses: Number.isFinite(Number(parsed.mailCaseHintUses)) ? Math.max(0, Number(parsed.mailCaseHintUses)) : 0,
    mailCaseComplete: Boolean(parsed.mailCaseComplete),
    darknetStage: Number.isFinite(Number(parsed.darknetStage)) ? Math.max(0, Math.min(6, Number(parsed.darknetStage))) : 0,
    darknetConnected: Boolean(parsed.darknetConnected),
    darknetAlias: typeof parsed.darknetAlias === 'string' ? parsed.darknetAlias.slice(0, 24) : '',
    darknetIdentityCreated: Boolean(parsed.darknetIdentityCreated),
    darknetVisited: Array.isArray(parsed.darknetVisited) ? parsed.darknetVisited.filter((item): item is string => typeof item === 'string') : [],
    darknetBookmarks: Array.isArray(parsed.darknetBookmarks) ? parsed.darknetBookmarks.filter((item): item is string => typeof item === 'string') : [],
    darknetMirrorVerified: Boolean(parsed.darknetMirrorVerified),
    darknetInboxRead: Array.isArray(parsed.darknetInboxRead) ? parsed.darknetInboxRead.filter((item): item is string => typeof item === 'string') : [],
    darknetChoice: parsed.darknetChoice === 'accept' || parsed.darknetChoice === 'ignore' ? parsed.darknetChoice : '',
    darknetReputation: Number.isFinite(Number(parsed.darknetReputation)) ? Math.max(0, Math.min(100, Number(parsed.darknetReputation))) : 0,
    darknetComplete: Boolean(parsed.darknetComplete),
    forensicsCaseStage: Number.isFinite(Number(parsed.forensicsCaseStage)) ? Math.max(0, Math.min(7, Number(parsed.forensicsCaseStage))) : 0,
    forensicsCaseFoundationAnswers: parsed.forensicsCaseFoundationAnswers && typeof parsed.forensicsCaseFoundationAnswers === 'object' ? parsed.forensicsCaseFoundationAnswers as Record<string, string> : {},
    forensicsCaseDiskObjectives: Array.isArray(parsed.forensicsCaseDiskObjectives) ? parsed.forensicsCaseDiskObjectives.filter((item): item is string => typeof item === 'string') : [],
    forensicsCaseDiskAnswers: parsed.forensicsCaseDiskAnswers && typeof parsed.forensicsCaseDiskAnswers === 'object' ? parsed.forensicsCaseDiskAnswers as Record<string, string> : {},
    forensicsCaseArtifactObjectives: Array.isArray(parsed.forensicsCaseArtifactObjectives) ? parsed.forensicsCaseArtifactObjectives.filter((item): item is string => typeof item === 'string') : [],
    forensicsCaseMemoryObjectives: Array.isArray(parsed.forensicsCaseMemoryObjectives) ? parsed.forensicsCaseMemoryObjectives.filter((item): item is string => typeof item === 'string') : [],
    forensicsCaseMemoryAnswers: parsed.forensicsCaseMemoryAnswers && typeof parsed.forensicsCaseMemoryAnswers === 'object' ? parsed.forensicsCaseMemoryAnswers as Record<string, string> : {},
    forensicsCaseContainmentSelections: parsed.forensicsCaseContainmentSelections && typeof parsed.forensicsCaseContainmentSelections === 'object' ? parsed.forensicsCaseContainmentSelections as Record<string, string> : {},
    forensicsCaseIndependentObjectives: Array.isArray(parsed.forensicsCaseIndependentObjectives) ? parsed.forensicsCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    forensicsCaseIndependentAnswers: parsed.forensicsCaseIndependentAnswers && typeof parsed.forensicsCaseIndependentAnswers === 'object' ? parsed.forensicsCaseIndependentAnswers as Record<string, string> : {},
    forensicsCaseFindingSelections: parsed.forensicsCaseFindingSelections && typeof parsed.forensicsCaseFindingSelections === 'object' ? parsed.forensicsCaseFindingSelections as Record<string, string> : {},
    forensicsCaseReportSelections: parsed.forensicsCaseReportSelections && typeof parsed.forensicsCaseReportSelections === 'object' ? parsed.forensicsCaseReportSelections as Record<string, string> : {},
    forensicsCaseHintUses: Number.isFinite(Number(parsed.forensicsCaseHintUses)) ? Math.max(0, Number(parsed.forensicsCaseHintUses)) : 0,
    forensicsCaseComplete: Boolean(parsed.forensicsCaseComplete),
    incidentCaseStage: Number.isFinite(Number(parsed.incidentCaseStage)) ? Math.max(0, Math.min(8, Number(parsed.incidentCaseStage))) : 0,
    incidentCaseFoundationAnswers: parsed.incidentCaseFoundationAnswers && typeof parsed.incidentCaseFoundationAnswers === 'object' ? parsed.incidentCaseFoundationAnswers as Record<string, string> : {},
    incidentCaseTriageObjectives: Array.isArray(parsed.incidentCaseTriageObjectives) ? parsed.incidentCaseTriageObjectives.filter((item): item is string => typeof item === 'string') : [],
    incidentCaseScopeAnswers: parsed.incidentCaseScopeAnswers && typeof parsed.incidentCaseScopeAnswers === 'object' ? parsed.incidentCaseScopeAnswers as Record<string, string> : {},
    incidentCaseContainmentSelections: parsed.incidentCaseContainmentSelections && typeof parsed.incidentCaseContainmentSelections === 'object' ? parsed.incidentCaseContainmentSelections as Record<string, string> : {},
    incidentCaseEradicationObjectives: Array.isArray(parsed.incidentCaseEradicationObjectives) ? parsed.incidentCaseEradicationObjectives.filter((item): item is string => typeof item === 'string') : [],
    incidentCaseRecoverySelections: parsed.incidentCaseRecoverySelections && typeof parsed.incidentCaseRecoverySelections === 'object' ? parsed.incidentCaseRecoverySelections as Record<string, string> : {},
    incidentCaseIndependentObjectives: Array.isArray(parsed.incidentCaseIndependentObjectives) ? parsed.incidentCaseIndependentObjectives.filter((item): item is string => typeof item === 'string') : [],
    incidentCaseIndependentAnswers: parsed.incidentCaseIndependentAnswers && typeof parsed.incidentCaseIndependentAnswers === 'object' ? parsed.incidentCaseIndependentAnswers as Record<string, string> : {},
    incidentCaseFindingSelections: parsed.incidentCaseFindingSelections && typeof parsed.incidentCaseFindingSelections === 'object' ? parsed.incidentCaseFindingSelections as Record<string, string> : {},
    incidentCaseReportSelections: parsed.incidentCaseReportSelections && typeof parsed.incidentCaseReportSelections === 'object' ? parsed.incidentCaseReportSelections as Record<string, string> : {},
    incidentCaseHintUses: Number.isFinite(Number(parsed.incidentCaseHintUses)) ? Math.max(0, Number(parsed.incidentCaseHintUses)) : 0,
    incidentCaseComplete: Boolean(parsed.incidentCaseComplete),
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
    const v20Raw = localStorage.getItem('false-access-progress-v20');
    const v19Raw = localStorage.getItem('false-access-progress-v19');
    const v18Raw = localStorage.getItem('false-access-progress-v18');
    const v17Raw = localStorage.getItem('false-access-progress-v17');
    const v16Raw = localStorage.getItem('false-access-progress-v16');
    const v15Raw = localStorage.getItem('false-access-progress-v15');
    const v14Raw = localStorage.getItem('false-access-progress-v14');
    const v13Raw = localStorage.getItem('false-access-progress-v13');
    const v12Raw = localStorage.getItem('false-access-progress-v12');
    const v11Raw = localStorage.getItem('false-access-progress-v11');
    const v10Raw = localStorage.getItem('false-access-progress-v10');
    const v9Raw = localStorage.getItem('false-access-progress-v9');
    const v8Raw = localStorage.getItem('false-access-progress-v8');
    const v7Raw = localStorage.getItem('false-access-progress-v7');
    const v6Raw = localStorage.getItem('false-access-progress-v6');
    const v5Raw = localStorage.getItem('false-access-progress-v5');
    const v4Raw = localStorage.getItem('false-access-progress-v4');
    const v3Raw = localStorage.getItem('false-access-progress-v3');
    const raw = currentRaw
      ?? v20Raw
      ?? v19Raw
      ?? v18Raw
      ?? v17Raw
      ?? v16Raw
      ?? v15Raw
      ?? v14Raw
      ?? v13Raw
      ?? v12Raw
      ?? v11Raw
      ?? v10Raw
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
    return normalizeProgress(JSON.parse(raw), !currentRaw && !v20Raw && !v19Raw && !v18Raw && !v17Raw && !v16Raw && !v15Raw && !v14Raw && !v13Raw && !v12Raw && !v11Raw && !v10Raw && !v9Raw && !v8Raw && !v7Raw && !v6Raw && !v5Raw && !v4Raw && !v3Raw) ?? fallback;
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

function addContractSkill(progress: ProgressState, skill: GeneratedContract['skill'], clean: boolean) {
  const skillId: SimulationSkillId = skill === 'mobile' ? 'mobileSecurity' : skill === 'email' ? 'emailSecurity' : skill;
  const current = progress.simulation.skills[skillId];
  return {
    ...progress.simulation.skills,
    [skillId]: {
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
    completeNetworkCase: () => setProgress((current) => {
      if (current.networkCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 2, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 3),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 4),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 3),
          reliability: bump(advanced.simulation.reputation.reliability, current.networkCaseHintUses > 10 ? 1 : 5),
          underground: bump(advanced.simulation.reputation.underground, 5),
        },
        progression: {
          ...advanced.simulation.progression,
          passedExamIds: advanced.simulation.progression.passedExamIds.includes('network-foundations')
            ? advanced.simulation.progression.passedExamIds
            : [...advanced.simulation.progression.passedExamIds, 'network-foundations'],
        },
        skills: {
          ...advanced.simulation.skills,
          networking: {
            ...advanced.simulation.skills.networking,
            theory: bump(advanced.simulation.skills.networking.theory, 26),
            guided: bump(advanced.simulation.skills.networking.guided, 28),
            independent: bump(advanced.simulation.skills.networking.independent, 18),
            production: bump(advanced.simulation.skills.networking.production, 8),
          },
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 10),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 12),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 9),
            production: bump(advanced.simulation.skills.incidentResponse.production, 5),
          },
          securityEngineering: {
            ...advanced.simulation.skills.securityEngineering,
            theory: bump(advanced.simulation.skills.securityEngineering.theory, 14),
            guided: bump(advanced.simulation.skills.securityEngineering.guided, 14),
            independent: bump(advanced.simulation.skills.securityEngineering.independent, 9),
            production: bump(advanced.simulation.skills.securityEngineering.production, 4),
          },
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 6),
            guided: bump(advanced.simulation.skills.forensics.guided, 8),
            independent: bump(advanced.simulation.skills.forensics.independent, 6),
          },
          operationalPlanning: {
            ...advanced.simulation.skills.operationalPlanning,
            theory: bump(advanced.simulation.skills.operationalPlanning.theory, 7),
            guided: bump(advanced.simulation.skills.operationalPlanning.guided, 8),
            independent: bump(advanced.simulation.skills.operationalPlanning.independent, 7),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'BLACKWIRE-03 закрыт', `Rogue DHCP/DNS удалён, сегментация камер восстановлена. Подсказок: ${current.networkCaseHintUses}.`, 9000);
      return {
        ...current,
        networkCaseComplete: true,
        networkCaseStage: 7,
        balance: advanced.balance + 9000,
        factionRep: { ...current.factionRep, north: (current.factionRep.north ?? 0) + 5 },
        contractOffers: [],
        simulation,
      };
    }),
    completeWebCase: () => setProgress((current) => {
      if (current.webCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 2, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 4),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 5),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 4),
          reliability: bump(advanced.simulation.reputation.reliability, current.webCaseHintUses > 10 ? 2 : 6),
          underground: bump(advanced.simulation.reputation.underground, 6),
        },
        progression: {
          ...advanced.simulation.progression,
          passedExamIds: advanced.simulation.progression.passedExamIds.includes('web-api-sql')
            ? advanced.simulation.progression.passedExamIds
            : [...advanced.simulation.progression.passedExamIds, 'web-api-sql'],
        },
        skills: {
          ...advanced.simulation.skills,
          web: {
            ...advanced.simulation.skills.web,
            theory: bump(advanced.simulation.skills.web.theory, 28),
            guided: bump(advanced.simulation.skills.web.guided, 30),
            independent: bump(advanced.simulation.skills.web.independent, 20),
            production: bump(advanced.simulation.skills.web.production, 9),
          },
          sql: {
            ...advanced.simulation.skills.sql,
            theory: bump(advanced.simulation.skills.sql.theory, 20),
            guided: bump(advanced.simulation.skills.sql.guided, 22),
            independent: bump(advanced.simulation.skills.sql.independent, 12),
            production: bump(advanced.simulation.skills.sql.production, 5),
          },
          appsec: {
            ...advanced.simulation.skills.appsec,
            theory: bump(advanced.simulation.skills.appsec.theory, 18),
            guided: bump(advanced.simulation.skills.appsec.guided, 20),
            independent: bump(advanced.simulation.skills.appsec.independent, 14),
            production: bump(advanced.simulation.skills.appsec.production, 6),
          },
          securityEngineering: {
            ...advanced.simulation.skills.securityEngineering,
            theory: bump(advanced.simulation.skills.securityEngineering.theory, 8),
            guided: bump(advanced.simulation.skills.securityEngineering.guided, 10),
            independent: bump(advanced.simulation.skills.securityEngineering.independent, 8),
          },
          communication: {
            ...advanced.simulation.skills.communication,
            guided: bump(advanced.simulation.skills.communication.guided, 5),
            production: bump(advanced.simulation.skills.communication.production, 4),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'VANTA-04 закрыт', `Два API-маршрута исправлены, SQL и сессии проверены. Подсказок: ${current.webCaseHintUses}.`, 10500);
      return {
        ...current,
        webCaseComplete: true,
        webCaseStage: 7,
        balance: advanced.balance + 10500,
        factionRep: { ...current.factionRep, north: (current.factionRep.north ?? 0) + 6 },
        contractOffers: [],
        simulation,
      };
    }),
    completeMobileCase: () => setProgress((current) => {
      if (current.mobileCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 2, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 5),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 6),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 4),
          reliability: bump(advanced.simulation.reputation.reliability, current.mobileCaseHintUses > 11 ? 2 : 6),
          underground: bump(advanced.simulation.reputation.underground, 7),
        },
        progression: {
          ...advanced.simulation.progression,
          passedExamIds: advanced.simulation.progression.passedExamIds.includes('mobile-security')
            ? advanced.simulation.progression.passedExamIds
            : [...advanced.simulation.progression.passedExamIds, 'mobile-security'],
        },
        skills: {
          ...advanced.simulation.skills,
          mobileSecurity: {
            ...advanced.simulation.skills.mobileSecurity,
            theory: bump(advanced.simulation.skills.mobileSecurity.theory, 30),
            guided: bump(advanced.simulation.skills.mobileSecurity.guided, 30),
            independent: bump(advanced.simulation.skills.mobileSecurity.independent, 20),
            production: bump(advanced.simulation.skills.mobileSecurity.production, 8),
          },
          appsec: {
            ...advanced.simulation.skills.appsec,
            theory: bump(advanced.simulation.skills.appsec.theory, 10),
            guided: bump(advanced.simulation.skills.appsec.guided, 12),
            independent: bump(advanced.simulation.skills.appsec.independent, 8),
            production: bump(advanced.simulation.skills.appsec.production, 3),
          },
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 10),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 12),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 10),
            production: bump(advanced.simulation.skills.incidentResponse.production, 5),
          },
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 12),
            guided: bump(advanced.simulation.skills.forensics.guided, 12),
            independent: bump(advanced.simulation.skills.forensics.independent, 10),
            production: bump(advanced.simulation.skills.forensics.production, 4),
          },
          networking: {
            ...advanced.simulation.skills.networking,
            guided: bump(advanced.simulation.skills.networking.guided, 8),
            independent: bump(advanced.simulation.skills.networking.independent, 6),
          },
          securityEngineering: {
            ...advanced.simulation.skills.securityEngineering,
            theory: bump(advanced.simulation.skills.securityEngineering.theory, 8),
            guided: bump(advanced.simulation.skills.securityEngineering.guided, 10),
            independent: bump(advanced.simulation.skills.securityEngineering.independent, 7),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'MIRRORCELL-05 закрыт', `Два мобильных устройства разобраны. Подсказок: ${current.mobileCaseHintUses}.`, 12000);
      return {
        ...current,
        mobileCaseComplete: true,
        mobileCaseStage: 7,
        balance: advanced.balance + 12000,
        factionRep: { ...current.factionRep, north: (current.factionRep.north ?? 0) + 7 },
        contractOffers: [],
        simulation,
      };
    }),
    completeAdCase: () => setProgress((current) => {
      if (current.adCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 3, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 6),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 8),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      const examIds = ['active-directory', 'stage-3-capstone'];
      const passedExamIds = [...advanced.simulation.progression.passedExamIds];
      examIds.forEach((id) => { if (!passedExamIds.includes(id)) passedExamIds.push(id); });
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 6),
          reliability: bump(advanced.simulation.reputation.reliability, current.adCaseHintUses > 12 ? 2 : 7),
          underground: bump(advanced.simulation.reputation.underground, 9),
        },
        progression: { ...advanced.simulation.progression, passedExamIds },
        skills: {
          ...advanced.simulation.skills,
          activeDirectory: {
            ...advanced.simulation.skills.activeDirectory,
            theory: bump(advanced.simulation.skills.activeDirectory.theory, 38),
            guided: bump(advanced.simulation.skills.activeDirectory.guided, 36),
            independent: bump(advanced.simulation.skills.activeDirectory.independent, 24),
            production: bump(advanced.simulation.skills.activeDirectory.production, 10),
          },
          windows: {
            ...advanced.simulation.skills.windows,
            theory: bump(advanced.simulation.skills.windows.theory, 14),
            guided: bump(advanced.simulation.skills.windows.guided, 16),
            independent: bump(advanced.simulation.skills.windows.independent, 12),
            production: bump(advanced.simulation.skills.windows.production, 6),
          },
          powershell: {
            ...advanced.simulation.skills.powershell,
            theory: bump(advanced.simulation.skills.powershell.theory, 12),
            guided: bump(advanced.simulation.skills.powershell.guided, 14),
            independent: bump(advanced.simulation.skills.powershell.independent, 10),
            production: bump(advanced.simulation.skills.powershell.production, 5),
          },
          networking: {
            ...advanced.simulation.skills.networking,
            theory: bump(advanced.simulation.skills.networking.theory, 8),
            guided: bump(advanced.simulation.skills.networking.guided, 10),
            independent: bump(advanced.simulation.skills.networking.independent, 8),
            production: bump(advanced.simulation.skills.networking.production, 4),
          },
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 14),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 16),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 13),
            production: bump(advanced.simulation.skills.incidentResponse.production, 7),
          },
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 10),
            guided: bump(advanced.simulation.skills.forensics.guided, 12),
            independent: bump(advanced.simulation.skills.forensics.independent, 10),
            production: bump(advanced.simulation.skills.forensics.production, 5),
          },
          siem: {
            ...advanced.simulation.skills.siem,
            theory: bump(advanced.simulation.skills.siem.theory, 14),
            guided: bump(advanced.simulation.skills.siem.guided, 16),
            independent: bump(advanced.simulation.skills.siem.independent, 11),
            production: bump(advanced.simulation.skills.siem.production, 7),
          },
          securityEngineering: {
            ...advanced.simulation.skills.securityEngineering,
            theory: bump(advanced.simulation.skills.securityEngineering.theory, 16),
            guided: bump(advanced.simulation.skills.securityEngineering.guided, 16),
            independent: bump(advanced.simulation.skills.securityEngineering.independent, 12),
            production: bump(advanced.simulation.skills.securityEngineering.production, 6),
          },
          operationalPlanning: {
            ...advanced.simulation.skills.operationalPlanning,
            theory: bump(advanced.simulation.skills.operationalPlanning.theory, 10),
            guided: bump(advanced.simulation.skills.operationalPlanning.guided, 12),
            independent: bump(advanced.simulation.skills.operationalPlanning.independent, 10),
            production: bump(advanced.simulation.skills.operationalPlanning.production, 5),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'IRONROOT-06 закрыт', `Старая учётка, GPO и опасные права устранены. Подсказок: ${current.adCaseHintUses}.`, 15000);
      return {
        ...current,
        adCaseComplete: true,
        adCaseStage: 7,
        balance: advanced.balance + 15000,
        factionRep: { ...current.factionRep, north: (current.factionRep.north ?? 0) + 9 },
        contractOffers: [],
        simulation,
      };
    }),
    completeMailCase: () => setProgress((current) => {
      if (current.mailCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 3, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 7),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 8),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      const passedExamIds = [...advanced.simulation.progression.passedExamIds];
      ['mail-incident', 'stage-3-mail'].forEach((id) => { if (!passedExamIds.includes(id)) passedExamIds.push(id); });
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 7),
          reliability: bump(advanced.simulation.reputation.reliability, current.mailCaseHintUses > 12 ? 2 : 8),
          underground: bump(advanced.simulation.reputation.underground, 10),
        },
        progression: { ...advanced.simulation.progression, passedExamIds },
        skills: {
          ...advanced.simulation.skills,
          emailSecurity: {
            ...advanced.simulation.skills.emailSecurity,
            theory: bump(advanced.simulation.skills.emailSecurity.theory, 42),
            guided: bump(advanced.simulation.skills.emailSecurity.guided, 40),
            independent: bump(advanced.simulation.skills.emailSecurity.independent, 28),
            production: bump(advanced.simulation.skills.emailSecurity.production, 12),
          },
          soc: {
            ...advanced.simulation.skills.soc,
            theory: bump(advanced.simulation.skills.soc.theory, 18),
            guided: bump(advanced.simulation.skills.soc.guided, 20),
            independent: bump(advanced.simulation.skills.soc.independent, 15),
            production: bump(advanced.simulation.skills.soc.production, 8),
          },
          siem: {
            ...advanced.simulation.skills.siem,
            theory: bump(advanced.simulation.skills.siem.theory, 16),
            guided: bump(advanced.simulation.skills.siem.guided, 18),
            independent: bump(advanced.simulation.skills.siem.independent, 13),
            production: bump(advanced.simulation.skills.siem.production, 7),
          },
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 18),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 20),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 16),
            production: bump(advanced.simulation.skills.incidentResponse.production, 8),
          },
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 14),
            guided: bump(advanced.simulation.skills.forensics.guided, 16),
            independent: bump(advanced.simulation.skills.forensics.independent, 13),
            production: bump(advanced.simulation.skills.forensics.production, 6),
          },
          networking: {
            ...advanced.simulation.skills.networking,
            theory: bump(advanced.simulation.skills.networking.theory, 12),
            guided: bump(advanced.simulation.skills.networking.guided, 14),
            independent: bump(advanced.simulation.skills.networking.independent, 10),
            production: bump(advanced.simulation.skills.networking.production, 5),
          },
          windows: {
            ...advanced.simulation.skills.windows,
            theory: bump(advanced.simulation.skills.windows.theory, 10),
            guided: bump(advanced.simulation.skills.windows.guided, 12),
            independent: bump(advanced.simulation.skills.windows.independent, 9),
            production: bump(advanced.simulation.skills.windows.production, 5),
          },
          communication: {
            ...advanced.simulation.skills.communication,
            theory: bump(advanced.simulation.skills.communication.theory, 9),
            guided: bump(advanced.simulation.skills.communication.guided, 11),
            independent: bump(advanced.simulation.skills.communication.independent, 10),
            production: bump(advanced.simulation.skills.communication.production, 6),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'BLACKPOST-07 закрыт', `Почтовая цепочка, endpoint и OAuth разобраны. Подсказок: ${current.mailCaseHintUses}.`, 16500);
      return {
        ...current,
        mailCaseComplete: true,
        mailCaseStage: 7,
        balance: advanced.balance + 16500,
        factionRep: { ...current.factionRep, north: (current.factionRep.north ?? 0) + 10 },
        contractOffers: [],
        simulation,
      };
    }),
    completeDarknetCore: (choice) => setProgress((current) => {
      if (current.darknetComplete) return current;
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      let simulation = {
        ...current.simulation,
        reputation: {
          ...current.simulation.reputation,
          underground: bump(current.simulation.reputation.underground, choice === 'accept' ? 8 : 3),
          reliability: bump(current.simulation.reputation.reliability, 2),
        },
        heat: {
          ...current.simulation.heat,
          digitalTrace: bump(current.simulation.heat.digitalTrace, choice === 'accept' ? 3 : 1),
          criminalExposure: bump(current.simulation.heat.criminalExposure, choice === 'accept' ? 5 : 2),
        },
        skills: {
          ...current.simulation.skills,
          operationalPlanning: {
            ...current.simulation.skills.operationalPlanning,
            theory: bump(current.simulation.skills.operationalPlanning.theory, 8),
            guided: bump(current.simulation.skills.operationalPlanning.guided, 6),
            independent: bump(current.simulation.skills.operationalPlanning.independent, 4),
          },
          communication: {
            ...current.simulation.skills.communication,
            theory: bump(current.simulation.skills.communication.theory, 3),
            guided: bump(current.simulation.skills.communication.guided, 3),
          },
        },
      };
      simulation.heat.wantedLevel = calculateWantedLevel(simulation.heat);
      simulation = recordSimulationEvent(simulation, 'risk', 'Первый псевдоним', choice === 'accept'
        ? `Псевдоним ${current.darknetAlias} принял первый закрытый контакт.`
        : `Псевдоним ${current.darknetAlias} оставил первое предложение без ответа.`);
      return {
        ...current,
        darknetChoice: choice,
        darknetStage: 6,
        darknetComplete: true,
        darknetReputation: choice === 'accept' ? 5 : 2,
        factionRep: { ...current.factionRep, line: (current.factionRep.line ?? 0) + (choice === 'accept' ? 3 : 1) },
        simulation,
      };
    }),
    completeForensicsCase: () => setProgress((current) => {
      if (current.forensicsCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 3, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const passedExamIds = [...advanced.simulation.progression.passedExamIds];
      ['disk-memory-forensics', 'stage-4-dfir'].forEach((id) => { if (!passedExamIds.includes(id)) passedExamIds.push(id); });
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 4),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 6),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 8),
          reliability: bump(advanced.simulation.reputation.reliability, current.forensicsCaseHintUses > 10 ? 3 : 9),
          underground: bump(advanced.simulation.reputation.underground, 11),
        },
        progression: { ...advanced.simulation.progression, passedExamIds },
        skills: {
          ...advanced.simulation.skills,
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 46),
            guided: bump(advanced.simulation.skills.forensics.guided, 44),
            independent: bump(advanced.simulation.skills.forensics.independent, 32),
            production: bump(advanced.simulation.skills.forensics.production, 15),
          },
          windows: {
            ...advanced.simulation.skills.windows,
            theory: bump(advanced.simulation.skills.windows.theory, 14),
            guided: bump(advanced.simulation.skills.windows.guided, 16),
            independent: bump(advanced.simulation.skills.windows.independent, 12),
            production: bump(advanced.simulation.skills.windows.production, 6),
          },
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 18),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 20),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 17),
            production: bump(advanced.simulation.skills.incidentResponse.production, 9),
          },
          threatHunting: {
            ...advanced.simulation.skills.threatHunting,
            theory: bump(advanced.simulation.skills.threatHunting.theory, 12),
            guided: bump(advanced.simulation.skills.threatHunting.guided, 14),
            independent: bump(advanced.simulation.skills.threatHunting.independent, 11),
            production: bump(advanced.simulation.skills.threatHunting.production, 5),
          },
          communication: {
            ...advanced.simulation.skills.communication,
            theory: bump(advanced.simulation.skills.communication.theory, 8),
            guided: bump(advanced.simulation.skills.communication.guided, 10),
            independent: bump(advanced.simulation.skills.communication.independent, 10),
            production: bump(advanced.simulation.skills.communication.production, 6),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'DEADFRAME-08 закрыт', `Диск, память и временная линия разобраны. Подсказок: ${current.forensicsCaseHintUses}.`, 19000);
      return {
        ...current,
        forensicsCaseComplete: true,
        forensicsCaseStage: 7,
        balance: advanced.balance + 19000,
        darknetReputation: bump(current.darknetReputation, 12),
        factionRep: { ...current.factionRep, line: (current.factionRep.line ?? 0) + 12 },
        contractOffers: [],
        simulation,
      };
    }),
    completeIncidentCase: () => setProgress((current) => {
      if (current.incidentCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 4, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const passedExamIds = [...advanced.simulation.progression.passedExamIds];
      ['siem-edr-incident', 'incident-response', 'stage-4-capstone'].forEach((id) => { if (!passedExamIds.includes(id)) passedExamIds.push(id); });
      const heat = {
        ...advanced.simulation.heat,
        digitalTrace: bump(advanced.simulation.heat.digitalTrace, 3),
        criminalExposure: bump(advanced.simulation.heat.criminalExposure, 7),
      };
      heat.wantedLevel = calculateWantedLevel(heat);
      let simulation = {
        ...advanced.simulation,
        heat,
        reputation: {
          ...advanced.simulation.reputation,
          professional: bump(advanced.simulation.reputation.professional, 10),
          reliability: bump(advanced.simulation.reputation.reliability, current.incidentCaseHintUses > 12 ? 5 : 12),
          underground: bump(advanced.simulation.reputation.underground, 14),
        },
        progression: { ...advanced.simulation.progression, passedExamIds },
        skills: {
          ...advanced.simulation.skills,
          incidentResponse: {
            ...advanced.simulation.skills.incidentResponse,
            theory: bump(advanced.simulation.skills.incidentResponse.theory, 50),
            guided: bump(advanced.simulation.skills.incidentResponse.guided, 48),
            independent: bump(advanced.simulation.skills.incidentResponse.independent, 38),
            production: bump(advanced.simulation.skills.incidentResponse.production, 20),
          },
          siem: {
            ...advanced.simulation.skills.siem,
            theory: bump(advanced.simulation.skills.siem.theory, 35),
            guided: bump(advanced.simulation.skills.siem.guided, 34),
            independent: bump(advanced.simulation.skills.siem.independent, 28),
            production: bump(advanced.simulation.skills.siem.production, 14),
          },
          soc: {
            ...advanced.simulation.skills.soc,
            theory: bump(advanced.simulation.skills.soc.theory, 30),
            guided: bump(advanced.simulation.skills.soc.guided, 28),
            independent: bump(advanced.simulation.skills.soc.independent, 24),
            production: bump(advanced.simulation.skills.soc.production, 14),
          },
          securityEngineering: {
            ...advanced.simulation.skills.securityEngineering,
            theory: bump(advanced.simulation.skills.securityEngineering.theory, 22),
            guided: bump(advanced.simulation.skills.securityEngineering.guided, 24),
            independent: bump(advanced.simulation.skills.securityEngineering.independent, 18),
            production: bump(advanced.simulation.skills.securityEngineering.production, 10),
          },
          operationalPlanning: {
            ...advanced.simulation.skills.operationalPlanning,
            theory: bump(advanced.simulation.skills.operationalPlanning.theory, 24),
            guided: bump(advanced.simulation.skills.operationalPlanning.guided, 22),
            independent: bump(advanced.simulation.skills.operationalPlanning.independent, 18),
            production: bump(advanced.simulation.skills.operationalPlanning.production, 10),
          },
          forensics: {
            ...advanced.simulation.skills.forensics,
            theory: bump(advanced.simulation.skills.forensics.theory, 10),
            guided: bump(advanced.simulation.skills.forensics.guided, 12),
            independent: bump(advanced.simulation.skills.forensics.independent, 8),
            production: bump(advanced.simulation.skills.forensics.production, 4),
          },
          threatHunting: {
            ...advanced.simulation.skills.threatHunting,
            theory: bump(advanced.simulation.skills.threatHunting.theory, 10),
            guided: bump(advanced.simulation.skills.threatHunting.guided, 12),
            independent: bump(advanced.simulation.skills.threatHunting.independent, 12),
            production: bump(advanced.simulation.skills.threatHunting.production, 6),
          },
          communication: {
            ...advanced.simulation.skills.communication,
            theory: bump(advanced.simulation.skills.communication.theory, 10),
            guided: bump(advanced.simulation.skills.communication.guided, 12),
            independent: bump(advanced.simulation.skills.communication.independent, 12),
            production: bump(advanced.simulation.skills.communication.production, 8),
          },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'GREYLOCK-09 закрыт', `Активный инцидент локализован, инфраструктура восстановлена, повторный CI-токен отозван. Подсказок: ${current.incidentCaseHintUses}.`, 24000);
      return {
        ...current,
        incidentCaseComplete: true,
        incidentCaseStage: 8,
        balance: advanced.balance + 24000,
        darknetReputation: bump(current.darknetReputation, 15),
        factionRep: { ...current.factionRep, line: (current.factionRep.line ?? 0) + 15 },
        contractOffers: [],
        simulation,
      };
    }),
    completeHuntCase: () => setProgress((current) => {
      if (current.huntCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 3, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const passedExamIds = [...advanced.simulation.progression.passedExamIds];
      ['threat-hunting', 'detection-engineering'].forEach((id) => { if (!passedExamIds.includes(id)) passedExamIds.push(id); });
      let simulation = {
        ...advanced.simulation,
        reputation: { ...advanced.simulation.reputation, professional: bump(advanced.simulation.reputation.professional, 6), reliability: bump(advanced.simulation.reputation.reliability, current.huntCaseHintUses > 10 ? 4 : 9), underground: bump(advanced.simulation.reputation.underground, 9) },
        progression: { ...advanced.simulation.progression, passedExamIds },
        skills: {
          ...advanced.simulation.skills,
          threatHunting: { ...advanced.simulation.skills.threatHunting, theory: bump(advanced.simulation.skills.threatHunting.theory, 32), guided: bump(advanced.simulation.skills.threatHunting.guided, 30), independent: bump(advanced.simulation.skills.threatHunting.independent, 24), production: bump(advanced.simulation.skills.threatHunting.production, 10) },
          detectionEngineering: { ...advanced.simulation.skills.detectionEngineering, theory: bump(advanced.simulation.skills.detectionEngineering.theory, 28), guided: bump(advanced.simulation.skills.detectionEngineering.guided, 26), independent: bump(advanced.simulation.skills.detectionEngineering.independent, 20), production: bump(advanced.simulation.skills.detectionEngineering.production, 8) },
          threatIntelligence: { ...advanced.simulation.skills.threatIntelligence, theory: bump(advanced.simulation.skills.threatIntelligence.theory, 14), guided: bump(advanced.simulation.skills.threatIntelligence.guided, 12), independent: bump(advanced.simulation.skills.threatIntelligence.independent, 8) },
          siem: { ...advanced.simulation.skills.siem, guided: bump(advanced.simulation.skills.siem.guided, 18), independent: bump(advanced.simulation.skills.siem.independent, 18), production: bump(advanced.simulation.skills.siem.production, 7) },
        },
      };
      simulation = recordSimulationEvent(simulation, 'contract', 'NIGHTGLASS-10 закрыт', `Гипотезы, Sigma/KQL и самостоятельная охота завершены. Подсказок: ${current.huntCaseHintUses}.`, 21000);
      return { ...current, huntCaseComplete: true, huntCaseStage: 7, balance: advanced.balance + 21000, darknetReputation: bump(current.darknetReputation, 10), contractOffers: [], simulation };
    }),
    completeCryptoCase: () => setProgress((current) => {
      if (current.cryptoCaseComplete) return current;
      const advanced = advanceSlots(current.simulation, current.balance, 3, 'contract');
      const bump = (value: number, amount: number) => Math.max(0, Math.min(100, value + amount));
      const passedExamIds = [...advanced.simulation.progression.passedExamIds];
      ['cryptography-pki', 'malware-static-analysis'].forEach((id) => { if (!passedExamIds.includes(id)) passedExamIds.push(id); });
      let simulation = { ...advanced.simulation, reputation: { ...advanced.simulation.reputation, professional: bump(advanced.simulation.reputation.professional, 7), reliability: bump(advanced.simulation.reputation.reliability, current.cryptoCaseHintUses > 10 ? 4 : 10), underground: bump(advanced.simulation.reputation.underground, 8) }, progression: { ...advanced.simulation.progression, passedExamIds }, skills: {
        ...advanced.simulation.skills,
        cryptography: { ...advanced.simulation.skills.cryptography, theory: bump(advanced.simulation.skills.cryptography.theory, 34), guided: bump(advanced.simulation.skills.cryptography.guided, 30), independent: bump(advanced.simulation.skills.cryptography.independent, 22), production: bump(advanced.simulation.skills.cryptography.production, 7) },
        malwareAnalysis: { ...advanced.simulation.skills.malwareAnalysis, theory: bump(advanced.simulation.skills.malwareAnalysis.theory, 32), guided: bump(advanced.simulation.skills.malwareAnalysis.guided, 30), independent: bump(advanced.simulation.skills.malwareAnalysis.independent, 24), production: bump(advanced.simulation.skills.malwareAnalysis.production, 8) },
        forensics: { ...advanced.simulation.skills.forensics, theory: bump(advanced.simulation.skills.forensics.theory, 12), guided: bump(advanced.simulation.skills.forensics.guided, 12), independent: bump(advanced.simulation.skills.forensics.independent, 10) },
        appsec: { ...advanced.simulation.skills.appsec, theory: bump(advanced.simulation.skills.appsec.theory, 10), guided: bump(advanced.simulation.skills.appsec.guided, 8) },
      }};
      simulation = recordSimulationEvent(simulation, 'contract', 'CIPHERFALL-11 закрыт', `PKI, TLS, PE/ELF и YARA разобраны. Подсказок: ${current.cryptoCaseHintUses}.`, 23000);
      return { ...current, cryptoCaseComplete: true, cryptoCaseStage: 7, balance: advanced.balance + 23000, darknetReputation: bump(current.darknetReputation, 9), contractOffers: [], simulation };
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
