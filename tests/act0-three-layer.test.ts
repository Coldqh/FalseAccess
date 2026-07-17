import { describe, expect, it } from 'vitest';
import { validateMissionDefinition } from '../src/core/scenario/validation';
import { createClinicEnvironment } from '../src/content/missions/clinic01/environment';
import { clinic01Definition } from '../src/content/missions/clinic01/definition';
import { createAct0ContractEnvironment } from '../src/content/contracts/act0/environment';
import { act0ContractDefinitions } from '../src/content/contracts/act0/definitions';
import { createFoundationEnvironment } from '../src/content/missions/foundationCheck01/environment';
import { foundationCheck01Definition } from '../src/content/missions/foundationCheck01/definition';
import { runCaseCommand } from '../src/simulation/terminal/caseEnvironment';

describe('Act 0 three-layer structure', () => {
  it('validates mission, contracts and mastery definitions', () => {
    const definitions = [clinic01Definition, ...act0ContractDefinitions, foundationCheck01Definition];
    for (const definition of definitions) {
      const result = validateMissionDefinition(definition);
      expect(result.errors, definition.id).toEqual([]);
      expect(result.valid).toBe(true);
      expect(definition.solutionFamilies.length).toBeGreaterThanOrEqual(2);
      expect(definition.safety.externalNetwork).toBe(false);
    }
  });

  it('generates deterministic clinic visible and hidden datasets', () => {
    const first = createClinicEnvironment(44);
    const second = createClinicEnvironment(44);
    const different = createClinicEnvironment(45);
    expect(first.shell.facts).toEqual(second.shell.facts);
    expect(first.visiblePython).toEqual(second.visiblePython);
    expect(first.hiddenPython).toEqual(second.hiddenPython);
    expect(first.visiblePython.expected).not.toEqual(first.hiddenPython.expected);
    expect(first.visiblePython.content).not.toEqual(different.visiblePython.content);
  });

  it('detects process and network findings from executed output', () => {
    const bundle = createClinicEnvironment(91);
    const ps = runCaseCommand(bundle.shell, bundle.shell.home, 'ps -ef');
    const ss = runCaseCommand(bundle.shell, bundle.shell.home, 'ss -tpn');
    expect(ps.payload.finding).toBe('clinic-process-correlated');
    expect(ss.payload.finding).toBe('clinic-network-correlated');
    expect(ps.payload.success).toBe(true);
    expect(ss.payload.success).toBe(true);
  });

  it('blocks destructive and external commands', () => {
    const bundle = createClinicEnvironment(11);
    const destructive = runCaseCommand(bundle.shell, bundle.shell.home, 'rm evidence/auth.log');
    const external = runCaseCommand(bundle.shell, bundle.shell.home, 'curl https://example.com');
    expect(destructive.payload.destructive).toBe(true);
    expect(destructive.exitCode).toBe(126);
    expect(external.payload.externalNetwork).toBe(true);
    expect(external.exitCode).toBe(126);
  });

  it('changes generated contract facts by seed without changing objectives', () => {
    for (const missionId of ['act0-contract-files', 'act0-contract-logs', 'act0-contract-process']) {
      const one = createAct0ContractEnvironment(missionId, 101);
      const two = createAct0ContractEnvironment(missionId, 102);
      expect(one.objective).toBe(two.objective);
      expect(one.shell.facts).not.toEqual(two.shell.facts);
    }
  });

  it('generates a new-schema mastery dataset', () => {
    const bundle = createFoundationEnvironment(77);
    expect(bundle.visiblePython.content).toContain('"type"');
    expect(bundle.visiblePython.content).toContain('"outcome"');
    expect(bundle.visiblePython.expected).not.toEqual(bundle.hiddenPython.expected);
  });
});
