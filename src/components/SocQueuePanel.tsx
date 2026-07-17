import { AlertTriangle, Check, Clock3, ExternalLink, ShieldAlert } from 'lucide-react';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

export interface SocQueueItem {
  id: string;
  time: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  entity: string;
  summary: string;
  artifactId: string;
  finding: string;
  source: string;
}

export function SocQueuePanel({ items, title = 'WATCHTOWER / ALERT QUEUE' }: { items: SocQueueItem[]; title?: string }) {
  const runtime = useMissionRuntime();
  const mission = runtime.activeMission;
  if (!mission) return null;

  const open = (item: SocQueueItem) => {
    runtime.markArtifactOpened(item.artifactId, 'soc-workbench');
    runtime.recordAction({
      type: 'query.executed',
      source: 'soc-workbench',
      payload: {
        finding: item.finding,
        alertId: item.id,
        entity: item.entity,
        source: item.source,
        success: true,
      },
    });
  };

  return (
    <section className="soc-queue-panel">
      <header><ShieldAlert size={18} /><strong>{title}</strong><span>{items.length} alerts</span></header>
      <div className="soc-queue-list">
        {items.map((item) => {
          const opened = mission.openedArtifacts.includes(item.artifactId);
          return (
            <button key={item.id} className={opened ? 'opened' : ''} onClick={() => open(item)}>
              <div className="soc-queue-meta"><span className={`severity ${item.severity.toLowerCase()}`}>{item.severity}</span><span><Clock3 size={12} />{item.time}</span><span>{item.id}</span></div>
              <div className="soc-queue-title"><AlertTriangle size={16} /><strong>{item.title}</strong></div>
              <p>{item.summary}</p>
              <footer><span>{item.entity}</span><span>{item.source}</span>{opened ? <Check size={15} /> : <ExternalLink size={14} />}</footer>
            </button>
          );
        })}
      </div>
    </section>
  );
}
