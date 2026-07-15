import { useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, ChevronRight, FileWarning, Link2, MailWarning, ShieldCheck, XCircle } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const checks = [
  {
    title: 'Проверь отправителя',
    question: 'Что подозрительно в адресе отправителя?',
    options: ['Домен sfera-career.com не является внутренним sfera-integration.local', 'В имени есть слово HR', 'Письмо пришло утром'],
    correct: 0,
    explanation: 'Отображаемое имя можно написать любым. Проверяется полный адрес и домен после @.',
  },
  {
    title: 'Проверь ссылку',
    question: 'Текст ссылки обещает staff.sfera.local, но фактический адрес другой. Какой вывод?',
    options: ['Ссылка ведёт на внешний домен и требует проверки', 'Все ссылки с HTTPS безопасны', 'Адрес не имеет значения'],
    correct: 0,
    explanation: 'HTTPS шифрует соединение, но не подтверждает честность владельца сайта. Важен сам домен.',
  },
  {
    title: 'Проверь вложение',
    question: 'Почему salary_update.docm нельзя открывать на рабочем компьютере?',
    options: ['DOCM может содержать макросы, а источник не подтверждён', 'Любой документ удаляет Windows', 'Файл слишком маленький'],
    correct: 0,
    explanation: 'Формат DOCM поддерживает макросы. Это не доказывает вредоносность, но требует изолированного анализа.',
  },
  {
    title: 'Выбери первые действия',
    question: 'Как правильно обработать письмо?',
    options: ['Не открывать вложение, сохранить письмо, передать в анализ и проверить других получателей', 'Ответить отправителю паролем', 'Удалить письмо и забыть'],
    correct: 0,
    explanation: 'Нужно снизить риск, сохранить данные и понять масштаб. Простое удаление уничтожает часть контекста.',
  },
];

export function FirstShiftApp() {
  const { progress, completeFirstShift } = useProgress();
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(checks.map(() => null));
  const [checked, setChecked] = useState<boolean[]>(checks.map(() => false));
  const available = progress.jobAccepted;
  const mistakes = useMemo(() => checked.reduce((sum, done, index) => sum + (done && answers[index] !== checks[index].correct ? 1 : 0), 0), [answers, checked]);

  if (!available) {
    return <div className="firstshift-locked"><ShieldCheck size={48} /><h2>Смена ещё не началась</h2><p>Пройди собеседование, открой предложение в Mail и нажми «Принять предложение».</p></div>;
  }

  if (progress.firstShiftComplete) {
    return <div className="firstshift-complete"><CheckCircle2 size={46} /><p className="eyebrow">ПЕРВАЯ СМЕНА / ЗАВЕРШЕНО</p><h2>Фишинговое письмо изолировано</h2><p>Ошибок при разборе: {progress.firstShiftMistakes}. В журнале смены сохранены отправитель, фактическая ссылка, тип вложения и действия аналитика.</p><div><strong>+{Math.max(500, 1200 - progress.firstShiftMistakes * 150)} ₽</strong><span>первая выплата за смену</span></div></div>;
  }

  const item = checks[active];
  const selected = answers[active];
  const isChecked = checked[active];
  const correct = selected === item.correct;
  const allChecked = checked.every(Boolean);

  const checkAnswer = () => {
    if (selected === null) return;
    setChecked((current) => current.map((value, index) => index === active ? true : value));
  };

  const next = () => {
    if (active < checks.length - 1) setActive((value) => value + 1);
    else if (allChecked) completeFirstShift(mistakes);
  };

  return (
    <div className="firstshift-app">
      <aside className="shift-sidebar">
        <div className="shift-brand"><ShieldCheck size={21} /><div><strong>СФЕРА / SOC</strong><span>смена 01 · 09:42</span></div></div>
        <div className="shift-ticket"><span>TICKET</span><strong>PHISH-2026-0041</strong><i>MEDIUM</i></div>
        <nav>{checks.map((step, index) => <button key={step.title} className={`${active === index ? 'active' : ''} ${checked[index] ? (answers[index] === step.correct ? 'done' : 'mistake') : ''}`} onClick={() => setActive(index)}><span>{checked[index] ? (answers[index] === step.correct ? <Check size={13} /> : <XCircle size={13} />) : index + 1}</span><strong>{step.title}</strong></button>)}</nav>
        <div className="shift-rule"><AlertTriangle size={17} /><p>Не открывай реальные подозрительные вложения. Здесь используется безопасная учебная карточка письма.</p></div>
      </aside>

      <main className="shift-main">
        <header><div><p className="eyebrow">ПЕРВЫЙ РАБОЧИЙ ДЕНЬ</p><h2>Подозрительное письмо бухгалтерии</h2></div><span>{active + 1}/{checks.length}</span></header>
        <section className="phishing-mail-card">
          <div className="mail-warning-head"><MailWarning size={24} /><div><strong>Обновление зарплатного кабинета</strong><span>получено 09:38</span></div></div>
          <dl>
            <div><dt>FROM</dt><dd>HR Portal &lt;documents@sfera-career.com&gt;</dd></div>
            <div><dt>REPLY-TO</dt><dd>support@secure-employee-login.test</dd></div>
            <div><dt>TO</dt><dd>accounting@sfera-integration.local</dd></div>
          </dl>
          <p>Коллеги, срочно подтвердите данные до 10:00. После срока доступ к выплатам будет ограничен.</p>
          <button className="fake-link"><Link2 size={15} /><span>Открыть staff.sfera.local/payroll</span><small>https://staff-sfera-login.test/payroll</small></button>
          <div className="fake-attachment"><FileWarning size={19} /><div><strong>salary_update.docm</strong><span>184 KB · Microsoft Word Macro-Enabled Document</span></div></div>
        </section>

        <section className="shift-question">
          <p className="eyebrow">ШАГ {active + 1} / {item.title}</p>
          <h3>{item.question}</h3>
          <div>{item.options.map((option, index) => <button key={option} className={`${selected === index ? 'selected' : ''} ${isChecked ? (index === item.correct ? 'correct' : selected === index ? 'wrong' : '') : ''}`} disabled={isChecked} onClick={() => setAnswers((current) => current.map((value, answerIndex) => answerIndex === active ? index : value))}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong>{isChecked && index === item.correct && <Check size={17} />}</button>)}</div>
        </section>
        {isChecked && <section className={`shift-feedback ${correct ? 'success' : 'error'}`}><strong>{correct ? 'Верно.' : 'Ошибка зафиксирована.'}</strong><p>{item.explanation}</p></section>}
        <footer>{!isChecked ? <button className="primary-action" disabled={selected === null} onClick={checkAnswer}>Проверить решение</button> : <button className="primary-action" onClick={next}>{active === checks.length - 1 ? 'Закрыть тикет' : 'Следующий шаг'}<ChevronRight size={17} /></button>}</footer>
      </main>
    </div>
  );
}
