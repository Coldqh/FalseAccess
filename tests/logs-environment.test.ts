import { describe, expect, it } from 'vitest';
import {
  createLogsEnvironment,
  LOGS_HOME,
  normalizeLogsPath,
  runLogsCommand,
} from '../src/content/missions/logs01/environment';

describe('chapter 0.2 shell environment', () => {
  it('generates deterministic transfer tasks from seed', () => {
    const first = createLogsEnvironment(101);
    const second = createLogsEnvironment(101);
    const other = createLogsEnvironment(102);
    expect(first.facts).toEqual(second.facts);
    expect(first.entries[first.facts.transferFile].content).toEqual(second.entries[second.facts.transferFile].content);
    expect(other.facts.transferSource).not.toBe(first.facts.transferSource);
  });

  it('supports pipelines with stdout and exit codes', () => {
    const environment = createLogsEnvironment(202);
    const result = runLogsCommand(environment, LOGS_HOME, 'grep "Failed password" logs/auth.log | wc -l');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toEqual(['6']);
    expect(result.payload.usedPipe).toBe(true);
    expect(result.payload.finding).toBe('guided-failure-count');
  });

  it('returns stderr without treating it as stdout', () => {
    const environment = createLogsEnvironment(303);
    const result = runLogsCommand(environment, LOGS_HOME, 'cat missing.log');
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toEqual([]);
    expect(result.stderr[0]).toContain('No such file');
  });

  it('allows derived output only inside the work directory', () => {
    const environment = createLogsEnvironment(404);
    const allowed = runLogsCommand(environment, LOGS_HOME, 'grep "Failed password" logs/auth.log > /home/ilya/work/failed.log');
    expect(allowed.exitCode).toBe(0);
    expect(allowed.payload.derivedWrite).toBe(true);
    expect(environment.entries['/home/ilya/work/failed.log'].content?.split('\n')).toHaveLength(6);

    const blocked = runLogsCommand(environment, LOGS_HOME, 'grep "Failed password" logs/auth.log > logs/auth.log');
    expect(blocked.exitCode).toBe(126);
    expect(blocked.payload.destructive).toBe(true);
  });

  it('normalizes UTC+03 time to UTC', () => {
    const environment = createLogsEnvironment(505);
    const result = runLogsCommand(environment, LOGS_HOME, 'date -u -d "2026-03-14 21:12:20 +0300"');
    expect(result.stdout).toEqual(['2026-03-14T18:12:20.000Z']);
    expect(result.payload.finding).toBe('normalized-time');
  });

  it('parses generated JSONL after excluding the damaged line', () => {
    const environment = createLogsEnvironment(606);
    const command = `grep '^{' ${environment.facts.transferFile} | jq -r 'select(.status=="failed") | .src' | sort | uniq -c`;
    const result = runLogsCommand(environment, LOGS_HOME, command);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.join('\n')).toContain(environment.facts.transferSource);
    expect(result.stdout.join('\n')).toContain(String(environment.facts.transferFailureCount));
    expect(result.payload.finding).toBe('transfer-source-count');
  });

  it('keeps path normalization inside the local tree', () => {
    expect(normalizeLogsPath(LOGS_HOME, '../../work')).toBe('/home/ilya/work');
    expect(normalizeLogsPath('/tmp', '~/cases/clinic-01')).toBe(LOGS_HOME);
  });
});
