import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Network, Search, ShieldAlert, XCircle } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import { getClinicStage, clinicTransitions } from '../missions/clinic01';
import { MissionGuideStrip } from '../components/MissionGuideStrip';
import { MissionStageComplete } from '../components/MissionStageComplete';
import type { AppId } from '../types';

const events = [
  ['21:08:11', 'AUTH_SUCCESS', 'nurse', '10.14.2.18', 'low'],
  ['21:11:42', 'AUTH_FAIL', 'admin', '185.44.17.92', 'high'],
  ['21:11:44', 'AUTH_FAIL', 'admin', '185.44.17.92', 'high'],
  ['21:11:47', 'AUTH_FAIL', 'root', '185.44.17.92', 'high'],
  ['21:12:02', 'AUTH_FAIL', 'postgres', '185.44.17.92', 'high'],
  ['21:12:16', 'AUTH_FAIL', 'oracle', '185.44.17.92', 'high'],
  ['21:12:20', 'AUTH_FAIL', 'root', '185.44.17.92', 'critical'],
  ['21:17:08', 'AUTH_SUCCESS', 'backup', '10.14.2.5', 'low'],
];

const decisions = [
  { label: 'Атакующий вошёл под root', correct: false, explanation: 'Для root записан Failed password. Это отказ.' },
  { label: 'Была серия неудачных попыток с одного внешнего адреса', correct: true, explanation: 'Шесть AUTH_FAIL пришли с 185.44.17.92. Успешного внешнего входа нет.' },
  { label: 'Сбой резервного копирования', correct: false, explanation: 'backup вошёл с внутреннего адреса. Ошибка резервного копирования не записана.' },
];

export function SiemApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress, setFlag } = useProgress();
  const stage = getClinicStage(progress);
  const missionActive = stage.id === 'siem';
  const [selected, setSelected] = useState<number | null>(progress.alertReviewed ? 1 : null);
  const choice = selected === null ? null : decisions[selected];

  const choose = (index: number) => {
    if (!missionActive) return;
    setSelected(index);
    if (decisions[index].correct) setFlag('alertReviewed', true);
  };

  return (
    <div className={`siem-app siem-app-v4 ${missionActive ? 'mission-layer-active' : 'base-app-only'}`}>
      <aside className="siem-sidebar">
        <div className="siem-brand"><ShieldAlert size={21} /><strong>WATCHTOWER</strong><span>LOCAL</span></div>
        <button className="active"><AlertTriangle size={17} />Alerts <b>1</b></button>
        <button><Search size={17} />Hunt</button>
        <button><Network size={17} />Assets</button>
        <button><Clock3 size={17} />Timeline</button>
      </aside>
      <main className="siem-main app-scroll">
        {missionActive && <MissionGuideStrip title="Проверь результат входов" text="FAIL означает отказ. SUCCESS означает успешную авторизацию. Сначала сравни источник, затем результат." detail="Выбери только тот вывод, который подтверждают строки таблицы." />}
        <header className="siem-header"><div><p className="eyebrow">ALERT / WT-2026-0314-01</p><h2>SSH password spray</h2></div><span className="severity critical">CRITICAL</span></header>
        <section className="alert-summary-grid"><div><span>SOURCE</span><strong>185.44.17.92</strong><small>External</small></div><div><span>ATTEMPTS</span><strong>6</strong><small>48 seconds</small></div><div><span>ACCOUNTS</span><strong>4</strong><small>admin, root, postgres, oracle</small></div><div><span>RESULT</span><strong>NO ACCESS</strong><small>All external attempts failed</small></div></section>
        <section className="event-table"><header><span>TIME</span><span>EVENT</span><span>USER</span><span>SOURCE</span><span>RISK</span></header>{events.map((row) => <div key={`${row[0]}-${row[2]}`}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span className={row[4]}>{row[4].toUpperCase()}</span></div>)}</section>
        {missionActive && <section className="analyst-decision"><div><p className="eyebrow">TRIAGE</p><h3>Что можно записать в отчёт?</h3></div><div className="decision-options">{decisions.map((decision, index) => <button key={decision.label} className={`${selected === index ? 'selected' : ''} ${selected === index ? (decision.correct ? 'correct' : 'wrong') : ''}`} onClick={() => choose(index)}><span>{String.fromCharCode(65 + index)}</span>{decision.label}</button>)}</div>{choice && <div className={`decision-result ${choice.correct ? '' : 'wrong'}`}>{choice.correct ? <CheckCircle2 size={19} /> : <XCircle size={19} />}<span><strong>{choice.correct ? 'Верно.' : 'Нет.'}</strong> {choice.explanation}</span></div>}</section>}
      </main>
      {progress.alertReviewed && <MissionStageComplete transition={clinicTransitions.siem} openApp={openApp} />}
    </div>
  );
}
