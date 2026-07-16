import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Home, Lock, MoreVertical, RefreshCw } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const baseSites = [
  { id: 'sfera', label: 'Сфера-Интеграция', path: 'sites/sfera/index.html', display: 'sfera-integration.local/careers' },
  { id: 'news', label: 'Острогорск Сегодня', path: 'sites/ostrogorsk-news/index.html', display: 'ostrogorsk-news.local' },
  { id: 'clinic', label: 'Городская клиника №4', path: 'sites/clinic/index.html', display: 'clinic-4.local' },
];

export function BrowserApp() {
  const { progress } = useProgress();
  const sites = useMemo(() => progress.routeCaseAccepted ? [...baseSites, { id: 'marshrut', label: 'Маршрут', path: 'sites/marshrut/index.html', display: 'marshrut.local' }] : baseSites, [progress.routeCaseAccepted]);
  const [activeId, setActiveId] = useState('sfera');
  const [reloadKey, setReloadKey] = useState(0);
  const active = useMemo(() => sites.find((site) => site.id === activeId)!, [activeId]);
  const src = `${new URL('.', window.location.href).href}${active.path}`;

  return (
    <div className="browser-app">
      <header className="browser-tabs">
        {sites.map((site) => <button key={site.id} className={activeId === site.id ? 'active' : ''} onClick={() => setActiveId(site.id)}><span>{site.label}</span></button>)}
        <i />
      </header>
      <div className="browser-bar">
        <button><ArrowLeft size={16} /></button><button><ArrowRight size={16} /></button><button onClick={() => setReloadKey((key) => key + 1)}><RefreshCw size={15} /></button><button onClick={() => setActiveId('sfera')}><Home size={15} /></button>
        <div className="address-bar"><Lock size={13} /><span>{active.display}</span></div>
        <button title="Открыть в обычном браузере" onClick={() => window.open(src, '_blank', 'noopener,noreferrer')}><ExternalLink size={15} /></button><button><MoreVertical size={16} /></button>
      </div>
      <iframe key={`${activeId}-${reloadKey}`} src={src} title={active.label} sandbox="allow-scripts allow-forms allow-same-origin" />
    </div>
  );
}
