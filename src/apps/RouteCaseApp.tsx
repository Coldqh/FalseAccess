import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDot, Code2, Copy, FileCode2,
  FileSearch, FileText, Globe2, ListChecks, Play, RotateCcw, Send, ShieldAlert, TerminalSquare, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  routeAccessLog, routeAuditLog, routeBrowserQuestions, routeDecisionOptions, routeFindingSections,
  routePythonStarter, routePythonSteps, routeReportSections, routeSessionsLog, routeTerminalObjectives,
  type RouteCaseChoice,
} from '../missions/route01';

type RunState = 'idle' | 'loading' | 'success' | 'error';

const stageNames = ['Дело', 'HTTP', 'Terminal', 'Python', 'Вывод', 'Отчёт', 'Решение', 'Готово'];

function insertSnippet(code: string, marker: string, snippet: string) {
  if (code.includes(snippet)) return code;
  return code.replace(marker, `${marker}\n${snippet}`);
}

function optionIsCorrect(option: unknown): boolean {
  return Boolean(option && typeof option === 'object' && 'correct' in option && (option as { correct?: boolean }).correct);
}

function correctSelection(sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[], selections: Record<string, string>) {
  return sections.every((section) => {
    const option = section.options.find((item) => item.id === selections[section.id]);
    return option ? optionIsCorrect(option) : false;
  });
}

function terminalCommand(raw: string) {
  return raw.trim().replace(/\s+/g, ' ');
}

