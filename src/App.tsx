import { useEffect } from 'react';
import { BootScreen } from './components/BootScreen';
import { ChapterZeroStart } from './components/ChapterZeroStart';
import { ChapterZeroWorkspace } from './components/ChapterZeroWorkspace';
import { ChapterZeroLogs } from './components/ChapterZeroLogs';
import { ChapterZeroClinic } from './components/ChapterZeroClinic';
import { ChapterZeroContracts, act0ContractIds } from './components/ChapterZeroContracts';
import { ChapterZeroMastery } from './components/ChapterZeroMastery';
import { Desktop } from './components/Desktop';
import { useProgress } from './system/ProgressContext';
import { useMissionRuntime } from './system/MissionRuntimeContext';
import { UpdateBanner } from './components/UpdateControl';
import './styles/chapterZero.css';
import './styles/chapterZeroLogs.css';
import './styles/chapterZeroAct.css';

export default function App() {
  const { progress } = useProgress();
  const { store, ensureMission, markArtifactOpened } = useMissionRuntime();
  const workspace = store.missions['workspace-01'];
  const logs = store.missions['logs-01'];
  const clinic = store.missions['clinic-01'];
  const foundation = store.missions['foundation-check-01'];
  const workspaceComplete = workspace?.status === 'completed';
  const logsComplete = logs?.status === 'completed';
  const clinicComplete = clinic?.status === 'completed';
  const contractsComplete = act0ContractIds.every((id) => store.missions[id]?.status === 'completed');
  const foundationComplete = foundation?.status === 'completed';
  const workspaceIntakeOpened = workspace?.openedArtifacts.includes('artifact.workspace.intake') ?? false;

  useEffect(() => {
    if (!progress.booted) return;
    if (!workspaceComplete) { ensureMission('workspace-01'); return; }
    if (!logsComplete) { ensureMission('logs-01'); return; }
    if (!clinicComplete) { ensureMission('clinic-01'); return; }
    if (store.activeMissionId === 'clinic-01') return;
    if (!contractsComplete) {
      if (act0ContractIds.includes(store.activeMissionId as any)) return;
      const next = act0ContractIds.find((id) => store.missions[id]?.status !== 'completed') ?? act0ContractIds[0];
      ensureMission(next);
      return;
    }
    if (act0ContractIds.includes(store.activeMissionId as any)) return;
    if (!foundationComplete) { ensureMission('foundation-check-01'); return; }
  }, [clinicComplete, contractsComplete, ensureMission, foundationComplete, logsComplete, progress.booted, store.activeMissionId, store.missions, workspaceComplete]);

  useEffect(() => {
    if (!logsComplete || !clinic || clinic.status === 'completed' || store.activeMissionId !== 'clinic-01') return;
    ['artifact.clinic.brief', 'artifact.clinic.auth-log'].forEach((artifactId) => {
      if (!clinic.openedArtifacts.includes(artifactId)) markArtifactOpened(artifactId, 'chapter-0-2-handoff');
    });
  }, [clinic, logsComplete, markArtifactOpened, store.activeMissionId]);

  let content;
  if (!progress.booted) content = <BootScreen />;
  else if (!workspace || !workspaceIntakeOpened) content = <ChapterZeroStart />;
  else if (!workspaceComplete) content = <ChapterZeroWorkspace />;
  else if (!logsComplete) content = <ChapterZeroLogs />;
  else if (!clinicComplete || store.activeMissionId === 'clinic-01') content = <ChapterZeroClinic />;
  else if (!contractsComplete || act0ContractIds.includes(store.activeMissionId as any)) content = <ChapterZeroContracts />;
  else if (!foundationComplete || !progress.clinicWrapupComplete) content = <ChapterZeroMastery />;
  else content = <Desktop />;

  return <>{content}<UpdateBanner /></>;
}
