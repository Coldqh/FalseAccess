import { useMemo, useState } from 'react';
import {
  Activity, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDot, ClipboardList,
  Code2, Copy, Cpu, FileCheck2, FileSearch, FileText, HardDrive, Network, Play, Power, RotateCcw,
  ShieldAlert, ShieldCheck, TerminalSquare, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  independentMachineCommands, windowsCollectorOutput, windowsFindingSections, windowsIndependentQuestions,
  windowsPowerShellObjectives, windowsProcessQuestions, windowsProcessTree, windowsReportSections,
  windowsScriptStarter, windowsScriptSteps,
} from '../missions/windows01';

const stageNames = ['Тикет', 'Процессы', 'PowerShell', 'Сборщик', 'Вторая машина', 'Вывод', 'Отчёт', 'Готово'];

type RunState = 'idle' | 'success' | 'error';

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',');
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

export function WindowsCaseApp() {
  const { progress, setFlag, completeWindowsCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.windowsCaseStage));
  const [processChecked, setProcessChecked] = useState(false);
  const [findingsChecked, setFindingsChecked] = useState(false);
  const [reportChecked, setReportChecked] = useState(false);
  const [independentChecked, setIndependentChecked] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Array<{ command: string; output: string; ok: boolean }>>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<Array<{ command: string; output: string; ok: boolean }>>([]);
  const [showIndependentHints, setShowIndependentHints] = useState(false);
  const [runState, setRunState] = useState<RunState>('idle');
  const [output, setOutput] = useState('');
  const [outputOpen, setOutputOpen] = useState(false);

  const setStage = (value: number) => setFlag('windowsCaseStage', Math.min(7, Math.max(progress.windowsCaseStage, value)));
  const nextObjective = windowsPowerShellObjectives.find((item) => !progress.windowsCaseObjectives.includes(item.id));
  const commandsDone = windowsPowerShellObjectives.every((item) => progress.windowsCaseObjectives.includes(item.id));
  const code = progress.windowsCaseScript || windowsScriptStarter;
  const codeStepIndex = Math.min(progress.windowsCaseScriptStep, windowsScriptSteps.length - 1);
  const codeStep = windowsScriptSteps[codeStepIndex];
  const codeStepReady = codeStep.check.test(code);
  const allCodeReady = windowsScriptSteps.every((item) => item.check.test(code));
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);
  const independentDone = independentMachineCommands.every((item) => progress.windowsCaseIndependentObjectives.includes(item.id));

  const choose = (
    key: 'windowsCaseProcessAnswers' | 'windowsCaseIndependentAnswers' | 'windowsCaseFindingSelections' | 'windowsCaseReportSelections',
    sectionId: string,
    optionId: string,
  ) => {
    setFlag(key, { ...progress[key], [sectionId]: optionId });
    if (key === 'windowsCaseProcessAnswers') setProcessChecked(false);
    if (key === 'windowsCaseIndependentAnswers') setIndependentChecked(false);
    if (key === 'windowsCaseFindingSelections') setFindingsChecked(false);
    if (key === 'windowsCaseReportSelections') setReportChecked(false);
  };

  const checkProcess = () => {
    setProcessChecked(true);
    if (allCorrect(windowsProcessQuestions, progress.windowsCaseProcessAnswers)) setStage(2);
  };

  const executeGuided = () => {
    if (!command.trim() || !nextObjective) return;
    const raw = normalizeCommand(command);
    const expected = normalizeCommand(nextObjective.command);
    const accepted = raw.toLowerCase() === expected.toLowerCase()
      || (nextObjective.id === 'events' && /get-winevent/i.test(raw) && /4688/.test(raw))
      || (nextObjective.id === 'network' && /get-nettcpconnection/i.test(raw) && /owningprocess/i.test(raw))
      || (nextObjective.id === 'hash' && /get-filehash/i.test(raw) && /invoice_viewer\.exe/i.test(raw))
      || (nextObjective.id === 'startup' && /win32_startupcommand/i.test(raw));
    setHistory((current) => [...current, {
      command,
      output: accepted ? nextObjective.output : `Команда не собирает нужный артефакт. Текущая задача: ${nextObjective.title}.`,
      ok: accepted,
    }]);
    setCommand('');
    if (!accepted) return;
    const completed = [...progress.windowsCaseObjectives, nextObjective.id];
    setFlag('windowsCaseObjectives', completed);
  };

  const useGuidedInsert = (value: string) => {
    setCommand(value);
    setFlag('windowsCaseHintUses', progress.windowsCaseHintUses + 1);
  };

  const updateCode = (value: string) => {
    setFlag('windowsCaseScript', value);
    setRunState('idle');
    setOutput('');
  };

  const insertCodeStep = () => {
    updateCode(insertSnippet(code, codeStep.marker, codeStep.snippet));
    setFlag('windowsCaseHintUses', progress.windowsCaseHintUses + 1);
  };

  const checkCodeStep = () => {
    if (!codeStepReady) {
      setRunState('error');
      setOutput(`В текущем коде не найден рабочий шаг:\n\n${codeStep.snippet}`);
      setOutputOpen(true);
      return;
    }
    const next = Math.min(windowsScriptSteps.length, progress.windowsCaseScriptStep + 1);
    setFlag('windowsCaseScriptStep', next);
    if (next >= windowsScriptSteps.length) {
      setOutput('Сборщик готов. Нажми RUN, чтобы проверить структуру результата.');
      setOutputOpen(true);
    }
  };

  const runCollector = () => {
    const missing = windowsScriptSteps.find((item) => !item.check.test(code));
    if (missing) {
      setRunState('error');
      setOutput(`Не хватает шага «${missing.title}».`);
      setOutputOpen(true);
      return;
    }
    setRunState('success');
    setOutput(windowsCollectorOutput);
    setOutputOpen(true);
    setFlag('windowsCaseScriptStep', windowsScriptSteps.length);
  };

  const executeIndependent = () => {
    if (!independentCommand.trim()) return;
    const raw = normalizeCommand(independentCommand).toLowerCase();
    const matches = (id: string, expected: string) => {
      const normalized = normalizeCommand(expected).toLowerCase();
      if (raw === normalized) return true;
      if (id === 'processes') return /win32_process/.test(raw);
      if (id === 'events') return /get-winevent/.test(raw) && /4688/.test(raw);
      if (id === 'network') return /get-nettcpconnection/.test(raw);
      if (id === 'startup') return /get-scheduledtask/.test(raw);
      return false;
    };
    const matched = independentMachineCommands.find((item) => !progress.windowsCaseIndependentObjectives.includes(item.id) && matches(item.id, item.command));
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: matched ? matched.output : 'Команда выполнена, но не даёт нового артефакта для этого снимка.',
      ok: Boolean(matched),
    }]);
    setIndependentCommand('');
    if (!matched) return;
    setFlag('windowsCaseIndependentObjectives', [...progress.windowsCaseIndependentObjectives, matched.id]);
  };

  const revealIndependentHints = () => {
    setShowIndependentHints((value) => !value);
    if (!showIndependentHints) setFlag('windowsCaseHintUses', progress.windowsCaseHintUses + 1);
  };

  const checkIndependent = () => {
    setIndependentChecked(true);
    if (independentDone && allCorrect(windowsIndependentQuestions, progress.windowsCaseIndependentAnswers)) setStage(5);
  };

  const checkFindings = () => {
    setFindingsChecked(true);
    if (allCorrect(windowsFindingSections, progress.windowsCaseFindingSelections)) setStage(6);
  };

  const checkReport = () => {
    setReportChecked(true);
    if (allCorrect(windowsReportSections, progress.windowsCaseReportSelections)) setStage(7);
  };

  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    values: Record<string, string>,
    checked: boolean,
    key: 'windowsCaseProcessAnswers' | 'windowsCaseIndependentAnswers' | 'windowsCaseFindingSelections' | 'windowsCaseReportSelections',
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
    <div className="route-case-app windows-case-app">
      <aside className="route-case-sidebar windows-case-sidebar">
        <header><p className="eyebrow">NORTHLINE-07</p><h2>Рабочая станция</h2><span>FIN-WS-07 · Windows</span></header>
        <nav>{stageNames.map((name, index) => <button key={name} className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`} disabled><span>{index < stage ? <Check size={13} /> : index + 1}</span><strong>{name}</strong></button>)}</nav>
        <footer><ShieldAlert size={16} /><p>Снимок машины изолирован. Все команды выполняются внутри стенда.</p></footer>
      </aside>

      <main className="route-case-main windows-case-main app-scroll">
        {stage === 0 && (
          <section className="route-brief windows-brief">
            <p className="eyebrow">ЗАКРЫТЫЙ ЧАТ / 22:18</p>
            <h1>Бухгалтерский компьютер</h1>
            <div className="route-dialogue"><span>И</span><div><strong>Игорь</strong><p>На складе бухгалтер открыла документ. Потом машина полезла на внешний адрес.</p><p>Сеть ей уже обрубили. Нужны цепочка запуска, файл, закрепление и список того, что проверить рядом.</p></div></div>
            <div className="windows-device-card">
              <div><HardDrive size={25} /><span>FIN-WS-07</span></div>
              <dl><div><dt>ОС</dt><dd>Windows 11 Enterprise</dd></div><div><dt>Пользователь</dt><dd>NORTHLINE\\elena.orlova</dd></div><div><dt>Адрес</dt><dd>10.32.4.27</dd></div><div><dt>Состояние</dt><dd>Изолирована от сети</dd></div></dl>
            </div>
            <div className="route-goal"><strong>Задача</strong><p>Восстановить цепочку процессов, связать PID с сетью, проверить автозапуск и собрать артефакты без удаления исходных данных.</p></div>
            <button className="primary-action" onClick={() => setStage(1)}>Открыть снимок процессов<ArrowRight size={17} /></button>
          </section>
        )}

        {stage === 1 && (
          <section className="windows-process-stage">
            <header><Cpu size={22} /><div><p className="eyebrow">PROCESS TREE</p><h2>Кто кого запустил</h2></div></header>
            <div className="windows-theory"><strong>Родительский процесс</strong><p>Название процесса само по себе почти ничего не доказывает. Смотри на родителя, путь, пользователя, командную строку и дальнейшие действия.</p></div>
            <div className="windows-process-tree">
              <header><span>PID</span><span>PPID</span><span>PROCESS</span><span>USER</span><span>PATH</span></header>
              {windowsProcessTree.map((process) => (
                <div key={process.pid} className={process.trusted ? '' : 'suspicious'}>
                  <code>{process.pid}</code><code>{process.parentPid}</code><strong style={{ paddingLeft: process.depth * 16 }}>{process.depth > 0 && '└─ '}{process.name}</strong><span>{process.user}</span><code>{process.path}</code>
                </div>
              ))}
            </div>
            {renderOptions(windowsProcessQuestions, progress.windowsCaseProcessAnswers, processChecked, 'windowsCaseProcessAnswers')}
            <button className="primary-action full" onClick={checkProcess}>Проверить цепочку</button>
          </section>
        )}

        {stage === 2 && (
          <section className="route-terminal-stage windows-shell-stage">
            <header><TerminalSquare size={22} /><div><p className="eyebrow">POWERSHELL / СБОР АРТЕФАКТОВ</p><h2>Проверь снимок машины</h2></div></header>
            {nextObjective && <div className="route-instruction"><span>{progress.windowsCaseObjectives.length + 1}</span><div><strong>{nextObjective.title}</strong><p>{nextObjective.explanation}</p><code>{nextObjective.command}</code></div><button onClick={() => useGuidedInsert(nextObjective.command)}>Вставить</button></div>}
            <div className="route-terminal-console windows-terminal-console">
              <div className="route-terminal-history"><p>PS C:\\Cases\\NORTHLINE-07&gt;</p>{history.map((entry, index) => <div key={`${entry.command}-${index}`}><b>PS&gt; {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>PS&gt;</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeGuided()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeGuided}>RUN</button></div>
            </div>
            {commandsDone && <button className="primary-action full windows-next" onClick={() => setStage(3)}>Собрать PowerShell-скрипт<ArrowRight size={17} /></button>}
          </section>
        )}

        {stage === 3 && (
          <section className="route-code-stage windows-code-stage">
            <header><Code2 size={22} /><div><p className="eyebrow">POWERSHELL / COLLECT-ARTIFACTS.PS1</p><h2>Автоматизируй сбор</h2></div><button className="route-run" onClick={runCollector}><Play size={15} fill="currentColor" />RUN</button></header>
            {progress.windowsCaseScriptStep < windowsScriptSteps.length && <div className="route-code-guide"><span>{codeStepIndex + 1}</span><div><strong>{codeStep.title}</strong><p>{codeStep.text}</p><pre>{codeStep.snippet}</pre></div><div><button onClick={insertCodeStep}>Вставить</button><button className={codeStepReady ? 'ready' : ''} onClick={checkCodeStep}>Проверить</button></div></div>}
            <div className="route-editor windows-script-editor"><div className="route-lines">{lineNumbers.map((line) => <span key={line}>{line}</span>)}</div><textarea value={code} onChange={(event) => updateCode(event.target.value)} spellCheck={false} onKeyDown={(event) => { if (event.key === 'Tab') { event.preventDefault(); const target = event.currentTarget; const start = target.selectionStart; const end = target.selectionEnd; updateCode(`${code.slice(0, start)}    ${code.slice(end)}`); window.setTimeout(() => { target.selectionStart = target.selectionEnd = start + 4; }, 0); } }} /></div>
            <div className={`route-output ${runState} ${outputOpen ? '' : 'collapsed'}`}><header onClick={() => output && setOutputOpen((value) => !value)}><TerminalSquare size={14} /><strong>OUTPUT</strong><span>{runState === 'success' ? <CheckCircle2 size={15} /> : runState === 'error' ? <XCircle size={15} /> : null}</span>{output && (outputOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />)}</header>{outputOpen && <pre>{output}</pre>}</div>
            <div className="route-code-tools"><button onClick={() => navigator.clipboard?.writeText(code)}><Copy size={14} />Копировать</button><button onClick={() => updateCode(windowsScriptStarter)}><RotateCcw size={14} />Сбросить</button>{allCodeReady && <span>Сборщик готов к проверке.</span>}</div>
            {runState === 'success' && <button className="primary-action full windows-next" onClick={() => setStage(4)}>Перейти ко второй машине<ArrowRight size={17} /></button>}
          </section>
        )}

        {stage === 4 && (
          <section className="windows-independent-stage">
            <header><Activity size={22} /><div><p className="eyebrow">OPS-WS-12 / САМОСТОЯТЕЛЬНО</p><h2>Вторая машина</h2></div></header>
            <div className="windows-theory warning"><strong>Теперь без пошагового порядка</strong><p>Есть снимок другой рабочей станции. Сам реши, какие источники проверить. Подсказки доступны, но использование сохраняется в результате главы.</p></div>
            <button className="secondary-action windows-hint-toggle" onClick={revealIndependentHints}>{showIndependentHints ? 'Скрыть доступные команды' : 'Показать доступные команды'}</button>
            {showIndependentHints && <div className="windows-command-bank">{independentMachineCommands.map((item) => <button key={item.id} disabled={progress.windowsCaseIndependentObjectives.includes(item.id)} onClick={() => setIndependentCommand(item.command)}><strong>{item.id.toUpperCase()}</strong><code>{item.command}</code></button>)}</div>}
            <div className="route-terminal-console windows-terminal-console independent">
              <div className="route-terminal-history"><p>PS C:\\Cases\\OPS-WS-12&gt;</p>{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b>PS&gt; {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>PS&gt;</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeIndependent()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeIndependent}>RUN</button></div>
            </div>
            {renderOptions(windowsIndependentQuestions, progress.windowsCaseIndependentAnswers, independentChecked, 'windowsCaseIndependentAnswers')}
            <button className="primary-action full" onClick={checkIndependent} disabled={!independentDone}>Проверить вторую машину</button>
          </section>
        )}

        {stage === 5 && (
          <section className="route-choice-stage windows-findings-stage"><header><FileSearch size={22} /><div><p className="eyebrow">РАССЛЕДОВАНИЕ</p><h2>Отдели факты от предположений</h2></div></header><div className="windows-evidence-row"><span><FileCheck2 size={17} />4688</span><span><Network size={17} />PID → IP</span><span><HardDrive size={17} />SHA-256</span><span><Power size={17} />AUTORUN</span></div>{renderOptions(windowsFindingSections, progress.windowsCaseFindingSelections, findingsChecked, 'windowsCaseFindingSelections')}<button className="primary-action full" onClick={checkFindings}>Проверить вывод</button></section>
        )}

        {stage === 6 && (
          <section className="route-choice-stage windows-report-stage"><header><ClipboardList size={22} /><div><p className="eyebrow">INCIDENT REPORT</p><h2>Собери точный отчёт</h2></div></header><p>Отчёт должен описывать только подтверждённые события, масштаб и следующие действия.</p>{renderOptions(windowsReportSections, progress.windowsCaseReportSelections, reportChecked, 'windowsCaseReportSelections')}<button className="primary-action full" onClick={checkReport}>Проверить отчёт</button></section>
        )}

        {stage === 7 && (
          <section className="route-wrap windows-wrap"><ShieldCheck size={50} /><p className="eyebrow">NORTHLINE-07 / ЗАВЕРШЕНО</p><h1>Две машины изолированы</h1><p>Ты связал события 4688, дерево процессов, сетевые соединения, хэш и механизмы автозапуска. Удаление файлов не использовалось вместо расследования.</p><div><strong>Отработано:</strong><span>Windows Process Tree</span><span>Event ID 4688</span><span>PowerShell</span><span>PID и сеть</span><span>SHA-256</span><span>Автозапуск</span><span>Самостоятельный triage</span></div><small>Подсказок использовано: {progress.windowsCaseHintUses}</small><button className="primary-action" onClick={completeWindowsCase}>Закрыть дело</button></section>
        )}
      </main>
    </div>
  );
}
