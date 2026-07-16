import { useMemo, useState } from 'react';
import { Check, CheckCircle2, ChevronRight, Circle, RotateCcw, UserRoundCheck, XCircle } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const questions = [
  {
    question: 'В терминале написано ilya@fa:~/cases$. Где ты находишься?',
    options: ['В /home/ilya/cases', 'На сервере с адресом cases', 'В процессе с именем ilya'],
    correct: 0,
    explanation: '~ — домашняя папка пользователя. Для Ильи это /home/ilya.',
  },
  {
    question: 'В auth.log шесть строк Failed password с одного внешнего IP. Что ты можешь утверждать?',
    options: ['Были неудачные попытки входа', 'Сервер взломан', 'Пароль root украден'],
    correct: 0,
    explanation: 'Failed password означает отказ. Успешный вход ищется отдельно.',
  },
  {
    question: 'Для чего в скрипте failed = 0?',
    options: ['Это счётчик найденных строк', 'Это номер сетевого порта', 'Это команда очистки файла'],
    correct: 0,
    explanation: 'Счётчик начинается с нуля и растёт на единицу при каждом совпадении.',
  },
  {
    question: 'Нашёл процесс из /tmp. Что делаешь до удаления?',
    options: ['Фиксирую PID, путь, время и сохраняю данные', 'Удаляю файл сразу', 'Перезагружаю компьютер'],
    correct: 0,
    explanation: 'После удаления часть данных пропадёт. Сначала их сохраняют.',
  },
  {
    question: 'Успешного внешнего входа нет. Как написать итог?',
    options: ['Зафиксированы попытки входа; компрометация не подтверждена', 'Сервер точно безопасен', 'Атакующий получил root'],
    correct: 0,
    explanation: 'Отчёт должен отделять найденные события от того, чего данные не доказали.',
  },
];

export function InterviewApp() {
  const { progress, completeInterview } = useProgress();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(questions.map(() => false));
  const available = progress.reportSubmitted;
  const score = useMemo(() => answers.reduce<number>((sum, answer, index) => sum + (answer === questions[index].correct ? 1 : 0), 0), [answers]);

  if (!available) {
    return <div className="interview-locked"><UserRoundCheck size={48} /><h2>Сначала закончи CLINIC-01</h2><p>Анна ждёт отчёт.</p></div>;
  }

  if (progress.interviewComplete) {
    return (
      <div className="interview-result-screen">
        <div className="interview-seal"><CheckCircle2 size={40} /></div>
        <p className="eyebrow">СОБЕСЕДОВАНИЕ ЗАКОНЧЕНО</p>
        <h2>{progress.interviewScore}/{questions.length}</h2>
        <div className="interview-final-dialogue">
          <strong>Анна Соколова</strong>
          <p>{progress.interviewScore >= 4 ? 'Ладно. Для стажёра нормально. Ответ пришлю на почту.' : 'Термины плавают. Но с данными ты работаешь аккуратно. Ответ пришлю позже.'}</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="interview-intro">
        <div className="interviewer-avatar large">АС</div>
        <p className="eyebrow">ВИДЕОЗВОНОК / 11:30</p>
        <h2>Анна Соколова</h2>
        <span>Руководитель смены SOC · «Сфера-Интеграция»</span>
        <div className="interview-call-lines">
          <p>Максим прислал твой отчёт.</p>
          <p>Пять вопросов. Где не знаешь — не выдумывай.</p>
        </div>
        <button className="primary-action" onClick={() => setStarted(true)}>Начать</button>
      </div>
    );
  }

  const question = questions[active];
  const selected = answers[active];
  const isChecked = checked[active];
  const correct = selected === question.correct;

  const choose = (index: number) => {
    if (isChecked) return;
    setAnswers((current) => current.map((value, answerIndex) => answerIndex === active ? index : value));
  };

  const check = () => {
    if (selected === null) return;
    setChecked((current) => current.map((value, index) => index === active ? true : value));
  };

  const next = () => {
    if (active < questions.length - 1) setActive((value) => value + 1);
    else completeInterview(score);
  };

  return (
    <div className="interview-app interview-app-v5">
      <aside className="interview-room">
        <div className="interview-company"><span>СФЕРА</span><strong>SECURITY OPERATIONS</strong></div>
        <div className="interviewer-card"><div className="interviewer-avatar">АС</div><strong>Анна Соколова</strong><span>Руководитель смены</span><p>{isChecked ? (correct ? 'Хорошо. Дальше.' : 'Нет. Смотри на формулировку.') : 'Слушаю.'}</p></div>
      </aside>
      <main className="interview-main">
        <header><div><p className="eyebrow">ВОПРОС {active + 1} / {questions.length}</p><h2>{question.question}</h2></div><strong>{score} верно</strong></header>
        <div className="interview-progress">{questions.map((_, index) => <button key={index} className={`${active === index ? 'active' : ''} ${checked[index] ? (answers[index] === questions[index].correct ? 'correct' : 'wrong') : ''}`} onClick={() => setActive(index)}>{checked[index] ? (answers[index] === questions[index].correct ? <Check size={13} /> : <XCircle size={13} />) : <Circle size={10} />}</button>)}</div>
        <section className="interview-question"><div>{question.options.map((option, index) => <button key={option} className={`${selected === index ? 'selected' : ''} ${isChecked ? (index === question.correct ? 'correct' : selected === index ? 'wrong' : '') : ''}`} onClick={() => choose(index)}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong>{isChecked && index === question.correct && <Check size={18} />}</button>)}</div></section>
        {isChecked && <section className={`interview-explanation ${correct ? 'success' : 'error'}`}><p>{question.explanation}</p></section>}
        <footer>
          <button className="secondary-action" onClick={() => { setAnswers(questions.map(() => null)); setChecked(questions.map(() => false)); setActive(0); }}><RotateCcw size={15} />Сначала</button>
          {!isChecked ? <button className="primary-action" disabled={selected === null} onClick={check}>Ответить</button> : <button className="primary-action" onClick={next}>{active === questions.length - 1 ? 'Закончить' : 'Следующий'}<ChevronRight size={17} /></button>}
        </footer>
      </main>
    </div>
  );
}
