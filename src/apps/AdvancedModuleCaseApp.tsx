import { useMemo, useState } from 'react';
import {
  ArrowRight, CheckCircle2, ClipboardCheck, FileCode2, Network, Play, ShieldCheck,
  TerminalSquare, XCircle,
} from 'lucide-react';
import type { ProgressState } from '../types';
import { useProgress } from '../system/ProgressContext';
import type { AdvancedModuleConfig, CaseQuestion } from '../missions/advancedModules';

type HistoryEntry = { command: string; output: string; ok: boolean };

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function allCorrect(questions: CaseQuestion[], selections: Record<string, string>) {
  return questions.every((question) => question.options.find((option) => option.id === selections[question.id])?.correct);
}

export function AdvancedModuleCaseApp({ config, onComplete }: { config: AdvancedModuleConfig; onComplete: () => void }) {
  const { progress, setFlag } = useProgress();
  const raw = progress as unknown as Record<string, unknown>;
  const key = (suffix: string) => `${config.prefix}${suffix}`;
  const stage = Math.max(0, Math.min(6, Number(raw[key('Stage')] ?? 0)));
  const foundation = (raw[key('FoundationAnswers')] ?? {}) as Record<string, string>;
  const objectives = (raw[key('Objectives')] ?? []) as string[];
  const patch = String(raw[key('Patch')] ?? '');
  const independentObjectives = (raw[key('IndependentObjectives')] ?? []) as string[];
  const independentAnswers = (raw[key('IndependentAnswers')] ?? {}) as Record<string, string>;
  const reportSelections = (raw[key('ReportSelections')] ?? {}) as Record<string, string>;
  const hintUses = Number(raw[key('HintUses')] ?? 0);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showHints, setShowHints] = useState(false);

  const setDynamic = (suffix: string, value: unknown) => {
    (setFlag as (name: keyof ProgressState, value: ProgressState[keyof ProgressState]) => void)(
      key(suffix) as keyof ProgressState,
      value as ProgressState[keyof ProgressState],
    );
  };
  const setStage = (value: number) => setDynamic('Stage', Math.max(stage, Math.min(6, value)));
  const nextGuided = config.guidedAnyOrder ? undefined : config.commands.find((item) => !objectives.includes(item.id));
  const guidedDone = config.commands.every((item) => objectives.includes(item.id));
  const independentDone = config.independentCommands.every((item) => independentObjectives.includes(item.id));

  const select = (suffix: 'FoundationAnswers' | 'IndependentAnswers' | 'ReportSelections', id: string, value: string) => {
    const source = suffix === 'FoundationAnswers' ? foundation : suffix === 'IndependentAnswers' ? independentAnswers : reportSelections;
    setDynamic(suffix, { ...source, [id]: value });
    setChecked((current) => ({ ...current, [suffix]: false }));
  };

  const renderQuestions = (questions: CaseQuestion[], selections: Record<string, string>, suffix: 'FoundationAnswers' | 'IndependentAnswers' | 'ReportSelections') => (
    <div className="advanced-question-stack">
      {questions.map((question) => (
        <article key={question.id} className="advanced-question-card">
          <h3>{question.label}</h3>
          <div>{question.options.map((option) => {
            const selected = selections[question.id] === option.id;
            const wasChecked = checked[suffix] && selected;
            return (
              <button key={option.id} className={`${selected ? 'selected' : ''} ${wasChecked ? (option.correct ? 'correct' : 'wrong') : ''}`} onClick={() => select(suffix, question.id, option.id)}>
                <span>{selected ? '●' : '○'}</span><p>{option.text}</p>{wasChecked && (option.correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />)}
              </button>
            );
          })}</div>
        </article>
      ))}
    </div>
  );

  const commandMatches = (match: string[], value: string) => {
    const normalized = normalize(value);
    return match.every((token) => normalized.includes(normalize(token)));
  };

  const runGuided = () => {
    if (!command.trim()) return;
    const candidate = config.guidedAnyOrder
      ? config.commands.find((item) => !objectives.includes(item.id) && commandMatches(item.match, command))
      : nextGuided && commandMatches(nextGuided.match, command) ? nextGuided : undefined;
    const output = candidate?.output ?? (config.guidedAnyOrder ? 'Команда выполнена, но нужного артефакта в этом снимке нет.' : `Сейчас нужно: ${nextGuided?.title ?? 'все цели закрыты'}.`);
    setHistory((current) => [...current, { command, output, ok: Boolean(candidate) }]);
    setCommand('');
    if (candidate && !objectives.includes(candidate.id)) setDynamic('Objectives', [...objectives, candidate.id]);
  };

  const runIndependent = () => {
    if (!independentCommand.trim()) return;
    const candidate = config.independentCommands.find((item) => !independentObjectives.includes(item.id) && commandMatches(item.match, independentCommand));
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: candidate?.output ?? 'В этом наборе нет такого артефакта или команда не соответствует доступному инструменту.',
      ok: Boolean(candidate),
    }]);
    setIndependentCommand('');
    if (candidate) setDynamic('IndependentObjectives', [...independentObjectives, candidate.id]);
  };

  const insertHint = (value: string, target: 'guided' | 'independent') => {
    if (target === 'guided') setCommand(value);
    else setIndependentCommand(value);
    setDynamic('HintUses', hintUses + 1);
  };

  const patchCorrect = useMemo(() => {
    const normalized = patch.toLowerCase().replace(/\s+/g, ' ');
    return config.requiredPatterns.every((pattern) => normalized.includes(pattern.toLowerCase()))
      && config.forbiddenPatterns.every((pattern) => !normalized.includes(pattern.toLowerCase()));
  }, [patch, config]);

  const checkFoundation = () => {
    setChecked((current) => ({ ...current, FoundationAnswers: true }));
    if (allCorrect(config.foundation, foundation)) setStage(2);
  };
  const checkIndependent = () => {
    setChecked((current) => ({ ...current, IndependentAnswers: true }));
    if (independentDone && allCorrect(config.independentQuestions, independentAnswers)) setStage(5);
  };
  const checkReport = () => {
    setChecked((current) => ({ ...current, ReportSelections: true }));
    if (allCorrect(config.reports, reportSelections)) setStage(6);
  };

  return (
    <div className="advanced-case-app">
      <aside className="advanced-case-sidebar">
        <header><p className="eyebrow">{config.caseId}</p><h2>{config.title}</h2><span>{config.subtitle}</span></header>
        <nav>{config.stageNames.map((name, index) => <button key={name} disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
        <footer><ShieldCheck size={15} /><div><strong>{config.environment}</strong><span>sources: {config.sources.join(' · ')}</span></div></footer>
      </aside>

      <main className="advanced-case-main app-scroll">
        {stage === 0 && <section className="advanced-brief">
          <header><Network size={29} /><div><p className="eyebrow">CASE / {config.caseId}</p><h1>{config.title}</h1><span>{config.subtitle}</span></div></header>
          <div className="advanced-contact"><strong>Контакт</strong><p>{config.contact}</p></div>
          <p className="advanced-brief-text">{config.brief}</p>
          <div className="advanced-architecture">{config.architecture.map((node) => <article key={`${node.role}-${node.title}`}><span>{node.role}</span><strong>{node.title}</strong><p>{node.detail}</p></article>)}</div>
          <button className="primary-action full" onClick={() => setStage(1)}>Начать разбор<ArrowRight size={17} /></button>
        </section>}

        {stage === 1 && <section className="advanced-foundation">
          <header><ClipboardCheck size={24} /><div><p className="eyebrow">FOUNDATIONS</p><h2>Сначала собери модель системы</h2></div></header>
          <div className="advanced-concepts">{config.concepts.map((concept) => <article key={concept.title}><strong>{concept.title}</strong><p>{concept.text}</p></article>)}</div>
          {renderQuestions(config.foundation, foundation, 'FoundationAnswers')}
          <button className="primary-action full" onClick={checkFoundation}>Проверить основу<ArrowRight size={17} /></button>
        </section>}

        {stage === 2 && <section className="advanced-terminal-stage">
          <header><TerminalSquare size={24} /><div><p className="eyebrow">EVIDENCE CONSOLE</p><h2>{config.guidedAnyOrder ? 'Сам выбери порядок расследования' : 'Собери технические факты'}</h2></div></header>
          <div className="advanced-command-goals">{config.commands.map((item) => <article key={item.id} className={objectives.includes(item.id) ? 'done' : ''}><span>{objectives.includes(item.id) ? '✓' : '○'}</span><div><strong>{item.title}</strong><p>{item.theory}</p>{(!config.guidedAnyOrder || showHints) && <code>{item.command}</code>}</div></article>)}</div>
          {config.guidedAnyOrder && <button className="secondary-action" onClick={() => { setShowHints((value) => !value); if (!showHints) setDynamic('HintUses', hintUses + 1); }}>{showHints ? 'Скрыть команды' : 'Показать команды-подсказки'}</button>}
          <div className="advanced-terminal-box">
            <div className="advanced-terminal-history">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
            <div className="advanced-terminal-input"><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runGuided()} placeholder="введи команду" />{nextGuided && <button onClick={() => insertHint(nextGuided.command, 'guided')}>Вставить</button>}<button className="primary-action" onClick={runGuided}><Play size={16} />Выполнить</button></div>
          </div>
          {guidedDone && <button className="primary-action full" onClick={() => setStage(3)}>Перейти к исправлению<ArrowRight size={17} /></button>}
        </section>}

        {stage === 3 && <section className="advanced-patch-stage">
          <header><FileCode2 size={24} /><div><p className="eyebrow">HARDENING</p><h2>{config.patchTitle}</h2></div></header>
          <div className="advanced-patch-theory"><strong>Задача</strong><p>{config.patchTheory}</p></div>
          <div className="advanced-patch-actions"><button className="secondary-action" onClick={() => { setDynamic('Patch', config.securePatch); setDynamic('HintUses', hintUses + 1); }}>Вставить безопасный шаблон</button><button className="secondary-action" onClick={() => setDynamic('Patch', config.vulnerablePatch)}>Вернуть исходную конфигурацию</button></div>
          <textarea value={patch || config.vulnerablePatch} onChange={(event) => setDynamic('Patch', event.target.value)} spellCheck={false} />
          <div className={`advanced-patch-status ${patchCorrect ? 'ok' : ''}`}><strong>{patchCorrect ? 'Конфигурация проходит проверку' : 'Проверка не пройдена'}</strong><p>Нужны все обязательные controls и отсутствие опасных шаблонов.</p></div>
          <button className="primary-action full" disabled={!patchCorrect} onClick={() => setStage(4)}>Зафиксировать исправление<ArrowRight size={17} /></button>
        </section>}

        {stage === 4 && <section className="advanced-independent-stage">
          <header><ShieldCheck size={24} /><div><p className="eyebrow">INDEPENDENT VALIDATION</p><h2>Второй набор без готового порядка</h2></div></header>
          <button className="secondary-action" onClick={() => { setShowHints((value) => !value); if (!showHints) setDynamic('HintUses', hintUses + 1); }}>{showHints ? 'Скрыть подсказки' : 'Показать доступные команды'}</button>
          {showHints && <div className="advanced-command-goals compact">{config.independentCommands.map((item) => <article key={item.id} className={independentObjectives.includes(item.id) ? 'done' : ''}><span>{independentObjectives.includes(item.id) ? '✓' : '○'}</span><div><strong>{item.title}</strong><code>{item.command}</code></div></article>)}</div>}
          <div className="advanced-terminal-box">
            <div className="advanced-terminal-history">{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
            <div className="advanced-terminal-input"><span>$</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runIndependent()} placeholder="исследуй второй набор" /><button className="primary-action" onClick={runIndependent}>Выполнить</button></div>
          </div>
          {renderQuestions(config.independentQuestions, independentAnswers, 'IndependentAnswers')}
          <button className="primary-action full" onClick={checkIndependent}>Проверить самостоятельную часть<ArrowRight size={17} /></button>
        </section>}

        {stage === 5 && <section className="advanced-report-stage">
          <header><ClipboardCheck size={24} /><div><p className="eyebrow">REPORT</p><h2>Отдели факты, решения и остаточный риск</h2></div></header>
          {renderQuestions(config.reports, reportSelections, 'ReportSelections')}
          <button className="primary-action full" onClick={checkReport}>Проверить отчёт<ArrowRight size={17} /></button>
        </section>}

        {stage === 6 && <section className="advanced-complete-stage">
          <CheckCircle2 size={56} /><p className="eyebrow">CASE COMPLETE</p><h1>{config.caseId}</h1><p>Техническая часть и отчёт завершены. Подсказок использовано: {hintUses}.</p>
          <button className="primary-action" onClick={onComplete}>Закрыть дело</button>
        </section>}
      </main>
    </div>
  );
}
