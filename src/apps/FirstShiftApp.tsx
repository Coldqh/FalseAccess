import { useMemo, useState } from 'react';
import {
  AlertTriangle, Check, CheckCircle2, ChevronRight, FileWarning, Link2, MailWarning,
  Network, ShieldCheck, TerminalSquare, UserRound, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

interface QuizItem {
  title: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const phishingChecks: QuizItem[] = [
  {
    title: 'Отправитель',
    question: 'Что здесь главное?',
    options: [
      'Письмо пришло с sfera-career.com, а рабочий домен — sfera-integration.local',
      'В имени отправителя написано HR Portal',
      'Письмо пришло до обеда',
    ],
    correct: 0,
    explanation: 'Имя отправителя подделывается за секунду. Смотри на адрес после @.',
  },
  {
    title: 'Ссылка',
    question: 'Текст ссылки и настоящий адрес не совпадают. Что делать?',
    options: [
      'Не открывать. Зафиксировать настоящий домен и проверить его отдельно',
      'Открыть: у ссылки есть HTTPS',
      'Переслать коллегам и спросить, работает ли',
    ],
    correct: 0,
    explanation: 'HTTPS шифрует соединение. Он не делает чужой сайт честным.',
  },
  {
    title: 'Вложение',
    question: 'Почему salary_update.docm нельзя запускать на рабочем компьютере?',
    options: [
      'DOCM поддерживает макросы, а источник письма не подтверждён',
      'Word-файлы всегда заражены',
      'Файл весит меньше мегабайта',
    ],
    correct: 0,
    explanation: 'Сам формат не доказывает заражение. Но макросы из чужого письма открывают только в изоляции.',
  },
  {
    title: 'Действия',
    question: 'Что делать первым?',
    options: [
      'Сохранить письмо, изолировать вложение и проверить других получателей',
      'Удалить письмо и закрыть тикет',
      'Ответить отправителю и попросить подтверждение',
    ],
    correct: 0,
    explanation: 'Нужно сохранить данные и понять масштаб. Одного удаления недостаточно.',
  },
];

const powershellChecks: QuizItem[] = [
  {
    title: 'Родительский процесс',
    question: 'Что запустило PowerShell?',
    options: ['WINWORD.EXE', 'explorer.exe', 'svchost.exe'],
    correct: 0,
    explanation: 'В журнале ParentProcessName указан WINWORD.EXE. Значит, команда пошла из документа Word.',
  },
  {
    title: 'Командная строка',
    question: 'Какая часть команды требует проверки?',
    options: ['-EncodedCommand и -ExecutionPolicy Bypass', '-NoProfile', 'powershell.exe'],
    correct: 0,
    explanation: 'Кодирование команды и обход политики часто используют в атаках. Это ещё не приговор, но сигнал сильный.',
  },
  {
    title: 'Первое действие',
    question: 'Что сделать с рабочей станцией?',
    options: [
      'Изолировать от сети, сохранить журнал и данные процесса',
      'Сразу удалить powershell.exe',
      'Перезагрузить компьютер и проверить, прошло ли',
    ],
    correct: 0,
    explanation: 'Изоляция ограничит связь. Данные процесса и журнал нужны для дальнейшего разбора.',
  },
];

const dnsChecks: QuizItem[] = [
  {
    title: 'Источник',
    question: 'Какой узел делает повторяющиеся запросы?',
    options: ['10.23.8.44', '10.23.8.12', '10.23.8.1'],
    correct: 0,
    explanation: 'Все запросы к update-cache-check.test идут с 10.23.8.44.',
  },
  {
    title: 'Ритм',
    question: 'Что необычного во времени запросов?',
    options: ['Они повторяются почти ровно раз в минуту', 'Они идут только утром', 'Запрос был один'],
    correct: 0,
    explanation: 'Ровный интервал похож на автоматическую работу программы. Нужно проверить процесс на узле.',
  },
  {
    title: 'Вывод',
    question: 'Что можно написать по этим данным?',
    options: [
      'Есть регулярные обращения к внешнему домену; назначение трафика пока не установлено',
      'Данные клиентов точно украдены',
      'Это обычный DNS, проверка не нужна',
    ],
    correct: 0,
    explanation: 'Запросы подтверждены. Кража данных — нет. В отчёте эти вещи нельзя смешивать.',
  },
];

const powershellEvent = `Event ID: 4688\nTime: 10:26:41\nComputer: ACC-WS-07\nUser: SFERA\\m.rybina\nNewProcessName: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\nParentProcessName: C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE\nCommandLine: powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand SQBFAFgA...`;

const dnsLog = `11:02:06  10.23.8.12  A  updates.microsoft.com\n11:04:14  10.23.8.44  A  update-cache-check.test\n11:05:13  10.23.8.44  A  update-cache-check.test\n11:06:15  10.23.8.44  A  update-cache-check.test\n11:07:14  10.23.8.44  A  update-cache-check.test\n11:08:16  10.23.8.44  A  update-cache-check.test\n11:09:03  10.23.8.1   A  ntp.sfera.local`;

function QuizPanel({
  items,
  onComplete,
}: {
  items: QuizItem[];
  onComplete: (mistakes: number) => void;
}) {
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(items.map(() => null));
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
  const item = items[active];
  const selected = answers[active];
  const isChecked = checked[active];
  const correct = selected === item.correct;
  const mistakes = useMemo(
    () => checked.reduce((sum, done, index) => sum + (done && answers[index] !== items[index].correct ? 1 : 0), 0),
    [answers, checked, items],
  );

  const check = () => {
    if (selected === null) return;
    setChecked((current) => current.map((value, index) => index === active ? true : value));
  };

  const next = () => {
    if (active < items.length - 1) setActive((value) => value + 1);
    else onComplete(mistakes);
  };

  return (
    <section className="shift-quiz">
      <div className="shift-step-nav">
        {items.map((step, index) => (
          <button
            key={step.title}
            className={`${active === index ? 'active' : ''} ${checked[index] ? (answers[index] === step.correct ? 'done' : 'mistake') : ''}`}
            onClick={() => setActive(index)}
          >
            <span>{checked[index] ? (answers[index] === step.correct ? <Check size={13} /> : <XCircle size={13} />) : index + 1}</span>
            {step.title}
          </button>
        ))}
      </div>
      <p className="eyebrow">ШАГ {active + 1} / {items.length}</p>
      <h3>{item.question}</h3>
      <div className="shift-options">
        {item.options.map((option, index) => (
          <button
            key={option}
            className={`${selected === index ? 'selected' : ''} ${isChecked ? (index === item.correct ? 'correct' : selected === index ? 'wrong' : '') : ''}`}
            disabled={isChecked}
            onClick={() => setAnswers((current) => current.map((value, answerIndex) => answerIndex === active ? index : value))}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            <strong>{option}</strong>
            {isChecked && index === item.correct && <Check size={17} />}
          </button>
        ))}
      </div>
      {isChecked && <div className={`shift-feedback ${correct ? 'success' : 'error'}`}><strong>{correct ? 'Верно.' : 'Нет.'}</strong><p>{item.explanation}</p></div>}
      <footer>
        {!isChecked
          ? <button className="primary-action" disabled={selected === null} onClick={check}>Проверить</button>
          : <button className="primary-action" onClick={next}>{active === items.length - 1 ? 'Закончить разбор' : 'Дальше'}<ChevronRight size={17} /></button>}
      </footer>
    </section>
  );
}

export function FirstShiftApp() {
  const { progress, setFlag, completeFirstShift } = useProgress();
  const available = progress.jobAccepted;
  const stage = progress.firstShiftStage;

  if (!available) {
    return <div className="firstshift-locked"><ShieldCheck size={48} /><h2>Смена ещё не началась</h2><p>Сначала ответь на письмо Анны.</p></div>;
  }

  if (progress.firstShiftComplete) {
    return (
      <div className="firstshift-complete">
        <CheckCircle2 size={46} />
        <p className="eyebrow">ПОНЕДЕЛЬНИК / 18:07</p>
        <h2>Первая смена закончена</h2>
        <p>Три тикета закрыты. Ошибок при разборе: {progress.firstShiftMistakes}.</p>
        <div><strong>+{Math.max(500, 1200 - progress.firstShiftMistakes * 150)} ₽</strong><span>оплата за смену</span></div>
        <p className="shift-afterword">Кирилл: «На сегодня всё. Пропуск не потеряй».</p>
      </div>
    );
  }

  const addMistakes = (amount: number) => setFlag('firstShiftMistakes', progress.firstShiftMistakes + amount);
  const finishIncident = (kind: 'phishing' | 'powershell' | 'dns', mistakes: number) => {
    addMistakes(mistakes);
    if (kind === 'phishing') {
      setFlag('phishingComplete', true);
      setFlag('firstShiftStage', 2);
    } else if (kind === 'powershell') {
      setFlag('powershellComplete', true);
      setFlag('firstShiftStage', 3);
    } else {
      setFlag('dnsComplete', true);
      setFlag('firstShiftStage', 4);
    }
  };

  return (
    <div className="firstshift-app firstshift-campaign">
      <aside className="shift-sidebar">
        <div className="shift-brand"><ShieldCheck size={21} /><div><strong>СФЕРА / SOC</strong><span>смена 01</span></div></div>
        <nav className="shift-campaign-nav">
          {[
            ['09:00', 'Вход', stage > 0],
            ['09:42', 'Фишинг', progress.phishingComplete],
            ['10:26', 'PowerShell', progress.powershellComplete],
            ['11:04', 'DNS', progress.dnsComplete],
            ['17:48', 'Отчёт', false],
          ].map(([time, label, done], index) => (
            <div key={String(label)} className={`${stage === index ? 'active' : ''} ${done ? 'done' : ''}`}>
              <span>{done ? <Check size={13} /> : time}</span><strong>{label}</strong>
            </div>
          ))}
        </nav>
        <div className="shift-person"><div>КЗ</div><p><strong>Кирилл Зорин</strong><span>аналитик второй линии</span></p></div>
      </aside>

      <main className="shift-main app-scroll">
        {stage === 0 && (
          <section className="shift-arrival">
            <p className="eyebrow">ПОНЕДЕЛЬНИК / 08:57</p>
            <h2>Первый день</h2>
            <div className="office-scene">
              <div className="office-line"><span>КЗ</span><p>Ты Илья? Пропуск держи. Турникет иногда не читает с первого раза.</p></div>
              <div className="office-line"><span>КЗ</span><p>Садись сюда. Логин временный. Пароль поменяешь после смены.</p></div>
              <div className="office-line"><span>АС</span><p>Кирилл покажет очередь. Ничего сам не блокируй, пока не позовёшь старшего.</p></div>
            </div>
            <button className="primary-action" onClick={() => setFlag('firstShiftStage', 1)}>Открыть очередь</button>
          </section>
        )}

        {stage === 1 && (
          <section className="shift-incident">
            <header><div><p className="eyebrow">PHISH-2026-0041</p><h2>Письмо в бухгалтерию</h2></div><span className="severity medium">MEDIUM</span></header>
            <div className="office-line compact"><span>КЗ</span><p>Пользователь ничего не открыл. Проверь адрес, ссылку и вложение.</p></div>
            <section className="phishing-mail-card">
              <div className="mail-warning-head"><MailWarning size={24} /><div><strong>Обновление зарплатного кабинета</strong><span>получено 09:38</span></div></div>
              <dl>
                <div><dt>FROM</dt><dd>HR Portal &lt;documents@sfera-career.com&gt;</dd></div>
                <div><dt>REPLY-TO</dt><dd>support@secure-employee-login.test</dd></div>
                <div><dt>TO</dt><dd>accounting@sfera-integration.local</dd></div>
              </dl>
              <p>Коллеги, подтвердите данные до 10:00. После срока доступ к выплатам будет ограничен.</p>
              <button className="fake-link"><Link2 size={15} /><span>Открыть staff.sfera.local/payroll</span><small>https://staff-sfera-login.test/payroll</small></button>
              <div className="fake-attachment"><FileWarning size={19} /><div><strong>salary_update.docm</strong><span>184 KB · Word Macro-Enabled Document</span></div></div>
            </section>
            <QuizPanel items={phishingChecks} onComplete={(mistakes) => finishIncident('phishing', mistakes)} />
          </section>
        )}

        {stage === 2 && (
          <section className="shift-incident">
            <header><div><p className="eyebrow">EDR-2026-0198</p><h2>Word запустил PowerShell</h2></div><span className="severity high">HIGH</span></header>
            <div className="office-line compact"><span>КЗ</span><p>Это та же бухгалтерия. EDR прислал создание процесса. Читай поля сверху вниз.</p></div>
            <pre className="shift-log-card"><TerminalSquare size={18} />{powershellEvent}</pre>
            <QuizPanel items={powershellChecks} onComplete={(mistakes) => finishIncident('powershell', mistakes)} />
          </section>
        )}

        {stage === 3 && (
          <section className="shift-incident">
            <header><div><p className="eyebrow">DNS-2026-0221</p><h2>Повторяющиеся запросы</h2></div><span className="severity high">HIGH</span></header>
            <div className="office-line compact"><span>КЗ</span><p>Узел уже изолирован. Теперь разберись, почему алерт вообще сработал.</p></div>
            <pre className="shift-log-card"><Network size={18} />{dnsLog}</pre>
            <QuizPanel items={dnsChecks} onComplete={(mistakes) => finishIncident('dns', mistakes)} />
          </section>
        )}

        {stage === 4 && (
          <section className="shift-report-choice">
            <p className="eyebrow">17:48 / КЛИЕНТ «РУБЕЖ-ЛОГИСТИКА»</p>
            <h2>Последняя формулировка</h2>
            <div className="office-scene">
              <div className="office-line"><span>АС</span><p>Клиент просит не писать про утечку. Мы её и не доказали.</p></div>
              <div className="office-line"><span>КЗ</span><p>Укажи трафик и напиши, что назначение не установлено. Этого достаточно.</p></div>
            </div>
            <h3>Что попадёт в отчёт?</h3>
            <div className="report-choice-grid">
              <button className={progress.shiftReportChoice === 'full' ? 'selected' : ''} onClick={() => setFlag('shiftReportChoice', 'full')}>
                <strong>Точный вариант</strong>
                <p>Зафиксирован исходящий трафик 14 МБ на внешний адрес. Назначение передачи не установлено.</p>
              </button>
              <button className={progress.shiftReportChoice === 'soft' ? 'selected' : ''} onClick={() => setFlag('shiftReportChoice', 'soft')}>
                <strong>Короткий вариант</strong>
                <p>Подтверждённого ущерба нет. Узел изолирован, наблюдение продолжается.</p>
              </button>
            </div>
            <button
              className="primary-action"
              disabled={!progress.shiftReportChoice}
              onClick={() => completeFirstShift(progress.firstShiftMistakes)}
            >
              Закрыть смену
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
