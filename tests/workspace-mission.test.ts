import { describe, expect, it } from 'vitest';
import {
  appendMissionAction,
  attemptMissionCompletion,
  createMissionRuntime,
  linkEvidence,
  openArtifact,
} from '../src/core/scenario/engine';
import { workspace01Definition } from '../src/content/missions/workspace01/definition';
import {
  createWorkspaceEnvironment,
  runWorkspaceCommand,
  WORKSPACE_HOME,
} from '../src/content/missions/workspace01/environment';

function run(state: ReturnType<typeof createMissionRuntime>, cwd: string, raw: string, seed: number) {
  const environment = createWorkspaceEnvironment(seed);
  const command = runWorkspaceCommand(environment, cwd, raw);
  let next = appendMissionAction(workspace01Definition, state, {
    type: 'command.executed',
    source: 'test-terminal',
    payload: command.payload,
  });
  if (command.openedArtifactId) next = openArtifact(workspace01Definition, next, command.openedArtifactId, 'test-terminal');
  return { state: next, cwd: command.cwd, environment };
}

function commonStart(seed: number) {
  let state = createMissionRuntime(workspace01Definition, seed, '2026-03-14T18:20:00.000Z');
  state = openArtifact(workspace01Definition, state, 'artifact.workspace.intake', 'test');
  let cwd = WORKSPACE_HOME;
  ({ state, cwd } = run(state, cwd, 'pwd', seed));
  ({ state, cwd } = run(state, cwd, 'ls', seed));
  ({ state, cwd } = run(state, cwd, 'cd cases/clinic-01', seed));
  ({ state, cwd } = run(state, cwd, 'cat brief.txt', seed));
  return { state, cwd };
}

describe('workspace chapter semantic completion', () => {
  it('accepts the relative navigation solution', () => {
    const seed = 505;
    let { state, cwd } = commonStart(seed);
    const environment = createWorkspaceEnvironment(seed);
    ({ state, cwd } = run(state, cwd, 'cd ../../incoming', seed));
    ({ state, cwd } = run(state, cwd, `cd ${environment.transfer.directory.split('/').at(-1)}`, seed));
    ({ state, cwd } = run(state, cwd, `cat ${environment.transfer.fileName}`, seed));
    state = linkEvidence(workspace01Definition, state, {
      claimId: 'outcome.workspace.transfer',
      evidenceId: 'artifact.workspace.transfer',
      note: 'opened and matched package code',
    });
    const attempt = attemptMissionCompletion(workspace01Definition, state);
    expect(attempt.completed).toBe(true);
    expect(attempt.state.assessment?.matchedSolutionFamilyId).toBe('solution.workspace.relative');
  });

  it('accepts the absolute navigation solution', () => {
    const seed = 606;
    let { state } = commonStart(seed);
    const environment = createWorkspaceEnvironment(seed);
    ({ state } = run(state, WORKSPACE_HOME, `cat ${environment.transfer.path}`, seed));
    state = linkEvidence(workspace01Definition, state, {
      claimId: 'outcome.workspace.transfer',
      evidenceId: 'artifact.workspace.transfer',
      note: 'opened by absolute path',
    });
    const attempt = attemptMissionCompletion(workspace01Definition, state);
    expect(attempt.completed).toBe(true);
    expect(attempt.state.assessment?.matchedSolutionFamilyId).toBe('solution.workspace.absolute');
  });

  it('rejects a memorized answer without opened evidence', () => {
    const seed = 707;
    const { state } = commonStart(seed);
    const attempt = attemptMissionCompletion(workspace01Definition, state);
    expect(attempt.completed).toBe(false);
    expect(attempt.reasons).toContain('rule.workspace.transfer-opened');
    expect(attempt.reasons).toContain('rule.workspace.transfer-evidence');
  });

  it('requires reset after a destructive attempt', () => {
    const seed = 808;
    let { state } = commonStart(seed);
    const destructive = runWorkspaceCommand(createWorkspaceEnvironment(seed), WORKSPACE_HOME, 'rm README.txt');
    state = appendMissionAction(workspace01Definition, state, {
      type: 'command.executed',
      source: 'test-terminal',
      payload: destructive.payload,
    });
    expect(state.assessment?.criticalErrors).toContain('critical.workspace.destructive');
  });
});
