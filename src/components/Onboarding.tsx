import { useState } from 'react';
import { ArrowLeft, ArrowRight, Code2, MessageSquare, Monitor, TerminalSquare, X } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import type { AppId } from '../types';

const pages = [
  {
    icon: Monitor,
    kicker: 'FALSE ACCESS / ПРОЛОГ',
    title: 'Максим ведёт тебя по первому делу',
    body: 'Отдельных лекций перед игрой больше нет. Максим коротко объясняет новый термин прямо во время работы, затем ты сразу используешь его в терминале или коде.',
    code: 'РЕПЛИКА → ДЕЙСТВИЕ → РЕЗУЛЬТАТ → СЛЕДУЮЩИЙ ШАГ',
  },
  {
    icon: MessageSquare,
    kicker: 'ЖИВОЕ ОБУЧЕНИЕ',
    title: 'Не читай главу — отвечай действием',
    body: 'Слева идёт разговор. Справа находится настоящий инструмент. Когда ты вводишь команду или строку Python правильно, Максим реагирует на результат и продолжает миссию.',
    code: 'МАКСИМ: введи pwd\nТЫ: pwd\nСИСТЕМА: /home/ilya',
  },
  {
    icon: TerminalSquare,
    kicker: 'TERMINAL + PYTHON',
    title: 'Первый навык появляется сразу',
    body: 'Ты начнёшь с одной команды, затем найдёшь нужный журнал и соберёшь первую программу по строкам. Все слова объясняются в момент, когда они понадобились.',
    code: 'pwd → ls → cd → cat → grep → Python',
  },
  {
    icon: Code2,
    kicker: 'ОШИБКИ РАЗРЕШЕНЫ',
    title: 'Ошибка не останавливает миссию',
    body: 'Терминал и Python покажут, что именно не сработало. Максим не выдаёт готовый ответ сразу: он объясняет причину и даёт исправить действие.',
    code: 'ОШИБКА → ОБЪЯСНЕНИЕ → ИСПРАВЛЕНИЕ',
  },
];

export function Onboarding({ openApp }: { openApp: (id: AppId) => void }) {
  const { setFlag } = useProgress();
  const [page, setPage] = useState(0);
  const current = pages[page];
  const Icon = current.icon;

  const finish = () => {
    setFlag('onboardingDone', true);
    openApp('missions');
  };

  return (
    <div className="onboarding-layer">
      <div className="onboarding-card">
        <button className="icon-button onboarding-close" onClick={finish} aria-label="Закрыть"><X size={18} /></button>
        <div className="onboarding-visual"><div className="onboarding-orbit"><Icon size={52} strokeWidth={1.2} /></div><div className="onboarding-code">{current.code}</div></div>
        <div className="onboarding-copy">
          <p className="eyebrow">{current.kicker}</p><h2>{current.title}</h2><p>{current.body}</p>
          <div className="pager-dots">{pages.map((_, index) => <span key={index} className={index === page ? 'active' : ''} />)}</div>
          <div className="onboarding-actions">
            <button className="secondary-action" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={18} />Назад</button>
            {page < pages.length - 1 ? <button className="primary-action compact" onClick={() => setPage((value) => value + 1)}>Дальше<ArrowRight size={18} /></button> : <button className="primary-action compact" onClick={finish}>Войти в систему<ArrowRight size={18} /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}
