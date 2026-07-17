import { AdvancedModuleCaseApp } from './AdvancedModuleCaseApp';
import { cloudModule } from '../missions/advancedModules';
import { useProgress } from '../system/ProgressContext';
export function CloudCaseApp(){ const { completeAdvancedCase } = useProgress(); return <AdvancedModuleCaseApp config={cloudModule} onComplete={() => completeAdvancedCase('cloud')} />; }
