import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  AlertTriangle, ArrowRight, Check, ChevronRight, CircleHelp, FolderSearch, RotateCcw,
  ShieldCheck, TerminalSquare,
} from 'lucide-react';
import { EvidenceBoard } from './EvidenceBoard';
import {
  createWorkspaceEnvironment,
  runWorkspaceCommand,
  WORKSPACE_HOME,
} from '../content/missions/workspace01/environment';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import type { MissionEvent } from '../core/scenario/types';

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function hasCommand(
  events: MissionEvent[],
  predicate: (payload: Record<string, unknown>) => boolean,
) {
  return events.some((event) => event.type === 'command.executed' && predicate(event.payload as Record<string, unknown>));
}

const hintCopy = [
  'Сначала сформулируй, что именно ты пытаешься узнать. Не вводи команды наугад.',
  'Нужная самостоятельная копия находится внутри /home/ilya/incoming.',
  'Осматривай дерево командами ls, переходи через cd, содержимое файла читай через cat.',
  'В incoming есть старый архив и новый вложенный каталог. Сверяй код пакета из brief.txt.',
];

export function ChapterZeroWorkspace() {
  const runtime = useMissionRuntime();
  const mission = runtime.activeMission;
  const environment = useMemo(() => createWorkspaceEnvironment(mission?.seed ?? 1), [mission?.seed]);
  const [command, setCommand] = useState('');
  const [hintTier, setHintTier] = useState(0);
  const [completionErrors, setCompletionErrors] = useState<string[]>([]);

  if (!mission || mission.missionId !== 'workspace-01') {
    return <main className="chapter-zero-loading">Рабочая копия не найдена.</main>;
  }

  const commandEvents = mission.actionLog.filter((event) => event.type === 'command.executed');
  const lastCommand = [...commandEvents].reverse().find((event) => typeof event.payload.nextCwd === 'string');
  const cwd = typeof lastCommand?.payload.nextCwd === 'string' ? lastCommand.payload.nextCwd : WORKSPACE_HOME;
  const hasPwd = hasCommand(mission.actionLog, (payload) => payload.name === 'pwd' && payload.success === true);
  const hasHomeLs = hasCommand(mission.actionLog, (payload) => payload.name === 'ls' && payload.targetPath === WORKSPACE_HOME && payload.success === true);
  const briefOpened = mission.openedArtifacts.includes('artifact.workspace.brief');
  const transferOpened = mission.openedArtifacts.includes('artifact.workspace.transfer');
  const transferLinked = mission.evidenceLinks.some((link) => link.claimId === 'outcome.workspace.transfer' && link.evidenceId === 'artifact.workspace.transfer');
  const criticalErrors = mission.assessment?.criticalErrors ?? [];

  const phase = !hasPwd
    ? { index: 1, title: 'Определи точку старта', text: 'Текущий каталог определяет, откуда считаются относительные пути.' }
    : !hasHomeLs
      ? { index: 2, title: 'Осмотри домашний каталог', text: 'Сначала посмотри доступные объекты. Не угадывай путь.' }
      : !briefOpened
        ? { index: 3, title: 'Найди постановку CLINIC-01', text: 'Перейди в cases/clinic-01 и открой brief.txt. Можно использовать относительный или абсолютный путь.' }
        : !transferOpened
          ? { index: 4, title: 'Самостоятельный поиск', text: `В brief.txt указан код пакета. Найди соответствующий текстовый индекс внутри incoming. Точный каталог не сообщается.` }
          : !transferLinked
            ? { index: 5, title: 'Зафиксируй evidence', text: 'Открытый файл ещё нужно связать с результатом самостоятельного поиска.' }
            : { index: 6, title: 'Глава готова к закрытию', text: 'Движок проверил действия, путь, артефакт и evidence link.' };

  const execute = () => {
    if (!command.trim() || mission.status === 'completed') return;
    const raw = command;
    const result = runWorkspaceCommand(environment, cwd, raw);
    runtime.recordAction({
      type: 'command.executed',
      source: 'chapter-zero-terminal',
      payload: result.payload,
    });
    if (result.openedArtifactId) runtime.markArtifactOpened(result.openedArtifactId, 'chapter-zero-terminal');
    setCommand('');
    setCompletionErrors([]);
  };

  const requestHint = () => {
    const nextTier = Math.min(5, hintTier + 1);
    setHintTier(nextTier);
    runtime.recordHint(nextTier, `workspace-phase-${phase.index}`);
  };

  const complete = () => {
    const attempt = runtime.completeActiveMission();
    setCompletionErrors(attempt.reasons);
  };

  const continueToLogs = () => {
    runtime.ensureMission('logs-01');
  };

  if (mission.status === 'completed') {
    const method = mission.assessment?.matchedSolutionFamilyId === 'solution.workspace.absolute'
      ? 'абсолютный путь'
      : 'относительная навигация';
    const mastery = runtime.store.mastery['computing.filesystem'];
    return (
      <main className="chapter-zero-complete">
        <section>
          <div className="chapter-zero-complete-icon"><ShieldCheck size={31} /></div>
          <p className="eyebrow">ГЛАВА 0.1 ЗАКРЫТА</p>
          <h1>Рабочая копия освоена</h1>
          <p>Система сохранила не ответ, а последовательность действий: команды, ошибки, открытые артефакты, подсказки и связь evidence.</p>
          <div className="chapter-zero-debrief-grid">
            <article><span>МЕТОД</span><strong>{method}</strong></article>
            <article><span>КОМАНДЫ</span><strong>{commandEvents.length}</strong></article>
            <article><span>ПОДСКАЗКА</span><strong>{mission.assessment?.autonomy.highestHintTier ?? 0}/5</strong></article>
            <article><span>FILESYSTEM</span><strong>уровень {mastery?.level ?? 0}</strong></article>
          </div>
          <div className="chapter-zero-next">
            <span>ДАЛЬШЕ</span>
            <h2>Глава 0.2 — Shell, логи и время</h2>
            <p>Следующая глава учит pipelines, stdout/stderr, форматы данных, UTC и самостоятельный разбор изменённого JSONL-набора.</p>
          </div>
          <button className="primary-action" onClick={continueToLogs}>Перейти к главе 0.2 <ArrowRight size={18} /></button>
        </section>
      </main>
    );
  }

  return (
    <main className="chapter-zero-workspace">
      <header className="chapter-zero-topbar">
        <div><span>FALSE ACCESS</span><strong>Глава 0.1 / Рабочее место</strong></div>
        <div><i>LOCAL</i><i>READ ONLY</i><i>SEED {mission.seed}</i></div>
      </header>

      <div className="chapter-zero-layout">
        <aside className="chapter-zero-mission-panel">
          <p className="eyebrow">ТЕКУЩАЯ ЦЕЛЬ / {phase.index} ИЗ 6</p>
          <h1>{phase.title}</h1>
          <p>{phase.text}</p>
          <div className="chapter-zero-progress">
            {[1, 2, 3, 4, 5, 6].map((step) => <span key={step} className={step < phase.index ? 'done' : step === phase.index ? 'active' : ''}>{step < phase.index ? <Check size={12} /> : step}</span>)}
          </div>

          <section className="chapter-zero-concept">
            <strong>Рабочая модель</strong>
            <p><code>cwd</code> — текущий каталог. Относительный путь считается от него. Абсолютный начинается с <code>/</code> и не зависит от cwd.</p>
          </section>

          <button className="chapter-zero-hint-button" onClick={requestHint} disabled={hintTier >= 5 || transferLinked}>
            <CircleHelp size={16} /> Подсказка {Math.min(5, hintTier + 1)}/5
          </button>
          {hintTier > 0 && (
            <div className="chapter-zero-hint">
              <strong>Уровень {hintTier}</strong>
              <p>{hintTier <= 4 ? hintCopy[hintTier - 1] : `Полный маршрут: cd /home/ilya/incoming/${environment.transfer.directory.split('/').at(-1)} && cat ${environment.transfer.fileName}`}</p>
            </div>
          )}

          {criticalErrors.length > 0 && (
            <div className="chapter-zero-critical">
              <AlertTriangle size={17} />
              <div><strong>Критическая ошибка</strong><p>Глава не закрывается после попытки изменить данные или выйти во внешнюю сеть.</p></div>
              <button onClick={runtime.resetActiveMission}><RotateCcw size={14} /> Reset</button>
            </div>
          )}
        </aside>

        <section className="chapter-zero-terminal-shell">
          <header><TerminalSquare size={17} /><span>LOCAL WORKSPACE</span><i>{cwd}</i></header>
          <div className="chapter-zero-terminal-output">
            <div className="chapter-zero-terminal-welcome">
              <strong>FALSE ACCESS TRAINING SHELL</strong>
              <span>Команды не закрывают цели напрямую. Движок оценивает журнал действий.</span>
              <span>Напиши help для локальной справки.</span>
            </div>
            {commandEvents.map((event) => {
              const stdout = stringArray(event.payload.stdout);
              const stderr = stringArray(event.payload.stderr);
              return (
                <div className="chapter-zero-terminal-event" key={event.id}>
                  <div><b>ilya@false-access</b>:<span>{String(event.payload.cwd ?? '~')}</span>$ {String(event.payload.command ?? '')}</div>
                  {stdout.map((line, index) => <pre key={`out-${index}`}>{line || ' '}</pre>)}
                  {stderr.map((line, index) => <pre className="stderr" key={`err-${index}`}>{line}</pre>)}
                  {Number(event.payload.exitCode ?? 0) !== 0 && <small>exit {String(event.payload.exitCode)}</small>}
                </div>
              );
            })}
          </div>
          <div className="chapter-zero-command-line">
            <span>ilya@false-access:{cwd.replace('/home/ilya', '~') || '~'}$</span>
            <input
              value={command}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setCommand(event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => event.key === 'Enter' && execute()}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <button onClick={execute}>RUN <ChevronRight size={14} /></button>
          </div>
        </section>

        <div className="chapter-zero-right-column">
          <EvidenceBoard suggestions={[{ claimId: 'outcome.workspace.transfer', evidenceId: 'artifact.workspace.transfer', label: 'Связать найденный пакет', note: 'Файл открыт в локальной среде и содержит код пакета из brief.txt.' }]} />
          <section className="chapter-zero-checks">
            <header><FolderSearch size={17} /><strong>Проверка главы</strong></header>
            {mission.assessment?.rules.filter((rule) => !rule.critical).map((rule) => (
              <div key={rule.ruleId} className={rule.passed ? 'passed' : ''}>
                <span>{rule.passed ? <Check size={12} /> : '·'}</span>
                <p>{rule.ruleId.replace('rule.workspace.', '').replaceAll('-', ' ')}</p>
              </div>
            ))}
            {transferLinked && (
              <button className="primary-action full" onClick={complete}>Закрыть главу <ArrowRight size={16} /></button>
            )}
            {completionErrors.length > 0 && <p className="chapter-zero-completion-error">Не закрыто: {completionErrors.join(', ')}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
