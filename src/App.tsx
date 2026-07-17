import { useEffect } from 'react';
import { BootScreen } from './components/BootScreen';
import { Desktop } from './components/Desktop';
import { useProgress } from './system/ProgressContext';
import { useMissionRuntime } from './system/MissionRuntimeContext';
import { UpdateBanner } from './components/UpdateControl';

export default function App() {
  const { progress } = useProgress();
  const { ensureMission } = useMissionRuntime();

  useEffect(() => {
    if (progress.booted) ensureMission('clinic-01');
  }, [ensureMission, progress.booted]);

  return (
    <>
      {progress.booted ? <Desktop /> : <BootScreen />}
      <UpdateBanner />
    </>
  );
}
