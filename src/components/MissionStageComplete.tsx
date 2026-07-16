import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { AppId } from '../types';
import { useProgress } from '../system/ProgressContext';

interface Props {
  transition: {
    id: string;
    title: string;
    facts: readonly string[];
    nextApp: AppId;
    button: string;
  };
  openApp: (id: AppId) => void;
}

export function MissionStageComplete({ transition, openApp }: Props) {
  const { progress, acknowledgeTransition } = useProgress();
  if (progress.acknowledgedTransitions.includes(transition.id)) return null;

  const proceed = () => {
    acknowledgeTransition(transition.id);
    openApp(transition.nextApp);
  };

  return (
    <div className="mission-complete-layer" role="dialog" aria-modal="true">
      <section className="mission-complete-dialog">
        <CheckCircle2 size={32} />
        <p className="eyebrow">ЭТАП ЗАВЕРШЁН</p>
        <h2>{transition.title}</h2>
        <div>{transition.facts.map((fact) => <p key={fact}>• {fact}</p>)}</div>
        <button className="primary-action" onClick={proceed}>{transition.button}<ArrowRight size={17} /></button>
      </section>
    </div>
  );
}
