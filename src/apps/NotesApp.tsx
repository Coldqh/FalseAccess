import { useEffect } from 'react';
import { CheckCircle2, ClipboardCheck, FileCheck2, RefreshCw, Save } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const emptyTemplate = `Инцидент: CLINIC-01

Наблюдение:

Источник:

Подтверждённые факты:

Что не подтверждено:

Рекомендации:
`;

const autoReport = `Инцидент: CLINIC-01

Наблюдение:
На рабочей станции clinic-ws зафиксирована серия попыток входа по SSH. Отдельно обнаружен процесс PID 911, запущенный из /tmp/.cache/update-agent.

Источник:
185.44.17.92

Подтверждённые факты:
- За 48 секунд журнал зафиксировал 6 неудачных попыток входа.
- Попытки затронули учётные записи admin, root, postgres и oracle.
- После серии отказов успешного внешнего входа с адреса 185.44.17.92 в журнале нет.
- Процесс PID 911 запущен из нетипичного временного каталога.

Что не подтверждено:
Компрометация учётной записи и получение доступа внешним источником не подтверждены.

Рекомендации:
Сохранить исходные журналы, проверить файл и происхождение процесса PID 911, ограничить внешний SSH, проверить затронутые учётные записи и продолжить наблюдение за узлом.
`;

export function NotesApp() {
  const { progress, setFlag } = useProgress();
  useEffect(() => {
    if (progress.alertReviewed && !progress.notes) setFlag('notes', autoReport);
  }, [progress.alertReviewed, progress.notes, setFlag]);

  const value = progress.notes || (progress.alertReviewed ? autoReport : emptyTemplate);
  const sufficient = value.length > 180 && /185\.44\.17\.92/.test(value) && /6/.test(value) && /неудач/i.test(value);

  const fillReport = () => setFlag('notes', autoReport);
  const submit = () => {
    if (sufficient) setFlag('reportSubmitted', true);
  };

  return (
    <div className="notes-app">
      <aside className="report-guide app-scroll">
        <p className="eyebrow">ТЕХНИЧЕСКИЙ ОТЧЁТ</p>
        <h2>Черновик по материалам дела</h2>
        <button className="report-autofill" onClick={fillReport}><ClipboardCheck size={17} /><span><strong>Заполнить по найденным фактам</strong><small>IP, количество событий, процесс и рекомендации</small></span></button>
        <div className="report-rule"><strong>Факт</strong><p>Шесть неудачных попыток SSH с адреса 185.44.17.92.</p></div>
        <div className="report-rule"><strong>Не факт</strong><p>«Сервер взломали». Успешного внешнего входа в данных нет.</p></div>
        <div className="report-rule"><strong>Рекомендация</strong><p>Сохранить журналы и проверить PID 911 до удаления файла.</p></div>
        <div className="report-checks">
          <span className={/185\.44\.17\.92/.test(value) ? 'ok' : ''}>IP-адрес</span>
          <span className={/6/.test(value) ? 'ok' : ''}>Количество</span>
          <span className={/неудач/i.test(value) ? 'ok' : ''}>Тип события</span>
          <span className={value.length > 180 ? 'ok' : ''}>Достаточно текста</span>
        </div>
      </aside>
      <section className="report-editor">
        <header><div><FileCheck2 size={18} /><strong>clinic-01-report.md</strong></div><div className="report-header-actions"><button title="Заполнить заново" onClick={fillReport}><RefreshCw size={14} /></button><span>{value.length} знаков</span></div></header>
        <textarea value={value} onChange={(event) => setFlag('notes', event.target.value)} spellCheck={false} />
        <footer>
          <span>Черновик сохранён локально</span>
          <button className="primary-action compact" disabled={!sufficient || progress.reportSubmitted} onClick={submit}>
            {progress.reportSubmitted ? <><CheckCircle2 size={17} /> Отчёт принят</> : <><Save size={17} /> Отправить отчёт</>}
          </button>
        </footer>
      </section>
    </div>
  );
}
