import { useMemo, useState } from 'react';
import { TerminalSquare } from 'lucide-react';
import type { CaseEnvironment } from '../simulation/terminal/caseEnvironment';
import { runCaseCommand } from '../simulation/terminal/caseEnvironment';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

export function CaseShellPanel({ environment, title }: { environment: CaseEnvironment; title: string }) {
  const runtime = useMissionRuntime();
  const mission = runtime.activeMission;
  const [command, setCommand] = useState('');
  const commandEvents = mission?.actionLog.filter((event) => event.type === 'command.executed') ?? [];
  const cwd = useMemo(() => {
    const latest = [...commandEvents].reverse().find((event) => typeof event.payload.nextCwd === 'string');
    return typeof latest?.payload.nextCwd === 'string' ? latest.payload.nextCwd : environment.home;
  }, [commandEvents, environment.home]);
  const history = commandEvents.slice(-18).flatMap((event) => {
    const stdout = Array.isArray(event.payload.stdout) ? event.payload.stdout.map(String) : [];
    const stderr = Array.isArray(event.payload.stderr) ? event.payload.stderr.map((line) => `stderr: ${String(line)}`) : [];
    return [`${String(event.payload.command ?? '')}`, ...stdout, ...stderr, `[exit ${Number(event.payload.exitCode ?? 0)}]`];
  });

  const execute = () => {
    if (!command.trim()) return;
    const result = runCaseCommand(environment, cwd, command);
    runtime.recordAction({ type: 'command.executed', source: 'act0-case-shell', payload: result.payload });
    result.openedArtifactIds.forEach((artifactId) => runtime.markArtifactOpened(artifactId, 'act0-case-shell'));
    setCommand('');
  };

  return (
    <section className="act0-shell">
      <header><TerminalSquare size={17} /><strong>{title}</strong><span>{cwd}</span></header>
      <pre>{history.length ? history.join('\n') : 'Локальная read-only среда. Команда help покажет доступные инструменты.'}</pre>
      <div><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && execute()} spellCheck={false} autoComplete="off" /><button onClick={execute}>RUN</button></div>
    </section>
  );
}
