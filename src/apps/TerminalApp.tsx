import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';
import { runShellCommand } from '../system/virtualShell';

export function TerminalApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { progress, completeTerminalObjective } = useProgress();
  const progressRef = useRef(progress);
  const completeRef = useRef(completeTerminalObjective);

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { completeRef.current = completeTerminalObjective; }, [completeTerminalObjective]);

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
        background: '#090b0d',
        foreground: '#e7e7df',
        cursor: '#ff5a38',
        cursorAccent: '#090b0d',
        selectionBackground: '#ff5a3833',
        black: '#0f1114',
        red: '#ff5a38',
        green: '#9dcf74',
        yellow: '#efc46b',
        blue: '#70a5d8',
        magenta: '#b58bd8',
        cyan: '#67c7c4',
        white: '#e7e7df',
        brightBlack: '#6b7078',
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

    const prompt = () => {
      const short = cwd === '/home/ilya' ? '~' : cwd.replace('/home/ilya', '~');
      terminal.write(`\r\n\x1b[38;2;255;90;56milya@fa\x1b[0m:\x1b[38;2;112;165;216m${short}\x1b[0m$ `);
    };
    const redraw = () => {
      terminal.write('\x1b[2K\r');
      const short = cwd === '/home/ilya' ? '~' : cwd.replace('/home/ilya', '~');
      terminal.write(`\x1b[38;2;255;90;56milya@fa\x1b[0m:\x1b[38;2;112;165;216m${short}\x1b[0m$ ${input}`);
      const moveLeft = input.length - cursor;
      if (moveLeft > 0) terminal.write(`\x1b[${moveLeft}D`);
    };

    terminal.writeln('\x1b[1;38;2;255;90;56mFALSE ACCESS // TRAINING SHELL\x1b[0m');
    terminal.writeln('Дело CLINIC-01 подключено. Напиши \x1b[1mhelp\x1b[0m или \x1b[1mmission\x1b[0m.');
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
        if (result.cwd) cwd = result.cwd;
        result.lines.forEach((line) => terminal.writeln(line));
        if (result.objective) {
          completeRef.current(result.objective);
          terminal.writeln('\x1b[38;2;157;207;116m[ЗАДАЧА ВЫПОЛНЕНА]\x1b[0m');
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
        if (historyIndex > 0) {
          historyIndex -= 1;
          input = history[historyIndex] ?? '';
          cursor = input.length;
          redraw();
        }
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
      resize.disconnect();
      disposable.dispose();
      terminal.dispose();
    };
  }, []);

  const completed = terminalObjectiveDefinitions.filter((item) => progress.terminalObjectives.includes(item.id));

  return (
    <div className="terminal-app">
      <aside className="terminal-guide">
        <div className="guide-header">
          <p className="eyebrow">CLINIC-01</p>
          <strong>{completed.length}/{terminalObjectiveDefinitions.length}</strong>
        </div>
        <div className="objective-list">
          {terminalObjectiveDefinitions.map((objective, index) => {
            const done = progress.terminalObjectives.includes(objective.id);
            return (
              <div className={`objective-item ${done ? 'done' : ''}`} key={objective.id}>
                <span>{done ? '✓' : String(index + 1).padStart(2, '0')}</span>
                <div><strong>{objective.label}</strong><small>{objective.hint}</small></div>
              </div>
            );
          })}
        </div>
        <div className="terminal-rule">
          <span>ПРАВИЛО</span>
          <p>Команда состоит из имени программы, параметров и аргументов.</p>
          <code>grep "текст" файл.log</code>
        </div>
      </aside>
      <div className="terminal-host" ref={hostRef} />
    </div>
  );
}
