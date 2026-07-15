import { CheckCircle2, FileCheck2, Save } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const template = `Инцидент: CLINIC-01

Наблюдение:

Источник:

Подтверждённые факты:

Что не подтверждено:

Рекомендации:
`;

export function NotesApp() {
  const { progress, setFlag } = useProgress();
  const value = progress.notes || template;
  const sufficient = value.length > 180 && /185\.44\.17\.92/.test(value) && /6/.test(value) && /неудач/i.test(value);

  const submit = () => {
    if (sufficient) setFlag('reportSubmitted', true);
  };

  return (
    <div className="notes-app">
      <aside className="report-guide app-scroll">
        <p className="eyebrow">ТЕХНИЧЕСКИЙ ОТЧЁТ</p>
        <h2>Пиши только то, что доказано</h2>
        <div className="report-rule"><strong>Факт</strong><p>Шесть неудачных попыток SSH с адреса 185.44.17.92.</p></div>
        <div className="report-rule"><strong>Не факт</strong><p>«Сервер взломали». Успешного внешнего входа в данных нет.</p></div>
        <div className="report-rule"><strong>Рекомендация</strong><p>Ограничить внешний SSH, проверить назначение подозрительного процесса, сохранить журналы.</p></div>
        <div className="report-checks">
          <span className={/185\.44\.17\.92/.test(value) ? 'ok' : ''}>IP-адрес</span>
          <span className={/6/.test(value) ? 'ok' : ''}>Количество</span>
          <span className={/неудач/i.test(value) ? 'ok' : ''}>Тип события</span>
          <span className={value.length > 180 ? 'ok' : ''}>Достаточно текста</span>
        </div>
      </aside>
      <section className="report-editor">
        <header><div><FileCheck2 size={18} /><strong>clinic-01-report.md</strong></div><span>{value.length} знаков</span></header>
        <textarea value={value} onChange={(event) => setFlag('notes', event.target.value)} spellCheck={false} />
        <footer>
          <span>Markdown / local draft</span>
          <button className="primary-action compact" disabled={!sufficient || progress.reportSubmitted} onClick={submit}>
            {progress.reportSubmitted ? <><CheckCircle2 size={17} /> Отчёт принят</> : <><Save size={17} /> Отправить отчёт</>}
          </button>
        </footer>
      </section>
    </div>
  );
}
