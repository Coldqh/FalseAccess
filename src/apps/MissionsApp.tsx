import { ArrowRight, BriefcaseBusiness, Check, Circle, Code2, FileText, Radar, Repeat2, TerminalSquare } from 'lucide-react';
import type { AppId } from '../types';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';

export function MissionsApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress } = useProgress();
  const terminalDone = terminalObjectiveDefinitions.every((item) => progress.terminalObjectives.includes(item.id));
  const stages = [
    { id: 'terminal', label: 'Осмотр системы', sub: '6 команд', done: terminalDone, icon: TerminalSquare },
    { id: 'code', label: 'Анализ журнала', sub: 'Python', done: progress.pythonComplete, icon: Code2 },
    { id: 'siem', label: 'Разбор алерта', sub: 'Triage', done: progress.alertReviewed, icon: Radar },
    { id: 'report', label: 'Технический отчёт', sub: 'Выводы', done: progress.reportSubmitted, icon: FileText },
  ];
  const complete = stages.filter((stage) => stage.done).length;

  return (
    <div className="mission-app app-scroll">
      <section className="mission-hero">
        <div>
          <p className="eyebrow">ГЛАВА 01 / ДО ПЕРВОЙ РАБОТЫ</p>
          <h2>Рабочая станция<br />городской клиники</h2>
          <p className="mission-lead">Компьютер регистратуры тормозит. Ночью были попытки входа. Максим прислал копию данных для учебного разбора.</p>
        </div>
        <div className="case-stamp">
          <span>CASE</span>
          <strong>CLINIC-01</strong>
          <i>{complete}/4</i>
        </div>
      </section>

      <section className="mission-status-strip">
        <div><span>СРЕДА</span><strong>Изолированная</strong></div>
        <div><span>ЦЕЛЬ</span><strong>Найти причину</strong></div>
        <div><span>РИСК</span><strong>Нулевой</strong></div>
        <div><span>ВРЕМЯ</span><strong>25–40 мин</strong></div>
      </section>

      <section className="mission-timeline">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const unlocked = index === 0 || stages[index - 1].done;
          return (
            <button key={stage.id} className={`mission-stage ${stage.done ? 'done' : ''} ${unlocked ? '' : 'locked'}`} disabled={!unlocked} onClick={() => openApp(stage.id === 'report' ? 'notes' : stage.id as AppId)}>
              <span className="stage-number">{stage.done ? <Check size={16} /> : unlocked ? String(index + 1).padStart(2, '0') : <Circle size={13} />}</span>
              <span className="stage-icon"><Icon size={23} strokeWidth={1.5} /></span>
              <span className="stage-copy"><strong>{stage.label}</strong><small>{stage.sub}</small></span>
              <ArrowRight size={17} />
            </button>
          );
        })}
      </section>

      <section className="briefing-card">
        <div className="briefing-label">ПЕРЕД НАЧАЛОМ</div>
        <div>
          <h3>Терминал не угадывает команды</h3>
          <p>Пиши точно. Linux различает регистр. <code>Auth.log</code> и <code>auth.log</code> — разные имена. Ошибся — прочитай ответ и исправь команду.</p>
        </div>
        <button className="primary-action compact" onClick={() => openApp('terminal')}>Открыть Terminal <ArrowRight size={17} /></button>
      </section>

      <section className="repeatable-mode-card">
        <div className="repeatable-mark"><Repeat2 size={23} /></div>
        <div>
          <p className="eyebrow">СИМУЛЯТОР / РАБОТА МЕЖДУ ГЛАВАМИ</p>
          <h3>Заказы собираются из уже пройденных навыков</h3>
          <p>Меняются клиенты, адреса, журналы, процессы и правильные выводы. Подсказки можно не открывать.</p>
        </div>
        <button className="secondary-action" onClick={() => openApp('contracts')}><BriefcaseBusiness size={17} />Открыть доску</button>
      </section>

      {progress.jobOfferUnlocked && (
        <section className="mission-complete-banner">
          <div className="pulse-dot" />
          <div><p className="eyebrow">НОВОЕ ПИСЬМО</p><h3>«Сфера-Интеграция» ответила</h3></div>
          <button className="secondary-action" onClick={() => openApp('mail')}>Открыть Mail</button>
        </section>
      )}
    </div>
  );
}
