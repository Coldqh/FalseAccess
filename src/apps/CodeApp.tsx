import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Copy, Eye, FileText, Play, RotateCcw, TerminalSquare, XCircle } from 'lucide-react';
import { authLog, pythonGuideSteps, pythonStarter } from '../data/content';
import { useProgress } from '../system/ProgressContext';
import { getClinicStage, clinicTransitions } from '../missions/clinic01';
import { MissionGuideStrip } from '../components/MissionGuideStrip';
import { MissionStageComplete } from '../components/MissionStageComplete';
import type { AppId } from '../types';

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
  if (/FileNotFoundError/i.test(message)) return 'Нужен путь /home/pyodide/auth.log.';
  return 'Смотри последнюю строку ошибки и номер строки.';
}

export function CodeApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress, setFlag } = useProgress();
  const stage = getClinicStage(progress);
  const missionActive = stage.id === 'code';
  const initialStep = Math.min(progress.pythonLessonStep, pythonGuideSteps.length - 1);
  const [code, setCode] = useState(() => missionActive ? buildCode(progress.pythonLessonStep) : '');
  const [activeStep, setActiveStep] = useState(initialStep);
  const [runState, setRunState] = useState<RunState>('idle');
  const [output, setOutput] = useState('');
  const [outputOpen, setOutputOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const pyodideRef = useRef<any>(null);

  const active = pythonGuideSteps[Math.min(activeStep, pythonGuideSteps.length - 1)];
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);
  const currentPassed = active.check.test(code);
  const allPassed = pythonGuideSteps.every((step) => step.check.test(code));
  const transitionAcknowledged = progress.acknowledgedTransitions.includes(clinicTransitions.code.id);

  useEffect(() => {
    if (progress.pythonComplete && transitionAcknowledged) {
      setCode('');
      setOutput('');
      setOutputOpen(false);
      setRunState('idle');
    }
  }, [progress.pythonComplete, transitionAcknowledged]);

  const updateCode = (value: string) => {
    setCode(value);
    setRunState('idle');
    setOutput('');
    setOutputOpen(false);
  };

  const checkStep = () => {
    if (!missionActive) return;
    if (!currentPassed) {
      setRunState('error');
      setOutput(`Нужна строка:\n${active.snippet}`);
      setOutputOpen(true);
      return;
    }
    setFlag('pythonLessonStep', Math.max(progress.pythonLessonStep, activeStep + 1));
    if (activeStep < pythonGuideSteps.length - 1) setActiveStep(activeStep + 1);
    else {
      setOutput('Код собран. Нажми RUN.');
      setOutputOpen(true);
    }
  };

  const runCode = async () => {
    if (missionActive) {
      const missing = pythonGuideSteps.find((step) => !step.check.test(code));
      if (missing) {
        setActiveStep(pythonGuideSteps.indexOf(missing));
        setRunState('error');
        setOutput(`Не хватает:\n${missing.snippet}`);
        setOutputOpen(true);
        return;
      }
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
      pyodide.FS.writeFile('/home/pyodide/auth.log', authLog);
      await pyodide.runPythonAsync(`
import sys, io
_capture = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _capture
`);
      try { await pyodide.runPythonAsync(code); }
      finally {
        await pyodide.runPythonAsync(`
sys.stdout = _old_stdout
_result = _capture.getvalue()
`);
      }
      const result = String(pyodide.globals.get('_result') ?? '').trim();
      if (missionActive && result.includes('Failed logins: 6')) {
        setRunState('success');
        setOutput(result);
        setFlag('pythonLessonStep', pythonGuideSteps.length);
        setFlag('pythonComplete', true);
      } else if (!missionActive) {
        setRunState('success');
        setOutput(result || '(программа завершилась без вывода)');
      } else {
        setRunState('error');
        setOutput(`${result || '(нет вывода)'}\nНужен вывод: Failed logins: 6`);
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
    <div className={`code-app-v4 ${missionActive ? 'mission-layer-active' : 'base-app-only'}`}>
      <section className="editor-shell-v4">
        <header className="editor-toolbar">
          <div className="editor-tab"><span className="python-dot">PY</span><strong>{missionActive ? 'analyze_auth.py' : 'untitled.py'}</strong><i>{code ? '●' : ''}</i></div>
          <div className="editor-actions">
            {missionActive && <button title="auth.log" onClick={() => setShowLog((value) => !value)}><Eye size={15} /></button>}
            <button title="Копировать" onClick={() => navigator.clipboard?.writeText(code)}><Copy size={15} /></button>
            <button title="Очистить" onClick={() => updateCode(missionActive ? pythonStarter : '')}><RotateCcw size={15} /></button>
            <button className="run-button" onClick={runCode} disabled={runState === 'loading'}><Play size={15} fill="currentColor" />{runState === 'loading' ? 'RUNNING' : 'RUN'}</button>
          </div>
        </header>

        {missionActive && (
          <MissionGuideStrip
            title={`${activeStep + 1}. ${active.title}`}
            text={active.why}
            detail={`${active.instruction} ${active.read}`}
            code={active.snippet}
            insertLabel="Вставить строку"
            onInsert={() => updateCode(insertStep(code, active))}
            onCheck={checkStep}
            checkReady={currentPassed}
          />
        )}

        {showLog && missionActive && <section className="source-preview-v4"><header><FileText size={15} /><strong>auth.log</strong><button onClick={() => setShowLog(false)}>Закрыть</button></header><pre>{authLog}</pre></section>}

        <div className="editor-area-v4">
          <div className="line-numbers" aria-hidden="true">{lineNumbers.map((line) => <span key={line}>{line}</span>)}</div>
          <textarea value={code} onChange={(event) => updateCode(event.target.value)} onKeyDown={handleTab} spellCheck={false} aria-label="Редактор Python" placeholder={missionActive ? '' : '# Новый файл'} />
        </div>

        <div className={`code-output-v4 ${runState} ${outputOpen ? 'expanded' : 'collapsed'}`}>
          <header onClick={() => output && setOutputOpen((value) => !value)}><TerminalSquare size={15} /><span>OUTPUT</span><i>{runState === 'success' ? <CheckCircle2 size={15} /> : runState === 'error' ? <XCircle size={15} /> : null}</i>{output && <button>{outputOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</button>}</header>
          {outputOpen && <pre>{output}</pre>}
        </div>
      </section>

      {progress.pythonComplete && <MissionStageComplete transition={clinicTransitions.code} openApp={openApp} />}
      {missionActive && allPassed && !progress.pythonComplete && <div className="code-ready-hint">Код собран. Нажми RUN.</div>}
    </div>
  );
}
