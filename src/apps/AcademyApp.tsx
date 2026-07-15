import { useMemo, useState } from 'react';
import { BookOpenCheck, Check, ChevronLeft, ChevronRight, Circle, Lightbulb, RotateCcw } from 'lucide-react';
import { academyLessons } from '../data/academy';
import { useProgress } from '../system/ProgressContext';

export function AcademyApp() {
  const { progress, completeAcademyLesson } = useProgress();
  const firstIncomplete = Math.max(0, academyLessons.findIndex((lesson) => !progress.academyLessons.includes(lesson.id)));
  const [activeIndex, setActiveIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const lesson = academyLessons[activeIndex];
  const done = progress.academyLessons.includes(lesson.id);
  const correct = answer === lesson.correct;
  const completed = progress.academyLessons.length;

  const nextIncomplete = useMemo(() => academyLessons.findIndex((item, index) => index > activeIndex && !progress.academyLessons.includes(item.id)), [activeIndex, progress.academyLessons]);

  const check = () => {
    if (answer === null) return;
    setChecked(true);
    if (correct) completeAcademyLesson(lesson.id);
  };

  const go = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(academyLessons.length - 1, index)));
    setAnswer(null);
    setChecked(false);
  };

  return (
    <div className="academy-app">
      <aside className="academy-index app-scroll">
        <div className="academy-brand"><BookOpenCheck size={22} /><div><strong>ACADEMY//ZERO</strong><span>основы без пропусков</span></div></div>
        <div className="academy-progress"><span>ПРОЙДЕНО</span><strong>{completed}/{academyLessons.length}</strong><i><b style={{ width: `${completed / academyLessons.length * 100}%` }} /></i></div>
        <nav>
          {academyLessons.map((item, index) => {
            const complete = progress.academyLessons.includes(item.id);
            return (
              <button key={item.id} className={activeIndex === index ? 'active' : ''} onClick={() => go(index)}>
                <span>{complete ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span>
                <div><strong>{item.title}</strong><small>{item.short}</small></div>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="academy-content app-scroll">
        <header className="academy-hero">
          <div><p className="eyebrow">УРОК {String(activeIndex + 1).padStart(2, '0')} / БАЗА</p><h2>{lesson.title}</h2><p>{lesson.definition}</p></div>
          <span className={done ? 'done' : ''}>{done ? <Check size={22} /> : <Circle size={18} />}{done ? 'ИЗУЧЕНО' : 'НЕ ПРОЙДЕНО'}</span>
        </header>

        <section className="academy-explanation">
          <div className="academy-number">01</div>
          <div><h3>Что это значит</h3>{lesson.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </section>

        <section className="academy-example">
          <div><Lightbulb size={19} /><span>{lesson.exampleTitle}</span></div>
          <pre>{lesson.example}</pre>
        </section>

        <section className="academy-explanation compact-block">
          <div className="academy-number">02</div>
          <div><h3>Зачем это в игре</h3><p>{lesson.gameUse}</p></div>
        </section>

        <section className="academy-check">
          <header><div><p className="eyebrow">ПРОВЕРКА</p><h3>{lesson.question}</h3></div><button onClick={() => { setAnswer(null); setChecked(false); }}><RotateCcw size={15} />Сбросить</button></header>
          <div className="academy-options">
            {lesson.options.map((option, index) => (
              <button key={option} className={`${answer === index ? 'selected' : ''} ${checked ? (index === lesson.correct ? 'correct' : answer === index ? 'wrong' : '') : ''}`} onClick={() => { setAnswer(index); setChecked(false); }}>
                <span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong>{checked && index === lesson.correct && <Check size={17} />}
              </button>
            ))}
          </div>
          {checked && <div className={`academy-feedback ${correct ? 'success' : 'error'}`}><strong>{correct ? 'Верно.' : 'Не так.'}</strong><span>{lesson.answer}</span></div>}
          <button className="primary-action" disabled={answer === null || (checked && correct)} onClick={check}>{checked && correct ? 'Урок пройден' : 'Проверить ответ'}</button>
        </section>

        <footer className="academy-navigation">
          <button className="secondary-action" disabled={activeIndex === 0} onClick={() => go(activeIndex - 1)}><ChevronLeft size={17} />Назад</button>
          <span>{activeIndex + 1} / {academyLessons.length}</span>
          <button className="secondary-action" disabled={activeIndex === academyLessons.length - 1} onClick={() => go(nextIncomplete >= 0 ? nextIncomplete : activeIndex + 1)}>Следующий урок<ChevronRight size={17} /></button>
        </footer>
      </main>
    </div>
  );
}
