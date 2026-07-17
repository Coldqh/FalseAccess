import { useRef, useState } from 'react';
import { CheckCircle2, Play, RotateCcw, XCircle } from 'lucide-react';
import type { EventPayload } from '../core/scenario/types';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

interface DatasetExpectation {
  path: string;
  content: string;
  expected: Record<string, string | number | boolean | null>;
}

interface Props {
  starter: string;
  visible: DatasetExpectation;
  hidden: DatasetExpectation;
  finding: string;
  title: string;
  instruction: string;
  source: string;
}

function equalRecord(actual: unknown, expected: Record<string, string | number | boolean | null>) {
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false;
  const record = actual as Record<string, unknown>;
  return Object.entries(expected).every(([key, value]) => record[key] === value);
}

export function PythonEvidencePanel({ starter, visible, hidden, finding, title, instruction, source }: Props) {
  const runtime = useMissionRuntime();
  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState('Скрипт не запускался.');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const pyodideRef = useRef<any>(null);

  const run = async () => {
    setState('loading');
    setOutput('Pyodide: запуск visible и hidden tests...');
    let payload: EventPayload = { success: false, finding: null, testsPassed: 0, testsTotal: 2, hiddenTests: true, readOnly: true };
    try {
      if (!pyodideRef.current) {
        const base = new URL('.', window.location.href).href;
        const module = await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`) as { loadPyodide: (options: { indexURL: string }) => Promise<any> };
        pyodideRef.current = await module.loadPyodide({ indexURL: `${base}pyodide/` });
      }
      const pyodide = pyodideRef.current;
      try { pyodide.FS.mkdirTree('/home/pyodide'); } catch { /* exists */ }
      pyodide.FS.writeFile(visible.path, visible.content);
      pyodide.FS.writeFile(hidden.path, hidden.content);
      await pyodide.runPythonAsync(code);
      const call = `
import json as _json
_visible_result = analyze(${JSON.stringify(visible.path)})
_hidden_result = analyze(${JSON.stringify(hidden.path)})
_fa_result = _json.dumps({"visible": _visible_result, "hidden": _hidden_result}, ensure_ascii=False)
`;
      await pyodide.runPythonAsync(call);
      const raw = String(pyodide.globals.get('_fa_result') ?? '{}');
      const parsed = JSON.parse(raw) as { visible?: unknown; hidden?: unknown };
      const visiblePassed = equalRecord(parsed.visible, visible.expected);
      const hiddenPassed = equalRecord(parsed.hidden, hidden.expected);
      const passed = visiblePassed && hiddenPassed;
      payload = {
        success: passed,
        finding: passed ? finding : null,
        testsPassed: Number(visiblePassed) + Number(hiddenPassed),
        testsTotal: 2,
        hiddenTests: true,
        readOnly: true,
      };
      setState(passed ? 'success' : 'error');
      setOutput(passed
        ? '2/2 теста пройдены. Hidden-набор отличается от видимого: жёстко прошитые значения не засчитаны.'
        : `${Number(visiblePassed) + Number(hiddenPassed)}/2 теста. Проверь обработку повреждённой строки, внешние auth-события и связь PID с network.`);
    } catch (error) {
      payload = { ...payload, error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) };
      setState('error');
      setOutput(error instanceof Error ? error.message : String(error));
    }
    runtime.recordAction({ type: 'python.executed', source, payload });
  };

  return (
    <section className="act0-python-panel">
      <header><div><strong>{title}</strong><span>VISIBLE + HIDDEN TESTS</span></div><button onClick={() => { setCode(starter); setState('idle'); setOutput('Код сброшен.'); }}><RotateCcw size={14} /></button></header>
      <p>{instruction}</p>
      <textarea value={code} onChange={(event) => { setCode(event.target.value); setState('idle'); }} spellCheck={false} />
      <footer><button className="primary-action" onClick={run} disabled={state === 'loading'}><Play size={15} />{state === 'loading' ? 'Проверка...' : 'Запустить тесты'}</button><pre className={state}>{state === 'success' ? <CheckCircle2 size={16} /> : state === 'error' ? <XCircle size={16} /> : null}{output}</pre></footer>
    </section>
  );
}
