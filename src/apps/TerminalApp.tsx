import { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';
import { runShellCommand } from '../system/virtualShell';
import { getClinicStage, clinicTransitions } from '../missions/clinic01';
import { MissionGuideStrip } from '../components/MissionGuideStrip';
import { MissionStageComplete } from '../components/MissionStageComplete';
import type { AppId } from '../types';

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
  return 'help';
}

export function TerminalApp({ openApp }: { openApp: (id: AppId) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fillCommandRef = useRef<(command: string) => void>(() => undefined);
  const { progress, completeTerminalObjective } = useProgress();
  const completeRef = useRef(completeTerminalObjective);
  const [cwdState, setCwdState] = useState('/home/ilya');
  const stage = getClinicStage(progress);
  const missionActive = stage.id === 'terminal';
  const terminalDone = terminalObjectiveDefinitions.every((item) => progress.terminalObjectives.includes(item.id));
  const nextObjective = useMemo(
    () => missionActive ? terminalObjectiveDefinitions.find((item) => !progress.terminalObjectives.includes(item.id)) : undefined,
    [missionActive, progress.terminalObjectives],
  );
  const suggestedCommand = commandForObjective(nextObjective?.id, cwdState);

  useEffect(() => { completeRef.current = completeTerminalObjective; }, [completeTerminalObjective]);

  useEffect(() => {
    if (!hostRef.current) return;
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'IBM Plex Mono, Consolas, monospace',
      fontSize: window.matchMedia('(max-width: 720px)').matches ? 12 : 13,
      lineHeight: 1.3,
      scrollback: 1500,
      theme: {
        background: '#090b0d', foreground: '#e7e7df', cursor: '#ff5a38', cursorAccent: '#090b0d',
        selectionBackground: '#ff5a3833', black: '#0f1114', red: '#ff5a38', green: '#9dcf74',
        yellow: '#efc46b', blue: '#70a5d8', magenta: '#b58bd8', cyan: '#67c7c4', white: '#e7e7df', brightBlack: '#6b7078',
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(hostRef.current);
    const fitNow = () => { try { fit.fit(); } catch { /* hidden while opening */ } };
    window.setTimeout(fitNow, 60);

    let cwd = '/home/ilya';
    let input = '';
    let cursor = 0;
    const history: string[] = [];
    let historyIndex = 0;
    const shortPath = () => cwd === '/home/ilya' ? '~' : cwd.replace('/home/ilya', '~');
    const prompt = () => terminal.write(`\r\n\x1b[38;2;255;90;56milya@false-access\x1b[0m:\x1b[38;2;112;165;216m${shortPath()}\x1b[0m$ `);
    const redraw = () => {
      terminal.write('\x1b[2K\r');
      terminal.write(`\x1b[38;2;255;90;56milya@false-access\x1b[0m:\x1b[38;2;112;165;216m${shortPath()}\x1b[0m$ ${input}`);
      const moveLeft = input.length - cursor;
      if (moveLeft > 0) terminal.write(`\x1b[${moveLeft}D`);
    };

    fillCommandRef.current = (command) => {
      input = command;
      cursor = command.length;
      terminal.focus();
      redraw();
    };

    terminal.writeln('\x1b[1;38;2;255;90;56mFALSE ACCESS TERMINAL\x1b[0m');
    terminal.writeln(missionActive ? 'case: CLINIC-01' : 'local shell');
    terminal.writeln('help — список команд');
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
        if (result.cwd) { cwd = result.cwd; setCwdState(cwd); }
        result.lines.forEach((line) => terminal.writeln(line));
        if (missionActive && result.objective) {
          completeRef.current(result.objective);
          terminal.writeln('\x1b[38;2;157;207;116m[OK]\x1b[0m');
        }
        prompt();
        return;
      }
      if (data === '\u007F') {
        if (cursor > 0) { input = input.slice(0, cursor - 1) + input.slice(cursor); cursor -= 1; redraw(); }
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
      if (data === '\u001b[D') { if (cursor > 0) { cursor -= 1; terminal.write('\x1b[D'); } return; }
      if (data === '\u001b[C') { if (cursor < input.length) { cursor += 1; terminal.write('\x1b[C'); } return; }
      if (data === '\t') return;
      if (data >= ' ' && data !== '\u007F') { input = input.slice(0, cursor) + data + input.slice(cursor); cursor += data.length; redraw(); }
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
  }, [missionActive]);

  return (
    <div className={`terminal-app-v4 ${missionActive ? 'mission-layer-active' : 'base-app-only'}`}>
      {missionActive && nextObjective && (
        <MissionGuideStrip
          title={nextObjective.label}
          text={nextObjective.mentor}
          detail={`${nextObjective.reply} ${nextObjective.why}`}
          code={suggestedCommand}
          insertLabel="Вставить команду"
          onInsert={() => fillCommandRef.current(suggestedCommand)}
        />
      )}
      <div className="terminal-host terminal-host-v4" ref={hostRef} />
      {terminalDone && <MissionStageComplete transition={clinicTransitions.terminal} openApp={openApp} />}
    </div>
  );
}
