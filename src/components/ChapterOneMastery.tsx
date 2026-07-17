import { useMemo, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { CaseReasoningPanel } from './CaseReasoningPanel';
import { CaseShellPanel } from './CaseShellPanel';
import { SocQueuePanel } from './SocQueuePanel';
import { createSferaShiftEnvironment } from '../content/missions/sferaShiftCheck01/environment';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import { useProgress } from '../system/ProgressContext';

const evidenceSuggestions = [
  { claimId: 'hypothesis.shift.chain', evidenceId: 'artifact.shift.processes', label: 'Chain → process tree', note: 'Process chain подтверждена endpoint telemetry.' },
  { claimId: 'outcome.shift.chain', evidenceId: 'artifact.shift.dns', label: 'Chain → DNS', note: 'DNS activity связана с тем же workstation.' },
  { claimId: 'outcome.shift.scope', evidenceId: 'artifact.shift.auth', label: 'Scope → identity', note: 'Identity telemetry не подтверждает новую внешнюю успешную сессию.' },
  { claimId: 'hypothesis.shift.backup', evidenceId: 'artifact.shift.backup', label: 'Backup → change ticket', note: 'Ночная передача подтверждена штатной задачей и change ticket.' },
];

export function ChapterOneMastery() {
  const runtime = useMissionRuntime();
  const { completeInterview, completeFirstShift, setFlag } = useProgress();
  const mission = runtime.activeMission;
  const definition = getMissionDefinition('sfera-shift-check-01');
  const bundle = useMemo(() => createSferaShiftEnvironment(mission?.seed ?? 1), [mission?.seed]);
  const [reasons, setReasons] = useState<string[]>([]);
  if (!mission || mission.missionId !== 'sfera-shift-check-01' || !definition) return <main className="chapter-one-loading">Первая смена не загружена.</main>;

  const complete = () => {
    const result = runtime.completeActiveMission();
    setReasons(result.reasons);
  };

  const unlockMainGame = () => {
    completeInterview(5);
    setFlag('jobAccepted', true);
    setFlag('phishingComplete', true);
    setFlag('powershellComplete', true);
    setFlag('dnsComplete', true);
    setFlag('shiftReportChoice', 'full');
    completeFirstShift(0);
  };

  if (mission.status === 'completed') {
    return <main className="chapter-one-complete chapter-one-mastery-complete"><section><ShieldCheck size={40} /><p className="eyebrow">АКТ 1 / СЛОЙ 3 ПРОЙДЕН</p><h1>Первая смена закрыта</h1><p>Очередь разобрана без подсказок. Один легитимный alert отделён от связанной mail-endpoint-DNS цепочки.</p><div className="chapter-one-score-grid"><article><span>CORRECTNESS</span><strong>{mission.assessment?.dimensionScores.correctness ?? 0}</strong></article><article><span>EVIDENCE</span><strong>{mission.assessment?.dimensionScores.evidence ?? 0}</strong></article><article><span>JUDGMENT</span><strong>{mission.assessment?.dimensionScores.judgment ?? 0}</strong></article><article><span>AUTONOMY</span><strong>100</strong></article></div><div className="chapter-one-next"><span>ОТКРЫТО</span><h2>Основная игра</h2><p>Город, работа в «Сфере», повседневные контракты и первый серый контакт.</p></div><button className="primary-action" onClick={unlockMainGame}>Перейти в город <ArrowRight size={17} /></button></section></main>;
  }

  return <main className="chapter-one-screen chapter-one-mastery">
    <header className="chapter-one-header"><div><p className="eyebrow">АКТ 1 / СЛОЙ 3 / БЕЗ ПОМОЩИ</p><h1>{definition.title}</h1><p>{definition.briefing.objective}</p></div><div className="chapter-one-no-hints">Подсказки отключены</div></header>
    <section className="chapter-one-layout"><div className="chapter-one-tools"><SocQueuePanel items={bundle.queue} title="WATCHTOWER / LIVE SHIFT" /><CaseShellPanel environment={bundle.shell} title="SHIFT ANALYST SHELL" /></div><CaseReasoningPanel evidenceSuggestions={evidenceSuggestions} /></section>
    <footer className="chapter-one-footer"><div><span>Alerts: {mission.actionLog.filter((event) => event.type === 'query.executed').length}/4</span><span>Evidence: {mission.evidenceLinks.length}/4</span><span>Hypotheses: {mission.hypotheses.length}/4</span></div><button className="primary-action" onClick={complete}>Закрыть смену</button>{reasons.length > 0 && <p>Не закрыто: {reasons.join(' · ')}</p>}</footer>
  </main>;
}
