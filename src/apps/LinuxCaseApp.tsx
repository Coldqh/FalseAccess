import { useMemo, useState } from 'react';
import {
  Activity, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Code2, Copy,
  FileCheck2, FileSearch, HardDrive, Network, Play, RefreshCw, RotateCcw, Server, ShieldAlert,
  ShieldCheck, TerminalSquare, UserRound, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  linuxAccountSnapshot, linuxArchitectureQuestions, linuxCollectorOutput, linuxContainmentSections,
  linuxFindingSections, linuxGuidedObjectives, linuxIndependentCommands, linuxIndependentQuestions,
  linuxReportSections, linuxScriptStarter, linuxScriptSteps, linuxServerOverview,
} from '../missions/linux01';

const stageNames = ['Сервер', 'Устройство', 'Терминал', 'Bash', 'Изоляция', 'Второй узел', 'Отчёт', 'Готово'];
type RunState = 'idle' | 'success' | 'error';

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, ' ').replace(/\s*\|\s*/g, ' | ').replace(/\s*>\s*/g, ' > ');
}

function isCorrect(option: unknown) {
  return Boolean(option && typeof option === 'object' && 'correct' in option && (option as { correct?: boolean }).correct);
}

function allCorrect(
  sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[],
  selections: Record<string, string>,
) {
  return sections.every((section) => isCorrect(section.options.find((option) => option.id === selections[section.id])));
}

function insertSnippet(code: string, marker: string, snippet: string) {
  if (code.includes(snippet)) return code;
  return code.replace(marker, `${marker}\n${snippet}`);
}

