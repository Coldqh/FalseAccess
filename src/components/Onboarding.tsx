import { useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Code2, Monitor, TerminalSquare, X } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import type { AppId } from '../types';

const pages = [
  {
    icon: Monitor,
    kicker: 'ШАГ 1 / СИСТЕМА',
    title: 'Это твой рабочий компьютер',
    body: 'Задания не решаются одной кнопкой. Открывай несколько окон, читай письма, сравнивай логи и сохраняй заметки.',
    code: 'MAIL → TERMINAL → CODE → SIEM',
    app: 'missions' as AppId,
  },
  {
    icon: TerminalSquare,
    kicker: 'ШАГ 2 / TERMINAL',
    title: 'Команды вводятся вручную',
    body: 'Начни с pwd, ls и cd. Ошибка не ломает игру: терминал объяснит, что не так. Команда help покажет доступные инструменты.',
    code: 'pwd\nls -la\ncd cases/clinic-01\ncat brief.txt',
    app: 'terminal' as AppId,
  },
  {
    icon: Code2,
    kicker: 'ШАГ 3 / PYTHON',
    title: 'Код запускается в браузере',
    body: 'Редактор объясняет переменные, циклы, условия и отступы. После запуска проверяется настоящий вывод программы.',
    code: 'for line in lines:\n    if "Failed" in line:\n        failed += 1',
    app: 'code' as AppId,
  },
  {
    icon: BriefcaseBusiness,
    kicker: 'ШАГ 4 / ЗАКАЗЫ',
    title: 'Пройденные навыки остаются в игре',
    body: 'После обучения открываются новые заказы. Файлы, адреса и ответы меняются. Решай через shell, Python и точные технические выводы.',
    code: 'WORK//QUEUE\nLINUX · PYTHON · SOC\nCLEAN RESULT → REP + PAY',
    app: 'contracts' as AppId,
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
        <div className="onboarding-visual">
          <div className="onboarding-orbit"><Icon size={52} strokeWidth={1.2} /></div>
          <div className="onboarding-code">{current.code}</div>
        </div>
        <div className="onboarding-copy">
          <p className="eyebrow">{current.kicker}</p>
          <h2>{current.title}</h2>
          <p>{current.body}</p>
          <div className="pager-dots">
            {pages.map((_, index) => <span key={index} className={index === page ? 'active' : ''} />)}
          </div>
          <div className="onboarding-actions">
            <button className="secondary-action" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={18} /> Назад</button>
            {page < pages.length - 1 ? (
              <button className="primary-action compact" onClick={() => setPage((value) => value + 1)}>Дальше <ArrowRight size={18} /></button>
            ) : (
              <button className="primary-action compact" onClick={finish}>Начать дело <ArrowRight size={18} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
