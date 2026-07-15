import { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Check, Clipboard, CornerDownLeft, Keyboard, MapPin, MessageSquare, Play, Radio, TerminalSquare } from 'lucide-react';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';
import { runShellCommand } from '../system/virtualShell';

function commandForObjective(id: string | undefined, cwd: string) {
  if (id === 'pwd') return 'pwd';
  if (id === 'ls') return 'ls';
  if (id === 'cd-case') {
    if (cwd === '/home/ilya') return 'cd cases/clinic-01';
    if (cwd === '/home/ilya/cases') return 'cd clinic-01';
    return 'cd /home/ilya/cases/clinic-01';
  }
  if (id === 'read-brief') return cwd === '/home/ilya/cases/clinic-01' ? 'cat brief.txt' : 'cat /home/ilya/cases/clinic-01/brief.txt';
  if (id === 'grep-failed') return cwd === '/home/ilya/cases/clinic-01' ? 'grep "Failed password" auth.log' : 'grep "Failed password" /home/ilya/cases/clinic-01/auth.log';
  if (id === 'inspect-processes') return 'ps';
  return 'mission';
}

function pathParts(cwd: string) {
  return cwd.split('/').filter(Boolean);
}

export function TerminalApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const fillCommandRef = useRef<(command: string) => void>(() => undefined);
  const { progress, completeTerminalObjective } = useProgress();
  const progressRef = useRef(progress);
  const completeRef = useRef(completeTerminalObjective);
  const [cwdState, setCwdState] = useState('/home/ilya');

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { completeRef.current = completeTerminalObjective; }, [completeTerminalObjective]);

  const nextObjective = useMemo(() => terminalObjectiveDefinitions.find((item) => !progress.terminalObjectives.includes(item.id)), [progress.terminalObjectives]);
  const completed = terminalObjectiveDefinitions.filter((item) => progress.terminalObjectives.includes(item.id));
  const lastCompleted = [...terminalObjectiveDefinitions].reverse().find((item) => progress.terminalObjectives.includes(item.id));
  const suggestedCommand = commandForObjective(nextObjective?.id, cwdState);

  useEffect(() => {
    if (!hostRef.current) return;
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'JetBrains Mono, IBM Plex Mono, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      scrollback: 1000,
      theme: {
        background: '#090b0d', foreground: '#e7e7df', cursor: '#ff5a38', cursorAccent: '#090b0d',
        selectionBackground: '#ff5a3833', black: '#0f1114', red: '#ff5a38', green: '#9dcf74',
        yellow: '#efc46b', blue: '#70a5d8', magenta: '#b58bd8', cyan: '#67c7c4', white: '#e7e7df', brightBlack: '#6b7078',
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(hostRef.current);
    const fitNow = () => { try { fit.fit(); } catch { /* window not measurable yet */ } };
    window.setTimeout(fitNow, 50);

    let cwd = '/home/ilya';
    let input = '';
    let cursor = 0;
    const history: string[] = [];
    let historyIndex = 0;

    const shortPath = () => cwd === '/home/ilya' ? '~' : cwd.replace('/home/ilya', '~');
    const prompt = () => terminal.write(`\r\n\x1b[38;2;255;90;56milya@fa\x1b[0m:\x1b[38;2;112;165;216m${shortPath()}\x1b[0m$ `);
    const redraw = () => {
      terminal.write('\x1b[2K\r');
      terminal.write(`\x1b[38;2;255;90;56milya@fa\x1b[0m:\x1b[38;2;112;165;216m${shortPath()}\x1b[0m$ ${input}`);
      const moveLeft = input.length - cursor;
      if (moveLeft > 0) terminal.write(`\x1b[${moveLeft}D`);
    };

    fillCommandRef.current = (command) => {
      input = command;
      cursor = input.length;
      terminal.focus();
      redraw();
    };

    terminal.writeln('\x1b[1;38;2;255;90;56mFALSE ACCESS // LIVE TRAINING SHELL\x1b[0m');
    terminal.writeln('Максим подключён. Смотри реплики слева и вводи действие после знака $.');
    terminal.writeln('Ошибки безопасны. Терминал не выполняет действия вне учебной системы.');
    prompt();

    const disposable = terminal.onData((data) => {
      if (data === '\r') {
        terminal.write('\r\n');
        const raw = input;
        if (raw.trim()) history.push(raw);
        historyIndex = history.length;
        input = '';
        cursor = 0;
        const result = runShellCommand(raw, cwd);
        if (result.clear) terminal.clear();
        if (result.cwd) {
          cwd = result.cwd;
          setCwdState(cwd);
        }
        result.lines.forEach((line) => terminal.writeln(line));
        if (result.objective) {
          completeRef.current(result.objective);
          terminal.writeln('\x1b[38;2;157;207;116m[МАКСИМ ПОЛУЧИЛ РЕЗУЛЬТАТ]\x1b[0m');
        }
        prompt();
        return;
      }
      if (data === '\u007F') {
        if (cursor > 0) {
          input = input.slice(0, cursor - 1) + input.slice(cursor);
          cursor -= 1;
          redraw();
        }
        return;
      }
      if (data === '\u001b[A') {
        if (historyIndex > 0) historyIndex -= 1;
        input = history[historyIndex] ?? '';
        cursor = input.length;
        redraw();
        return;
      }
      if (data === '\u001b[B') {
        if (historyIndex < history.length) historyIndex += 1;
        input = history[historyIndex] ?? '';
        cursor = input.length;
        redraw();
        return;
      }
      if (data === '\u001b[D') {
        if (cursor > 0) { cursor -= 1; terminal.write('\x1b[D'); }
        return;
      }
      if (data === '\u001b[C') {
        if (cursor < input.length) { cursor += 1; terminal.write('\x1b[C'); }
        return;
      }
      if (data === '\t') return;
      if (data >= ' ' && data !== '\u007F') {
        input = input.slice(0, cursor) + data + input.slice(cursor);
        cursor += data.length;
        redraw();
      }
    });

    const resize = new ResizeObserver(fitNow);
    resize.observe(hostRef.current);
    terminal.focus();
    return () => {
      fillCommandRef.current = () => undefined;
      resize.disconnect();
      disposable.dispose();
      terminal.dispose();
    };
  }, []);

  const parts = pathParts(cwdState);

  return (
    <div className="terminal-app beginner-terminal live-terminal">
      <aside className="terminal-guide app-scroll mentor-console">
        <header className="mentor-console-header">
          <div className="mentor-avatar">МБ<span /></div>
          <div><strong>Максим Белов</strong><small><Radio size={11} /> экран подключён</small></div>
          <b>{completed.length}/{terminalObjectiveDefinitions.length}</b>
        </header>

        <section className="location-card">
          <header><MapPin size={15} /><span>ТЕКУЩАЯ ПАПКА</span></header>
          <div className="path-breadcrumb"><b>/</b>{parts.map((part, index) => <span key={`${part}-${index}`}>{part}</span>)}</div>
        </section>

        <div className="mentor-chat-stream">
          {completed.length === 0 && <div className="mentor-bubble"><span>МБ</span><p>Не буду грузить теорией заранее. Я даю одну задачу, ты сразу делаешь её справа. После результата разберём, что произошло.</p></div>}
          {lastCompleted && <div className="mentor-bubble result"><span>МБ</span><p>{lastCompleted.after}</p></div>}
          {nextObjective ? (
            <>
              <div className="mentor-bubble"><span>МБ</span><p>{nextObjective.mentor}</p></div>
              <div className="mentor-bubble"><span>МБ</span><p>{nextObjective.reply}</p></div>
            </>
          ) : <div className="mentor-bubble result"><span>МБ</span><p>Готово. Ты сам нашёл журнал, отфильтровал события и заметил процесс. Открывай Code Editor — теперь автоматизируем подсчёт.</p></div>}
        </div>

        {nextObjective ? (
          <section className="live-action-card">
            <p className="eyebrow">ТВОЁ ДЕЙСТВИЕ / ШАГ {completed.length + 1}</p>
            <div className="where-to-type"><Keyboard size={16} /><span>Печатай справа после знака <code>$</code></span></div>
            <button className="command-to-run" onClick={() => fillCommandRef.current(suggestedCommand)}><code>{suggestedCommand}</code><Play size={15} /></button>
            <div className="micro-theory"><strong>Зачем</strong><p>{nextObjective.why}</p></div>
            <div className="expected-result"><span>ОЖИДАЕМЫЙ РЕЗУЛЬТАТ</span><strong>{nextObjective.result}</strong></div>
            <div className="terminal-coach-actions">
              <button onClick={() => navigator.clipboard?.writeText(suggestedCommand)}><Clipboard size={14} />Копировать</button>
              <button onClick={() => fillCommandRef.current(suggestedCommand)}><CornerDownLeft size={14} />Вставить</button>
            </div>
          </section>
        ) : <section className="terminal-complete-card"><Check size={24} /><div><strong>Разговор продолжится в Code Editor</strong><span>Там ты напишешь первую программу по одной строке.</span></div></section>}

        <section className="command-anatomy live-reference">
          <header><TerminalSquare size={15} /><span>ШПАРГАЛКА, НЕ ЛЕКЦИЯ</span></header>
          <p>Команда читается слева направо: программа → настройка → данные.</p>
          <code>grep "Failed" auth.log</code>
          <div><b>grep</b><span>что запустить</span></div>
          <div><b>"Failed"</b><span>что искать</span></div>
          <div><b>auth.log</b><span>в каком файле</span></div>
        </section>
      </aside>
      <div className="terminal-host" ref={hostRef} />
    </div>
  );
}
