import { AlertTriangle, CheckCircle2, Clock3, Network, Search, ShieldAlert } from 'lucide-react';
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

export function SiemApp() {
  const { progress, setFlag } = useProgress();
  const available = progress.pythonComplete;

  return (
    <div className="siem-app">
      <aside className="siem-sidebar">
        <div className="siem-brand"><ShieldAlert size={21} /><strong>WATCHTOWER</strong><span>LOCAL</span></div>
        <button className="active"><AlertTriangle size={17} />Alerts <b>1</b></button>
        <button><Search size={17} />Hunt</button>
        <button><Network size={17} />Assets</button>
        <button><Clock3 size={17} />Timeline</button>
      </aside>
      <main className="siem-main app-scroll">
        <header className="siem-header">
          <div><p className="eyebrow">ALERT / WT-2026-0314-01</p><h2>SSH password spray</h2></div>
          <span className="severity critical">CRITICAL</span>
        </header>
        {!available ? (
          <div className="locked-panel">
            <ShieldAlert size={42} strokeWidth={1.2} />
            <h3>Сначала проверь данные</h3>
            <p>Закончи скрипт в CODE. Алерт откроется после правильного результата.</p>
          </div>
        ) : (
          <>
            <section className="alert-summary-grid">
              <div><span>SOURCE</span><strong>185.44.17.92</strong><small>External</small></div>
              <div><span>ATTEMPTS</span><strong>6</strong><small>48 seconds</small></div>
              <div><span>ACCOUNTS</span><strong>4</strong><small>admin, root, postgres, oracle</small></div>
              <div><span>RESULT</span><strong>NO ACCESS</strong><small>All attempts failed</small></div>
            </section>
            <section className="event-table">
              <header><span>TIME</span><span>EVENT</span><span>USER</span><span>SOURCE</span><span>RISK</span></header>
              {events.map((row) => <div key={`${row[0]}-${row[2]}`}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span className={row[4]}>{row[4].toUpperCase()}</span></div>)}
            </section>
            <section className="analyst-decision">
              <div>
                <p className="eyebrow">TRIAGE</p>
                <h3>Какой вывод подтверждают данные?</h3>
              </div>
              <div className="decision-options">
                <button onClick={() => undefined}><span>A</span>Атакующий вошёл под root</button>
                <button className={progress.alertReviewed ? 'selected' : ''} onClick={() => setFlag('alertReviewed', true)}><span>B</span>Была серия неудачных попыток с одного внешнего адреса</button>
                <button onClick={() => undefined}><span>C</span>Сбой резервного копирования</button>
              </div>
              {progress.alertReviewed && <div className="decision-result"><CheckCircle2 size={19} /><span><strong>Верно.</strong> Успешного внешнего входа в журнале нет. Нельзя писать о компрометации без подтверждения.</span></div>}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
