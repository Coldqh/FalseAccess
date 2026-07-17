import { Check, FileCheck2, Link2 } from 'lucide-react';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

export interface EvidenceSuggestion {
  claimId: string;
  evidenceId: string;
  label: string;
  note: string;
}

export function EvidenceBoard({ suggestions = [] }: { suggestions?: EvidenceSuggestion[] }) {
  const { activeMission, attachEvidence } = useMissionRuntime();
  if (!activeMission) return null;
  const definition = getMissionDefinition(activeMission.missionId);
  if (!definition) return null;

  const opened = definition.artifacts.filter((artifact) => activeMission.openedArtifacts.includes(artifact.id));
  const availableSuggestions = suggestions.filter((suggestion) => activeMission.openedArtifacts.includes(suggestion.evidenceId));

  return (
    <aside className="chapter-zero-evidence">
      <header>
        <FileCheck2 size={18} />
        <div><strong>Evidence</strong><span>{opened.length} открыто · {activeMission.evidenceLinks.length} связано</span></div>
      </header>
      <div className="chapter-zero-evidence-list">
        {opened.map((artifact) => (
          <article key={artifact.id}>
            <span><Check size={13} /></span>
            <div><strong>{artifact.title}</strong><small>{artifact.origin}</small></div>
          </article>
        ))}
        {!opened.length && <p>Открытые артефакты появятся здесь автоматически.</p>}
      </div>
      <div className="chapter-zero-evidence-actions">
        {availableSuggestions.map((suggestion) => {
          const linked = activeMission.evidenceLinks.some((link) => (
            link.claimId === suggestion.claimId && link.evidenceId === suggestion.evidenceId
          ));
          return (
            <button
              key={`${suggestion.claimId}:${suggestion.evidenceId}`}
              className={linked ? 'linked' : ''}
              disabled={linked}
              onClick={() => attachEvidence({
                claimId: suggestion.claimId,
                evidenceId: suggestion.evidenceId,
                note: suggestion.note,
              })}
            >
              {linked ? <Check size={15} /> : <Link2 size={15} />}
              {linked ? `${suggestion.label}: связано` : suggestion.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
