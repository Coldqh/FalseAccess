import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  appendMissionAction,
  attemptMissionCompletion,
  commitDecision,
  createMissionRuntime,
  linkEvidence,
  openArtifact,
  resetMission,
  submitReport,
  upsertHypothesis,
  useHint,
} from '../core/scenario/engine';
import type {
  EvidenceLink,
  MissionActionInput,
  MissionRuntimeState,
  PlayerDecision,
  PlayerHypothesis,
  PlayerReport,
} from '../core/scenario/types';
import { getMissionDefinition, missionRegistry } from '../content/missions/registry';
import {
  createLearningRuntimeStore,
  loadLearningRuntime,
  persistLearningRuntime,
  type LearningRuntimeStore,
} from '../persistence/learningRuntime';

interface MissionRuntimeContextValue {
  store: LearningRuntimeStore;
  activeMission: MissionRuntimeState | null;
  ensureMission: (missionId: string, seed?: number) => void;
  activateMission: (missionId: string) => void;
  recordAction: (action: MissionActionInput) => void;
  markArtifactOpened: (artifactId: string, source?: string) => void;
  saveHypothesis: (input: Omit<PlayerHypothesis, 'id' | 'createdAt' | 'updatedAt'>) => void;
  attachEvidence: (input: Omit<EvidenceLink, 'id' | 'createdAt'>) => void;
  saveDecision: (input: Omit<PlayerDecision, 'id' | 'committedAt'>) => void;
  saveReport: (sections: PlayerReport['sections']) => void;
  recordHint: (tier: number, hintId: string) => void;
  completeActiveMission: () => { completed: boolean; reasons: string[] };
  resetActiveMission: () => void;
  resetLearningRuntime: () => void;
}

const MissionRuntimeContext = createContext<MissionRuntimeContextValue | null>(null);

function seedForMission(missionId: string): number {
  let hash = 2166136261;
  for (const char of missionId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function MissionRuntimeProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<LearningRuntimeStore>(() => {
    if (typeof window === 'undefined') return createLearningRuntimeStore();
    return loadLearningRuntime(missionRegistry);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') persistLearningRuntime(store);
  }, [store]);

  const activeMission = store.activeMissionId ? store.missions[store.activeMissionId] ?? null : null;

  const updateActive = (updater: (state: MissionRuntimeState) => MissionRuntimeState) => {
    setStore((current) => {
      const missionId = current.activeMissionId;
      if (!missionId) return current;
      const state = current.missions[missionId];
      if (!state) return current;
      const next = updater(state);
      if (next === state) return current;
      return { ...current, missions: { ...current.missions, [missionId]: next } };
    });
  };

  const value = useMemo<MissionRuntimeContextValue>(() => ({
    store,
    activeMission,
    ensureMission: (missionId, seed) => setStore((current) => {
      const definition = getMissionDefinition(missionId);
      if (!definition) return current;
      if (current.missions[missionId]) {
        return current.activeMissionId ? current : { ...current, activeMissionId: missionId };
      }
      const runtime = createMissionRuntime(definition, seed ?? seedForMission(missionId));
      return {
        ...current,
        activeMissionId: missionId,
        missions: { ...current.missions, [missionId]: runtime },
      };
    }),
    activateMission: (missionId) => setStore((current) => current.missions[missionId]
      ? { ...current, activeMissionId: missionId }
      : current),
    recordAction: (action) => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? appendMissionAction(definition, state, action) : state;
    }),
    markArtifactOpened: (artifactId, source) => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? openArtifact(definition, state, artifactId, source) : state;
    }),
    saveHypothesis: (input) => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? upsertHypothesis(definition, state, input) : state;
    }),
    attachEvidence: (input) => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? linkEvidence(definition, state, input) : state;
    }),
    saveDecision: (input) => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? commitDecision(definition, state, input) : state;
    }),
    saveReport: (sections) => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? submitReport(definition, state, sections) : state;
    }),
    recordHint: (tier, hintId) => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? useHint(definition, state, tier, hintId) : state;
    }),
    completeActiveMission: () => {
      if (!activeMission) return { completed: false, reasons: ['active-mission-missing'] };
      const definition = getMissionDefinition(activeMission.missionId);
      if (!definition) return { completed: false, reasons: ['mission-definition-missing'] };
      const attempt = attemptMissionCompletion(definition, activeMission);
      setStore((current) => ({
        ...current,
        missions: { ...current.missions, [activeMission.missionId]: attempt.state },
      }));
      return { completed: attempt.completed, reasons: attempt.reasons };
    },
    resetActiveMission: () => updateActive((state) => {
      const definition = getMissionDefinition(state.missionId);
      return definition ? resetMission(definition, state) : state;
    }),
    resetLearningRuntime: () => setStore(createLearningRuntimeStore()),
  // updateActive intentionally uses the current provider closure; state changes recreate value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [store, activeMission]);

  return <MissionRuntimeContext.Provider value={value}>{children}</MissionRuntimeContext.Provider>;
}

export function useMissionRuntime() {
  const context = useContext(MissionRuntimeContext);
  if (!context) throw new Error('useMissionRuntime must be used inside MissionRuntimeProvider.');
  return context;
}
