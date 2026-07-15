import { useMemo, useRef, useState } from 'react';
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Code2, Copy, Eye, FileText, Play, Radio, RotateCcw, TerminalSquare, UserRound, XCircle } from 'lucide-react';
import { authLog, pythonGuideSteps, pythonSolution, pythonStarter } from '../data/content';
import { useProgress } from '../system/ProgressContext';

type RunState = 'idle' | 'loading' | 'success' | 'error';

function insertStep(code: string, step: typeof pythonGuideSteps[number]) {
  if (step.check.test(code)) return code;
  return code.replace(step.marker, `${step.marker}\n${step.snippet}`);
}

function buildCode(stepCount: number) {
  return pythonGuideSteps.slice(0, stepCount).reduce((current, step) => insertStep(current, step), pythonStarter);
}

function explainPythonError(message: string) {
  if (/IndentationError|unexpected indent|expected an indented block/i.test(message)) return 'Проверь отступы: 4 пробела внутри for, 8 — внутри if.';
  if (/SyntaxError/i.test(message)) return 'Проверь двоеточия после for и if, кавычки и скобки.';
  if (/NameError/i.test(message)) return 'Проверь имена: lines, line и failed.';
  if (/FileNotFoundError/i.test(message)) return 'Файл не найден. Нужен путь /home/pyodide/auth.log.';
  if (/TypeError/i.test(message)) return 'Проверь значение failed. Счётчик должен начинаться с 0.';
  return 'Смотри последнюю строку ошибки и номер строки.';
}

