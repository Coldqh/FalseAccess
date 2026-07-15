import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const bootLines = [
  '[ OK ] memory map',
  '[ OK ] local vault',
  '[ OK ] virtual network',
  '[ OK ] training shell',
  '[ OK ] evidence store',
  '[ .. ] loading profile: ilya.v',
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
          window.setTimeout(() => setReady(true), 450);
          window.clearInterval(interval);
        }
        return next;
      });
    }, 180);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="boot-screen">
      <div className="boot-grid" />
      <section className="boot-panel">
        <div className="boot-mark">
          <span>FA</span><i>//</i><span>OS</span>
        </div>
        <div className="boot-title-row">
          <div>
            <p className="eyebrow">LOCAL TRAINING BUILD 0.1</p>
            <h1>FALSE<br />ACCESS</h1>
          </div>
          <ShieldCheck size={46} strokeWidth={1.2} />
        </div>
        <div className="boot-log">
          {bootLines.slice(0, visible).map((line, index) => (
            <div key={line} className={index === visible - 1 ? 'boot-line active' : 'boot-line'}>{line}</div>
          ))}
        </div>
        <div className="boot-meta">
          <span>OSTROGORSK</span>
          <span>14.03.2026 / 21:20</span>
          <span>NO CLOUD SESSION</span>
        </div>
        <button className="primary-action" disabled={!ready} onClick={() => setFlag('booted', true)}>
          <span>ЗАПУСТИТЬ СИСТЕМУ</span>
          <ArrowRight size={20} />
        </button>
      </section>
      <p className="boot-legal">Все цели и данные вымышлены. Лаборатория работает локально.</p>
    </main>
  );
}
