import { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import { runShellCommand } from '../system/virtualShell';
import { getClinicStage, clinicTransitions } from '../missions/clinic01';
import { MissionGuideStrip } from '../components/MissionGuideStrip';
import { MissionStageComplete } from '../components/MissionStageComplete';
import type { AppId } from '../types';

function commandName(raw: string) {
  return raw.trim().match(/^([^\s]+)/)?.[1]?.toLowerCase() ?? '';
}

function targetArtifact(raw: string): string | null {
  const name = commandName(raw);
  if (/\bauth\.log\b/i.test(raw)) return 'artifact.clinic.auth-log';
  if (/\bprocesses\.txt\b/i.test(raw) || name === 'ps') return 'artifact.clinic.processes';
  if (/\bbrief\.txt\b/i.test(raw)) return 'artifact.clinic.brief';
  if (/\bnetwork\.txt\b/i.test(raw) || name === 'ss') return 'artifact.clinic.network';
  return null;
}

function commandFailed(lines: string[]) {
  return lines.some((line) => /(^|\s)(command not found|No such file|No such directory|missing operand|usage:)/i.test(line));
}

const objectiveGuidance: Record<string, { title: string; text: string; detail: string }> = {
  pwd: {
    title: 'Определи текущий каталог',
    text: 'Этот шаг уже проходится в главе 0.1.',
    detail: 'При новом сохранении он будет закрыт автоматически после стартовой главы.',
  },
  ls: {
    title: 'Осмотри домашний каталог',
    text: 'Этот шаг уже проходится в главе 0.1.',
    detail: 'Не вводи команды по памяти — сначала проверяй контекст.',
  },
  'cd-case': {
    title: 'Перейди к материалам дела',
    text: 'Этот шаг уже проходится в главе 0.1.',
    detail: 'Абсолютный и относительный путь считаются разными допустимыми методами.',
  },
  'read-brief': {
    title: 'Прочитай постановку',
    text: 'Этот шаг уже проходится в главе 0.1.',
    detail: 'Ограничения читаются до анализа данных.',
  },
  'grep-failed': {
    title: 'Выдели события отказа входа',
    text: 'Найди строки Failed password в auth.log. Отказ входа не равен успешной компрометации.',
    detail: 'Выбери read-only команду поиска самостоятельно. Синтаксис доступных инструментов есть в help.',
  },
  'inspect-processes': {
    title: 'Исследуй процессы отдельно',
    text: 'События SSH не объясняют локальный процесс. Получи снимок процессов и проверь путь запуска.',
    detail: 'Не связывай две линии расследования только потому, что они происходят на одном узле.',
  },
};

export function TerminalApp({ openApp }: { openApp: (id: AppId) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const { progress, completeTerminalObjective } = useProgress();
  const missionRuntime = useMissionRuntime();
  const completeRef = useRef(completeTerminalObjective);
  const recordRef = useRef(missionRuntime.recordAction);
  const artifactRef = useRef(missionRuntime.markArtifactOpened);
  const [cwdState, setCwdState] = useState('/home/ilya');
  const stage = getClinicStage(progress);
  const missionActive = stage.id === 'terminal';
  const terminalDone = terminalObjectiveDefinitions.every((item) => progress.terminalObjectives.includes(item.id));
  const nextObjective = useMemo(
    () => missionActive ? terminalObjectiveDefinitions.find((item) => !progress.terminalObjectives.includes(item.id)) : undefined,
    [missionActive, progress.terminalObjectives],
  );
  const guidance = nextObjective ? objectiveGuidance[nextObjective.id] : null;

  useEffect(() => { completeRef.current = completeTerminalObjective; }, [completeTerminalObjective]);
  useEffect(() => { recordRef.current = missionRuntime.recordAction; }, [missionRuntime.recordAction]);
  useEffect(() => { artifactRef.current = missionRuntime.markArtifactOpened; }, [missionRuntime.markArtifactOpened]);

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

    terminal.writeln('\x1b[1;38;2;255;90;56mFALSE ACCESS TERMINAL\x1b[0m');
    terminal.writeln(missionActive ? 'CLINIC-01 / ГЛАВА 0.2 / LOCAL READ ONLY' : 'local shell');
    terminal.writeln('help — доступные команды. Готовые команды не вставляются.');
    prompt();

    const disposable = terminal.onData((data) => {
      if (data === '\r') {
        terminal.write('\r\n');
        const raw = input;
        if (raw.trim()) history.push(raw);
        historyIndex = history.length;
        input = '';
        cursor = 0;
        const before = cwd;
        const result = runShellCommand(raw, cwd);
        if (result.clear) terminal.clear();
        if (result.cwd) { cwd = result.cwd; setCwdState(cwd); }
        result.lines.forEach((line) => terminal.writeln(line));

        const failed = commandFailed(result.lines);
        const artifactId = targetArtifact(raw);
        if (raw.trim()) {
          recordRef.current({
            type: 'command.executed',
            source: 'terminal',
            payload: {
              command: raw.trim(),
              name: commandName(raw),
              cwd: before,
              nextCwd: cwd,
              stdout: result.lines,
              stderr: failed ? result.lines : [],
              success: !failed,
              exitCode: failed ? 1 : 0,
              readOnly: true,
              destructive: false,
              externalNetwork: false,
              targetArtifactId: artifactId,
            },
          });
        }
        if (artifactId && !failed) artifactRef.current(artifactId, 'terminal');
        if (missionActive && result.objective) {
          completeRef.current(result.objective);
          terminal.writeln('\x1b[38;2;157;207;116m[RECORDED]\x1b[0m действие добавлено в evidence journal');
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
      resize.disconnect();
      disposable.dispose();
      terminal.dispose();
    };
  }, [missionActive]);

  return (
    <div className={`terminal-app-v4 ${missionActive ? 'mission-layer-active' : 'base-app-only'}`}>
      {missionActive && nextObjective && guidance && (
        <MissionGuideStrip
          title={guidance.title}
          text={guidance.text}
          detail={`${guidance.detail} Текущий каталог: ${cwdState}`}
        />
      )}
      <div className="terminal-host terminal-host-v4" ref={hostRef} />
      {terminalDone && <MissionStageComplete transition={clinicTransitions.terminal} openApp={openApp} />}
    </div>
  );
}
