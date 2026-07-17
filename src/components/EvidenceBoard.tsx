import { Check, FileCheck2, Link2 } from 'lucide-react';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

export function EvidenceBoard() {
  const { activeMission, attachEvidence } = useMissionRuntime();
  if (!activeMission) return null;
  const definition = getMissionDefinition(activeMission.missionId);
  if (!definition) return null;

  const opened = definition.artifacts.filter((artifact) => activeMission.openedArtifacts.includes(artifact.id));
  const transferLinked = activeMission.evidenceLinks.some((link) => (
    link.claimId === 'outcome.workspace.transfer'
    && link.evidenceId === 'artifact.workspace.transfer'
  ));
  const transferOpened = activeMission.openedArtifacts.includes('artifact.workspace.transfer');

  const linkTransfer = () => attachEvidence({
    claimId: 'outcome.workspace.transfer',
    evidenceId: 'artifact.workspace.transfer',
    note: 'Файл открыт в локальной среде и содержит код пакета из brief.txt.',
  });

  return (
    <aside className="chapter-zero-evidence">
      <header>
        <FileCheck2 size={18} />
        <div><strong>Evidence</strong><span>{opened.length} открыто</span></div>
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
      {transferOpened && (
        <button className={transferLinked ? 'linked' : ''} disabled={transferLinked} onClick={linkTransfer}>
          {transferLinked ? <Check size={15} /> : <Link2 size={15} />}
          {transferLinked ? 'Evidence связано' : 'Связать найденный пакет'}
        </button>
      )}
    </aside>
  );
}
