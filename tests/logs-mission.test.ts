import { describe, expect, it } from 'vitest';
import {
  appendMissionAction,
  attemptMissionCompletion,
  createMissionRuntime,
  linkEvidence,
  openArtifact,
} from '../src/core/scenario/engine';
import { logs01Definition } from '../src/content/missions/logs01/definition';
import {
  createLogsEnvironment,
  LOGS_HOME,
  runLogsCommand,
  type LogsEnvironment,
} from '../src/content/missions/logs01/environment';

function execute(
  environment: LogsEnvironment,
  state: ReturnType<typeof createMissionRuntime>,
  cwd: string,
  raw: string,
) {
  const result = runLogsCommand(environment, cwd, raw);
  let next = appendMissionAction(logs01Definition, state, {
    type: 'command.executed',
    source: 'test-shell',
    payload: result.payload,
  });
  for (const artifactId of result.openedArtifactIds) {
    next = openArtifact(logs01Definition, next, artifactId, 'test-shell');
  }
  return { state: next, cwd: result.cwd };
}

function guidedStart(seed: number) {
  const environment = createLogsEnvironment(seed);
  let state = createMissionRuntime(logs01Definition, seed, '2026-03-14T18:24:00.000Z');
  state = openArtifact(logs01Definition, state, 'artifact.logs.intake', 'test');
  let cwd = LOGS_HOME;
  ({ state, cwd } = execute(environment, state, cwd, 'cat brief.txt'));
  ({ state, cwd } = execute(environment, state, cwd, 'cat formats.txt'));
  ({ state, cwd } = execute(environment, state, cwd, 'grep "Failed password" logs/auth.log'));
  ({ state, cwd } = execute(environment, state, cwd, 'grep "Failed password" logs/auth.log | wc -l'));
  ({ state, cwd } = execute(environment, state, cwd, 'grep "Failed password" logs/auth.log > /home/ilya/work/failed.log'));
  ({ state, cwd } = execute(environment, state, cwd, 'date -u -d "2026-03-14 21:12:20 +0300"'));
  ({ state, cwd } = execute(environment, state, cwd, 'cat logs/proxy.csv'));
  return { environment, state, cwd };
}

function linkRequiredEvidence(state: ReturnType<typeof createMissionRuntime>) {
  let next = linkEvidence(logs01Definition, state, {
    claimId: 'outcome.logs.guided-count', evidenceId: 'artifact.logs.auth', note: 'executed count',
  });
  next = linkEvidence(logs01Definition, next, {
    claimId: 'outcome.logs.time', evidenceId: 'artifact.logs.proxy', note: 'UTC correlation',
  });
  next = linkEvidence(logs01Definition, next, {
    claimId: 'outcome.logs.transfer', evidenceId: 'artifact.logs.transfer', note: 'generated transfer result',
  });
  return next;
}

describe('chapter 0.2 semantic assessment', () => {
  it('accepts the structured jq solution family', () => {
    const seed = 707;
    let { environment, state, cwd } = guidedStart(seed);
    ({ state, cwd } = execute(environment, state, cwd, `grep '^{' ${environment.facts.transferFile} | jq -r 'select(.status=="failed") | .src' | sort | uniq -c`));
    state = linkRequiredEvidence(state);
    const attempt = attemptMissionCompletion(logs01Definition, state);
    expect(attempt.completed).toBe(true);
    expect(attempt.state.assessment?.matchedSolutionFamilyId).toBe('solution.logs.jq');
  });

  it('accepts the text pipeline solution family', () => {
    const seed = 808;
    let { environment, state, cwd } = guidedStart(seed);
    ({ state, cwd } = execute(environment, state, cwd, `grep '"status":"failed"' ${environment.facts.transferFile} | cut -d '"' -f 16 | sort | uniq -c`));
    state = linkRequiredEvidence(state);
    const attempt = attemptMissionCompletion(logs01Definition, state);
    expect(attempt.completed).toBe(true);
    expect(attempt.state.assessment?.matchedSolutionFamilyId).toBe('solution.logs.text');
  });

  it('rejects copied values without executed transfer evidence', () => {
    const seed = 909;
    let { state } = guidedStart(seed);
    state = linkEvidence(logs01Definition, state, {
      claimId: 'outcome.logs.guided-count', evidenceId: 'artifact.logs.auth', note: 'guided',
    });
    state = linkEvidence(logs01Definition, state, {
      claimId: 'outcome.logs.time', evidenceId: 'artifact.logs.proxy', note: 'time',
    });
    const attempt = attemptMissionCompletion(logs01Definition, state);
    expect(attempt.completed).toBe(false);
    expect(attempt.reasons).toContain('rule.logs.transfer-result');
    expect(attempt.reasons).toContain('rule.logs.transfer-evidence');
  });

  it('records source modification as a critical error', () => {
    const seed = 1001;
    const { environment, state } = guidedStart(seed);
    const result = runLogsCommand(environment, LOGS_HOME, 'grep failed logs/auth.log > logs/auth.log');
    const next = appendMissionAction(logs01Definition, state, {
      type: 'command.executed', source: 'test-shell', payload: result.payload,
    });
    expect(next.assessment?.criticalErrors).toContain('critical.logs.destructive');
  });
});