export function LinuxCaseApp() {
  const { progress, setFlag, completeLinuxCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.linuxCaseStage));
  const [architectureChecked, setArchitectureChecked] = useState(false);
  const [containmentChecked, setContainmentChecked] = useState(false);
  const [independentChecked, setIndependentChecked] = useState(false);
  const [findingsChecked, setFindingsChecked] = useState(false);
  const [reportChecked, setReportChecked] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Array<{ command: string; output: string; ok: boolean }>>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<Array<{ command: string; output: string; ok: boolean }>>([]);
  const [showIndependentHints, setShowIndependentHints] = useState(false);
  const [runState, setRunState] = useState<RunState>('idle');
  const [output, setOutput] = useState('');
  const [outputOpen, setOutputOpen] = useState(false);

  const setStage = (value: number) => setFlag('linuxCaseStage', Math.min(7, Math.max(progress.linuxCaseStage, value)));
  const nextObjective = linuxGuidedObjectives.find((item) => !progress.linuxCaseObjectives.includes(item.id));
  const commandsDone = linuxGuidedObjectives.every((item) => progress.linuxCaseObjectives.includes(item.id));
  const code = progress.linuxCaseScript || linuxScriptStarter;
  const codeStepIndex = Math.min(progress.linuxCaseScriptStep, linuxScriptSteps.length - 1);
  const codeStep = linuxScriptSteps[codeStepIndex];
  const codeStepReady = codeStep.check.test(code);
  const allCodeReady = linuxScriptSteps.every((item) => item.check.test(code));
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);
  const independentDone = linuxIndependentCommands.every((item) => progress.linuxCaseIndependentObjectives.includes(item.id));

  const choose = (
    key: 'linuxCaseArchitectureAnswers' | 'linuxCaseContainmentSelections' | 'linuxCaseIndependentAnswers' | 'linuxCaseFindingSelections' | 'linuxCaseReportSelections',
    sectionId: string,
    optionId: string,
  ) => {
    setFlag(key, { ...progress[key], [sectionId]: optionId });
    if (key === 'linuxCaseArchitectureAnswers') setArchitectureChecked(false);
    if (key === 'linuxCaseContainmentSelections') setContainmentChecked(false);
    if (key === 'linuxCaseIndependentAnswers') setIndependentChecked(false);
    if (key === 'linuxCaseFindingSelections') setFindingsChecked(false);
    if (key === 'linuxCaseReportSelections') setReportChecked(false);
  };

  const checkArchitecture = () => {
    setArchitectureChecked(true);
    if (allCorrect(linuxArchitectureQuestions, progress.linuxCaseArchitectureAnswers)) setStage(2);
  };

  const commandMatches = (id: string, raw: string, expected: string) => {
    const lower = raw.toLowerCase();
    if (lower === normalizeCommand(expected).toLowerCase()) return true;
    if (id === 'accounts') return /getent\s+passwd/.test(lower);
    if (id === 'auth') return /grep/.test(lower) && /auth\.log/.test(lower) && /(accepted|sudo)/.test(lower);
    if (id === 'service') return /systemctl\s+status/.test(lower) && /odds-api/.test(lower);
    if (id === 'journal') return /journalctl/.test(lower) && /odds-api/.test(lower);
    if (id === 'cron') return /(cat|less|sed)/.test(lower) && /metrics-sync/.test(lower);
    if (id === 'sockets') return /ss\s+-[a-z]*p[a-z]*l?[a-z]*n?[a-z]*t|ss\s+-plant/.test(lower);
    if (id === 'changed') return /find/.test(lower) && /newermt/.test(lower);
    return false;
  };

  const executeGuided = () => {
    if (!command.trim() || !nextObjective) return;
    const raw = normalizeCommand(command);
    const accepted = commandMatches(nextObjective.id, raw, nextObjective.command);
    setHistory((current) => [...current, {
      command,
      output: accepted ? nextObjective.output : `Команда не даёт нужный артефакт. Текущая задача: ${nextObjective.title}.`,
      ok: accepted,
    }]);
    setCommand('');
    if (!accepted) return;
    setFlag('linuxCaseObjectives', [...progress.linuxCaseObjectives, nextObjective.id]);
  };

  const useGuidedInsert = (value: string) => {
    setCommand(value);
    setFlag('linuxCaseHintUses', progress.linuxCaseHintUses + 1);
  };

  const updateCode = (value: string) => {
    setFlag('linuxCaseScript', value);
    setRunState('idle');
    setOutput('');
  };

  const insertCodeStep = () => {
    updateCode(insertSnippet(code, codeStep.marker, codeStep.snippet));
    setFlag('linuxCaseHintUses', progress.linuxCaseHintUses + 1);
  };

  const checkCodeStep = () => {
    if (!codeStepReady) {
      setRunState('error');
      setOutput(`В сборщике не найден рабочий шаг:\n\n${codeStep.snippet}`);
      setOutputOpen(true);
      return;
    }
    const next = Math.min(linuxScriptSteps.length, progress.linuxCaseScriptStep + 1);
    setFlag('linuxCaseScriptStep', next);
    if (next >= linuxScriptSteps.length) {
      setOutput('Сборщик готов. Нажми RUN, чтобы проверить результат.');
      setOutputOpen(true);
    }
  };

  const runCollector = () => {
    const missing = linuxScriptSteps.find((item) => !item.check.test(code));
    if (missing) {
      setRunState('error');
      setOutput(`Не хватает шага «${missing.title}».`);
      setOutputOpen(true);
      return;
    }
    setRunState('success');
    setOutput(linuxCollectorOutput);
    setOutputOpen(true);
    setFlag('linuxCaseScriptStep', linuxScriptSteps.length);
  };

  const checkContainment = () => {
    setContainmentChecked(true);
    if (allCorrect(linuxContainmentSections, progress.linuxCaseContainmentSelections)) setStage(5);
  };

  const independentMatches = (id: string, raw: string, expected: string) => {
    const lower = raw.toLowerCase();
    if (lower === normalizeCommand(expected).toLowerCase()) return true;
    if (id === 'accounts') return /getent\s+passwd/.test(lower);
    if (id === 'auth') return /auth\.log/.test(lower) && /grep/.test(lower);
    if (id === 'timers') return /systemctl\s+list-timers/.test(lower);
    if (id === 'network') return /ss\s+-/.test(lower);
    if (id === 'changed') return /find/.test(lower) && /systemd/.test(lower);
    return false;
  };

  const executeIndependent = () => {
    if (!independentCommand.trim()) return;
    const raw = normalizeCommand(independentCommand);
    const matched = linuxIndependentCommands.find((item) => !progress.linuxCaseIndependentObjectives.includes(item.id) && independentMatches(item.id, raw, item.command));
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: matched ? matched.output : 'Команда выполнена, но не даёт нового артефакта для EDGE-BET-04.',
      ok: Boolean(matched),
    }]);
    setIndependentCommand('');
    if (!matched) return;
    setFlag('linuxCaseIndependentObjectives', [...progress.linuxCaseIndependentObjectives, matched.id]);
  };

  const revealIndependentHints = () => {
    setShowIndependentHints((value) => !value);
    if (!showIndependentHints) setFlag('linuxCaseHintUses', progress.linuxCaseHintUses + 1);
  };

  const checkIndependent = () => {
    setIndependentChecked(true);
    if (independentDone && allCorrect(linuxIndependentQuestions, progress.linuxCaseIndependentAnswers)) setStage(6);
  };

  const checkFinalReport = () => {
    setFindingsChecked(true);
    setReportChecked(true);
    if (allCorrect(linuxFindingSections, progress.linuxCaseFindingSelections)
      && allCorrect(linuxReportSections, progress.linuxCaseReportSelections)) setStage(7);
  };

  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    values: Record<string, string>,
    checked: boolean,
    key: 'linuxCaseArchitectureAnswers' | 'linuxCaseContainmentSelections' | 'linuxCaseIndependentAnswers' | 'linuxCaseFindingSelections' | 'linuxCaseReportSelections',
  ) => (
    <div className="route-section-list windows-option-list">
      {sections.map((section) => (
        <article key={section.id}>
          <h3>{section.label}</h3>
          {section.options.map((option) => {
            const selected = values[section.id] === option.id;
            const right = checked && selected && isCorrect(option);
            const wrong = checked && selected && !isCorrect(option);
            return (
              <button key={option.id} className={`${selected ? 'selected' : ''} ${right ? 'correct' : ''} ${wrong ? 'wrong' : ''}`} onClick={() => choose(key, section.id, option.id)}>
                {selected ? '●' : '○'}<span>{option.text}</span>{right && <CheckCircle2 size={16} />}{wrong && <XCircle size={16} />}
              </button>
            );
          })}
        </article>
      ))}
    </div>
  );

  return (
    <div className="route-case-app windows-case-app linux-case-app">
      <aside className="route-case-sidebar windows-case-sidebar linux-case-sidebar">
        <header><p className="eyebrow">REDTABLE-02</p><h2>Linux Server</h2><span>BET-CORE-02</span></header>
        <nav>{stageNames.map((name, index) => <button key={name} type="button" disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
        <footer><ShieldAlert size={17} /><div><strong>LIVE SERVICE</strong><span>traffic on reserve node</span></div></footer>
      </aside>

      <main className="route-case-main windows-case-main linux-case-main app-scroll">
        {stage === 0 && (
          <section className="route-brief-stage windows-brief-stage linux-brief-stage">
            <div className="route-brief-copy">
              <p className="eyebrow">ИГОРЬ / 03:26</p><h1>Сервер букмекеров</h1>
              <div className="route-dialog"><span>И</span><div><strong>Игорь</strong><p>Ночью пропала часть расчётов. Админ говорит, что ничего не менял. Проверь входы, службы и кто остался внутри.</p></div></div>
              <div className="route-dialog muted"><span>И</span><div><strong>Игорь</strong><p>Основной трафик уже перевели на резерв. BET-CORE-02 не трогай наугад. Мне нужен работающий сервис и точный ответ.</p></div></div>
              <div className="route-goal"><strong>Задача</strong><p>Восстановить цепочку SSH → sudo → закрепление, сохранить доказательства, закрыть чужой доступ и проверить второй узел.</p></div>
              <button className="primary-action" onClick={() => setStage(1)}>Открыть снимок сервера<ArrowRight size={17} /></button>
            </div>
            <div className="windows-device-card linux-server-card"><div><Server size={28} /><span>BET-CORE-02</span></div><dl>{linuxServerOverview.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></div>
          </section>
        )}

        {stage === 1 && (
          <section className="windows-process-stage linux-architecture-stage">
            <header><UserRound size={22} /><div><p className="eyebrow">ACCOUNTS / PRIVILEGES</p><h2>Кто имеет доступ</h2></div></header>
            <div className="windows-theory"><strong>Пользователь — это не просто имя</strong><p>Смотри на UID, shell, домашний каталог, SSH-ключи и sudo. Сервисная учётка с интерактивным shell требует объяснения.</p></div>
            <pre className="linux-snapshot">{linuxAccountSnapshot}</pre>
            {renderOptions(linuxArchitectureQuestions, progress.linuxCaseArchitectureAnswers, architectureChecked, 'linuxCaseArchitectureAnswers')}
            <button className="primary-action full" onClick={checkArchitecture}>Проверить устройство сервера</button>
          </section>
        )}

        {stage === 2 && (
          <section className="route-terminal-stage windows-shell-stage linux-shell-stage">
            <header><TerminalSquare size={22} /><div><p className="eyebrow">SHELL / READ-ONLY TRIAGE</p><h2>Восстанови события ночи</h2></div></header>
            {nextObjective && <div className="route-instruction"><span>{progress.linuxCaseObjectives.length + 1}</span><div><strong>{nextObjective.title}</strong><p>{nextObjective.explanation}</p><code>{nextObjective.command}</code></div><button onClick={() => useGuidedInsert(nextObjective.command)}>Вставить</button></div>}
            <div className="route-terminal-console windows-terminal-console linux-terminal-console">
              <div className="route-terminal-history"><p>analyst@casebox:/cases/redtable-02$</p>{history.map((entry, index) => <div key={`${entry.command}-${index}`}><b>$ {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeGuided()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeGuided}>RUN</button></div>
            </div>
            {commandsDone && <button className="primary-action full windows-next" onClick={() => setStage(3)}>Написать Bash-сборщик<ArrowRight size={17} /></button>}
          </section>
        )}

        {stage === 3 && (
          <section className="route-code-stage windows-code-stage linux-code-stage">
            <header><Code2 size={22} /><div><p className="eyebrow">BASH / COLLECT-EVIDENCE.SH</p><h2>Автоматизируй сбор</h2></div><button className="route-run" onClick={runCollector}><Play size={15} fill="currentColor" />RUN</button></header>
            {progress.linuxCaseScriptStep < linuxScriptSteps.length && <div className="route-code-guide"><span>{codeStepIndex + 1}</span><div><strong>{codeStep.title}</strong><p>{codeStep.text}</p><pre>{codeStep.snippet}</pre></div><div><button onClick={insertCodeStep}>Вставить</button><button className={codeStepReady ? 'ready' : ''} onClick={checkCodeStep}>Проверить</button></div></div>}
            <div className="route-editor windows-script-editor linux-script-editor"><div className="route-lines">{lineNumbers.map((line) => <span key={line}>{line}</span>)}</div><textarea value={code} onChange={(event) => updateCode(event.target.value)} spellCheck={false} onKeyDown={(event) => { if (event.key === 'Tab') { event.preventDefault(); const target = event.currentTarget; const start = target.selectionStart; const end = target.selectionEnd; updateCode(`${code.slice(0, start)}  ${code.slice(end)}`); window.setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0); } }} /></div>
            <div className={`route-output ${runState} ${outputOpen ? '' : 'collapsed'}`}><header onClick={() => output && setOutputOpen((value) => !value)}><TerminalSquare size={14} /><strong>OUTPUT</strong><span>{runState === 'success' ? <CheckCircle2 size={15} /> : runState === 'error' ? <XCircle size={15} /> : null}</span>{output && (outputOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />)}</header>{outputOpen && <pre>{output}</pre>}</div>
            <div className="route-code-tools"><button onClick={() => navigator.clipboard?.writeText(code)}><Copy size={14} />Копировать</button><button onClick={() => updateCode(linuxScriptStarter)}><RotateCcw size={14} />Сбросить</button>{allCodeReady && <span>Сборщик готов к проверке.</span>}</div>
            {runState === 'success' && <button className="primary-action full windows-next" onClick={() => setStage(4)}>Перейти к изоляции<ArrowRight size={17} /></button>}
          </section>
        )}

        {stage === 4 && (
          <section className="route-choice-stage linux-containment-stage">
            <header><ShieldCheck size={22} /><div><p className="eyebrow">CONTAINMENT / RECOVERY</p><h2>Закрой доступ, не уничтожив дело</h2></div></header>
            <div className="windows-theory warning"><strong>Порядок важен</strong><p>Сначала сохраняются данные. Потом закрывается подтверждённый доступ. Основная служба возвращается только из проверенной конфигурации.</p></div>
            {renderOptions(linuxContainmentSections, progress.linuxCaseContainmentSelections, containmentChecked, 'linuxCaseContainmentSelections')}
            <button className="primary-action full" onClick={checkContainment}>Выполнить план изоляции</button>
          </section>
        )}

        {stage === 5 && (
          <section className="windows-independent-stage linux-independent-stage">
            <header><Activity size={22} /><div><p className="eyebrow">EDGE-BET-04 / САМОСТОЯТЕЛЬНО</p><h2>Проверь второй сервер</h2></div></header>
            <div className="windows-theory warning"><strong>Готовой очереди нет</strong><p>Снимок содержит пользователей, auth.log, systemd timers и сеть. Сам выбери порядок. Подсказки остаются доступными и учитываются.</p></div>
            <button className="secondary-action windows-hint-toggle" onClick={revealIndependentHints}>{showIndependentHints ? 'Скрыть команды' : 'Показать доступные команды'}</button>
            {showIndependentHints && <div className="windows-command-bank linux-command-bank">{linuxIndependentCommands.map((item) => <button key={item.id} disabled={progress.linuxCaseIndependentObjectives.includes(item.id)} onClick={() => setIndependentCommand(item.command)}><strong>{item.id.toUpperCase()}</strong><code>{item.command}</code></button>)}</div>}
            <div className="route-terminal-console windows-terminal-console independent linux-terminal-console">
              <div className="route-terminal-history"><p>analyst@casebox:/cases/edge-bet-04$</p>{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b>$ {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>$</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeIndependent()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeIndependent}>RUN</button></div>
            </div>
            {renderOptions(linuxIndependentQuestions, progress.linuxCaseIndependentAnswers, independentChecked, 'linuxCaseIndependentAnswers')}
            <button className="primary-action full" onClick={checkIndependent} disabled={!independentDone}>Проверить EDGE-BET-04</button>
          </section>
        )}

        {stage === 6 && (
          <section className="route-choice-stage linux-report-stage">
            <header><ClipboardList size={22} /><div><p className="eyebrow">INCIDENT REPORT</p><h2>Собери вывод по двум серверам</h2></div></header>
            <div className="linux-evidence-row"><span><FileCheck2 size={16} />AUTH + SUDO</span><span><HardDrive size={16} />SYSTEMD + CRON</span><span><Network size={16} />PID → REMOTE</span><span><RefreshCw size={16} />RECOVERY</span></div>
            <h3 className="linux-section-title">Факты</h3>
            {renderOptions(linuxFindingSections, progress.linuxCaseFindingSelections, findingsChecked, 'linuxCaseFindingSelections')}
            <h3 className="linux-section-title">Отчёт</h3>
            {renderOptions(linuxReportSections, progress.linuxCaseReportSelections, reportChecked, 'linuxCaseReportSelections')}
            <button className="primary-action full" onClick={checkFinalReport}>Проверить и закрыть расследование</button>
          </section>
        )}

        {stage === 7 && (
          <section className="route-wrap windows-wrap linux-wrap"><ShieldCheck size={50} /><p className="eyebrow">REDTABLE-02 / ЗАВЕРШЕНО</p><h1>Доступ закрыт</h1><p>Ты восстановил SSH-цепочку, связал sudo с изменениями, нашёл systemd и cron-закрепление, сохранил артефакты и проверил второй сервер без готового порядка.</p><div><strong>Отработано:</strong><span>Linux users</span><span>SSH / auth.log</span><span>sudo</span><span>systemd</span><span>journalctl</span><span>cron / timers</span><span>ss</span><span>Bash</span><span>containment</span></div><small>Подсказок использовано: {progress.linuxCaseHintUses}</small><button className="primary-action" onClick={completeLinuxCase}>Закрыть дело</button></section>
        )}
      </main>
    </div>
  );
}