export function CodeApp() {
  const { progress, setFlag } = useProgress();
  const initialStep = progress.pythonComplete ? pythonGuideSteps.length - 1 : Math.min(progress.pythonLessonStep, pythonGuideSteps.length - 1);
  const [code, setCode] = useState(progress.pythonComplete ? pythonSolution : buildCode(progress.pythonLessonStep));
  const [activeStep, setActiveStep] = useState(initialStep);
  const [runState, setRunState] = useState<RunState>(progress.pythonComplete ? 'success' : 'idle');
  const [output, setOutput] = useState(progress.pythonComplete ? 'Failed logins: 6' : '');
  const [showLog, setShowLog] = useState(false);
  const [mode, setMode] = useState<'guided' | 'free'>('guided');
  const [mobilePane, setMobilePane] = useState<'brief' | 'code'>('brief');
  const [outputOpen, setOutputOpen] = useState(false);
  const pyodideRef = useRef<any>(null);
  const active = pythonGuideSteps[Math.min(activeStep, pythonGuideSteps.length - 1)];
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);
  const completedSteps = pythonGuideSteps.filter((step) => step.check.test(code)).length;
  const currentPassed = active.check.test(code);
  const allPassed = pythonGuideSteps.every((step) => step.check.test(code));
  const markerLine = Math.max(1, code.split('\n').findIndex((line) => line === active.marker) + 1);

  const updateCode = (value: string) => {
    setCode(value);
    setRunState('idle');
    setOutput('');
    setOutputOpen(false);
  };

  const checkStep = () => {
    if (!currentPassed) {
      setRunState('error');
      setOutput(`Строка не найдена. Нужна запись:\n${active.snippet}`);
      setOutputOpen(true);
      return;
    }
    const next = Math.min(pythonGuideSteps.length - 1, activeStep + 1);
    setFlag('pythonLessonStep', Math.max(progress.pythonLessonStep, activeStep + 1));
    setActiveStep(next);
    setRunState('idle');
    setOutput(activeStep === pythonGuideSteps.length - 1 ? 'Код собран. Запускай.' : '');
    setOutputOpen(activeStep === pythonGuideSteps.length - 1);
  };

  const runCode = async () => {
    const missing = pythonGuideSteps.find((step) => !step.check.test(code));
    if (missing) {
      const index = pythonGuideSteps.indexOf(missing);
      setActiveStep(index);
      setRunState('error');
      setOutput(`Не хватает: ${missing.snippet}`);
      setOutputOpen(true);
      return;
    }
    setRunState('loading');
    setOutput('running...');
    setOutputOpen(true);
    try {
      if (!pyodideRef.current) {
        const base = new URL('.', window.location.href).href;
        const pyodideModule = await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`) as { loadPyodide: (options: { indexURL: string }) => Promise<any> };
        pyodideRef.current = await pyodideModule.loadPyodide({ indexURL: `${base}pyodide/` });
      }
      const pyodide = pyodideRef.current;
      try { pyodide.FS.mkdirTree('/home/pyodide'); } catch { /* already exists */ }
      pyodide.FS.writeFile('/home/pyodide/auth.log', authLog);
      await pyodide.runPythonAsync(`
import sys, io
_capture = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _capture
`);
      try {
        await pyodide.runPythonAsync(code);
      } finally {
        await pyodide.runPythonAsync(`
sys.stdout = _old_stdout
_result = _capture.getvalue()
`);
      }
      const result = String(pyodide.globals.get('_result') ?? '').trim();
      if (result.includes('Failed logins: 6')) {
        setRunState('success');
        setOutput(result);
        setFlag('pythonLessonStep', pythonGuideSteps.length);
        setFlag('pythonComplete', true);
      } else {
        setRunState('error');
        setOutput(`${result || '(no output)'}\nexpected: Failed logins: 6`);
      }
    } catch (error) {
      setRunState('error');
      const message = error instanceof Error ? error.message : String(error);
      setOutput(`${explainPythonError(message)}\n\n${message}`);
    }
  };

  const handleTab = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${code.slice(0, start)}    ${code.slice(end)}`;
    updateCode(next);
    window.setTimeout(() => { target.selectionStart = target.selectionEnd = start + 4; }, 0);
  };

  return (
    <div className={`code-app code-app-v3 mobile-pane-${mobilePane}`}>
      <nav className="mobile-work-tabs code-mobile-tabs" aria-label="Панели редактора">
        <button className={mobilePane === 'brief' ? 'active' : ''} onClick={() => setMobilePane('brief')}><UserRound size={15} />Максим</button>
        <button className={mobilePane === 'code' ? 'active' : ''} onClick={() => setMobilePane('code')}><Code2 size={15} />Код</button>
      </nav>
      <aside className="lesson-panel app-scroll mentor-code-panel">
        <header className="mentor-console-header code-mentor-header">
          <div className="mentor-avatar">МБ<span /></div>
          <div><strong>Максим Белов</strong><small><Radio size={11} /> на связи</small></div>
          <b>{completedSteps}/{pythonGuideSteps.length}</b>
        </header>

        <div className="code-zero-header mission-code-brief">
          <p className="eyebrow">CLINIC-01 / ANALYZE_AUTH.PY</p>
          <h3>Посчитать Failed password</h3>
          <p>Файл: auth.log</p>
          <div className="mode-switch"><button className={mode === 'guided' ? 'active' : ''} onClick={() => setMode('guided')}>Максим</button><button className={mode === 'free' ? 'active' : ''} onClick={() => setMode('free')}>Сам</button></div>
        </div>

        {mode === 'guided' ? (
          <>
            <div className="mentor-chat-stream code-mentor-chat">
              {activeStep === 0 && <div className="mentor-bubble"><span>МБ</span><p>Открой analyze_auth.py. Python выполнит строки сверху вниз. Начнём с файла.</p></div>}
              <div className="mentor-bubble"><span>МБ</span><p>{active.why}</p></div>
              <div className="mentor-bubble"><span>МБ</span><p>{active.instruction}</p></div>
              {currentPassed && <div className="mentor-bubble result"><span>МБ</span><p>{active.read}</p></div>}
            </div>

            <section className="live-action-card code-live-action">
              <p className="eyebrow">СТРОКА {activeStep + 1}</p>
              <pre>{active.snippet}</pre>
              <div className="guided-actions">
                <button onClick={() => navigator.clipboard?.writeText(active.snippet)}><Copy size={14} />Копировать</button>
                <button onClick={() => { updateCode(insertStep(code, active)); setMobilePane('code'); }}><FileText size={14} />Вставить</button>
              </div>
              <button className="primary-action full-step" onClick={checkStep}>{currentPassed ? <><Check size={16} />Готово</> : 'Проверить'}</button>
            </section>

            <div className="syntax-index beginner-step-index compact-step-list">
              {pythonGuideSteps.map((step, index) => {
                const passed = step.check.test(code);
                const unlocked = index <= Math.max(progress.pythonLessonStep, completedSteps);
                return <button key={step.id} disabled={!unlocked} className={`${activeStep === index ? 'active' : ''} ${passed ? 'passed' : ''}`} onClick={() => setActiveStep(index)}><span>{passed ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span><div><strong>{step.title}</strong><small>{step.concept}</small></div><ChevronRight size={14} /></button>;
              })}
            </div>
          </>
        ) : (
          <section className="free-mode-guide"><Code2 size={28} /><h3>analyze_auth.py</h3><button className="secondary-action full" onClick={() => updateCode(pythonStarter)}>Очистить файл</button></section>
        )}
      </aside>

      <section className="editor-shell">
        <header className="editor-toolbar">
          <div className="editor-tab"><span className="python-dot">PY</span><strong>analyze_auth.py</strong><i>●</i></div>
          <div className="editor-actions">
            <button title="auth.log" onClick={() => setShowLog((value) => !value)}><Eye size={15} /></button>
            <button title="Копировать" onClick={() => navigator.clipboard?.writeText(code)}><Copy size={15} /></button>
            <button title="Сбросить" onClick={() => { updateCode(pythonStarter); setActiveStep(0); }}><RotateCcw size={15} /></button>
            <button className="run-button" onClick={runCode} disabled={runState === 'loading'}><Play size={15} fill="currentColor" /> {runState === 'loading' ? 'RUNNING' : 'RUN'}</button>
          </div>
        </header>
        {mode === 'guided' && (
          <section className="mobile-inline-lesson code-inline-lesson">
            <div className="mobile-inline-speaker">
              <span>МБ</span>
              <div>
                <strong>{active.title}</strong>
                <p>{active.why}</p>
                <small>{active.instruction}</small>
              </div>
            </div>
            <div className="mobile-code-snippet">
              <pre>{active.snippet}</pre>
              <div className="mobile-code-actions">
                <button onClick={() => updateCode(insertStep(code, active))}><FileText size={14} />Вставить строку</button>
                <button className={currentPassed ? 'ready' : ''} onClick={checkStep}><Check size={14} />Проверить готово</button>
              </div>
            </div>
            {currentPassed && <p className="mobile-step-result">{active.read}</p>}
          </section>
        )}
        {showLog && <section className="source-preview"><header><FileText size={15} /><strong>auth.log</strong><button onClick={() => setShowLog(false)}>Закрыть</button></header><pre>{authLog}</pre></section>}
        <div className="editor-area">
          <div className="line-numbers" aria-hidden="true">{lineNumbers.map((line) => <span key={line} className={line === markerLine + 1 ? 'target-line' : ''}>{line}</span>)}</div>
          <textarea value={code} onChange={(event) => updateCode(event.target.value)} onKeyDown={handleTab} spellCheck={false} aria-label="Редактор Python" />
        </div>
        <div className={`code-output ${runState} ${output ? 'has-output' : 'empty'} ${outputOpen ? 'expanded' : 'collapsed'}`}>
          <header onClick={() => output && setOutputOpen((value) => !value)}>
            <TerminalSquare size={15} /><span>OUTPUT</span>
            <i>{runState === 'success' ? <CheckCircle2 size={15} /> : runState === 'error' ? <XCircle size={15} /> : null}</i>
            {output && <button aria-label={outputOpen ? 'Свернуть вывод' : 'Развернуть вывод'}>{outputOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</button>}
          </header>
          {outputOpen && <pre>{output}</pre>}
        </div>
      </section>

      <aside className="code-checklist app-scroll beginner-checklist">
        <p className="eyebrow">CASE FILES</p>
        <h3>CLINIC-01</h3>
        <div className="program-flow">
          <div><span>01</span><strong>auth.log</strong><small>8 записей</small></div>
          <div><span>02</span><strong>analyze_auth.py</strong><small>{completedSteps}/8 строк</small></div>
          <div><span>03</span><strong>expected</strong><small>Failed logins: 6</small></div>
        </div>
        <div className="code-vocabulary">
          <span>CHECK</span>
          <div><b>Path</b><p>{pythonGuideSteps[0].check.test(code) ? 'OK' : '—'}</p></div>
          <div><b>log_path</b><p>{pythonGuideSteps[1].check.test(code) ? 'OK' : '—'}</p></div>
          <div><b>for / if</b><p>{pythonGuideSteps[4].check.test(code) && pythonGuideSteps[5].check.test(code) ? 'OK' : '—'}</p></div>
          <div><b>print</b><p>{pythonGuideSteps[7].check.test(code) ? 'OK' : '—'}</p></div>
        </div>
        <button className="secondary-action full" onClick={() => { updateCode(pythonSolution); setActiveStep(pythonGuideSteps.length - 1); }}>solution.py</button>
        {allPassed && !progress.pythonComplete && <div className="ready-to-run"><Check size={17} /><span>Код собран. Запускай.</span></div>}
        {progress.pythonComplete && <div className="passed-stamp">PASSED</div>}
        <div className="step-navigation"><button disabled={activeStep === 0} onClick={() => setActiveStep((value) => value - 1)}><ChevronLeft size={15} />Назад</button><button disabled={activeStep === pythonGuideSteps.length - 1} onClick={() => setActiveStep((value) => value + 1)}>Дальше<ChevronRight size={15} /></button></div>
      </aside>
    </div>
  );
}
