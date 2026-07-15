import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, HelpCircle, Network, Search, ShieldAlert, XCircle } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

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
  { label: 'Атакующий вошёл под root', correct: false, explanation: 'В журнале есть Failed password для root. Это неудачный вход, а не успешный.' },
  { label: 'Была серия неудачных попыток с одного внешнего адреса', correct: true, explanation: 'Шесть событий AUTH_FAIL пришли с 185.44.17.92. Успешного внешнего входа в таблице нет.' },
  { label: 'Сбой резервного копирования', correct: false, explanation: 'Запись backup — успешный вход с внутреннего адреса 10.14.2.5. Данных о сбое резервного копирования нет.' },
];

export function SiemApp() {
  const { progress, setFlag } = useProgress();
  const [selected, setSelected] = useState<number | null>(progress.alertReviewed ? 1 : null);
  const available = progress.pythonComplete;
  const choice = selected === null ? null : decisions[selected];

  const choose = (index: number) => {
    setSelected(index);
    if (decisions[index].correct) setFlag('alertReviewed', true);
  };

  return (
    <div className="siem-app">
      <aside className="siem-sidebar">
        <div className="siem-brand"><ShieldAlert size={21} /><strong>WATCHTOWER</strong><span>LOCAL</span></div>
        <button className="active"><AlertTriangle size={17} />Alerts <b>1</b></button>
        <button><Search size={17} />Hunt</button><button><Network size={17} />Assets</button><button><Clock3 size={17} />Timeline</button>
        <div className="siem-glossary"><HelpCircle size={16} /><strong>ТЕРМИНЫ</strong><p><b>SIEM</b> собирает события из разных систем.</p><p><b>Alert</b> — предупреждение, которое требует проверки.</p><p><b>Triage</b> — быстрая первичная оценка: что случилось, насколько опасно и что делать дальше.</p></div>
      </aside>
      <main className="siem-main app-scroll">
        <header className="siem-header"><div><p className="eyebrow">ALERT / WT-2026-0314-01</p><h2>SSH password spray</h2><p className="siem-subtitle">Система заметила серию попыток входа в разные учётные записи. Алерт — повод проверить данные, а не готовый приговор.</p></div><span className="severity critical">CRITICAL</span></header>
        {!available ? <div className="locked-panel"><ShieldAlert size={42} strokeWidth={1.2} /><h3>Сначала проверь данные</h3><p>Закончи программу в Code Editor. SIEM откроется после правильного вывода, чтобы ты понимал, откуда взялись цифры.</p></div> : <>
          <section className="siem-reading-order"><span>КАК ЧИТАТЬ ЭКРАН</span><div><b>1</b><p>Посмотри источник и количество событий.</p></div><div><b>2</b><p>Проверь таблицу: FAIL и SUCCESS — разные результаты.</p></div><div><b>3</b><p>Сделай только тот вывод, который подтверждают строки.</p></div></section>
          <section className="alert-summary-grid"><div><span>SOURCE</span><strong>185.44.17.92</strong><small>External</small></div><div><span>ATTEMPTS</span><strong>6</strong><small>48 seconds</small></div><div><span>ACCOUNTS</span><strong>4</strong><small>admin, root, postgres, oracle</small></div><div><span>RESULT</span><strong>NO ACCESS</strong><small>All external attempts failed</small></div></section>
          <section className="event-table"><header><span>TIME</span><span>EVENT</span><span>USER</span><span>SOURCE</span><span>RISK</span></header>{events.map((row) => <div key={`${row[0]}-${row[2]}`}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span className={row[4]}>{row[4].toUpperCase()}</span></div>)}</section>
          <section className="analyst-decision"><div><p className="eyebrow">TRIAGE / ВЫБЕРИ ПОДТВЕРЖДЁННЫЙ ВЫВОД</p><h3>Что можно написать в отчёте?</h3></div><div className="decision-options">{decisions.map((decision, index) => <button key={decision.label} className={`${selected === index ? 'selected' : ''} ${selected === index ? (decision.correct ? 'correct' : 'wrong') : ''}`} onClick={() => choose(index)}><span>{String.fromCharCode(65 + index)}</span>{decision.label}</button>)}</div>{choice && <div className={`decision-result ${choice.correct ? '' : 'wrong'}`}>{choice.correct ? <CheckCircle2 size={19} /> : <XCircle size={19} />}<span><strong>{choice.correct ? 'Верно.' : 'Нет.'}</strong> {choice.explanation}</span></div>}</section>
        </>}
      </main>
    </div>
  );
}
