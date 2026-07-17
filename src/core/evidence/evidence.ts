import type { EvidenceLink, MissionDefinition, MissionRuntimeState } from '../scenario/types';

export interface EvidenceValidationResult {
  valid: boolean;
  reason: string;
}

export function validateEvidenceLink(
  definition: MissionDefinition,
  state: MissionRuntimeState,
  link: Pick<EvidenceLink, 'claimId' | 'evidenceId'>,
): EvidenceValidationResult {
  const evidenceExists = definition.artifacts.some((artifact) => artifact.id === link.evidenceId)
    || state.actionLog.some((event) => event.id === link.evidenceId);
  if (!evidenceExists) return { valid: false, reason: 'Источник доказательства не существует в этой миссии.' };

  const claimExists = definition.hypotheses.some((hypothesis) => hypothesis.id === link.claimId)
    || definition.outcomes.some((outcome) => outcome.id === link.claimId);
  if (!claimExists) return { valid: false, reason: 'Утверждение не описано в модели миссии.' };

  return { valid: true, reason: 'Связь относится к известному утверждению и существующему доказательству.' };
}

export function uniqueEvidenceLinks(links: EvidenceLink[]): EvidenceLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.claimId}:${link.evidenceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
