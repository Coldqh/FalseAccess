import { BootScreen } from './components/BootScreen';
import { Desktop } from './components/Desktop';
import { useProgress } from './system/ProgressContext';
import { UpdateBanner } from './components/UpdateControl';

export default function App() {
  const { progress } = useProgress();
  return (
    <>
      {progress.booted ? <Desktop /> : <BootScreen />}
      <UpdateBanner />
    </>
  );
}
