import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CompletedContract, GeneratedContract, ProgressState } from '../types';
import { createInitialProgress } from '../data/content';
import { generateContractOffers } from '../data/contracts';

interface ProgressContextValue {
  progress: ProgressState;
  completeTerminalObjective: (id: string) => void;
  setFlag: <K extends keyof ProgressState>(key: K, value: ProgressState[K]) => void;
  markMailRead: (id: string) => void;
  markMessageRead: (id: string) => void;
  acceptContract: (contract: GeneratedContract) => void;
  abandonContract: () => void;
  completeContract: (clean: boolean) => void;
  refreshContracts: () => void;
  resetProgress: () => void;
}

const STORAGE_KEY = 'false-access-progress-v2';
const ProgressContext = createContext<ProgressContextValue | null>(null);

function loadProgress(): ProgressState {
  const fallback = createInitialProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('false-access-progress-v1');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...fallback,
      ...parsed,
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
    const terminalDone = progress.terminalObjectives.length >= 6;
    const shouldUnlock = terminalDone && progress.pythonComplete && progress.alertReviewed && progress.reportSubmitted;
    if (shouldUnlock && !progress.jobOfferUnlocked) {
      setProgress((current) => ({ ...current, jobOfferUnlocked: true }));
    }
  }, [progress.terminalObjectives.length, progress.pythonComplete, progress.alertReviewed, progress.reportSubmitted, progress.jobOfferUnlocked]);

  useEffect(() => {
    if (progress.contractOffers.length === 0) {
      setProgress((current) => ({ ...current, contractOffers: generateContractOffers(current, current.contractRefreshes) }));
    }
  }, [progress.contractOffers.length, progress.contractRefreshes]);

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
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
      const next = {
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
      return next;
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
