import { useState } from 'react';
import { Check, FileCheck2, ShieldCheck } from 'lucide-react';
import type { EvidenceSuggestion } from './EvidenceBoard';
import { EvidenceBoard } from './EvidenceBoard';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

const reportLabels: Record<string, string> = {
  facts: 'Подтверждённые факты', evidence: 'Доказательства и способ получения', limitations: 'Ограничения данных', decision: 'Принятое решение', nextSteps: 'Следующие действия',
};

export function CaseReasoningPanel({ evidenceSuggestions }: { evidenceSuggestions: EvidenceSuggestion[] }) {
  const runtime = useMissionRuntime();
  const mission = runtime.activeMission;
  const definition = mission ? getMissionDefinition(mission.missionId) : null;
  const [hypothesisNotes, setHypothesisNotes] = useState<Record<string, string>>({});
  const [decisionRationale, setDecisionRationale] = useState('');
  const [report, setReport] = useState<Record<string, string>>(() => mission?.report?.sections ?? {});
  if (!mission || !definition) return null;

  return (
    <section className="act0-reasoning">
      <EvidenceBoard suggestions={evidenceSuggestions} />
      {definition.hypotheses.length > 0 && <section className="act0-hypotheses">
        <header><strong>Гипотезы</strong><span>Статус должен соответствовать evidence</span></header>
        {definition.hypotheses.map((hypothesis) => {
          const saved = mission.hypotheses.find((item) => item.hypothesisId === hypothesis.id);
          return <article key={hypothesis.id}><div><strong>{hypothesis.title}</strong><p>{hypothesis.description}</p></div><select value={saved?.status ?? 'open'} onChange={(event) => runtime.saveHypothesis({ hypothesisId: hypothesis.id, status: event.target.value as any, confidence: 'medium', note: hypothesisNotes[hypothesis.id] ?? '' })}>{hypothesis.allowedStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><input value={hypothesisNotes[hypothesis.id] ?? saved?.note ?? ''} onChange={(event) => setHypothesisNotes((current) => ({ ...current, [hypothesis.id]: event.target.value }))} placeholder="Коротко: почему такой статус" /></article>;
        })}
      </section>}
      {definition.decisions.length > 0 && <section className="act0-decisions">
        <header><ShieldCheck size={17} /><strong>Решение</strong></header>
        <textarea value={decisionRationale} onChange={(event) => setDecisionRationale(event.target.value)} placeholder="Почему действие соответствует риску и ограничениям" />
        <div>{definition.decisions.map((decision) => {
          const selected = mission.decisions.some((item) => item.decisionId === decision.id);
          return <button key={decision.id} className={selected ? 'selected' : ''} onClick={() => runtime.saveDecision({ decisionId: decision.id, rationale: decisionRationale })}>{selected && <Check size={14} />}<strong>{decision.title}</strong><span>{decision.description}</span></button>;
        })}</div>
      </section>}
      <section className="act0-report">
        <header><FileCheck2 size={17} /><strong>Evidence report</strong></header>
        {Object.keys(reportLabels).map((section) => <label key={section}><span>{reportLabels[section]}</span><textarea value={report[section] ?? ''} onChange={(event) => setReport((current) => ({ ...current, [section]: event.target.value }))} /></label>)}
        <button className="primary-action" onClick={() => runtime.saveReport(report)}>Сохранить отчёт</button>
      </section>
    </section>
  );
}
