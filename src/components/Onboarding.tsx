import { useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Code2, GraduationCap, Monitor, TerminalSquare, X } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import type { AppId } from '../types';

const pages = [
  {
    icon: Monitor,
    kicker: 'ШАГ 1 / ЧТО ЭТО ЗА ИГРА',
    title: 'Ты начинаешь с абсолютного нуля',
    body: 'Игра не ждёт, что ты знаешь Linux, Python или информационную безопасность. Сначала она объяснит слова. Потом покажет действие. Затем даст повторить самому.',
    code: 'ОБЪЯСНЕНИЕ → ПРИМЕР → ПРАКТИКА → ПРОВЕРКА',
  },
  {
    icon: GraduationCap,
    kicker: 'ШАГ 2 / ACADEMY',
    title: 'Сначала разберись в базе',
    body: 'Academy объясняет компьютер, операционную систему, файлы, пути, команды, IP, порты, логи и программу. После каждого урока — один короткий вопрос с разбором.',
    code: 'ФАЙЛ · ПУТЬ · КОМАНДА · ЛОГ · ПРОГРАММА',
  },
  {
    icon: TerminalSquare,
    kicker: 'ШАГ 3 / TERMINAL',
    title: 'Пиши после знака $',
    body: 'Слева всегда показана следующая команда, место ввода, смысл каждой части и ожидаемый результат. Ошибка безопасна: терминал объяснит текущую папку и предложит проверить путь.',
    code: 'ilya@fa:~$ pwd\n/home/ilya',
  },
  {
    icon: Code2,
    kicker: 'ШАГ 4 / PYTHON',
    title: 'Программа собирается по одной строке',
    body: 'Редактор покажет точное место, строку кода, её чтение и назначение. Ты узнаешь переменную, список, цикл, условие и отступ до запуска программы.',
    code: 'for line in lines:\n    if "Failed" in line:\n        failed += 1',
  },
  {
    icon: BriefcaseBusiness,
    kicker: 'ШАГ 5 / СЮЖЕТ И ЗАКАЗЫ',
    title: 'Навык остаётся частью игры',
    body: 'После дела клиники ты пройдёшь собеседование и первую смену. Освоенные темы открывают повторяемые заказы с другими данными и условиями.',
    code: 'CLINIC-01 → INTERVIEW → FIRST SHIFT → WORK//QUEUE',
  },
];

export function Onboarding({ openApp }: { openApp: (id: AppId) => void }) {
  const { setFlag } = useProgress();
  const [page, setPage] = useState(0);
  const current = pages[page];
  const Icon = current.icon;

  const finish = () => {
    setFlag('onboardingDone', true);
    openApp('academy');
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
            {page < pages.length - 1 ? <button className="primary-action compact" onClick={() => setPage((value) => value + 1)}>Дальше<ArrowRight size={18} /></button> : <button className="primary-action compact" onClick={finish}>Начать с Academy<ArrowRight size={18} /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}
