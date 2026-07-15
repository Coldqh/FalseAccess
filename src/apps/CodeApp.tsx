import { useMemo, useRef, useState } from 'react';
import { BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, Code2, Copy, Eye, FileText, HelpCircle, Play, RotateCcw, TerminalSquare, WandSparkles, XCircle } from 'lucide-react';
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
  if (/IndentationError|unexpected indent|expected an indented block/i.test(message)) {
    return 'Ошибка отступа. Код внутри for должен иметь 4 пробела, а код внутри if — 8 пробелов.';
  }
  if (/SyntaxError/i.test(message)) {
    return 'Ошибка синтаксиса. Проверь двоеточия после for и if, кавычки и круглые скобки.';
  }
  if (/NameError/i.test(message)) {
    return 'Python встретил неизвестное имя. Проверь написание переменных: lines, line и failed — разные имена.';
  }
  if (/FileNotFoundError/i.test(message)) {
    return 'Файл не найден. Путь должен быть точно /home/pyodide/auth.log.';
  }
  if (/TypeError/i.test(message)) {
    return 'Операция получила значение неподходящего типа. Проверь, что счётчик failed начинается с числа 0.';
  }
  return 'Прочитай последнюю строку ошибки. В ней указан тип проблемы и номер строки кода.';
}

export function CodeApp() {
  const { progress, setFlag } = useProgress();
  const initialStep = progress.pythonComplete ? pythonGuideSteps.length : Math.min(progress.pythonLessonStep, pythonGuideSteps.length - 1);
  const [code, setCode] = useState(progress.pythonComplete ? pythonSolution : buildCode(progress.pythonLessonStep));
  const [activeStep, setActiveStep] = useState(initialStep);
  const [runState, setRunState] = useState<RunState>(progress.pythonComplete ? 'success' : 'idle');
  const [output, setOutput] = useState(progress.pythonComplete ? 'Failed logins: 6\n\nЛаборатория уже пройдена.' : 'Код ещё не запускался. Сначала собери программу по шагам слева.');
  const [showLog, setShowLog] = useState(false);
  const [mode, setMode] = useState<'guided' | 'free'>('guided');
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
    setOutput('Код изменён. Проверь текущий шаг.');
  };

  const checkStep = () => {
    if (!currentPassed) {
      setRunState('error');
      setOutput(`Шаг не найден. Перейди к строке ${markerLine} и напиши:\n${active.snippet}\n\nВажно: сохрани пробелы в начале строки.`);
      return;
    }
    const next = Math.min(pythonGuideSteps.length - 1, activeStep + 1);
    setFlag('pythonLessonStep', Math.max(progress.pythonLessonStep, activeStep + 1));
    setActiveStep(next);
    setRunState('idle');
    setOutput(activeStep === pythonGuideSteps.length - 1 ? 'Все части на месте. Теперь нажми RUN.' : `Шаг ${activeStep + 1} принят. Переходим дальше.`);
  };

  const runCode = async () => {
    const missing = pythonGuideSteps.find((step) => !step.check.test(code));
    if (missing) {
      const index = pythonGuideSteps.indexOf(missing);
      setActiveStep(index);
      setRunState('error');
      setOutput(`Программа ещё не собрана. Не хватает шага ${index + 1}: ${missing.title}.\nНужно написать:\n${missing.snippet}`);
      return;
    }
    setRunState('loading');
    setOutput('Python читает программу и выполняет строки сверху вниз...');
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
        setOutput(`${result}\n\nПрограмма прошла по 8 строкам журнала, нашла 6 строк с Failed password и вывела итог.`);
        setFlag('pythonLessonStep', pythonGuideSteps.length);
        setFlag('pythonComplete', true);
      } else {
        setRunState('error');
        setOutput(`${result || '(программа ничего не вывела)'}\n\nКод запустился, но результат неверный. Ожидается Failed logins: 6. Проверь условие и увеличение счётчика.`);
      }
    } catch (error) {
      setRunState('error');
      const message = error instanceof Error ? error.message : String(error);
      setOutput(`${explainPythonError(message)}\n\nТЕХНИЧЕСКОЕ СООБЩЕНИЕ:\n${message}`);
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
    <div className="code-app code-app-v3">
      <aside className="lesson-panel app-scroll">
        <div className="code-zero-header">
          <p className="eyebrow">PYTHON / ПЕРВАЯ ПРОГРАММА</p>
          <h3>Счётчик ошибок входа</h3>
          <p>Ты не обязан знать код. Иди по шагам. Каждый шаг объясняет, <b>куда писать, что означает строка и зачем она нужна</b>.</p>
          <div className="mode-switch"><button className={mode === 'guided' ? 'active' : ''} onClick={() => setMode('guided')}><BookOpen size={14} />Обучение</button><button className={mode === 'free' ? 'active' : ''} onClick={() => setMode('free')}><Code2 size={14} />Самостоятельно</button></div>
        </div>

        {mode === 'guided' ? (
          <>
            <div className="python-step-progress"><span>СОБРАНО</span><strong>{completedSteps}/{pythonGuideSteps.length}</strong><i><b style={{ width: `${completedSteps / pythonGuideSteps.length * 100}%` }} /></i></div>
            <div className="syntax-index beginner-step-index">
              {pythonGuideSteps.map((step, index) => {
                const passed = step.check.test(code);
                const unlocked = index <= Math.max(progress.pythonLessonStep, completedSteps);
                return <button key={step.id} disabled={!unlocked} className={`${activeStep === index ? 'active' : ''} ${passed ? 'passed' : ''}`} onClick={() => setActiveStep(index)}><span>{passed ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span><div><strong>{step.title}</strong><small>{step.concept}</small></div><ChevronRight size={14} /></button>;
              })}
            </div>
            <section className="guided-code-step">
              <p className="eyebrow">ШАГ {activeStep + 1} / {pythonGuideSteps.length}</p>
              <h3>{active.title}</h3>
              <div className="write-location"><FileText size={16} /><span>{active.instruction}</span><b>примерно строка {markerLine + 1}</b></div>
              <pre>{active.snippet}</pre>
              <div className="why-code"><strong>Зачем</strong><p>{active.why}</p></div>
              <div className="read-code"><strong>Как читать</strong><p>{active.read}</p></div>
              <div className="guided-actions">
                <button onClick={() => navigator.clipboard?.writeText(active.snippet)}><Copy size={14} />Копировать</button>
                <button onClick={() => updateCode(insertStep(code, active))}><WandSparkles size={14} />Вставить пример</button>
              </div>
              <button className="primary-action full-step" onClick={checkStep}>{currentPassed ? <><Check size={16} />Проверить и продолжить</> : 'Проверить шаг'}</button>
            </section>
          </>
        ) : (
          <section className="free-mode-guide"><Code2 size={28} /><h3>Самостоятельный режим</h3><p>Собери программу без пошаговой вставки. Справа остаются проверка структуры, журнал и перевод ошибок.</p><button className="secondary-action full" onClick={() => updateCode(pythonStarter)}>Пустой учебный шаблон</button></section>
        )}
      </aside>

      <section className="editor-shell">
        <header className="editor-toolbar">
          <div className="editor-tab"><span className="python-dot">PY</span><strong>analyze_auth.py</strong><i>●</i></div>
          <div className="editor-actions">
            <button title="Показать журнал" onClick={() => setShowLog((value) => !value)}><Eye size={15} /></button>
            <button title="Скопировать код" onClick={() => navigator.clipboard?.writeText(code)}><Copy size={15} /></button>
            <button title="Сбросить" onClick={() => { updateCode(pythonStarter); setActiveStep(0); setOutput('Код сброшен. Начни с шага 1.'); }}><RotateCcw size={15} /></button>
            <button className="run-button" onClick={runCode} disabled={runState === 'loading'}><Play size={15} fill="currentColor" /> {runState === 'loading' ? 'ЗАПУСК...' : 'RUN'}</button>
          </div>
        </header>
        {showLog && <section className="source-preview"><header><FileText size={15} /><strong>auth.log — данные, которые читает программа</strong><button onClick={() => setShowLog(false)}>Закрыть</button></header><pre>{authLog}</pre></section>}
        <div className="editor-help-line"><HelpCircle size={14} /><span>Печатай в большом поле ниже. Клавиша Tab вставляет 4 пробела. Комментарии начинаются с # и Python их не выполняет.</span></div>
        <div className="editor-area">
          <div className="line-numbers" aria-hidden="true">{lineNumbers.map((line) => <span key={line} className={line === markerLine + 1 ? 'target-line' : ''}>{line}</span>)}</div>
          <textarea value={code} onChange={(event) => updateCode(event.target.value)} onKeyDown={handleTab} spellCheck={false} aria-label="Редактор Python" />
        </div>
        <div className={`code-output ${runState}`}>
          <header><TerminalSquare size={15} /><span>OUTPUT / ЗДЕСЬ ПОЯВИТСЯ РЕЗУЛЬТАТ ИЛИ ОШИБКА</span><i>{runState === 'success' ? <CheckCircle2 size={15} /> : runState === 'error' ? <XCircle size={15} /> : null}</i></header>
          <pre>{output}</pre>
        </div>
      </section>

      <aside className="code-checklist app-scroll beginner-checklist">
        <p className="eyebrow">КАРТА ПРОГРАММЫ</p>
        <h3>Что происходит сверху вниз</h3>
        <div className="program-flow">
          <div><span>1</span><strong>Подключить инструмент</strong><small>Path</small></div>
          <div><span>2</span><strong>Прочитать данные</strong><small>auth.log → lines</small></div>
          <div><span>3</span><strong>Создать счётчик</strong><small>failed = 0</small></div>
          <div><span>4</span><strong>Проверить строки</strong><small>for + if</small></div>
          <div><span>5</span><strong>Вывести ответ</strong><small>print</small></div>
        </div>
        <div className="code-vocabulary">
          <span>МИНИ-СЛОВАРЬ</span>
          <div><b>строка кода</b><p>Одна инструкция программы.</p></div>
          <div><b>переменная</b><p>Имя, под которым хранится значение.</p></div>
          <div><b>список</b><p>Несколько значений в заданном порядке.</p></div>
          <div><b>цикл</b><p>Повторение блока кода.</p></div>
          <div><b>условие</b><p>Проверка: выполнять блок или нет.</p></div>
        </div>
        <div className="expected-output"><span>ПРАВИЛЬНЫЙ ИТОГ</span><code>Failed logins: 6</code><p>Шесть строк содержат Failed password.</p></div>
        <button className="secondary-action full" onClick={() => { updateCode(pythonSolution); setActiveStep(pythonGuideSteps.length - 1); }}>Показать готовую программу</button>
        {allPassed && !progress.pythonComplete && <div className="ready-to-run"><Check size={17} /><span>Структура собрана. Нажми RUN и проверь реальный вывод.</span></div>}
        {progress.pythonComplete && <div className="passed-stamp">LAB PASSED</div>}
        <div className="step-navigation"><button disabled={activeStep === 0} onClick={() => setActiveStep((value) => value - 1)}><ChevronLeft size={15} />Назад</button><button disabled={activeStep === pythonGuideSteps.length - 1} onClick={() => setActiveStep((value) => value + 1)}>Дальше<ChevronRight size={15} /></button></div>
      </aside>
    </div>
  );
}
