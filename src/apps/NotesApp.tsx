import { useMemo, useState } from 'react';
import { CheckCircle2, FileCheck2, Save, XCircle } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import { getClinicStage, clinicTransitions } from '../missions/clinic01';
import { MissionGuideStrip } from '../components/MissionGuideStrip';
import { MissionStageComplete } from '../components/MissionStageComplete';
import type { AppId } from '../types';

const reportSections = [
  {
    id: 'observation', label: 'Наблюдение',
    options: [
      { id: 'auth-failures', text: 'Зафиксирована серия неудачных попыток входа по SSH.', correct: true },
      { id: 'server-owned', text: 'Сервер полностью захвачен внешним атакующим.', correct: false },
      { id: 'employee-theft', text: 'Сотрудник клиники украл базу пациентов.', correct: false },
    ],
  },
  {
    id: 'source', label: 'Источник',
    options: [
      { id: 'external-ip', text: '185.44.17.92', correct: true },
      { id: 'backup-ip', text: '10.14.2.5', correct: false },
      { id: 'unknown', text: 'Источник определить невозможно.', correct: false },
    ],
  },
  {
    id: 'confirmed', label: 'Подтверждённые факты',
    options: [
      { id: 'six-fails', text: 'Шесть неудачных входов и процесс PID 911 из /tmp/.cache.', correct: true },
      { id: 'root-success', text: 'Успешный вход под root подтверждён.', correct: false },
      { id: 'database-delete', text: 'Медицинская база была удалена.', correct: false },
    ],
  },
  {
    id: 'unconfirmed', label: 'Что не подтверждено',
    options: [
      { id: 'no-compromise', text: 'Компрометация учётной записи и получение внешнего доступа.', correct: true },
      { id: 'no-attempts', text: 'Наличие попыток входа.', correct: false },
      { id: 'no-process', text: 'Наличие подозрительного процесса.', correct: false },
    ],
  },
  {
    id: 'recommendation', label: 'Рекомендации',
    options: [
      { id: 'preserve-check-limit', text: 'Сохранить журналы, проверить PID 911 и ограничить внешний SSH.', correct: true },
      { id: 'delete-all', text: 'Удалить журналы и все файлы из /tmp.', correct: false },
      { id: 'shutdown-clinic', text: 'Выключить всю сеть клиники без дополнительной проверки.', correct: false },
    ],
  },
] as const;

function buildReport(selections: Record<string, string>) {
  const rows = reportSections.map((section) => {
    const selected = section.options.find((option) => option.id === selections[section.id]);
    return `${section.label}:\n${selected?.text ?? '—'}`;
  });
  return `Инцидент: CLINIC-01\n\n${rows.join('\n\n')}`;
}

export function NotesApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress, setFlag } = useProgress();
  const stage = getClinicStage(progress);
  const missionActive = stage.id === 'report';
  const [checked, setChecked] = useState(false);
  const selections = progress.reportSelections;
  const preview = useMemo(() => buildReport(selections), [selections]);
  const allSelected = reportSections.every((section) => Boolean(selections[section.id]));
  const allCorrect = reportSections.every((section) => section.options.find((option) => option.id === selections[section.id])?.correct);

  const choose = (sectionId: string, optionId: string) => {
    setFlag('reportSelections', { ...selections, [sectionId]: optionId });
    setChecked(false);
  };

  const submit = () => {
    setChecked(true);
    if (!allSelected || !allCorrect) return;
    setFlag('notes', preview);
    setFlag('reportSubmitted', true);
  };

  if (!missionActive && !progress.reportSubmitted) {
    return (
      <div className="notes-base-app">
        <header><FileCheck2 size={18} /><strong>untitled.md</strong><span>Локально</span></header>
        <textarea value={progress.notes} onChange={(event) => setFlag('notes', event.target.value)} spellCheck={false} placeholder="Новая заметка" />
        <footer>Notes</footer>
      </div>
    );
  }

  if (!missionActive && progress.reportSubmitted) {
    return (
      <div className="notes-base-app">
        <header><FileCheck2 size={18} /><strong>clinic-01-report.md</strong><span>Сохранено</span></header>
        <textarea value={progress.notes} onChange={(event) => setFlag('notes', event.target.value)} spellCheck={false} />
        <footer>Локальный файл</footer>
        <MissionStageComplete transition={clinicTransitions.report} openApp={openApp} />
      </div>
    );
  }

  return (
    <div className="report-builder-app app-scroll">
      {missionActive && <MissionGuideStrip title="Собери отчёт" text="Выбирай только то, что подтверждают журналы и таблица SIEM." detail="В каждой строке один правильный вариант. После проверки отчёт соберётся в файл." />}
      <section className="report-builder-grid">
        <div className="report-choice-list">
          {reportSections.map((section) => (
            <article key={section.id}>
              <h3>{section.label}</h3>
              <div>{section.options.map((option) => {
                const selected = selections[section.id] === option.id;
                const bad = checked && selected && !option.correct;
                const good = checked && selected && option.correct;
                return <button key={option.id} className={`${selected ? 'selected' : ''} ${bad ? 'wrong' : ''} ${good ? 'correct' : ''}`} onClick={() => choose(section.id, option.id)}><span>{selected ? '●' : '○'}</span><p>{option.text}</p>{bad && <XCircle size={16} />}{good && <CheckCircle2 size={16} />}</button>;
              })}</div>
            </article>
          ))}
        </div>
        <aside className="report-preview">
          <p className="eyebrow">ПРЕДПРОСМОТР</p>
          <pre>{preview}</pre>
          <button className="primary-action" disabled={!allSelected} onClick={submit}><Save size={17} />Проверить и отправить</button>
          {checked && !allCorrect && <div className="report-builder-error">В отчёте есть вывод, который не подтверждён данными.</div>}
        </aside>
      </section>
    </div>
  );
}
