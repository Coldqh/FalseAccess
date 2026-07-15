import { ArrowRight, MessageSquare, X } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import type { AppId } from '../types';

export function Onboarding({ openApp }: { openApp: (id: AppId) => void }) {
  const { setFlag } = useProgress();

  const finish = () => {
    setFlag('onboardingDone', true);
    openApp('missions');
  };

  return (
    <div className="onboarding-layer">
      <div className="onboarding-card">
        <button className="icon-button onboarding-close" onClick={finish} aria-label="Закрыть"><X size={18} /></button>
        <div className="onboarding-visual">
          <div className="onboarding-orbit"><MessageSquare size={52} strokeWidth={1.2} /></div>
          <div className="onboarding-code">21:20\nМАКСИМ БЕЛОВ\nВХОДЯЩИЙ ВЫЗОВ</div>
        </div>
        <div className="onboarding-copy">
          <p className="eyebrow">14 МАРТА / ОСТРОГОРСК</p>
          <h2>Максим Белов</h2>
          <p>«Я скинул архив с клиники. Открой дело. Ничего не удаляй».</p>
          <div className="onboarding-actions">
            <button className="primary-action compact" onClick={finish}>Ответить <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