export function RouteCaseApp() {
  const { progress, setFlag, completeRouteCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.routeCaseStage));
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ command: string; output: string; ok: boolean }>>([]);
  const [browserChecked, setBrowserChecked] = useState(false);
  const [findingsChecked, setFindingsChecked] = useState(false);
  const [reportChecked, setReportChecked] = useState(false);
  const [runState, setRunState] = useState<RunState>('idle');
  const [output, setOutput] = useState('');
  const [outputOpen, setOutputOpen] = useState(false);
  const pyodideRef = useRef<any>(null);

  const terminalDone = routeTerminalObjectives.every((item) => progress.routeCaseTerminalObjectives.includes(item.id));
  const nextTerminal = routeTerminalObjectives.find((item) => !progress.routeCaseTerminalObjectives.includes(item.id));
  const code = progress.routeCaseCode || routePythonStarter;
  const codeStepIndex = Math.min(progress.routeCaseCodeStep, routePythonSteps.length - 1);
  const codeStep = routePythonSteps[codeStepIndex];
  const codeStepReady = codeStep.check.test(code);
  const allCodeReady = routePythonSteps.every((item) => item.check.test(code));
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);

  const setStage = (value: number) => setFlag('routeCaseStage', Math.min(7, Math.max(progress.routeCaseStage, value)));

  const chooseBrowser = (questionId: string, optionId: string) => {
    setFlag('routeCaseBrowserAnswers', { ...progress.routeCaseBrowserAnswers, [questionId]: optionId });
    setBrowserChecked(false);
  };

  const checkBrowser = () => {
    setBrowserChecked(true);
    if (correctSelection(routeBrowserQuestions, progress.routeCaseBrowserAnswers)) setStage(2);
  };

  const runTerminal = () => {
    const raw = terminalCommand(terminalInput);
    if (!raw || !nextTerminal) return;
    const expected = terminalCommand(nextTerminal.command);
    const accepted = raw === expected
      || (nextTerminal.id === 'admin' && raw.includes('grep') && raw.includes('/admin') && raw.includes('access.jsonl'))
      || (nextTerminal.id === 'fails' && raw.includes('grep') && raw.includes('401') && raw.includes('access.jsonl'));
    const outputText = accepted ? nextTerminal.output : `Команда не решает текущую задачу. Нужна работа с: ${nextTerminal.command}`;
    setTerminalHistory((current) => [...current, { command: terminalInput, output: outputText, ok: accepted }]);
    setTerminalInput('');
    if (accepted) {
      const completed = [...progress.routeCaseTerminalObjectives, nextTerminal.id];
      setFlag('routeCaseTerminalObjectives', completed);
      if (completed.length === routeTerminalObjectives.length) setStage(3);
    }
  };

  const updateCode = (value: string) => {
    setFlag('routeCaseCode', value);
    setRunState('idle');
    setOutput('');
  };

  const checkCodeStep = () => {
    if (!codeStepReady) {
      setRunState('error');
      setOutput(`Строка не найдена:\n${codeStep.snippet}`);
      setOutputOpen(true);
      return;
    }
    const next = Math.min(routePythonSteps.length, progress.routeCaseCodeStep + 1);
    setFlag('routeCaseCodeStep', next);
    if (next >= routePythonSteps.length) {
      setOutput('Программа собрана. Нажми RUN.');
      setOutputOpen(true);
    }
  };

  const runPython = async () => {
    const missing = routePythonSteps.find((item) => !item.check.test(code));
    if (missing) {
      setRunState('error');
      setOutput(`Не хватает шага «${missing.title}».`);
      setOutputOpen(true);
      return;
    }
    setRunState('loading');
    setOutput('Запуск Python...');
    setOutputOpen(true);
    try {
      if (!pyodideRef.current) {
        const base = new URL('.', window.location.href).href;
        const module = await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`) as { loadPyodide: (options: { indexURL: string }) => Promise<any> };
        pyodideRef.current = await module.loadPyodide({ indexURL: `${base}pyodide/` });
      }
      const pyodide = pyodideRef.current;
      try { pyodide.FS.mkdirTree('/home/pyodide'); } catch { /* exists */ }
      pyodide.FS.writeFile('/home/pyodide/access.jsonl', routeAccessLog);
      pyodide.FS.writeFile('/home/pyodide/sessions.jsonl', routeSessionsLog);
      await pyodide.runPythonAsync('import sys, io\n_capture = io.StringIO()\n_old_stdout = sys.stdout\nsys.stdout = _capture');
      try { await pyodide.runPythonAsync(code); }
      finally { await pyodide.runPythonAsync('sys.stdout = _old_stdout\n_result = _capture.getvalue()'); }
      const result = String(pyodide.globals.get('_result') ?? '').trim();
      if (result.includes('198.51.100.27') && result.includes('/admin') && result.includes('rt_8f31c')) {
        setRunState('success');
        setOutput(result);
        setFlag('routeCaseCodeStep', routePythonSteps.length);
        setStage(4);
      } else {
        setRunState('error');
        setOutput(`${result || '(нет вывода)'}\n\nНужна временная линия с IP 198.51.100.27, /admin и session rt_8f31c.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRunState('error');
      setOutput(`Проверь отступы, кавычки и имена переменных.\n\n${message}`);
    }
  };

  const chooseFinding = (sectionId: string, optionId: string) => {
    setFlag('routeCaseFindingSelections', { ...progress.routeCaseFindingSelections, [sectionId]: optionId });
    setFindingsChecked(false);
  };

  const checkFindings = () => {
    setFindingsChecked(true);
    if (correctSelection(routeFindingSections, progress.routeCaseFindingSelections)) setStage(5);
  };

  const chooseReport = (sectionId: string, optionId: string) => {
    setFlag('routeCaseReportSelections', { ...progress.routeCaseReportSelections, [sectionId]: optionId });
    setReportChecked(false);
  };

  const checkReport = () => {
    setReportChecked(true);
    if (correctSelection(routeReportSections, progress.routeCaseReportSelections)) setStage(6);
  };

  const chooseDecision = (choice: RouteCaseChoice) => {
    setFlag('routeCaseChoice', choice);
    setStage(7);
  };

  return (
    <div className="route-case-app">
      <aside className="route-case-sidebar">
        <header><p className="eyebrow">MARSHRUT-01</p><h2>Ночная сессия</h2><span>Игорь · 8 000 ₽</span></header>
        <nav>{stageNames.map((name, index) => <button key={name} className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`} disabled><span>{index < stage ? <Check size={13} /> : index + 1}</span><strong>{name}</strong></button>)}</nav>
        <footer><ShieldAlert size={16} /><p>Работа идёт с копией данных внутри учебного стенда.</p></footer>
      </aside>

      <main className="route-case-main app-scroll">
        {stage === 0 && (
          <section className="route-brief">
            <p className="eyebrow">КАФЕ «СИГНАЛ» / ВЕЧЕР</p><h1>Архив службы доставки</h1>
            <div className="route-dialogue"><span>И</span><div><strong>Игорь</strong><p>У них ночью открыли админку. Нужны IP, время и учётка. Два дня.</p><p>Работай только с архивом. На сам сервер не лезь.</p></div></div>
            <div className="route-file-grid"><article><FileText size={21} /><strong>access.jsonl</strong><span>HTTP-запросы</span></article><article><FileCode2 size={21} /><strong>sessions.jsonl</strong><span>Создание и использование сессий</span></article><article><ListChecks size={21} /><strong>audit.jsonl</strong><span>Действия в панели</span></article></div>
            <div className="route-goal"><strong>Задача</strong><p>Восстановить цепочку событий и отделить доказанные факты от догадок.</p></div>
            <button className="primary-action" onClick={() => setStage(1)}>Открыть сайт «Маршрут»<ArrowRight size={17} /></button>
          </section>
        )}

        {stage === 1 && (
          <section className="route-browser-stage">
            <header><Globe2 size={22} /><div><p className="eyebrow">HTTP / ОСНОВЫ</p><h2>Посмотри, как сайт общается с сервером</h2></div></header>
            <div className="route-browser-grid">
              <div className="route-browser-frame"><div className="route-browser-bar"><span>🔒 marshrut.local</span></div><iframe src={`${new URL('.', window.location.href).href}sites/marshrut/index.html`} title="Маршрут" sandbox="allow-scripts allow-forms allow-same-origin" /></div>
              <aside className="route-network-panel"><header><CircleDot size={15} /><strong>NETWORK</strong></header><div className="route-request"><b>POST</b><code>/login</code><span className="bad">401</span></div><div className="route-request"><b>GET</b><code>/admin</code><span>302</span></div><div className="route-request"><b>GET</b><code>/admin/orders</code><span className="good">200</span></div><div className="route-cookie"><strong>Cookie</strong><code>route_sid=rt_8f31c</code><p>Сервер использует cookie, чтобы связать запрос с уже созданной сессией.</p></div></aside>
            </div>
            <div className="route-questions">{routeBrowserQuestions.map((question) => <article key={question.id}><h3>{question.label}</h3><div>{question.options.map((option) => { const selected = progress.routeCaseBrowserAnswers[question.id] === option.id; const wrong = browserChecked && selected && !optionIsCorrect(option); const right = browserChecked && selected && optionIsCorrect(option); return <button key={option.id} className={`${selected ? 'selected' : ''} ${wrong ? 'wrong' : ''} ${right ? 'correct' : ''}`} onClick={() => chooseBrowser(question.id, option.id)}>{selected ? '●' : '○'} {option.text}</button>; })}</div></article>)}</div>
            <button className="primary-action" onClick={checkBrowser}>Проверить ответы</button>
          </section>
        )}

        {stage === 2 && (
          <section className="route-terminal-stage">
            <header><TerminalSquare size={22} /><div><p className="eyebrow">TERMINAL / JSONL</p><h2>Осмотри архив</h2></div></header>
            {nextTerminal && <div className="route-instruction"><span>{progress.routeCaseTerminalObjectives.length + 1}</span><div><strong>{nextTerminal.title}</strong><p>{nextTerminal.explanation}</p><code>{nextTerminal.command}</code></div><button onClick={() => setTerminalInput(nextTerminal.command)}>Вставить</button></div>}
            <div className="route-terminal-console"><div className="route-terminal-history"><p>FALSE ACCESS / route-01</p>{terminalHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b>$ {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div><div className="route-terminal-input"><span>$</span><input value={terminalInput} onChange={(event) => setTerminalInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runTerminal()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={runTerminal}>Выполнить</button></div></div>
            {terminalDone && <button className="primary-action" onClick={() => setStage(3)}>Перейти к Python<ArrowRight size={17} /></button>}
          </section>
        )}

        {stage === 3 && (
          <section className="route-code-stage">
            <header><Code2 size={22} /><div><p className="eyebrow">PYTHON / ВРЕМЕННАЯ ЛИНИЯ</p><h2>Соедини два журнала</h2></div><button className="route-run" disabled={runState === 'loading'} onClick={runPython}><Play size={15} fill="currentColor" />RUN</button></header>
            {progress.routeCaseCodeStep < routePythonSteps.length && <div className="route-code-guide"><span>{codeStepIndex + 1}</span><div><strong>{codeStep.title}</strong><p>{codeStep.text}</p><pre>{codeStep.snippet}</pre></div><div><button onClick={() => updateCode(insertSnippet(code, codeStep.marker, codeStep.snippet))}>Вставить</button><button className={codeStepReady ? 'ready' : ''} onClick={checkCodeStep}>Проверить</button></div></div>}
            <div className="route-editor"><div className="route-lines">{lineNumbers.map((line) => <span key={line}>{line}</span>)}</div><textarea value={code} onChange={(event) => updateCode(event.target.value)} spellCheck={false} onKeyDown={(event) => { if (event.key === 'Tab') { event.preventDefault(); const target = event.currentTarget; const start = target.selectionStart; const end = target.selectionEnd; updateCode(`${code.slice(0, start)}    ${code.slice(end)}`); window.setTimeout(() => { target.selectionStart = target.selectionEnd = start + 4; }, 0); } }} /></div>
            <div className={`route-output ${runState} ${outputOpen ? '' : 'collapsed'}`}><header onClick={() => output && setOutputOpen((value) => !value)}><TerminalSquare size={14} /><strong>OUTPUT</strong><span>{runState === 'success' ? <CheckCircle2 size={15} /> : runState === 'error' ? <XCircle size={15} /> : null}</span>{output && (outputOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />)}</header>{outputOpen && <pre>{output}</pre>}</div>
            <div className="route-code-tools"><button onClick={() => navigator.clipboard?.writeText(code)}><Copy size={14} />Копировать</button><button onClick={() => updateCode(routePythonStarter)}><RotateCcw size={14} />Сбросить код</button>{allCodeReady && <span>Все строки на месте. Запусти программу.</span>}</div>
          </section>
        )}

        {stage === 4 && (
          <section className="route-choice-stage"><header><FileSearch size={22} /><div><p className="eyebrow">АНАЛИЗ</p><h2>Что подтверждают данные?</h2></div></header><p>Не выбирай объяснение только потому, что оно звучит правдоподобно.</p><div className="route-section-list">{routeFindingSections.map((section) => <article key={section.id}><h3>{section.label}</h3>{section.options.map((option) => { const selected = progress.routeCaseFindingSelections[section.id] === option.id; const wrong = findingsChecked && selected && !optionIsCorrect(option); const right = findingsChecked && selected && optionIsCorrect(option); return <button key={option.id} className={`${selected ? 'selected' : ''} ${wrong ? 'wrong' : ''} ${right ? 'correct' : ''}`} onClick={() => chooseFinding(section.id, option.id)}>{selected ? '●' : '○'}<span>{option.text}</span>{wrong && <XCircle size={16} />}{right && <CheckCircle2 size={16} />}</button>; })}</article>)}</div><button className="primary-action" onClick={checkFindings}>Проверить вывод</button></section>
        )}

        {stage === 5 && (
          <section className="route-choice-stage"><header><FileText size={22} /><div><p className="eyebrow">ОТЧЁТ</p><h2>Собери четыре точные строки</h2></div></header><div className="route-section-list">{routeReportSections.map((section) => <article key={section.id}><h3>{section.label}</h3>{section.options.map((option) => { const selected = progress.routeCaseReportSelections[section.id] === option.id; const wrong = reportChecked && selected && !optionIsCorrect(option); const right = reportChecked && selected && optionIsCorrect(option); return <button key={option.id} className={`${selected ? 'selected' : ''} ${wrong ? 'wrong' : ''} ${right ? 'correct' : ''}`} onClick={() => chooseReport(section.id, option.id)}>{selected ? '●' : '○'}<span>{option.text}</span>{wrong && <XCircle size={16} />}{right && <CheckCircle2 size={16} />}</button>; })}</article>)}</div><button className="primary-action" onClick={checkReport}>Проверить отчёт</button></section>
        )}

        {stage === 6 && (
          <section className="route-decision-stage"><header><Send size={22} /><div><p className="eyebrow">ИГОРЬ ЖДЁТ ОТВЕТ</p><h2>Что ему отправить?</h2></div></header><div className="route-dialogue compact"><span>И</span><div><strong>Игорь</strong><p>Скинь IP, время, учётку и cookie. Остальное не нужно.</p></div></div><div className="route-decision-grid">{routeDecisionOptions.map((option) => <button key={option.id} onClick={() => chooseDecision(option.id)}><strong>{option.title}</strong><p>{option.text}</p><span>{option.pay ? `Оплата: ${option.pay.toLocaleString('ru-RU')} ₽` : 'Без оплаты'}</span></button>)}</div></section>
        )}

        {stage === 7 && (() => { const decision = routeDecisionOptions.find((item) => item.id === progress.routeCaseChoice); return <section className="route-wrap"><CheckCircle2 size={48} /><p className="eyebrow">MARSHRUT-01 / ЗАВЕРШЕНО</p><h1>{decision?.title ?? 'Решение принято'}</h1><p>{decision?.text}</p><div><strong>Ты отработал:</strong><span>HTTP-коды и методы</span><span>Cookie и сессии</span><span>JSONL</span><span>Объединение журналов в Python</span><span>Факты и недоказанные выводы</span></div><button className="primary-action" onClick={() => completeRouteCase(progress.routeCaseChoice as RouteCaseChoice)}>Закрыть дело</button></section>; })()}
      </main>
    </div>
  );
}
