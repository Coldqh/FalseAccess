import { useState } from 'react';
import {
  ArrowRight, CheckCircle2, ClipboardList, DatabaseBackup, FileClock, FileSearch2,
  HardDrive, LockKeyhole, MemoryStick, SearchCode, ShieldCheck, TerminalSquare, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  artifactObjectives, containmentSections, diskObjectives, diskQuestions, findingSections,
  forensicsArchitecture, forensicsCaseOverview, forensicsFoundationQuestions, independentCommands,
  independentQuestions, memoryObjectives, memoryQuestions, reportSections,
} from '../missions/forensics01';

interface HistoryEntry { command: string; output: string; ok: boolean }
type SelectKey =
  | 'forensicsCaseFoundationAnswers'
  | 'forensicsCaseDiskAnswers'
  | 'forensicsCaseMemoryAnswers'
  | 'forensicsCaseContainmentSelections'
  | 'forensicsCaseIndependentAnswers'
  | 'forensicsCaseFindingSelections'
  | 'forensicsCaseReportSelections';

const stages = ['Вводная', 'Основа', 'Диск', 'Артефакты', 'Память', 'Локализация', 'Второй образ / Отчёт', 'Готово'];
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/["']/g, '');
const allCorrect = (
  sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[],
  selected: Record<string, string>,
) => sections.every((section) => section.options.find((option) => option.id === selected[section.id])?.correct);

function commandMatches(expected: string, raw: string) {
  const a = normalize(expected);
  const b = normalize(raw);
  if (a === b) return true;
  if (a.startsWith('sha256sum')) return b.includes('sha256sum') && b.includes(a.includes('vault-03') ? 'vault-03' : 'locker-17');
  if (a.startsWith('mmls')) return b.includes('mmls') && b.includes('locker-17.e01');
  if (a.startsWith('fls')) return b.includes('fls') && b.includes('locker-17.e01') && b.includes('bodyfile');
  if (a.startsWith('mactime')) return b.includes('mactime') && b.includes('bodyfile') && b.includes('timeline');
  if (a.startsWith('grep')) return a.split(' ').some((part) => part.length > 8 && b.includes(part));
  if (a.startsWith('sqlite3')) return b.includes('sqlite3') && b.includes('history.db') && b.includes('downloads');
  if (a.startsWith('cat')) return a.split(' ').slice(-1).some((part) => b.includes(part));
  if (a.startsWith('icat')) return b.includes('icat') && b.includes('128774') && b.includes('sync.log');
  if (a.startsWith('vol')) {
    const plugin = a.split(' ').find((part) => part.includes('windows.'));
    const image = a.includes('vault-03') ? 'vault-03.raw' : 'locker-17.raw';
    return b.includes('vol') && b.includes(image) && Boolean(plugin && b.includes(plugin));
  }
  return false;
}

export function ForensicsCaseApp() {
  const { progress, setFlag, completeForensicsCase } = useProgress();
  const stage = Math.max(0, Math.min(7, progress.forensicsCaseStage));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showHints, setShowHints] = useState(false);

  const stageObjectives = stage === 2 ? diskObjectives : stage === 3 ? artifactObjectives : memoryObjectives;
  const completed = stage === 2
    ? progress.forensicsCaseDiskObjectives
    : stage === 3
      ? progress.forensicsCaseArtifactObjectives
      : progress.forensicsCaseMemoryObjectives;
  const nextObjective = stageObjectives.find((item) => !completed.includes(item.id));
  const stageDone = stageObjectives.every((item) => completed.includes(item.id));
  const independentDone = independentCommands.every((item) => progress.forensicsCaseIndependentObjectives.includes(item.id));

  const setStage = (value: number) => setFlag('forensicsCaseStage', Math.max(progress.forensicsCaseStage, Math.min(7, value)));
  const choose = (key: SelectKey, sectionId: string, optionId: string) => {
    setFlag(key, { ...progress[key], [sectionId]: optionId });
    setChecked((current) => ({ ...current, [key]: false }));
  };

  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    selections: Record<string, string>,
    key: SelectKey,
  ) => (
    <div className="windows-question-stack forensics-question-stack">
      {sections.map((section) => (
        <article className="windows-question-card" key={section.id}>
          <h3>{section.label}</h3>
          <div>{section.options.map((option) => {
            const selected = selections[section.id] === option.id;
            const status = checked[key] && selected ? (option.correct ? 'correct' : 'wrong') : '';
            return <button key={option.id} className={`${selected ? 'selected' : ''} ${status}`} onClick={() => choose(key, section.id, option.id)}>
              <span>{selected ? '●' : '○'}</span><p>{option.text}</p>{checked[key] && selected && (option.correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />)}
            </button>;
          })}</div>
        </article>
      ))}
    </div>
  );

  const verify = (key: SelectKey, sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[], next: number) => {
    setChecked((current) => ({ ...current, [key]: true }));
    if (allCorrect(sections, progress[key])) setStage(next);
  };

  const runCommand = () => {
    if (!command.trim() || !nextObjective) return;
    const ok = commandMatches(nextObjective.command, command);
    setHistory((current) => [...current, { command, output: ok ? nextObjective.output : `Сейчас нужно: ${nextObjective.title}.`, ok }]);
    setCommand('');
    if (!ok) return;
    const key = stage === 2 ? 'forensicsCaseDiskObjectives' : stage === 3 ? 'forensicsCaseArtifactObjectives' : 'forensicsCaseMemoryObjectives';
    setFlag(key, [...completed, nextObjective.id]);
  };

  const insert = (value: string, target: 'main' | 'independent') => {
    if (target === 'main') setCommand(value);
    else setIndependentCommand(value);
    setFlag('forensicsCaseHintUses', progress.forensicsCaseHintUses + 1);
  };

  const runIndependent = () => {
    if (!independentCommand.trim()) return;
    const found = independentCommands.find((item) => commandMatches(item.command, independentCommand));
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: found ? found.output : 'Команда выполнилась, но нужный артефакт не найден.',
      ok: Boolean(found),
    }]);
    setIndependentCommand('');
    if (found && !progress.forensicsCaseIndependentObjectives.includes(found.id)) {
      setFlag('forensicsCaseIndependentObjectives', [...progress.forensicsCaseIndependentObjectives, found.id]);
    }
  };

  const checkFinal = () => {
    setChecked((current) => ({ ...current, forensicsCaseIndependentAnswers: true, forensicsCaseFindingSelections: true, forensicsCaseReportSelections: true }));
    if (
      independentDone
      && allCorrect(independentQuestions, progress.forensicsCaseIndependentAnswers)
      && allCorrect(findingSections, progress.forensicsCaseFindingSelections)
      && allCorrect(reportSections, progress.forensicsCaseReportSelections)
    ) setStage(7);
  };

  return <div className="route-case-app windows-case-app mobile-case-app forensics-case-app">
    <aside className="route-case-sidebar windows-case-sidebar forensics-case-sidebar">
      <header><p className="eyebrow">DEADFRAME-08</p><h2>Disk & Memory</h2><span>DFIR LAB</span></header>
      <nav>{stages.map((name, index) => <button key={name} disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
      <footer><LockKeyhole size={15} /><div><strong>READ ONLY</strong><span>hashed evidence</span></div></footer>
    </aside>

    <main className="route-case-main windows-case-main forensics-case-main app-scroll">
      {stage === 0 && <section className="route-brief-stage windows-brief-stage forensics-brief-stage">
        <header><HardDrive size={29} /><div><p className="eyebrow">CASE / DEADFRAME-08</p><h1>Файл удалили. Процесс остался в памяти.</h1></div></header>
        <div className="route-brief-grid windows-brief-grid">{forensicsCaseOverview.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        <div className="windows-theory warning"><strong>Dead Letter / node-14</strong><p>После сделки один ноутбук нашли включённым. Есть образ SSD и RAM. Нужны точная цепочка, переданные данные и второй образ без подсказанного порядка.</p></div>
        <div className="forensics-architecture-grid">{forensicsArchitecture.map((item) => <article key={item.id}><span>{item.role}</span>{item.id === 'memory' ? <MemoryStick size={21} /> : <HardDrive size={21} />}<strong>{item.title}</strong><p>{item.subtitle}</p><code>{item.address}</code></article>)}</div>
        <button className="primary-action full" onClick={() => setStage(1)}>Начать форензик-разбор<ArrowRight size={17} /></button>
      </section>}

      {stage === 1 && <section className="route-choice-stage forensics-foundation-stage">
        <header><DatabaseBackup size={23} /><div><p className="eyebrow">FORENSIC FOUNDATIONS</p><h2>Образ, хэш, volatile data и временная линия</h2></div></header>
        <div className="network-theory-strip forensics-theory-strip">
          <article><strong>IMAGE</strong><p>Анализ идёт по рабочей копии. Оригинал не меняется.</p></article>
          <article><strong>HASH</strong><p>Хэш фиксирует целостность источника и копии.</p></article>
          <article><strong>VOLATILE</strong><p>RAM хранит процессы, команды, соединения и временные секреты.</p></article>
          <article><strong>TIMELINE</strong><p>Вывод строится по нескольким независимым источникам.</p></article>
        </div>
        {renderOptions(forensicsFoundationQuestions, progress.forensicsCaseFoundationAnswers, 'forensicsCaseFoundationAnswers')}
        <button className="primary-action full" onClick={() => verify('forensicsCaseFoundationAnswers', forensicsFoundationQuestions, 2)}>Перейти к диску<ArrowRight size={17} /></button>
      </section>}

      {(stage === 2 || stage === 3 || stage === 4) && <section className="windows-terminal-stage forensics-terminal-stage">
        <header>{stage === 2 ? <HardDrive size={23} /> : stage === 3 ? <FileClock size={23} /> : <MemoryStick size={23} />}<div><p className="eyebrow">{stage === 2 ? 'DISK IMAGE' : stage === 3 ? 'ARTIFACTS / TIMELINE' : 'VOLATILITY 3'}</p><h2>{stage === 2 ? 'Собери файловую временную линию' : stage === 3 ? 'Подтверди загрузку, запуск и закрепление' : 'Свяжи процесс, команду, файлы и сеть'}</h2></div></header>
        <div className="windows-theory"><strong>{nextObjective?.title ?? 'Сбор завершён'}</strong><p>{stage === 2 ? 'Команды читают forensic image и пишут результаты только в analysis/.' : stage === 3 ? 'Один артефакт не достаточен. Связывай browser, Prefetch, registry и удалённый лог.' : 'Снимок RAM разбирается плагинами Volatility 3. Не делай вывод по одному имени процесса.'}</p>{nextObjective && <code>{nextObjective.command}</code>}</div>
        <div className="windows-terminal-box"><div className="windows-terminal-history">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
          {nextObjective && <div className="windows-terminal-input"><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runCommand()} placeholder={stage === 4 ? 'vol -f ...' : 'forensic command'} /><button onClick={() => insert(nextObjective.command, 'main')}>Вставить</button><button className="primary-action" onClick={runCommand}>Выполнить</button></div>}
        </div>
        {stageDone && stage === 2 && <>{renderOptions(diskQuestions, progress.forensicsCaseDiskAnswers, 'forensicsCaseDiskAnswers')}<button className="primary-action full" onClick={() => verify('forensicsCaseDiskAnswers', diskQuestions, 3)}>Перейти к артефактам<ArrowRight size={17} /></button></>}
        {stageDone && stage === 3 && <button className="primary-action full" onClick={() => setStage(4)}>Открыть снимок памяти<ArrowRight size={17} /></button>}
        {stageDone && stage === 4 && <>{renderOptions(memoryQuestions, progress.forensicsCaseMemoryAnswers, 'forensicsCaseMemoryAnswers')}<button className="primary-action full" onClick={() => verify('forensicsCaseMemoryAnswers', memoryQuestions, 5)}>Перейти к локализации<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 5 && <section className="route-choice-stage forensics-containment-stage">
        <header><ShieldCheck size={23} /><div><p className="eyebrow">CHAIN OF CUSTODY / RESPONSE</p><h2>Не уничтожь доказательства при локализации</h2></div></header>
        {renderOptions(containmentSections, progress.forensicsCaseContainmentSelections, 'forensicsCaseContainmentSelections')}
        <button className="primary-action full" onClick={() => verify('forensicsCaseContainmentSelections', containmentSections, 6)}>Перейти ко второму образу<ArrowRight size={17} /></button>
      </section>}

      {stage === 6 && <section className="forensics-independent-stage">
        <header><SearchCode size={23} /><div><p className="eyebrow">INDEPENDENT CASE / VAULT-03</p><h2>Второй образ без готовой последовательности</h2></div></header>
        <div className="windows-theory"><strong>Твоя задача</strong><p>Зафиксируй хэши, восстанови загрузку и дерево процессов, найди внешний канал. Доступные команды можно открыть, но это засчитывается как подсказка.</p></div>
        <button className="secondary-action" onClick={() => setShowHints((value) => !value)}>{showHints ? 'Скрыть доступные команды' : 'Показать доступные команды'}</button>
        {showHints && <div className="forensics-command-pool">{independentCommands.map((item) => <button key={item.id} onClick={() => insert(item.command, 'independent')}><TerminalSquare size={14} /><code>{item.command}</code></button>)}</div>}
        <div className="windows-terminal-box"><div className="windows-terminal-history">{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
          <div className="windows-terminal-input"><span>$</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runIndependent()} placeholder="команда анализа" /><button className="primary-action" onClick={runIndependent}>Выполнить</button></div>
        </div>
        <div className="forensics-final-grid">
          <section><h3>Второй образ</h3>{renderOptions(independentQuestions, progress.forensicsCaseIndependentAnswers, 'forensicsCaseIndependentAnswers')}</section>
          <section><h3>Подтверждённые выводы</h3>{renderOptions(findingSections, progress.forensicsCaseFindingSelections, 'forensicsCaseFindingSelections')}</section>
          <section><h3>Отчёт</h3>{renderOptions(reportSections, progress.forensicsCaseReportSelections, 'forensicsCaseReportSelections')}</section>
        </div>
        <button className="primary-action full" onClick={checkFinal}>Проверить расследование<ClipboardList size={17} /></button>
      </section>}

      {stage === 7 && <section className="windows-complete-stage forensics-complete-stage">
        <FileSearch2 size={45} /><p className="eyebrow">CASE CLOSED</p><h2>DEADFRAME-08 закрыт</h2>
        <p>Два дисковых образа и два снимка памяти разобраны. Цепочка запуска, закрепления, доступа к файлам и внешнего соединения подтверждена.</p>
        <div><span>Экзамен</span><strong>DISK + MEMORY FORENSICS</strong><small>Подсказок: {progress.forensicsCaseHintUses}</small></div>
        <button className="primary-action full" onClick={completeForensicsCase}>Закрыть дело<CheckCircle2 size={17} /></button>
      </section>}
    </main>
  </div>;
}
