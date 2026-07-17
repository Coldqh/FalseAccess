import { useMemo, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { CaseShellPanel } from './CaseShellPanel';
import { PythonEvidencePanel } from './PythonEvidencePanel';
import { CaseReasoningPanel } from './CaseReasoningPanel';
import { createFoundationEnvironment, foundationPythonStarter } from '../content/missions/foundationCheck01/environment';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import { useProgress } from '../system/ProgressContext';

const evidenceSuggestions = [
  { claimId: 'hypothesis.foundation.spray', evidenceId: 'artifact.foundation.auth', label: 'Spray → auth.log', note: 'Серия отказов получена инструментально.' },
  { claimId: 'hypothesis.foundation.process', evidenceId: 'artifact.foundation.processes', label: 'Процесс → processes.csv', note: 'PID и path получены из process snapshot.' },
  { claimId: 'outcome.foundation.transfer', evidenceId: 'artifact.foundation.network', label: 'Связать connections.csv', note: 'Remote связан с PID.' },
  { claimId: 'outcome.foundation.python', evidenceId: 'artifact.foundation.events', label: 'Python → events.jsonl', note: 'Анализатор адаптирован к новой схеме и прошёл hidden tests.' },
];

export function ChapterZeroMastery() {
  const runtime = useMissionRuntime();
  const { progress, setFlag } = useProgress();
  const mission = runtime.activeMission;
  const definition = getMissionDefinition('foundation-check-01');
  const bundle = useMemo(() => createFoundationEnvironment(mission?.seed ?? 1), [mission?.seed]);
  const [reasons, setReasons] = useState<string[]>([]);
  if (!mission || mission.missionId !== 'foundation-check-01' || !definition) return <main className="chapter-zero-loading">Контрольная операция не загружена.</main>;

  const complete = () => {
    const result = runtime.completeActiveMission();
    setReasons(result.reasons);
  };

  const unlockAct1 = () => {
    const completedObjectives = ['pwd','ls','cd-case','read-brief','grep-failed','inspect-processes'];
    setFlag('terminalObjectives', Array.from(new Set([...progress.terminalObjectives, ...completedObjectives])));
    setFlag('pythonComplete', true);
    setFlag('alertReviewed', true);
    setFlag('reportSubmitted', true);
    setFlag('clinicIntroComplete', true);
    setFlag('clinicWrapupComplete', true);
    setFlag('onboardingDone', true);
  };

  if (mission.status === 'completed') {
    return <main className="act0-complete-screen act0-mastery-complete"><section><ShieldCheck size={38} /><p className="eyebrow">СЛОЙ 3 / MASTERY CHECK ПРОЙДЕН</p><h1>Акт 0 подтверждён</h1><p>Новая форма задачи решена без наставника, готового маршрута и раскрытого типа инцидента.</p><div className="act0-score-grid"><article><span>CORRECTNESS</span><strong>{mission.assessment?.dimensionScores.correctness ?? 0}</strong></article><article><span>EVIDENCE</span><strong>{mission.assessment?.dimensionScores.evidence ?? 0}</strong></article><article><span>JUDGMENT</span><strong>{mission.assessment?.dimensionScores.judgment ?? 0}</strong></article><article><span>AUTONOMY</span><strong>100</strong></article></div><div className="act0-next-card"><span>ОТКРЫТО</span><h2>Акт 1 — Сфера</h2><p>Техническое собеседование, telemetry, SIEM, EDR и первая смена.</p></div><button className="primary-action" onClick={unlockAct1}>Перейти к основной игре <ArrowRight size={17} /></button></section></main>;
  }

  return <main className="act0-case-screen act0-mastery-screen">
    <header className="act0-case-header"><div><p className="eyebrow">АКТ 0 / СЛОЙ 3 / БЕЗ ПОМОЩИ</p><h1>{definition.title}</h1><p>{definition.briefing.objective}</p></div><div className="act0-no-hints">Подсказки отключены</div></header>
    <section className="act0-case-grid">
      <div className="act0-tools-column">
        <CaseShellPanel environment={bundle.shell} title="FOUNDATION CHECK SHELL" />
        <PythonEvidencePanel starter={foundationPythonStarter} visible={bundle.visiblePython} hidden={bundle.hiddenPython} finding="foundation-python-hidden-tests" title="transfer_analyze.py" instruction="Адаптируй analyze(path) к новой схеме type/outcome/src. Hidden dataset снова отличается." source="foundation-check-python" />
      </div>
      <CaseReasoningPanel evidenceSuggestions={evidenceSuggestions} />
    </section>
    <footer className="act0-case-footer"><div><span>Источники: {mission.openedArtifacts.length}/6</span><span>Evidence: {mission.evidenceLinks.length}/4</span><span>Hypotheses: {mission.hypotheses.length}/3</span></div><button className="primary-action" onClick={complete}>Завершить контрольную операцию</button>{reasons.length > 0 && <p>Не закрыто: {reasons.join(' · ')}</p>}</footer>
  </main>;
}
