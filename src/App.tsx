import { useEffect } from 'react';
import { BootScreen } from './components/BootScreen';
import { ChapterZeroStart } from './components/ChapterZeroStart';
import { ChapterZeroWorkspace } from './components/ChapterZeroWorkspace';
import { Desktop } from './components/Desktop';
import { useProgress } from './system/ProgressContext';
import { useMissionRuntime } from './system/MissionRuntimeContext';
import { UpdateBanner } from './components/UpdateControl';
import './styles/chapterZero.css';

export default function App() {
  const { progress } = useProgress();
  const { store, ensureMission, markArtifactOpened } = useMissionRuntime();
  const workspace = store.missions['workspace-01'];
  const workspaceComplete = workspace?.status === 'completed';
  const clinic = store.missions['clinic-01'];
  const intakeOpened = workspace?.openedArtifacts.includes('artifact.workspace.intake') ?? false;

  useEffect(() => {
    if (!progress.booted) return;
    if (!workspaceComplete || !progress.onboardingDone) ensureMission('workspace-01');
    else ensureMission('clinic-01');
  }, [ensureMission, progress.booted, progress.onboardingDone, workspaceComplete]);


  useEffect(() => {
    if (!workspaceComplete || !progress.onboardingDone) return;
    if (store.activeMissionId !== 'clinic-01' || !clinic) return;
    if (!clinic.openedArtifacts.includes('artifact.clinic.brief')) {
      markArtifactOpened('artifact.clinic.brief', 'chapter-0-1-handoff');
    }
  }, [clinic, markArtifactOpened, progress.onboardingDone, store.activeMissionId, workspaceComplete]);

  let content;
  if (!progress.booted) content = <BootScreen />;
  else if (!workspace || !intakeOpened) content = <ChapterZeroStart />;
  else if (!workspaceComplete || !progress.onboardingDone) content = <ChapterZeroWorkspace />;
  else content = <Desktop />;

  return (
    <>
      {content}
      <UpdateBanner />
    </>
  );
}
