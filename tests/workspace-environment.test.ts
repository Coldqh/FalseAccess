import { describe, expect, it } from 'vitest';
import {
  createWorkspaceEnvironment,
  normalizeWorkspacePath,
  runWorkspaceCommand,
  WORKSPACE_HOME,
} from '../src/content/missions/workspace01/environment';

describe('workspace chapter environment', () => {
  it('is deterministic for a fixed seed', () => {
    const first = createWorkspaceEnvironment(101);
    const second = createWorkspaceEnvironment(101);
    expect(first.transfer).toEqual(second.transfer);
    expect(Object.keys(first.entries)).toEqual(Object.keys(second.entries));
  });

  it('normalizes absolute and relative paths', () => {
    expect(normalizeWorkspacePath(WORKSPACE_HOME, 'cases/clinic-01')).toBe('/home/ilya/cases/clinic-01');
    expect(normalizeWorkspacePath('/home/ilya/cases/clinic-01', '../../incoming')).toBe('/home/ilya/incoming');
    expect(normalizeWorkspacePath('/tmp', '~/notes')).toBe('/home/ilya/notes');
  });

  it('returns real exit codes and path errors', () => {
    const environment = createWorkspaceEnvironment(202);
    const missing = runWorkspaceCommand(environment, WORKSPACE_HOME, 'cd missing');
    expect(missing.exitCode).toBe(1);
    expect(missing.stderr[0]).toContain('No such file');
    expect(missing.cwd).toBe(WORKSPACE_HOME);
  });

  it('opens the transfer artifact through a relative path', () => {
    const environment = createWorkspaceEnvironment(303);
    const result = runWorkspaceCommand(environment, environment.transfer.directory, `cat ${environment.transfer.fileName}`);
    expect(result.exitCode).toBe(0);
    expect(result.openedArtifactId).toBe('artifact.workspace.transfer');
    expect(result.payload.pathMode).toBe('relative');
  });

  it('blocks destructive and external commands', () => {
    const environment = createWorkspaceEnvironment(404);
    const destructive = runWorkspaceCommand(environment, WORKSPACE_HOME, 'rm README.txt');
    const external = runWorkspaceCommand(environment, WORKSPACE_HOME, 'curl https://example.test');
    expect(destructive.payload.destructive).toBe(true);
    expect(destructive.exitCode).toBe(126);
    expect(external.payload.externalNetwork).toBe(true);
    expect(external.exitCode).toBe(126);
  });
});
