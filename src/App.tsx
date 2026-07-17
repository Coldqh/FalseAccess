import { useEffect } from 'react';
import { BootScreen } from './components/BootScreen';
import { ChapterZeroStart } from './components/ChapterZeroStart';
import { ChapterZeroWorkspace } from './components/ChapterZeroWorkspace';
import { ChapterZeroLogs } from './components/ChapterZeroLogs';
import { Desktop } from './components/Desktop';
import { useProgress } from './system/ProgressContext';
import { useMissionRuntime } from './system/MissionRuntimeContext';
import { UpdateBanner } from './components/UpdateControl';
import './styles/chapterZero.css';
import './styles/chapterZeroLogs.css';

export default function App() {
  const { progress } = useProgress();
  const { store, ensureMission, markArtifactOpened } = useMissionRuntime();
  const workspace = store.missions['workspace-01'];
  const workspaceComplete = workspace?.status === 'completed';
  const workspaceIntakeOpened = workspace?.openedArtifacts.includes('artifact.workspace.intake') ?? false;
  const logs = store.missions['logs-01'];
  const logsComplete = logs?.status === 'completed';
  const clinic = store.missions['clinic-01'];

  useEffect(() => {
    if (!progress.booted) return;
    if (!workspaceComplete) {
      ensureMission('workspace-01');
      return;
    }
    if (!logsComplete || !progress.onboardingDone) {
      ensureMission('logs-01');
      return;
    }
    ensureMission('clinic-01');
  }, [ensureMission, logsComplete, progress.booted, progress.onboardingDone, workspaceComplete]);

  useEffect(() => {
    if (!workspaceComplete || !logsComplete || !progress.onboardingDone) return;
    if (store.activeMissionId !== 'clinic-01' || !clinic) return;
    if (!clinic.openedArtifacts.includes('artifact.clinic.brief')) {
      markArtifactOpened('artifact.clinic.brief', 'chapter-0-2-handoff');
    }
    if (!clinic.openedArtifacts.includes('artifact.clinic.auth-log')) {
      markArtifactOpened('artifact.clinic.auth-log', 'chapter-0-2-handoff');
    }
  }, [clinic, logsComplete, markArtifactOpened, progress.onboardingDone, store.activeMissionId, workspaceComplete]);

  let content;
  if (!progress.booted) content = <BootScreen />;
  else if (!workspace || !workspaceIntakeOpened) content = <ChapterZeroStart />;
  else if (!workspaceComplete) content = <ChapterZeroWorkspace />;
  else if (!logsComplete || !progress.onboardingDone) content = <ChapterZeroLogs />;
  else content = <Desktop />;

  return (
    <>
      {content}
      <UpdateBanner />
    </>
  );
}
