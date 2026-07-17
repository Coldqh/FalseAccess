import { AdvancedModuleCaseApp } from './AdvancedModuleCaseApp';
import { supplyModule } from '../missions/advancedModules';
import { useProgress } from '../system/ProgressContext';
export function SupplyChainCaseApp(){ const { completeAdvancedCase } = useProgress(); return <AdvancedModuleCaseApp config={supplyModule} onComplete={() => completeAdvancedCase('supply')} />; }
