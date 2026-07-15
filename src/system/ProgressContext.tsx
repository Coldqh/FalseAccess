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
  completeInterview: (score: number) => void;
  completeFirstShift: (mistakes: number) => void;
  acceptContract: (contract: GeneratedContract) => void;
  abandonContract: () => void;
  completeContract: (clean: boolean) => void;
  refreshContracts: () => void;
  resetProgress: () => void;
}

const STORAGE_KEY = 'false-access-progress-v3';
const ProgressContext = createContext<ProgressContextValue | null>(null);

function loadProgress(): ProgressState {
  const fallback = createInitialProgress();
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const raw = currentRaw
      ?? localStorage.getItem('false-access-progress-v2')
      ?? localStorage.getItem('false-access-progress-v1');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const legacy = !currentRaw;
    return {
      ...fallback,
      ...parsed,
      interviewComplete: legacy ? false : Boolean(parsed.interviewComplete),
      interviewScore: legacy ? 0 : Number(parsed.interviewScore ?? 0),
      jobOfferUnlocked: legacy ? false : Boolean(parsed.jobOfferUnlocked),
      jobAccepted: legacy ? false : Boolean(parsed.jobAccepted),
      firstShiftComplete: legacy ? false : Boolean(parsed.firstShiftComplete),
      firstShiftMistakes: legacy ? 0 : Number(parsed.firstShiftMistakes ?? 0),
      academyLessons: Array.isArray(parsed.academyLessons) ? parsed.academyLessons : [],
      terminalObjectives: Array.isArray(parsed.terminalObjectives) ? parsed.terminalObjectives : [],
      readMail: Array.isArray(parsed.readMail) ? parsed.readMail : [],
      readMessages: Array.isArray(parsed.readMessages) ? parsed.readMessages : [],
      contractOffers: Array.isArray(parsed.contractOffers) ? parsed.contractOffers : [],
      completedContracts: Array.isArray(parsed.completedContracts) ? parsed.completedContracts : [],
      factionRep: { ...fallback.factionRep, ...(parsed.factionRep ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (progress.interviewComplete && !progress.jobOfferUnlocked) {
      setProgress((current) => ({ ...current, jobOfferUnlocked: true }));
    }
  }, [progress.interviewComplete, progress.jobOfferUnlocked]);

  useEffect(() => {
    if (progress.contractOffers.length === 0) {
      setProgress((current) => ({ ...current, contractOffers: generateContractOffers(current, current.contractRefreshes) }));
    }
  }, [progress.contractOffers.length, progress.contractRefreshes]);

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
    completeAcademyLesson: (id) => setProgress((current) => current.academyLessons.includes(id)
      ? current
      : { ...current, academyLessons: [...current.academyLessons, id] }),
    completeTerminalObjective: (id) => setProgress((current) => current.terminalObjectives.includes(id)
      ? current
      : { ...current, terminalObjectives: [...current.terminalObjectives, id], contractOffers: [] }),
    setFlag: (key, value) => setProgress((current) => ({
      ...current,
      [key]: value,
      ...(key === 'pythonComplete' || key === 'alertReviewed' || key === 'reportSubmitted' ? { contractOffers: [] } : {}),
    })),
    markMailRead: (id) => setProgress((current) => current.readMail.includes(id)
      ? current
      : { ...current, readMail: [...current.readMail, id] }),
    markMessageRead: (id) => setProgress((current) => current.readMessages.includes(id)
      ? current
      : { ...current, readMessages: [...current.readMessages, id] }),
    completeInterview: (score) => setProgress((current) => ({
      ...current,
      interviewComplete: true,
      interviewScore: Math.max(current.interviewScore, score),
      jobOfferUnlocked: true,
    })),
    completeFirstShift: (mistakes) => setProgress((current) => ({
      ...current,
      firstShiftComplete: true,
      firstShiftMistakes: mistakes,
      balance: current.balance + Math.max(500, 1200 - mistakes * 150),
      factionRep: { ...current.factionRep, sfera: (current.factionRep.sfera ?? 0) + Math.max(1, 3 - mistakes) },
      contractOffers: [],
    })),
    acceptContract: (contract) => setProgress((current) => ({ ...current, activeContract: contract })),
    abandonContract: () => setProgress((current) => ({ ...current, activeContract: null })),
    completeContract: (clean) => setProgress((current) => {
      const contract = current.activeContract;
      if (!contract) return current;
      const record: CompletedContract = {
        id: contract.id,
        title: contract.title,
        factionId: contract.factionId,
        skill: contract.skill,
        pay: contract.pay,
        completedAt: new Date().toISOString(),
        clean,
      };
      const repGain = clean ? 2 : 1;
      return {
        ...current,
        balance: current.balance + contract.pay,
        activeContract: null,
        completedContracts: [record, ...current.completedContracts].slice(0, 50),
        factionRep: {
          ...current.factionRep,
          [contract.factionId]: (current.factionRep[contract.factionId] ?? 0) + repGain,
        },
        contractRefreshes: current.contractRefreshes + 1,
        contractOffers: [],
      };
    }),
    refreshContracts: () => setProgress((current) => ({ ...current, contractRefreshes: current.contractRefreshes + 1, contractOffers: [] })),
    resetProgress: () => setProgress({ ...createInitialProgress(), booted: true }),
  }), [progress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used inside ProgressProvider');
  return context;
}
