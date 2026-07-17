import { useMemo, useState } from 'react';
import {
  BookOpenCheck, Check, CheckCircle2, ChevronRight, ClipboardCheck, Code2, RotateCcw,
  ShieldCheck, TerminalSquare, XCircle,
} from 'lucide-react';
import { foundationModules, type FoundationModuleId } from '../data/foundationPractice';
import { getLearningReference, learningEvidenceLabels, learningPrinciples } from '../data/learningStandards';
import { useProgress } from '../system/ProgressContext';
import { campaignAuditChecks } from '../system/campaignAudit';
import { answerStatusText, assessFoundationAnswer, validateFoundationCommand } from '../system/learningAssessment';

export function PracticeApp() {
  const { progress, setFlag, completeFoundationModule } = useProgress();
  const [activeId, setActiveId] = useState<FoundationModuleId>('foundation-0');
  const [mode, setMode] = useState<'guided' | 'assessment'>('guided');
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [checked, setChecked] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const module = foundationModules.find((item) => item.id === activeId)!;
  const complete = progress.foundationModulesComplete.includes(module.id);
  const taskIds = progress.foundationTaskIds;
  const nextTask = module.tasks.find((task) => !taskIds.includes(`${module.id}:${task.id}`));
  const moduleTasksDone = module.tasks.every((task) => taskIds.includes(`${module.id}:${task.id}`));
  const moduleAnswers = progress.foundationAnswers;
  const draft = progress.foundationExamDrafts[module.id] ?? '';
  const questionsCorrect = module.questions.every((question) => question.options.find((option) => option.id === moduleAnswers[`${module.id}:${question.id}`])?.correct);
  const writtenAssessment = assessFoundationAnswer(module, draft);
  const ready = questionsCorrect && moduleTasksDone && writtenAssessment.passed;
  const completedCount = progress.foundationModulesComplete.length;
  const audit = useMemo(() => campaignAuditChecks(progress), [progress]);
  const auditPassed = audit.filter((item) => item.status === 'pass').length;
  const sources = module.sourceIds.map(getLearningReference).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const selectModule = (id: FoundationModuleId) => {
    setActiveId(id);
    setCommand('');
    setOutput('');
    setChecked(false);
    setShowAudit(false);
  };

  const choose = (questionId: string, optionId: string) => {
    setFlag('foundationAnswers', { ...progress.foundationAnswers, [`${module.id}:${questionId}`]: optionId });
    setChecked(false);
  };

  const run = () => {
    if (!nextTask || !command.trim()) return;
    const result = validateFoundationCommand(nextTask, command);
    setOutput(result.passed ? `${nextTask.output}\n\nEVIDENCE: ${result.reason}` : `ОШИБКА ПРОВЕРКИ\n${result.reason}`);
    if (!result.passed) return;
    const key = `${module.id}:${nextTask.id}`;
    if (!taskIds.includes(key)) setFlag('foundationTaskIds', [...taskIds, key]);
    setCommand('');
  };

  return <div className="practice-app">
    <aside className="practice-sidebar app-scroll">
      <header><ShieldCheck size={24}/><div><strong>FOUNDATION//REBUILD</strong><span>этапы 0–3</span></div></header>
      <div className="practice-total"><span>ЭТАПЫ ОСВОЕНЫ</span><strong>{completedCount}/4</strong><i><b style={{width:`${completedCount * 25}%`}}/></i></div>
      <nav>{foundationModules.map((item) => {
        const done = progress.foundationModulesComplete.includes(item.id);
        return <button key={item.id} className={item.id === module.id && !showAudit ? 'active' : ''} onClick={() => selectModule(item.id)}>
          <span>{done ? <Check size={14}/> : item.stage}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
        </button>;
      })}</nav>
      <button className={`practice-audit-link ${showAudit ? 'active' : ''}`} onClick={() => setShowAudit(true)}><ClipboardCheck size={16}/><span>Аудит обучения</span><b>{auditPassed}/{audit.length}</b></button>
    </aside>

    <main className="practice-main app-scroll">
      {showAudit ? <section className="practice-audit">
        <header><div><p className="eyebrow">LEARNING SYSTEM AUDIT</p><h2>Честность и проверяемость обучения</h2></div><ClipboardCheck size={26}/></header>
        <p className="practice-lead">Аудит проверяет структуру рубрик, источники, отсутствие игрового «рабочего опыта» в foundation, командные валидаторы и честные границы модулей. Он не подменяет внешний review специалистов.</p>
        <div className="practice-audit-grid">{audit.map((item) => <article key={item.id} className={item.status}>
          <span>{item.status === 'pass' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div>
        </article>)}</div>
        <section className="practice-scope"><header><BookOpenCheck size={19}/><strong>Правила новой системы</strong><b>{learningPrinciples.length}</b></header><div>{learningPrinciples.map((principle) => <span key={principle}>{principle}</span>)}</div></section>
      </section> : <>
        <header className="practice-hero">
          <div><p className="eyebrow">ЭТАП {module.stage} / {learningEvidenceLabels[module.evidenceLevel].toUpperCase()}</p><h2>{module.title}</h2><p>{module.subtitle}</p></div>
          <div className="practice-mode"><button className={mode === 'guided' ? 'active' : ''} onClick={() => setMode('guided')}>Разбор</button><button className={mode === 'assessment' ? 'active' : ''} onClick={() => setMode('assessment')}>Проверка</button></div>
        </header>

        <section className="practice-scope"><header><BookOpenCheck size={19}/><strong>Темы этапа</strong><b>INTRO</b></header><div>{module.scope.map((topic) => <span key={topic}>{topic}</span>)}</div></section>

        <section className="practice-scope"><header><CheckCircle2 size={19}/><strong>Что реально подтверждается</strong><b>{module.evidence.length}</b></header><div>{module.evidence.map((item) => <span key={item}>{item}</span>)}</div></section>

        <section className="practice-scope"><header><XCircle size={19}/><strong>Что этап не подтверждает</strong><b>{module.limitations.length}</b></header><div>{module.limitations.map((item) => <span key={item}>{item}</span>)}</div></section>

        <section className="practice-questions">
          <header><p className="eyebrow">CONCEPT CHECK</p><h3>Проверь модель системы</h3></header>
          {module.questions.map((question) => <article key={question.id}>
            <h4>{question.prompt}</h4><div>{question.options.map((option) => {
              const selected = moduleAnswers[`${module.id}:${question.id}`] === option.id;
              const status = checked && selected ? (option.correct ? 'correct' : 'wrong') : '';
              return <button key={option.id} className={`${selected ? 'selected' : ''} ${status}`} onClick={() => choose(question.id, option.id)}><span>{selected ? '●' : '○'}</span><strong>{option.text}</strong>{checked && selected && (option.correct ? <CheckCircle2 size={16}/> : <XCircle size={16}/>)}</button>;
            })}</div>{checked && <p>{question.explanation}</p>}
          </article>)}
          <button className="secondary-action" onClick={() => setChecked(true)}>Проверить модель</button>
        </section>

        <section className="practice-terminal">
          <header><TerminalSquare size={20}/><div><p className="eyebrow">STRUCTURED PRACTICE</p><h3>{nextTask?.title ?? 'Все задачи закрыты'}</h3></div></header>
          {nextTask && <div className="practice-theory"><strong>До команды</strong><p>{nextTask.theory}</p>{mode === 'guided' && <code>{nextTask.command}</code>}</div>}
          <div className="practice-task-list">{module.tasks.map((task, index) => {
            const done = taskIds.includes(`${module.id}:${task.id}`);
            return <article key={task.id} className={done ? 'done' : ''}><span>{done ? <Check size={14}/> : String(index + 1).padStart(2, '0')}</span><strong>{task.title}</strong></article>;
          })}</div>
          <div className="practice-console"><pre>{output || 'foundation-lab ready\nПроверяется структура команды, а не наличие отдельных слов.'}</pre>{nextTask && <div><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && run()} placeholder={mode === 'guided' ? nextTask.command : 'введи команду самостоятельно'}/>{mode === 'guided' && <button onClick={() => setCommand(nextTask.command)}>Вставить</button>}<button className="primary-action" onClick={run}>Проверить</button></div>}</div>
        </section>

        <section className="practice-final">
          <header><Code2 size={20}/><div><p className="eyebrow">TRANSFER TASK</p><h3>{module.finalPrompt}</h3></div></header>
          {mode === 'guided' && <div className="practice-example"><strong>Ориентир, не готовый ответ</strong><pre>{module.finalExample}</pre></div>}
          <textarea value={draft} onChange={(event) => setFlag('foundationExamDrafts', {...progress.foundationExamDrafts, [module.id]: event.target.value})} placeholder="Ответ должен закрыть рубрику и не содержать опасных утверждений."/>
          <div className="practice-final-status"><span>Модель {questionsCorrect ? '✓' : '—'}</span><span>Команды {moduleTasksDone ? '✓' : '—'}</span><span>Рубрика {writtenAssessment.passed ? '✓' : '—'}</span></div>
          <p>{answerStatusText(writtenAssessment, module.finalRubric.minWords)}</p>
          <button className="primary-action full" disabled={!ready || complete} onClick={() => completeFoundationModule(module.id)}>{complete ? 'Этап уже освоен' : 'Зафиксировать освоение'}<ChevronRight size={17}/></button>
          {!ready && <button className="practice-reset" onClick={() => { setCommand(''); setOutput(''); setChecked(false); }}><RotateCcw size={15}/>Сбросить локальный вывод</button>}
        </section>

        <section className="curriculum-sources">
          <header><div><p className="eyebrow">SOURCE BASELINE</p><h3>На чём построен этап</h3></div><BookOpenCheck size={20}/></header>
          <div>{sources.map((source) => <article key={source.id}><strong>{source.authority}</strong><span>{source.title}</span><b>{source.version}</b><p>{source.assessmentModel}</p></article>)}</div>
        </section>
      </>}
    </main>
  </div>;
}
