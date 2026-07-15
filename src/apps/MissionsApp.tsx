import { ArrowRight, BriefcaseBusiness, Check, Circle, Code2, FileText, Mail, MessageSquare, Radar, Repeat2, ShieldCheck, TerminalSquare, UserRoundCheck } from 'lucide-react';
import type { AppId } from '../types';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';

export function MissionsApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress } = useProgress();
  const terminalDone = terminalObjectiveDefinitions.every((item) => progress.terminalObjectives.includes(item.id));
  const clinicStages = [
    { id: 'terminal' as AppId, label: 'Осмотр системы', sub: 'Пути, файлы, процессы', done: terminalDone, unlocked: true, icon: TerminalSquare },
    { id: 'code' as AppId, label: 'Скрипт анализа', sub: 'Python', done: progress.pythonComplete, unlocked: terminalDone, icon: Code2 },
    { id: 'siem' as AppId, label: 'Алерт WT-0314-01', sub: 'Разбор событий', done: progress.alertReviewed, unlocked: progress.pythonComplete, icon: Radar },
    { id: 'notes' as AppId, label: 'Отчёт', sub: 'Факты и рекомендации', done: progress.reportSubmitted, unlocked: progress.alertReviewed, icon: FileText },
  ];
  const clinicComplete = clinicStages.every((stage) => stage.done);
  const totalStages = clinicStages.length + 3;
  const completeStages = clinicStages.filter((stage) => stage.done).length + Number(progress.interviewComplete) + Number(progress.jobAccepted) + Number(progress.firstShiftComplete);

  return (
    <div className="mission-app mission-app-v3 app-scroll">
      <section className="mission-hero">
        <div>
          <p className="eyebrow">14 МАРТА / 21:20 / ОСТРОГОРСК</p>
          <h2>Клиника №4<br />ночные входы</h2>
          <p className="mission-lead">Максим прислал архив с рабочей станции регистратуры. Ночью перебирали учётные записи. Компьютер тормозит. Нужно понять, что произошло.</p>
        </div>
        <div className="case-stamp"><span>CASE</span><strong>CLINIC-01</strong><i>{completeStages}/{totalStages}</i></div>
      </section>

      <section className="mission-status-strip">
        <div><span>КОНТАКТ</span><strong>Максим Белов</strong></div>
        <div><span>УЗЕЛ</span><strong>clinic-ws</strong></div>
        <div><span>ДАННЫЕ</span><strong>Обезличенная копия</strong></div>
        <div><span>СТАТУС</span><strong>{clinicComplete ? 'Разобрано' : 'Открыто'}</strong></div>
      </section>

      <section className="mentor-call-card">
        <div className="mentor-call-avatar">МБ<span /></div>
        <div><p className="eyebrow">ВХОДЯЩИЙ ВЫЗОВ / 21:20</p><h3>Максим Белов</h3><p>«Открой терминал. Сначала найдём материалы дела. Ничего не удаляй».</p></div>
        <button className="primary-action compact" onClick={() => openApp('terminal')}><MessageSquare size={17} />Ответить</button>
      </section>

      <section className="chapter-block">
        <header><div><p className="eyebrow">ДЕЛО CLINIC-01</p><h3>Рабочая станция регистратуры</h3><p>Проверить журнал SSH, список процессов и признаки успешного доступа.</p></div><span className={clinicComplete ? 'done' : ''}>{clinicComplete ? 'ЗАКРЫТО' : 'В РАБОТЕ'}</span></header>
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
          <span className="road-number">02</span><UserRoundCheck size={25} /><div><p className="eyebrow">СФЕРА / 11:30</p><h3>Собеседование с Анной</h3><p>Пять вопросов по делу CLINIC-01.</p></div><button disabled={!clinicComplete} onClick={() => openApp('interview')}>{progress.interviewComplete ? 'Завершено' : 'Войти'}<ArrowRight size={15} /></button>
        </article>
        <article className={`${progress.jobOfferUnlocked ? 'available' : 'locked'} ${progress.jobAccepted ? 'done' : ''}`}>
          <span className="road-number">03</span><Mail size={25} /><div><p className="eyebrow">ВХОДЯЩЕЕ ПИСЬМО</p><h3>Предложение о работе</h3><p>«Сфера-Интеграция», младший аналитик SOC.</p></div><button disabled={!progress.jobOfferUnlocked} onClick={() => openApp('mail')}>{progress.jobAccepted ? 'Принято' : 'Открыть'}<ArrowRight size={15} /></button>
        </article>
        <article className={`${progress.jobAccepted ? 'available' : 'locked'} ${progress.firstShiftComplete ? 'done' : ''}`}>
          <span className="road-number">04</span><ShieldCheck size={25} /><div><p className="eyebrow">ПОНЕДЕЛЬНИК / 09:42</p><h3>Тикет PHISH-2026-0041</h3><p>Подозрительное письмо в бухгалтерии.</p></div><button disabled={!progress.jobAccepted} onClick={() => openApp('firstshift')}>{progress.firstShiftComplete ? 'Закрыто' : 'Открыть тикет'}<ArrowRight size={15} /></button>
        </article>
      </section>

      <section className="repeatable-mode-card">
        <div className="repeatable-mark"><Repeat2 size={23} /></div>
        <div><p className="eyebrow">WORK//QUEUE</p><h3>Новые заявки</h3><p>Логи, процессы, DNS, Python и веб-события.</p></div>
        <button className="secondary-action" onClick={() => openApp('contracts')}><BriefcaseBusiness size={17} />Открыть доску</button>
      </section>
    </div>
  );
}
