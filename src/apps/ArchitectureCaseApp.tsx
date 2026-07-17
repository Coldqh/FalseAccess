import { AdvancedModuleCaseApp } from './AdvancedModuleCaseApp';
import { architectureModule } from '../missions/advancedModules';
import { useProgress } from '../system/ProgressContext';
export function ArchitectureCaseApp(){ const { completeAdvancedCase } = useProgress(); return <AdvancedModuleCaseApp config={architectureModule} onComplete={() => completeAdvancedCase('architecture')} />; }
