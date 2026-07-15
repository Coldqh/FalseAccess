import { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Check, CornerDownLeft, MapPin, Radio, TerminalSquare, UserRound } from 'lucide-react';
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
  const completeRef = useRef(completeTerminalObjective);
  const [cwdState, setCwdState] = useState('/home/ilya');
  const [mobilePane, setMobilePane] = useState<'brief' | 'shell'>('brief');

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
      fontSize: window.matchMedia('(max-width: 720px)').matches ? 11 : 13,
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

    terminal.writeln('\x1b[1;38;2;255;90;56mFALSE ACCESS // CLINIC-01\x1b[0m');
    terminal.writeln('case mounted: /home/ilya/cases/clinic-01');
    terminal.writeln('help — commands');
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
          terminal.writeln('\x1b[38;2;157;207;116m[OK]\x1b[0m');
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
    <div className={`terminal-app beginner-terminal live-terminal mobile-pane-${mobilePane}`}>
      <nav className="mobile-work-tabs" aria-label="Панели терминала">
        <button className={mobilePane === 'brief' ? 'active' : ''} onClick={() => setMobilePane('brief')}><UserRound size={15} />Максим</button>
        <button className={mobilePane === 'shell' ? 'active' : ''} onClick={() => setMobilePane('shell')}><TerminalSquare size={15} />Терминал</button>
      </nav>
      <aside className="terminal-guide app-scroll mentor-console">
        <header className="mentor-console-header">
          <div className="mentor-avatar">МБ<span /></div>
          <div><strong>Максим Белов</strong><small><Radio size={11} /> на связи</small></div>
          <b>{completed.length}/{terminalObjectiveDefinitions.length}</b>
        </header>

        <section className="location-card">
          <header><MapPin size={15} /><span>PATH</span></header>
          <div className="path-breadcrumb"><b>/</b>{parts.map((part, index) => <span key={`${part}-${index}`}>{part}</span>)}</div>
        </section>

        <div className="mentor-chat-stream">
          {completed.length === 0 && <div className="mentor-bubble"><span>МБ</span><p>Архив уже на месте. Ничего не удаляй. Начнём с текущей папки.</p></div>}
          {lastCompleted && <div className="mentor-bubble result"><span>МБ</span><p>{lastCompleted.after}</p></div>}
          {nextObjective ? (
            <>
              <div className="mentor-bubble"><span>МБ</span><p>{nextObjective.mentor}</p></div>
              <div className="mentor-bubble"><span>МБ</span><p>{nextObjective.reply}</p></div>
            </>
          ) : <div className="mentor-bubble result"><span>МБ</span><p>Хватит терминала. Открой Code Editor. Посчитаем такие события скриптом.</p></div>}
        </div>

        {nextObjective ? (
          <section className="live-action-card">
            <p className="eyebrow">КОМАНДА</p>
            <button className="command-to-run" onClick={() => { fillCommandRef.current(suggestedCommand); setMobilePane('shell'); }}><code>{suggestedCommand}</code><CornerDownLeft size={15} /></button>
            <small>{nextObjective.label}</small>
          </section>
        ) : <section className="terminal-complete-card"><Check size={24} /><div><strong>Осмотр закончен</strong><span>Следующий шаг: analyze_auth.py</span></div></section>}
      </aside>
      <div className="terminal-host" ref={hostRef} />
    </div>
  );
}
