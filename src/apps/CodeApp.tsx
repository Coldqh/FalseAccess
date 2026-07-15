import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, Copy, Play, RotateCcw, TerminalSquare, XCircle } from 'lucide-react';
import { authLog, pythonSolution, pythonStarter, syntaxLessons } from '../data/content';
import { useProgress } from '../system/ProgressContext';

type RunState = 'idle' | 'loading' | 'success' | 'error';

export function CodeApp() {
  const { progress, setFlag } = useProgress();
  const [code, setCode] = useState(pythonStarter);
  const [activeLesson, setActiveLesson] = useState(0);
  const [runState, setRunState] = useState<RunState>('idle');
  const [output, setOutput] = useState('Нажми RUN, когда код готов.');
  const pyodideRef = useRef<any>(null);
  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);

  const runCode = async () => {
    setRunState('loading');
    setOutput('Запуск Python...');
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
        setOutput(`${result}\n\nПроверка пройдена. Найдено 6 неудачных входов.`);
        setFlag('pythonComplete', true);
      } else {
        setRunState('error');
        setOutput(`${result || '(программа ничего не вывела)'}\n\nОжидается: Failed logins: 6`);
      }
    } catch (error) {
      setRunState('error');
      const message = error instanceof Error ? error.message : String(error);
      setOutput(message);
    }
  };

  const active = syntaxLessons[activeLesson];

  return (
    <div className="code-app">
      <aside className="lesson-panel app-scroll">
        <div className="lesson-title">
          <p className="eyebrow">PYTHON / ОСНОВЫ</p>
          <h3>Счётчик ошибок входа</h3>
          <p>Программа должна пройти по строкам журнала и посчитать строки с текстом <code>Failed password</code>.</p>
        </div>
        <div className="syntax-index">
          {syntaxLessons.map((lesson, index) => (
            <button key={lesson.key} className={activeLesson === index ? 'active' : ''} onClick={() => setActiveLesson(index)}>
              <span>{String(index + 1).padStart(2, '0')}</span>{lesson.title}<ChevronRight size={14} />
            </button>
          ))}
        </div>
        <div className="syntax-card">
          <span className="syntax-label">{active.title}</span>
          <pre>{active.code}</pre>
          <p>{active.text}</p>
        </div>
        <div className="indent-warning">
          <strong>Отступы — часть синтаксиса</strong>
          <p>Строки внутри <code>for</code> и <code>if</code> должны быть сдвинуты вправо. Python иначе не понимает границы блока.</p>
        </div>
      </aside>

      <section className="editor-shell">
        <header className="editor-toolbar">
          <div className="editor-tab"><span className="python-dot">PY</span><strong>analyze_auth.py</strong><i>●</i></div>
          <div className="editor-actions">
            <button title="Скопировать решение" onClick={() => navigator.clipboard?.writeText(code)}><Copy size={15} /></button>
            <button title="Сбросить" onClick={() => { setCode(pythonStarter); setRunState('idle'); setOutput('Код сброшен.'); }}><RotateCcw size={15} /></button>
            <button className="run-button" onClick={runCode} disabled={runState === 'loading'}><Play size={15} fill="currentColor" /> {runState === 'loading' ? 'ЗАПУСК...' : 'RUN'}</button>
          </div>
        </header>
        <div className="editor-area">
          <div className="line-numbers" aria-hidden="true">{lineNumbers.map((line) => <span key={line}>{line}</span>)}</div>
          <textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label="Редактор Python" />
        </div>
        <div className={`code-output ${runState}`}>
          <header><TerminalSquare size={15} /><span>OUTPUT</span><i>{runState === 'success' ? <CheckCircle2 size={15} /> : runState === 'error' ? <XCircle size={15} /> : null}</i></header>
          <pre>{output}</pre>
        </div>
      </section>

      <aside className="code-checklist app-scroll">
        <p className="eyebrow">ПРОВЕРКА</p>
        <h3>Что должно быть в коде</h3>
        {[
          ['for', /for\s+\w+\s+in\s+lines\s*:/],
          ['if', /if\s+["']Failed password["']\s+in\s+\w+\s*:/],
          ['+= 1', /failed\s*\+=\s*1/],
          ['print', /print\s*\(/],
        ].map(([label, pattern]) => {
          const ok = (pattern as RegExp).test(code);
          return <div className={`code-rule ${ok ? 'ok' : ''}`} key={label as string}><span>{ok ? '✓' : '·'}</span><code>{label as string}</code></div>;
        })}
        <div className="expected-output">
          <span>ПРАВИЛЬНЫЙ ВЫВОД</span>
          <code>Failed logins: 6</code>
        </div>
        <button className="secondary-action full" onClick={() => setCode(pythonSolution)}>Показать эталон</button>
        {progress.pythonComplete && <div className="passed-stamp">LAB PASSED</div>}
      </aside>
    </div>
  );
}
