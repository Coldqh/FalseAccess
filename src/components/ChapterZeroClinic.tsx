import { useMemo, useState } from 'react';
import { ArrowRight, CircleHelp, RotateCcw, ShieldCheck } from 'lucide-react';
import { CaseShellPanel } from './CaseShellPanel';
import { PythonEvidencePanel } from './PythonEvidencePanel';
import { CaseReasoningPanel } from './CaseReasoningPanel';
import { createClinicEnvironment, clinicPythonStarter } from '../content/missions/clinic01/environment';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

const evidenceSuggestions = [
  { claimId: 'hypothesis.clinic.password-spray', evidenceId: 'artifact.clinic.auth-log', label: 'Spray → auth.log', note: 'Failed auth-события получены из auth.log.' },
  { claimId: 'hypothesis.clinic.local-process', evidenceId: 'artifact.clinic.processes', label: 'Процесс → processes.csv', note: 'PID, PPID, user и path получены из snapshot.' },
  { claimId: 'outcome.clinic.network', evidenceId: 'artifact.clinic.network', label: 'PID → connections.csv', note: 'Внешнее соединение связано с процессом по PID.' },
  { claimId: 'outcome.clinic.python', evidenceId: 'artifact.clinic.events', label: 'Python → events.jsonl', note: 'Анализатор прошёл visible и hidden datasets.' },
];

const hints = [
  'Сначала отдели process snapshot от network snapshot. Один источник не доказывает всю цепочку.',
  'В process snapshot ищи необычный путь, пользователя и родителя. Потом используй PID в connections.',
  'Функция analyze(path) должна читать каждую JSONL-строку через try/except и не падать на повреждённой записи.',
  'Поддержи spray и локальный процесс отдельно. Общую причину оставь unknown или rejected без причинного evidence.',
];

export function ChapterZeroClinic() {
  const runtime = useMissionRuntime();
  const mission = runtime.activeMission;
  const definition = getMissionDefinition('clinic-01');
  const bundle = useMemo(() => createClinicEnvironment(mission?.seed ?? 1), [mission?.seed]);
  const [hintTier, setHintTier] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);

  if (!mission || mission.missionId !== 'clinic-01' || !definition) return <main className="chapter-zero-loading">CLINIC-01 не загружена.</main>;

  const requestHint = () => {
    const next = Math.min(5, hintTier + 1);
    setHintTier(next);
    runtime.recordHint(next, `clinic-hint-${next}`);
  };

  const complete = () => {
    const result = runtime.completeActiveMission();
    setReasons(result.reasons);
  };

  if (mission.status === 'completed') {
    return <main className="act0-complete-screen"><section><ShieldCheck size={34} /><p className="eyebrow">СЛОЙ 1 / СЮЖЕТНАЯ МИССИЯ ЗАКРЫТА</p><h1>CLINIC-01 завершена</h1><p>Обучение закончено. Дальше система не объясняет команды и не показывает подсказки.</p><div className="act0-score-grid"><article><span>HIDDEN TESTS</span><strong>2/2</strong></article><article><span>ПОДСКАЗКА</span><strong>{mission.assessment?.autonomy.highestHintTier ?? 0}/5</strong></article><article><span>EVIDENCE</span><strong>{mission.evidenceLinks.length}</strong></article><article><span>РЕШЕНИЕ</span><strong>{mission.assessment?.matchedSolutionFamilyId?.includes('isolate') ? 'изоляция' : 'ограничение'}</strong></article></div><button className="primary-action" onClick={() => runtime.ensureMission('act0-contract-files')}>Перейти к контрактам <ArrowRight size={17} /></button></section></main>;
  }

  return <main className="act0-case-screen">
    <header className="act0-case-header"><div><p className="eyebrow">АКТ 0 / ГЛАВА 0.3 / СЛОЙ 1</p><h1>{definition.title}</h1><p>{definition.briefing.objective}</p></div><div><button onClick={requestHint}><CircleHelp size={16} />Подсказка {Math.min(5, hintTier + 1)}/5</button><button onClick={() => runtime.resetActiveMission()}><RotateCcw size={15} />Reset</button></div></header>
    {hintTier > 0 && <section className="act0-hint"><strong>Максим</strong><p>{hints[Math.min(hintTier - 1, hints.length - 1)]}</p></section>}
    <section className="act0-case-grid">
      <div className="act0-tools-column">
        <CaseShellPanel environment={bundle.shell} title="CLINIC SHELL" />
        <PythonEvidencePanel
          starter={clinicPythonStarter}
          visible={bundle.visiblePython}
          hidden={bundle.hiddenPython}
          finding="clinic-python-hidden-tests"
          title="analyze.py"
          instruction="Реализуй analyze(path). Видимый и скрытый наборы различаются; значения нельзя зашить вручную."
          source="clinic-python"
        />
      </div>
      <CaseReasoningPanel evidenceSuggestions={evidenceSuggestions} />
    </section>
    <footer className="act0-case-footer"><div><span>Критические ошибки: {mission.assessment?.criticalErrors.length ?? 0}</span><span>Evidence: {mission.evidenceLinks.length}/4</span><span>Hypotheses: {mission.hypotheses.length}/4</span></div><button className="primary-action" onClick={complete}>Проверить и закрыть миссию</button>{reasons.length > 0 && <p>Не закрыто: {reasons.join(' · ')}</p>}</footer>
  </main>;
}
