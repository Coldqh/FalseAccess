import { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Check, Clipboard, CornerDownLeft, FolderTree, Keyboard, MapPin, Play, TerminalSquare } from 'lucide-react';
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

    terminal.writeln('\x1b[1;38;2;255;90;56mFALSE ACCESS // BEGINNER SHELL\x1b[0m');
    terminal.writeln('Печатай после знака $. Слева показано, что писать и зачем.');
    terminal.writeln('Ошибки безопасны. Команда \x1b[1mhelp\x1b[0m покажет доступные инструменты.');
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
          terminal.writeln('\x1b[38;2;157;207;116m[ШАГ ВЫПОЛНЕН]\x1b[0m');
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

  const completed = terminalObjectiveDefinitions.filter((item) => progress.terminalObjectives.includes(item.id));
  const parts = pathParts(cwdState);

  return (
    <div className="terminal-app beginner-terminal">
      <aside className="terminal-guide app-scroll">
        <div className="guide-header">
          <div><p className="eyebrow">LINUX / С НУЛЯ</p><strong>{completed.length}/{terminalObjectiveDefinitions.length}</strong></div>
          <span>{nextObjective ? 'СЛЕДУЮЩИЙ ШАГ' : 'ТЕРМИНАЛ ПРОЙДЕН'}</span>
        </div>

        <section className="location-card">
          <header><MapPin size={15} /><span>ТЫ НАХОДИШЬСЯ ЗДЕСЬ</span></header>
          <div className="path-breadcrumb"><b>/</b>{parts.map((part, index) => <span key={`${part}-${index}`}>{part}</span>)}</div>
          <p>Все относительные пути считаются от этой папки.</p>
        </section>

        {nextObjective ? (
          <section className="terminal-coach-card">
            <p className="eyebrow">ШАГ {String(completed.length + 1).padStart(2, '0')}</p>
            <h3>{nextObjective.label}</h3>
            <div className="where-to-type"><Keyboard size={16} /><span>Пиши в чёрном окне после знака <code>$</code></span></div>
            <button className="command-to-run" onClick={() => fillCommandRef.current(suggestedCommand)}><code>{suggestedCommand}</code><Play size={15} /></button>
            <p>{nextObjective.why}</p>
            <div className="expected-result"><span>ЧТО ДОЛЖНО ПРОИЗОЙТИ</span><strong>{nextObjective.result}</strong></div>
            <div className="terminal-coach-actions">
              <button onClick={() => navigator.clipboard?.writeText(suggestedCommand)}><Clipboard size={14} />Скопировать</button>
              <button onClick={() => fillCommandRef.current(suggestedCommand)}><CornerDownLeft size={14} />Вставить в терминал</button>
            </div>
          </section>
        ) : (
          <section className="terminal-complete-card"><Check size={24} /><div><strong>Базовый осмотр закончен</strong><span>Теперь открой Code Editor. Там журнал будет обработан программой.</span></div></section>
        )}

        <section className="command-anatomy">
          <header><TerminalSquare size={15} /><span>КАК ЧИТАТЬ КОМАНДУ</span></header>
          <code>grep -c "Failed" auth.log</code>
          <div><b>grep</b><span>программа</span></div>
          <div><b>-c</b><span>параметр</span></div>
          <div><b>"Failed"</b><span>что искать</span></div>
          <div><b>auth.log</b><span>где искать</span></div>
        </section>

        <div className="objective-list compact-objectives">
          {terminalObjectiveDefinitions.map((objective, index) => {
            const done = progress.terminalObjectives.includes(objective.id);
            return <div className={`objective-item ${done ? 'done' : ''}`} key={objective.id}><span>{done ? '✓' : String(index + 1).padStart(2, '0')}</span><div><strong>{objective.label}</strong><small>{objective.command}</small></div></div>;
          })}
        </div>
      </aside>
      <div className="terminal-host" ref={hostRef} />
    </div>
  );
}
