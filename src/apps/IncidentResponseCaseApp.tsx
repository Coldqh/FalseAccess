import { useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, FileClock,
  LockKeyhole, Network, Radar, RotateCcw, ServerCog, ShieldAlert, ShieldCheck,
  TerminalSquare, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  containmentSections, eradicationObjectives, findingSections, incidentArchitecture,
  incidentCaseOverview, incidentFoundationQuestions, independentCommands,
  independentQuestions, recoverySections, reportSections, scopeQuestions, triageObjectives,
} from '../missions/incidentResponse01';

interface HistoryEntry { command: string; output: string; ok: boolean }
type SelectKey =
  | 'incidentCaseFoundationAnswers'
  | 'incidentCaseScopeAnswers'
  | 'incidentCaseContainmentSelections'
  | 'incidentCaseRecoverySelections'
  | 'incidentCaseIndependentAnswers'
  | 'incidentCaseFindingSelections'
  | 'incidentCaseReportSelections';

const stages = ['Вводная', 'Основа', 'Triage', 'Scope', 'Containment', 'Eradication', 'Recovery', 'Вторая волна / Отчёт', 'Готово'];
const normalize = (value: string) => value.trim().toLowerCase().replace(/\\/g, '/').replace(/\s+/g, ' ').replace(/["']/g, '');
const allCorrect = (
  sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[],
  selected: Record<string, string>,
) => sections.every((section) => section.options.find((option) => option.id === selected[section.id])?.correct);

function commandMatches(expected: string, raw: string) {
  const a = normalize(expected);
  const b = normalize(raw);
  if (a === b) return true;
  if (a.startsWith('siem search')) {
    const anchors = a.split(' ').filter((part) => part.includes('=') || /gl-\d+|198\.51\.100\.44|203\.0\.113\.89|ci_pat_991|svc_archive/.test(part));
    return b.includes('siem search') && anchors.every((part) => b.includes(part));
  }
  if (a.startsWith('edr process-tree')) return b.includes('edr process-tree') && (b.includes('gw-pay-02') || b.includes('ci-runner-02'));
  if (a.startsWith('edr remediate')) return b.includes('edr remediate') && b.includes('ops-jump-01') && b.includes('cache.dat');
  if (a.startsWith('idp disable-user')) return b.includes('idp disable-user') && b.includes('svc_archive');
  if (a.startsWith('idp revoke-token')) return b.includes('idp revoke-token') && (b.includes('gl_rt_27a1') || b.includes('ci_pat_991'));
  if (a.startsWith('idp token-audit')) return b.includes('idp token-audit') && b.includes('buildbot');
  if (a.startsWith('irctl remediate')) return b.includes('irctl remediate') && b.includes('archive-03') && b.includes('archive-sync.timer');
  if (a.startsWith('vpn policy')) return b.includes('vpn policy') && b.includes('service-accounts') && b.includes('mfa-bypass=deny');
  if (a.startsWith('repo search')) return b.includes('repo search') && b.includes('ci_pat_991');
  return false;
}

export function IncidentResponseCaseApp() {
  const { progress, setFlag, completeIncidentCase } = useProgress();
  const stage = Math.max(0, Math.min(8, progress.incidentCaseStage));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showHints, setShowHints] = useState(false);

  const objectives = stage === 2 ? triageObjectives : eradicationObjectives;
  const completed = stage === 2 ? progress.incidentCaseTriageObjectives : progress.incidentCaseEradicationObjectives;
  const nextObjective = objectives.find((item) => !completed.includes(item.id));
  const objectivesDone = objectives.every((item) => completed.includes(item.id));
  const independentDone = independentCommands.every((item) => progress.incidentCaseIndependentObjectives.includes(item.id));

  const setStage = (value: number) => setFlag('incidentCaseStage', Math.max(progress.incidentCaseStage, Math.min(8, value)));
  const choose = (key: SelectKey, sectionId: string, optionId: string) => {
    setFlag(key, { ...progress[key], [sectionId]: optionId });
    setChecked((current) => ({ ...current, [key]: false }));
  };

  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    selections: Record<string, string>,
    key: SelectKey,
  ) => (
    <div className="windows-question-stack incident-question-stack">
      {sections.map((section) => (
        <article className="windows-question-card" key={section.id}>
          <h3>{section.label}</h3>
          <div>{section.options.map((option) => {
            const selected = selections[section.id] === option.id;
            const status = checked[key] && selected ? (option.correct ? 'correct' : 'wrong') : '';
            return <button key={option.id} className={`${selected ? 'selected' : ''} ${status}`} onClick={() => choose(key, section.id, option.id)}>
              <span>{selected ? '●' : '○'}</span><p>{option.text}</p>{checked[key] && selected && (option.correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />)}
            </button>;
          })}</div>
        </article>
      ))}
    </div>
  );

  const verify = (key: SelectKey, sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[], next: number) => {
    setChecked((current) => ({ ...current, [key]: true }));
    if (allCorrect(sections, progress[key])) setStage(next);
  };

  const runCommand = () => {
    if (!command.trim() || !nextObjective) return;
    const ok = commandMatches(nextObjective.command, command);
    setHistory((current) => [...current, { command, output: ok ? nextObjective.output : `Сейчас нужно: ${nextObjective.title}.`, ok }]);
    setCommand('');
    if (!ok) return;
    const key = stage === 2 ? 'incidentCaseTriageObjectives' : 'incidentCaseEradicationObjectives';
    setFlag(key, [...completed, nextObjective.id]);
  };

  const insert = (value: string, target: 'main' | 'independent') => {
    if (target === 'main') setCommand(value);
    else setIndependentCommand(value);
    setFlag('incidentCaseHintUses', progress.incidentCaseHintUses + 1);
  };

  const runIndependent = () => {
    if (!independentCommand.trim()) return;
    const found = independentCommands.find((item) => commandMatches(item.command, independentCommand));
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: found ? found.output : 'Команда выполнилась, но нужный источник не найден.',
      ok: Boolean(found),
    }]);
    setIndependentCommand('');
    if (found && !progress.incidentCaseIndependentObjectives.includes(found.id)) {
      setFlag('incidentCaseIndependentObjectives', [...progress.incidentCaseIndependentObjectives, found.id]);
    }
  };

  const checkFinal = () => {
    setChecked((current) => ({
      ...current,
      incidentCaseIndependentAnswers: true,
      incidentCaseFindingSelections: true,
      incidentCaseReportSelections: true,
    }));
    if (
      independentDone
      && allCorrect(independentQuestions, progress.incidentCaseIndependentAnswers)
      && allCorrect(findingSections, progress.incidentCaseFindingSelections)
      && allCorrect(reportSections, progress.incidentCaseReportSelections)
    ) setStage(8);
  };

  return <div className="route-case-app windows-case-app forensics-case-app incident-case-app">
    <aside className="route-case-sidebar windows-case-sidebar incident-case-sidebar">
      <header><p className="eyebrow">GREYLOCK-09</p><h2>Incident Response</h2><span>ACTIVE INCIDENT</span></header>
      <nav>{stages.map((name, index) => <button key={name} disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
      <footer><LockKeyhole size={15} /><div><strong>LIVE CLONE</strong><span>synthetic systems</span></div></footer>
    </aside>

    <main className="route-case-main windows-case-main incident-case-main app-scroll">
      {stage === 0 && <section className="route-brief-stage windows-brief-stage incident-brief-stage">
        <header><ShieldAlert size={29} /><div><p className="eyebrow">CASE / GREYLOCK-09</p><h1>Сервис работает. Противник внутри.</h1></div></header>
        <div className="route-brief-grid windows-brief-grid">{incidentCaseOverview.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        <div className="windows-theory warning"><strong>Greylock / operator</strong><p>Gateway отправляет трафик наружу. Учётка архиватора ходила через VPN и jump-host. Расчёты нельзя остановить целиком. Нужен контроль инцидента, а не паника.</p></div>
        <div className="incident-architecture-grid">{incidentArchitecture.map((item) => <article key={item.id}><span>{item.role}</span>{item.id === 'siem' ? <Radar size={21} /> : item.id === 'identity' ? <Network size={21} /> : <ServerCog size={21} />}<strong>{item.title}</strong><p>{item.subtitle}</p><code>{item.address}</code></article>)}</div>
        <button className="primary-action full" onClick={() => setStage(1)}>Принять инцидент<ArrowRight size={17} /></button>
      </section>}

      {stage === 1 && <section className="route-choice-stage incident-foundation-stage">
        <header><Activity size={23} /><div><p className="eyebrow">IR LIFECYCLE</p><h2>Подтверждение, локализация, устранение и восстановление</h2></div></header>
        <div className="network-theory-strip incident-theory-strip">
          <article><strong>IDENTIFY</strong><p>Подтверди событие, масштаб и критичные активы.</p></article>
          <article><strong>CONTAIN</strong><p>Останови развитие, сохранив доказательства и бизнес.</p></article>
          <article><strong>ERADICATE</strong><p>Удали закрепление и закрой первоначальную причину.</p></article>
          <article><strong>RECOVER</strong><p>Верни системы поэтапно и следи за повторением.</p></article>
        </div>
        {renderOptions(incidentFoundationQuestions, progress.incidentCaseFoundationAnswers, 'incidentCaseFoundationAnswers')}
        <button className="primary-action full" onClick={() => verify('incidentCaseFoundationAnswers', incidentFoundationQuestions, 2)}>Открыть SIEM и EDR<ArrowRight size={17} /></button>
      </section>}

      {stage === 2 && <section className="windows-terminal-stage incident-terminal-stage">
        <header><Radar size={23} /><div><p className="eyebrow">TRIAGE / SIEM + EDR</p><h2>Подтверди вход, процесс, сеть и масштаб</h2></div></header>
        <div className="windows-theory"><strong>{nextObjective?.title ?? 'Первичный triage завершён'}</strong><p>Не строй вывод по одному алерту. Связывай identity, process tree, network и поиск индикаторов по всему контуру.</p>{nextObjective && <code>{nextObjective.command}</code>}</div>
        <div className="windows-terminal-box"><div className="windows-terminal-history">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><code>&gt; {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
          {nextObjective && <div className="windows-terminal-input"><span>&gt;</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runCommand()} placeholder="siem search ..." /><button onClick={() => insert(nextObjective.command, 'main')}>Вставить</button><button className="primary-action" onClick={runCommand}>Выполнить</button></div>}
        </div>
        {objectivesDone && <button className="primary-action full" onClick={() => setStage(3)}>Определить scope<ArrowRight size={17} /></button>}
      </section>}

      {stage === 3 && <section className="route-choice-stage incident-scope-stage">
        <header><Network size={23} /><div><p className="eyebrow">SCOPE</p><h2>Отдели затронутое от неподтверждённого</h2></div></header>
        {renderOptions(scopeQuestions, progress.incidentCaseScopeAnswers, 'incidentCaseScopeAnswers')}
        <button className="primary-action full" onClick={() => verify('incidentCaseScopeAnswers', scopeQuestions, 4)}>Собрать план containment<ArrowRight size={17} /></button>
      </section>}

      {stage === 4 && <section className="route-choice-stage incident-containment-stage">
        <header><ShieldCheck size={23} /><div><p className="eyebrow">CONTAINMENT</p><h2>Останови развитие и не уничтожь сервис</h2></div></header>
        <div className="windows-theory warning"><strong>Ограничение</strong><p>Чистые DB-CORE-01 и WEB-PAY-01 должны продолжать работу через резервный gateway. Все действия журналируются.</p></div>
        {renderOptions(containmentSections, progress.incidentCaseContainmentSelections, 'incidentCaseContainmentSelections')}
        <button className="primary-action full" onClick={() => verify('incidentCaseContainmentSelections', containmentSections, 5)}>Начать eradication<ArrowRight size={17} /></button>
      </section>}

      {stage === 5 && <section className="windows-terminal-stage incident-eradication-stage">
        <header><RotateCcw size={23} /><div><p className="eyebrow">ERADICATION</p><h2>Удали доступ, закрепление и первоначальную причину</h2></div></header>
        <div className="windows-theory"><strong>{nextObjective?.title ?? 'Eradication завершён'}</strong><p>Удаление файла не закрывает инцидент. Нужны identity, tokens, persistence и слабая VPN-политика.</p>{nextObjective && <code>{nextObjective.command}</code>}</div>
        <div className="windows-terminal-box"><div className="windows-terminal-history">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><code>&gt; {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
          {nextObjective && <div className="windows-terminal-input"><span>&gt;</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runCommand()} placeholder="response command" /><button onClick={() => insert(nextObjective.command, 'main')}>Вставить</button><button className="primary-action" onClick={runCommand}>Выполнить</button></div>}
        </div>
        {objectivesDone && <button className="primary-action full" onClick={() => setStage(6)}>Перейти к восстановлению<ArrowRight size={17} /></button>}
      </section>}

      {stage === 6 && <section className="route-choice-stage incident-recovery-stage">
        <header><ServerCog size={23} /><div><p className="eyebrow">RECOVERY</p><h2>Верни сервисы и проверь, что проблема не вернулась</h2></div></header>
        {renderOptions(recoverySections, progress.incidentCaseRecoverySelections, 'incidentCaseRecoverySelections')}
        <button className="primary-action full" onClick={() => verify('incidentCaseRecoverySelections', recoverySections, 7)}>Запустить усиленный мониторинг<ArrowRight size={17} /></button>
      </section>}

      {stage === 7 && <section className="forensics-independent-stage incident-independent-stage">
        <header><AlertTriangle size={23} /><div><p className="eyebrow">SECOND WAVE / GL-8897</p><h2>Через три часа появился новый токен</h2></div></header>
        <div className="windows-theory"><strong>Самостоятельная работа</strong><p>Первый доступ закрыт. Новый алерт идёт с CI-runner. Найди неучтённый секрет, определи scope и отзови доступ. Порядок не задан.</p></div>
        <button className="secondary-action" onClick={() => setShowHints((value) => !value)}>{showHints ? 'Скрыть доступные команды' : 'Показать доступные команды'}</button>
        {showHints && <div className="forensics-command-pool incident-command-pool">{independentCommands.map((item) => <button key={item.id} onClick={() => insert(item.command, 'independent')}><TerminalSquare size={14} /><code>{item.command}</code></button>)}</div>}
        <div className="windows-terminal-box"><div className="windows-terminal-history">{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><code>&gt; {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
          <div className="windows-terminal-input"><span>&gt;</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runIndependent()} placeholder="команда расследования" /><button className="primary-action" onClick={runIndependent}>Выполнить</button></div>
        </div>
        <div className="forensics-final-grid incident-final-grid">
          <section><h3>Вторая волна</h3>{renderOptions(independentQuestions, progress.incidentCaseIndependentAnswers, 'incidentCaseIndependentAnswers')}</section>
          <section><h3>Подтверждённые выводы</h3>{renderOptions(findingSections, progress.incidentCaseFindingSelections, 'incidentCaseFindingSelections')}</section>
          <section><h3>Итоговый отчёт</h3>{renderOptions(reportSections, progress.incidentCaseReportSelections, 'incidentCaseReportSelections')}</section>
        </div>
        <button className="primary-action full" onClick={checkFinal}>Проверить полный incident response<ClipboardList size={17} /></button>
      </section>}

      {stage === 8 && <section className="windows-complete-stage incident-complete-stage">
        <ShieldCheck size={45} /><p className="eyebrow">INCIDENT CLOSED</p><h2>GREYLOCK-09 закрыт</h2>
        <p>Первоначальный доступ, перемещение, закрепление и повторная волна разобраны. Сервисы возвращены поэтапно, неучтённый CI-токен отозван.</p>
        <div><span>Экзамен</span><strong>SIEM + EDR + INCIDENT RESPONSE</strong><small>Подсказок: {progress.incidentCaseHintUses}</small></div>
        <button className="primary-action full" onClick={completeIncidentCase}>Закрыть инцидент<CheckCircle2 size={17} /></button>
      </section>}
    </main>
  </div>;
}
