import { ArrowRight, BookOpenCheck, BriefcaseBusiness, Check, Circle, Code2, FileText, GraduationCap, Mail, Radar, Repeat2, ShieldCheck, TerminalSquare, UserRoundCheck } from 'lucide-react';
import type { AppId } from '../types';
import { terminalObjectiveDefinitions } from '../data/content';
import { academyLessons } from '../data/academy';
import { useProgress } from '../system/ProgressContext';

export function MissionsApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress } = useProgress();
  const academyDone = progress.academyLessons.length === academyLessons.length;
  const terminalDone = terminalObjectiveDefinitions.every((item) => progress.terminalObjectives.includes(item.id));
  const clinicStages = [
    { id: 'academy' as AppId, label: 'База с абсолютного нуля', sub: `${progress.academyLessons.length}/${academyLessons.length} уроков`, done: academyDone, unlocked: true, icon: GraduationCap },
    { id: 'terminal' as AppId, label: 'Осмотр системы', sub: 'Linux и пути', done: terminalDone, unlocked: true, icon: TerminalSquare },
    { id: 'code' as AppId, label: 'Первая программа', sub: 'Python по строкам', done: progress.pythonComplete, unlocked: terminalDone, icon: Code2 },
    { id: 'siem' as AppId, label: 'Разбор алерта', sub: 'SOC triage', done: progress.alertReviewed, unlocked: progress.pythonComplete, icon: Radar },
    { id: 'notes' as AppId, label: 'Технический отчёт', sub: 'Факты и выводы', done: progress.reportSubmitted, unlocked: progress.alertReviewed, icon: FileText },
  ];
  const clinicComplete = clinicStages.slice(1).every((stage) => stage.done);
  const totalStages = clinicStages.length + 3;
  const completeStages = clinicStages.filter((stage) => stage.done).length + Number(progress.interviewComplete) + Number(progress.jobAccepted) + Number(progress.firstShiftComplete);

  return (
    <div className="mission-app mission-app-v3 app-scroll">
      <section className="mission-hero">
        <div>
          <p className="eyebrow">ПРОЛОГ / ОТ НУЛЯ ДО ПЕРВОЙ СМЕНЫ</p>
          <h2>Илья ещё ничего<br />не знает</h2>
          <p className="mission-lead">Сначала разберись, что такое файл, путь, команда, лог и программа. Потом решай дело клиники, проходи собеседование и выходи на первую смену в SOC.</p>
        </div>
        <div className="case-stamp"><span>PROGRESS</span><strong>0.3</strong><i>{completeStages}/{totalStages}</i></div>
      </section>

      <section className="mission-status-strip">
        <div><span>СТАРТ</span><strong>Абсолютный ноль</strong></div>
        <div><span>ЦЕЛЬ</span><strong>Первая смена SOC</strong></div>
        <div><span>РЕЖИМ</span><strong>Обучение включено</strong></div>
        <div><span>ВРЕМЯ</span><strong>60–100 мин</strong></div>
      </section>

      <section className="chapter-block">
        <header><div><p className="eyebrow">ГЛАВА 01 / CLINIC-01</p><h3>Рабочая станция городской клиники</h3><p>Максим прислал безопасную копию журналов. Нужно понять, что произошло, и не назвать попытки входа успешным взломом без доказательств.</p></div><span className={clinicComplete ? 'done' : ''}>{clinicComplete ? 'ЗАВЕРШЕНО' : 'В РАБОТЕ'}</span></header>
        <div className="mission-timeline">
          {clinicStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <button key={stage.id} className={`mission-stage ${stage.done ? 'done' : ''} ${stage.unlocked ? '' : 'locked'}`} disabled={!stage.unlocked} onClick={() => openApp(stage.id)}>
                <span className="stage-number">{stage.done ? <Check size={16} /> : stage.unlocked ? String(index + 1).padStart(2, '0') : <Circle size={13} />}</span>
                <span className="stage-icon"><Icon size={23} strokeWidth={1.5} /></span>
                <span className="stage-copy"><strong>{stage.label}</strong><small>{stage.sub}</small></span>
                <ArrowRight size={17} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="story-roadmap">
        <article className={`${clinicComplete ? 'available' : 'locked'} ${progress.interviewComplete ? 'done' : ''}`}>
          <span className="road-number">02</span><UserRoundCheck size={25} /><div><p className="eyebrow">СОБЕСЕДОВАНИЕ</p><h3>Анна Соколова</h3><p>Пять вопросов с разбором каждого ответа. Ошибка не закрывает сюжет.</p></div><button disabled={!clinicComplete} onClick={() => openApp('interview')}>{progress.interviewComplete ? 'Пройдено' : 'Начать'}<ArrowRight size={15} /></button>
        </article>
        <article className={`${progress.jobOfferUnlocked ? 'available' : 'locked'} ${progress.jobAccepted ? 'done' : ''}`}>
          <span className="road-number">03</span><Mail size={25} /><div><p className="eyebrow">ПРЕДЛОЖЕНИЕ</p><h3>«Сфера-Интеграция»</h3><p>После собеседования открой Mail, прочитай условия и прими работу.</p></div><button disabled={!progress.jobOfferUnlocked} onClick={() => openApp('mail')}>{progress.jobAccepted ? 'Принято' : 'Открыть Mail'}<ArrowRight size={15} /></button>
        </article>
        <article className={`${progress.jobAccepted ? 'available' : 'locked'} ${progress.firstShiftComplete ? 'done' : ''}`}>
          <span className="road-number">04</span><ShieldCheck size={25} /><div><p className="eyebrow">ПЕРВЫЙ ДЕНЬ</p><h3>Фишинговый тикет</h3><p>Проверь отправителя, ссылку, вложение и выбери первые действия аналитика.</p></div><button disabled={!progress.jobAccepted} onClick={() => openApp('firstshift')}>{progress.firstShiftComplete ? 'Смена закрыта' : 'Начать смену'}<ArrowRight size={15} /></button>
        </article>
      </section>

      {!academyDone && <section className="beginner-warning"><BookOpenCheck size={22} /><div><strong>Начни с Academy</strong><p>Там объясняются слова, которые раньше игра бросала без подготовки: операционная система, путь, команда, IP, порт, лог, переменная, цикл и факт.</p></div><button className="primary-action compact" onClick={() => openApp('academy')}>Открыть Academy</button></section>}

      <section className="repeatable-mode-card">
        <div className="repeatable-mark"><Repeat2 size={23} /></div>
        <div><p className="eyebrow">СИМУЛЯТОР / МЕЖДУ ГЛАВАМИ</p><h3>Пройденные навыки превращаются в заказы</h3><p>Меняются клиенты, адреса, журналы и правильные выводы. Подсказки можно не открывать.</p></div>
        <button className="secondary-action" onClick={() => openApp('contracts')}><BriefcaseBusiness size={17} />Открыть доску</button>
      </section>
    </div>
  );
}
