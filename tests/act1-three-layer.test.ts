import { describe, expect, it } from 'vitest';
import { validateMissionDefinition } from '../src/core/scenario/validation';
import { createMissionRuntime, appendMissionAction, openArtifact, linkEvidence, upsertHypothesis, commitDecision, submitReport, attemptMissionCompletion } from '../src/core/scenario/engine';
import { sferaOrientation01Definition } from '../src/content/missions/sferaOrientation01/definition';
import { sferaShiftCheck01Definition } from '../src/content/missions/sferaShiftCheck01/definition';
import { act1ContractDefinitions } from '../src/content/contracts/act1/definitions';
import { createAct1ContractEnvironment } from '../src/content/contracts/act1/environment';
import { createSferaOrientationEnvironment } from '../src/content/missions/sferaOrientation01/environment';
import { createSferaShiftEnvironment } from '../src/content/missions/sferaShiftCheck01/environment';

const report = { facts: 'facts', evidence: 'evidence', limitations: 'limitations', decision: 'decision', nextSteps: 'next' };

describe('act 1 definitions', () => {
  it('validates all three layers', () => {
    [sferaOrientation01Definition, ...act1ContractDefinitions, sferaShiftCheck01Definition].forEach((definition) => {
      expect(validateMissionDefinition(definition)).toEqual({ valid: true, errors: [] });
    });
  });

  it('generates deterministic but variable contract datasets', () => {
    const first = createAct1ContractEnvironment('act1-contract-dns', 77);
    const same = createAct1ContractEnvironment('act1-contract-dns', 77);
    const other = createAct1ContractEnvironment('act1-contract-dns', 78);
    expect(first.shell.facts).toEqual(same.shell.facts);
    expect(first.shell.facts).not.toEqual(other.shell.facts);
  });

  it('keeps orientation and mastery datasets local and seeded', () => {
    expect(createSferaOrientationEnvironment(12).shell.facts).toEqual(createSferaOrientationEnvironment(12).shell.facts);
    expect(createSferaShiftEnvironment(22).shell.home).toBe('/home/ilya/sfera/shift-01');
  });
});

describe('act 1 semantic completion', () => {
  it('completes orientation through evidence, hypotheses and a valid response', () => {
    const d = sferaOrientation01Definition;
    let s = createMissionRuntime(d, 1);
    for (const finding of ['sfera-queue-mail','sfera-queue-endpoint','sfera-queue-dns']) s = appendMissionAction(d, s, { type: 'query.executed', source: 'test', payload: { finding, success: true } });
    for (const finding of ['sfera-mail-domain','sfera-process-chain','sfera-dns-beacon','sfera-scope-host']) s = appendMissionAction(d, s, { type: 'command.executed', source: 'test', payload: { finding, success: true } });
    for (const [id, status] of [['hypothesis.sfera.phishing','supported'],['hypothesis.sfera.execution','supported'],['hypothesis.sfera.beacon','supported'],['hypothesis.sfera.account','unknown']] as const) s = upsertHypothesis(d, s, { hypothesisId: id, status, confidence: 'medium', note: 'evidence' });
    for (const artifact of d.artifacts) s = openArtifact(d, s, artifact.id);
    for (const [claimId,evidenceId] of [['hypothesis.sfera.phishing','artifact.sfera.mail'],['hypothesis.sfera.execution','artifact.sfera.processes'],['hypothesis.sfera.beacon','artifact.sfera.dns'],['outcome.sfera.scope','artifact.sfera.assets']] as const) s = linkEvidence(d, s, { claimId, evidenceId, note: 'linked' });
    s = commitDecision(d, s, { decisionId: 'decision.sfera.isolate-preserve', rationale: 'preserve and isolate' });
    s = submitReport(d, s, report);
    expect(attemptMissionCompletion(d, s).completed).toBe(true);
  });

  it('blocks the mastery check when all alerts are closed blindly', () => {
    const d = sferaShiftCheck01Definition;
    let s = createMissionRuntime(d, 1);
    s = commitDecision(d, s, { decisionId: 'decision.shift.close-all', rationale: 'close' });
    const result = attemptMissionCompletion(d, s);
    expect(result.completed).toBe(false);
    expect(result.reasons).toContain('critical.shift.close');
  });
});
