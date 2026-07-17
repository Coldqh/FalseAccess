import { AdvancedModuleCaseApp } from './AdvancedModuleCaseApp';
import { capstoneModule } from '../missions/advancedModules';
import { useProgress } from '../system/ProgressContext';
export function CapstoneCaseApp(){ const { completeAdvancedCase } = useProgress(); return <AdvancedModuleCaseApp config={capstoneModule} onComplete={() => completeAdvancedCase('capstone')} />; }
