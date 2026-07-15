import { useMemo, useState } from 'react';
import { Check, CheckCircle2, ChevronRight, Circle, RotateCcw, UserRoundCheck, XCircle } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const questions = [
  {
    question: 'Ты открыл терминал и видишь приглашение ilya@fa:~/cases$. Что означает ~/cases?',
    options: ['Текущую папку пользователя', 'IP-адрес компьютера', 'Имя запущенного процесса'],
    correct: 0,
    explanation: '~ заменяет домашнюю папку /home/ilya. Значит, текущий путь — /home/ilya/cases.',
  },
  {
    question: 'В журнале шесть строк Failed password с одного внешнего IP. Что доказано?',
    options: ['Система полностью захвачена', 'Были неудачные попытки входа', 'Пароль root точно украден'],
    correct: 1,
    explanation: 'Failed password подтверждает только неудачную аутентификацию. Успешный доступ нужно искать отдельно.',
  },
  {
    question: 'Зачем программе переменная failed = 0?',
    options: ['Чтобы хранить количество найденных ошибок', 'Чтобы закрыть сетевой порт', 'Чтобы удалить журнал'],
    correct: 0,
    explanation: 'failed — счётчик. Он начинается с нуля и увеличивается при каждом совпадении.',
  },
  {
    question: 'Что аналитик должен сделать до удаления подозрительного файла?',
    options: ['Сохранить данные и зафиксировать путь, процесс и время', 'Немедленно удалить всё', 'Опубликовать файл в чате'],
    correct: 0,
    explanation: 'Сначала сохраняют доказательства и контекст. Иначе можно уничтожить данные, нужные для расследования.',
  },
  {
    question: 'Почему технический отчёт разделяет факты и предположения?',
    options: ['Чтобы не выдавать гипотезу за доказанное событие', 'Чтобы отчёт был длиннее', 'Чтобы скрыть ошибки аналитика'],
    correct: 0,
    explanation: 'Решения принимают по отчёту. Неточная формулировка может привести к неправильной блокировке, обвинению или потере данных.',
  },
];

export function InterviewApp() {
  const { progress, completeInterview } = useProgress();
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(questions.map(() => false));
  const available = progress.reportSubmitted;
  const score = useMemo(() => answers.reduce<number>((sum, answer, index) => sum + (answer === questions[index].correct ? 1 : 0), 0), [answers]);
  const allChecked = checked.every(Boolean);

  if (!available) {
    return <div className="interview-locked"><UserRoundCheck size={48} /><h2>Сначала закончи CLINIC-01</h2><p>Собеседование откроется после терминала, Python, SIEM и технического отчёта.</p></div>;
  }

  if (progress.interviewComplete) {
    return <div className="interview-result-screen"><div className="interview-seal"><CheckCircle2 size={40} /></div><p className="eyebrow">СОБЕСЕДОВАНИЕ ЗАВЕРШЕНО</p><h2>{progress.interviewScore}/{questions.length}</h2><p>Анна не ждала идеальных терминов. Ей был нужен человек, который читает данные, признаёт границы уверенности и не уничтожает доказательства.</p><div className="result-next"><strong>Новое письмо</strong><span>Предложение от «Сферы-Интеграции» уже в Mail.</span></div></div>;
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
    else if (allChecked) completeInterview(score);
  };

  return (
    <div className="interview-app">
      <aside className="interview-room">
        <div className="interview-company"><span>СФЕРА</span><strong>SECURITY OPERATIONS</strong></div>
        <div className="interviewer-card"><div className="interviewer-avatar">АС</div><strong>Анна Соколова</strong><span>Руководитель смены SOC</span><p>«Не торопись. Мне важнее ход мысли, чем выученная формулировка».</p></div>
        <div className="interview-rules"><span>КАК ЭТО РАБОТАЕТ</span><p>Выбери ответ. После проверки появится объяснение. Ошибка не закрывает прохождение: собеседование тоже часть обучения.</p></div>
      </aside>
      <main className="interview-main">
        <header><div><p className="eyebrow">ТЕХНИЧЕСКОЕ СОБЕСЕДОВАНИЕ</p><h2>Вопрос {active + 1} из {questions.length}</h2></div><strong>{score} верно</strong></header>
        <div className="interview-progress">{questions.map((_, index) => <button key={index} className={`${active === index ? 'active' : ''} ${checked[index] ? (answers[index] === questions[index].correct ? 'correct' : 'wrong') : ''}`} onClick={() => setActive(index)}>{checked[index] ? (answers[index] === questions[index].correct ? <Check size={13} /> : <XCircle size={13} />) : <Circle size={10} />}</button>)}</div>
        <section className="interview-question"><p>{question.question}</p><div>{question.options.map((option, index) => <button key={option} className={`${selected === index ? 'selected' : ''} ${isChecked ? (index === question.correct ? 'correct' : selected === index ? 'wrong' : '') : ''}`} onClick={() => choose(index)}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong>{isChecked && index === question.correct && <Check size={18} />}</button>)}</div></section>
        {isChecked && <section className={`interview-explanation ${correct ? 'success' : 'error'}`}><strong>{correct ? 'Верно.' : 'Ответ неточный.'}</strong><p>{question.explanation}</p></section>}
        <footer>
          <button className="secondary-action" onClick={() => { setAnswers(questions.map(() => null)); setChecked(questions.map(() => false)); setActive(0); }}><RotateCcw size={15} />Начать заново</button>
          {!isChecked ? <button className="primary-action" disabled={selected === null} onClick={check}>Проверить ответ</button> : <button className="primary-action" onClick={next}>{active === questions.length - 1 ? 'Завершить собеседование' : 'Следующий вопрос'}<ChevronRight size={17} /></button>}
        </footer>
      </main>
    </div>
  );
}
