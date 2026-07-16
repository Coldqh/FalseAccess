import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CompletedContract, GeneratedContract, ProgressState } from '../types';
import { createInitialProgress } from '../data/content';
import { generateContractOffers } from '../data/contracts';

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
  saveNow: () => string;
  importProgress: (value: unknown) => boolean;
  resetProgress: () => void;
}

const STORAGE_KEY = 'false-access-progress-v4';
const SAVE_TIME_KEY = 'false-access-last-saved-at';
const ProgressContext = createContext<ProgressContextValue | null>(null);

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
    jobAccepted: legacy ? false : Boolean(parsed.jobAccepted),
    firstShiftComplete: legacy || legacyShortShift ? false : Boolean(parsed.firstShiftComplete),
    firstShiftMistakes: legacy || legacyShortShift ? 0 : Number(parsed.firstShiftMistakes ?? 0),
    firstShiftStage: legacy || legacyShortShift ? 0 : (Boolean(parsed.firstShiftComplete) ? 5 : Number(parsed.firstShiftStage ?? 0)),
    phishingComplete: legacy || legacyShortShift ? false : Boolean(parsed.phishingComplete),
    powershellComplete: legacy || legacyShortShift ? false : Boolean(parsed.powershellComplete),
    dnsComplete: legacy || legacyShortShift ? false : Boolean(parsed.dnsComplete),
    shiftReportChoice: legacyShortShift ? '' : (parsed.shiftReportChoice === 'full' || parsed.shiftReportChoice === 'soft' ? parsed.shiftReportChoice : ''),
    criminalContactUnlocked: legacy || legacyShortShift ? false : (Boolean(parsed.criminalContactUnlocked) || Boolean(parsed.firstShiftComplete)),
    criminalContactResponse: legacyShortShift ? '' : (parsed.criminalContactResponse === 'interested' || parsed.criminalContactResponse === 'declined' ? parsed.criminalContactResponse : ''),
    pythonLessonStep: Number(parsed.pythonLessonStep ?? 0),
    academyLessons: Array.isArray(parsed.academyLessons) ? parsed.academyLessons.filter((item): item is string => typeof item === 'string') : [],
    terminalObjectives,
    pythonComplete,
    alertReviewed,
    reportSubmitted,
    readMail: Array.isArray(parsed.readMail) ? parsed.readMail.filter((item): item is string => typeof item === 'string') : [],
    readMessages: Array.isArray(parsed.readMessages) ? parsed.readMessages.filter((item): item is string => typeof item === 'string') : [],
    contractOffers: Array.isArray(parsed.contractOffers) ? parsed.contractOffers : [],
    completedContracts: Array.isArray(parsed.completedContracts) ? parsed.completedContracts : [],
    factionRep: { ...fallback.factionRep, ...(parsed.factionRep ?? {}) },
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    balance: Number.isFinite(Number(parsed.balance)) ? Number(parsed.balance) : fallback.balance,
    contractRefreshes: Number.isFinite(Number(parsed.contractRefreshes)) ? Number(parsed.contractRefreshes) : 0,
  };
}

function loadProgress(): ProgressState {
  const fallback = createInitialProgress();
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const v3Raw = localStorage.getItem('false-access-progress-v3');
    const raw = currentRaw
      ?? v3Raw
      ?? localStorage.getItem('false-access-progress-v2')
      ?? localStorage.getItem('false-access-progress-v1');
    if (!raw) return fallback;
    return normalizeProgress(JSON.parse(raw), !currentRaw && !v3Raw) ?? fallback;
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

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => { persist(progress); }, [progress]);

  useEffect(() => {
    if (progress.interviewComplete && !progress.jobOfferUnlocked) setProgress((current) => ({ ...current, jobOfferUnlocked: true }));
  }, [progress.interviewComplete, progress.jobOfferUnlocked]);

  useEffect(() => {
    if (progress.contractOffers.length === 0) setProgress((current) => ({ ...current, contractOffers: generateContractOffers(current, current.contractRefreshes) }));
  }, [progress.contractOffers.length, progress.contractRefreshes]);

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
    completeInterview: (score) => setProgress((current) => ({ ...current, interviewComplete: true, interviewScore: Math.max(current.interviewScore, score), jobOfferUnlocked: true })),
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
    acceptContract: (contract) => setProgress((current) => ({ ...current, activeContract: contract })),
    abandonContract: () => setProgress((current) => ({ ...current, activeContract: null })),
    completeContract: (clean) => setProgress((current) => {
      const contract = current.activeContract;
      if (!contract) return current;
      const record: CompletedContract = { id: contract.id, title: contract.title, factionId: contract.factionId, skill: contract.skill, pay: contract.pay, completedAt: new Date().toISOString(), clean };
      return {
        ...current,
        balance: current.balance + contract.pay,
        activeContract: null,
        completedContracts: [record, ...current.completedContracts].slice(0, 50),
        factionRep: { ...current.factionRep, [contract.factionId]: (current.factionRep[contract.factionId] ?? 0) + (clean ? 2 : 1) },
        contractRefreshes: current.contractRefreshes + 1,
        contractOffers: [],
      };
    }),
    refreshContracts: () => setProgress((current) => ({ ...current, contractRefreshes: current.contractRefreshes + 1, contractOffers: [] })),
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
