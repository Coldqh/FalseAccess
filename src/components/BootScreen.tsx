import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const bootLines = [
  '[ OK ] local profile',
  '[ OK ] read-only workspace',
  '[ OK ] evidence journal',
  '[ OK ] command registry',
  '[ OK ] external network blocked',
  '[ .. ] incoming: workspace-clinic-01.local',
];

export function BootScreen() {
  const { setFlag } = useProgress();
  const [visible, setVisible] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible((value) => {
        const next = Math.min(value + 1, bootLines.length);
        if (next === bootLines.length) {
          window.setTimeout(() => setReady(true), 350);
          window.clearInterval(interval);
        }
        return next;
      });
    }, 150);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="boot-screen chapter-zero-boot">
      <div className="boot-grid" />
      <section className="boot-panel">
        <div className="boot-title-row">
          <div><p className="eyebrow">LOCAL TRAINING ENVIRONMENT</p><h1>FALSE<br />ACCESS</h1></div>
          <ShieldCheck size={31} />
        </div>
        <div className="boot-log">{bootLines.slice(0, visible).map((line, index) => <div key={line} className={index === visible - 1 ? 'boot-line active' : 'boot-line'}>{line}</div>)}</div>
        <div className="boot-meta"><span>OSTROGORSK</span><span>14.03.2026 / 21:20</span><span>NO EXTERNAL NETWORK</span></div>
        <button className="primary-action" disabled={!ready} onClick={() => setFlag('booted', true)}><span>ОТКРЫТЬ ПРОФИЛЬ</span><ArrowRight size={20} /></button>
      </section>
    </main>
  );
}
