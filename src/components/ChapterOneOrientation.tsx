import { useMemo, useState } from 'react';
import { ArrowRight, CircleHelp, RotateCcw, ShieldCheck } from 'lucide-react';
import { CaseReasoningPanel } from './CaseReasoningPanel';
import { CaseShellPanel } from './CaseShellPanel';
import { SocQueuePanel } from './SocQueuePanel';
import { createSferaOrientationEnvironment } from '../content/missions/sferaOrientation01/environment';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

const evidenceSuggestions = [
  { claimId: 'hypothesis.sfera.phishing', evidenceId: 'artifact.sfera.mail', label: 'Phishing → raw EML', note: 'Домен и authentication results получены из сырого письма.' },
  { claimId: 'hypothesis.sfera.execution', evidenceId: 'artifact.sfera.processes', label: 'Execution → process tree', note: 'Parent, child, user и host получены из endpoint telemetry.' },
  { claimId: 'hypothesis.sfera.beacon', evidenceId: 'artifact.sfera.dns', label: 'DNS activity → resolver log', note: 'Ритм и источник получены из DNS telemetry.' },
  { claimId: 'outcome.sfera.scope', evidenceId: 'artifact.sfera.assets', label: 'Scope → CMDB', note: 'IP, host, owner и критичность сверены по inventory.' },
];

const hints = [
  'Открой каждый alert, затем возвращайся к исходному источнику. Карточка SIEM сама по себе не доказательство.',
  'Для письма проверь From, Received и Authentication-Results. Для endpoint найди parent и child.',
  'Свяжи DNS с endpoint через host/IP. Identity telemetry нужна, чтобы не выдумать внешнюю успешную сессию.',
  'Поддержи три наблюдаемые гипотезы отдельно. Account compromise оставь unknown или rejected без новой успешной сессии.',
];

export function ChapterOneOrientation() {
  const runtime = useMissionRuntime();
  const mission = runtime.activeMission;
  const definition = getMissionDefinition('sfera-orientation-01');
  const bundle = useMemo(() => createSferaOrientationEnvironment(mission?.seed ?? 1), [mission?.seed]);
  const [hintTier, setHintTier] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);

  if (!mission || mission.missionId !== 'sfera-orientation-01' || !definition) return <main className="chapter-one-loading">Очередь «Сферы» не загружена.</main>;

  const requestHint = () => {
    const next = Math.min(5, hintTier + 1);
    setHintTier(next);
    runtime.recordHint(next, `sfera-orientation-${next}`);
  };

  const complete = () => {
    const result = runtime.completeActiveMission();
    setReasons(result.reasons);
  };

  if (mission.status === 'completed') {
    return (
      <main className="chapter-one-complete">
        <section>
          <ShieldCheck size={38} />
          <p className="eyebrow">АКТ 1 / СЛОЙ 1 ЗАКРЫТ</p>
          <h1>Учебная очередь разобрана</h1>
          <p>Система сохранила alert pivots, shell-запросы, scope, гипотезы, evidence и handoff.</p>
          <div className="chapter-one-score-grid">
            <article><span>CORRECTNESS</span><strong>{mission.assessment?.dimensionScores.correctness ?? 0}</strong></article>
            <article><span>EVIDENCE</span><strong>{mission.assessment?.dimensionScores.evidence ?? 0}</strong></article>
            <article><span>JUDGMENT</span><strong>{mission.assessment?.dimensionScores.judgment ?? 0}</strong></article>
            <article><span>ПОДСКАЗКА</span><strong>{mission.assessment?.autonomy.highestHintTier ?? 0}/5</strong></article>
          </div>
          <button className="primary-action" onClick={() => runtime.ensureMission('act1-contract-mail')}>Перейти к самостоятельным контрактам <ArrowRight size={17} /></button>
        </section>
      </main>
    );
  }

  return (
    <main className="chapter-one-screen">
      <header className="chapter-one-header">
        <div><p className="eyebrow">АКТ 1 / СФЕРА / СЛОЙ 1</p><h1>{definition.title}</h1><p>{definition.briefing.objective}</p></div>
        <div><button onClick={requestHint}><CircleHelp size={16} />Подсказка {Math.min(5, hintTier + 1)}/5</button><button onClick={runtime.resetActiveMission}><RotateCcw size={15} />Reset</button></div>
      </header>
      {hintTier > 0 && <section className="chapter-one-hint"><strong>Кирилл</strong><p>{hints[Math.min(hintTier - 1, hints.length - 1)]}</p></section>}
      <section className="chapter-one-layout">
        <div className="chapter-one-tools">
          <SocQueuePanel items={bundle.queue} />
          <CaseShellPanel environment={bundle.shell} title="SFERA ANALYST SHELL" />
        </div>
        <CaseReasoningPanel evidenceSuggestions={evidenceSuggestions} />
      </section>
      <footer className="chapter-one-footer"><div><span>Alerts: {mission.actionLog.filter((event) => event.type === 'query.executed').length}/3</span><span>Evidence: {mission.evidenceLinks.length}/4</span><span>Hypotheses: {mission.hypotheses.length}/4</span></div><button className="primary-action" onClick={complete}>Проверить handoff</button>{reasons.length > 0 && <p>Не закрыто: {reasons.join(' · ')}</p>}</footer>
    </main>
  );
}
