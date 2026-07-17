import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  AlertTriangle, ArrowRight, Braces, Check, ChevronRight, CircleHelp, Clock3,
  FileJson, RotateCcw, ShieldCheck, TerminalSquare,
} from 'lucide-react';
import { EvidenceBoard } from './EvidenceBoard';
import { getMissionDefinition } from '../content/missions/registry';
import {
  createLogsEnvironment,
  LOGS_HOME,
  runLogsCommand,
} from '../content/missions/logs01/environment';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import { useProgress } from '../system/ProgressContext';
import type { MissionEvent } from '../core/scenario/types';

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function hasFinding(events: MissionEvent[], finding: string) {
  return events.some((event) => event.type === 'command.executed' && event.payload.finding === finding);
}

function hasSuccessfulCommand(events: MissionEvent[], predicate: (payload: Record<string, unknown>) => boolean) {
  return events.some((event) => event.type === 'command.executed'
    && event.payload.success === true
    && predicate(event.payload as Record<string, unknown>));
}

const evidenceSuggestions = [
  {
    claimId: 'outcome.logs.guided-count',
    evidenceId: 'artifact.logs.auth',
    label: 'Связать счётчик с auth.log',
    note: 'Счётчик получен выполненной read-only командой над logs/auth.log.',
  },
  {
    claimId: 'outcome.logs.time',
    evidenceId: 'artifact.logs.proxy',
    label: 'Связать UTC с proxy.csv',
    note: 'Локальная метка UTC+03 нормализована перед сопоставлением с proxy.csv.',
  },
  {
    claimId: 'outcome.logs.transfer',
    evidenceId: 'artifact.logs.transfer',
    label: 'Связать transfer-вывод',
    note: 'Источник и количество отказов получены из самостоятельно обработанного JSONL-набора.',
  },
];

const hintCopy = [
  'Сначала открой brief.txt и formats.txt. Не начинай с поиска случайных слов.',
  'Guided-набор лежит в logs. Для счётчика нужен вывод только строк Failed password.',
  'Одна команда может передать stdout другой через |. Производный файл сохраняй только в /home/ilya/work.',
  'Для transfer сначала убери повреждённую строку, затем извлеки src только из событий status=failed.',
];

export function ChapterZeroLogs() {
  const runtime = useMissionRuntime();
  const { progress, setFlag } = useProgress();
  const mission = runtime.activeMission;
  const definition = getMissionDefinition('logs-01');
  const environment = useMemo(() => createLogsEnvironment(mission?.seed ?? 1), [mission?.seed]);
  const [command, setCommand] = useState('');
  const [hintTier, setHintTier] = useState(0);
  const [completionErrors, setCompletionErrors] = useState<string[]>([]);

  if (!definition || !mission || mission.missionId !== 'logs-01') {
    return <main className="chapter-zero-loading">Набор главы 0.2 не найден.</main>;
  }

  const intakeOpened = mission.openedArtifacts.includes('artifact.logs.intake');
  const commandEvents = mission.actionLog.filter((event) => event.type === 'command.executed');
  const lastCommand = [...commandEvents].reverse().find((event) => typeof event.payload.nextCwd === 'string');
  const cwd = typeof lastCommand?.payload.nextCwd === 'string' ? lastCommand.payload.nextCwd : LOGS_HOME;
  const briefOpened = mission.openedArtifacts.includes('artifact.logs.brief');
  const formatsOpened = mission.openedArtifacts.includes('artifact.logs.formats');
  const guidedCount = hasFinding(mission.actionLog, 'guided-failure-count');
  const guidedSource = hasFinding(mission.actionLog, 'guided-source');
  const derivedOutput = hasSuccessfulCommand(mission.actionLog, (payload) => payload.derivedWrite === true);
  const normalizedTime = hasFinding(mission.actionLog, 'normalized-time');
  const proxyOpened = mission.openedArtifacts.includes('artifact.logs.proxy');
  const transferOpened = mission.openedArtifacts.includes('artifact.logs.transfer');
  const transferResult = hasFinding(mission.actionLog, 'transfer-source-count');
  const linkedClaims = new Set(mission.evidenceLinks.map((link) => link.claimId));
  const evidenceReady = [
    'outcome.logs.guided-count',
    'outcome.logs.time',
    'outcome.logs.transfer',
  ].every((claimId) => linkedClaims.has(claimId));
  const criticalErrors = mission.assessment?.criticalErrors ?? [];

  const phase = !briefOpened
    ? { index: 1, title: 'Прочитай рабочую задачу', text: 'Открой brief.txt и зафиксируй часовой пояс источника.' }
    : !formatsOpened
      ? { index: 2, title: 'Проверь форматы', text: 'Узнай, чем отличаются текстовый лог, CSV и JSONL. Обрати внимание на stdout, stderr и exit code.' }
      : !guidedCount || !guidedSource
        ? { index: 3, title: 'Разбери auth.log', text: 'Выдели Failed password, получи счётчик и проверь внешний источник. Используй pipeline, а не ручной пересчёт.' }
        : !derivedOutput
          ? { index: 4, title: 'Сохрани производный результат', text: 'Перенаправь отфильтрованные строки в новый файл внутри /home/ilya/work. Исходник менять нельзя.' }
          : !normalizedTime || !proxyOpened
            ? { index: 5, title: 'Нормализуй время', text: 'Переведи метку UTC+03:00 в UTC и сопоставь результат с logs/proxy.csv.' }
            : !transferOpened || !transferResult
              ? { index: 6, title: 'Самостоятельный JSONL', text: 'Найди transfer-файл. Исключи повреждённую строку и получи источник вместе с количеством failed-событий.' }
              : !evidenceReady
                ? { index: 7, title: 'Свяжи evidence', text: 'Три вывода должны ссылаться на конкретные открытые артефакты.' }
                : { index: 8, title: 'Глава готова к закрытию', text: 'Движок проверил команды, результаты, форматы, время, transfer и evidence links.' };

  const accept = () => runtime.markArtifactOpened('artifact.logs.intake', 'chapter-0-2-briefing');

  const execute = () => {
    if (!command.trim() || mission.status === 'completed') return;
    const result = runLogsCommand(environment, cwd, command);
    runtime.recordAction({
      type: 'command.executed',
      source: 'chapter-zero-logs-terminal',
      payload: result.payload,
    });
    result.openedArtifactIds.forEach((artifactId) => runtime.markArtifactOpened(artifactId, 'chapter-zero-logs-terminal'));
    setCommand('');
    setCompletionErrors([]);
  };

  const requestHint = () => {
    const nextTier = Math.min(5, hintTier + 1);
    setHintTier(nextTier);
    runtime.recordHint(nextTier, `logs-phase-${phase.index}`);
  };

  const complete = () => {
    const attempt = runtime.completeActiveMission();
    setCompletionErrors(attempt.reasons);
  };

  const continueToClinic = () => {
    const learned = ['pwd', 'ls', 'cd-case', 'read-brief', 'grep-failed'];
    setFlag('terminalObjectives', Array.from(new Set([...progress.terminalObjectives, ...learned])));
    setFlag('clinicIntroComplete', true);
    setFlag('onboardingDone', true);
  };

  if (!intakeOpened) {
    return (
      <main className="chapter-zero-start chapter-zero-logs-start">
        <section className="chapter-zero-start-card">
          <header>
            <div className="chapter-zero-start-avatar">МБ</div>
            <div><p className="eyebrow">ЛОКАЛЬНАЯ ПЕРЕДАЧА / ГЛАВА 0.2</p><h1>Теперь сами данные</h1></div>
          </header>
          <div className="chapter-zero-message">
            <p>«Навигацию ты прошёл. В следующем пакете три формата и две временные зоны. Не считай строки глазами — результат должен повторяться.»</p>
            <span>Максим Белов · системный администратор клиники №4</span>
          </div>
          <section className="chapter-zero-briefing">
            <div><span>ЗАДАЧА</span><p>{definition.briefing.objective}</p></div>
            <div><span>ОГРАНИЧЕНИЯ</span><ul>{definition.briefing.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul></div>
          </section>
          <button className="primary-action chapter-zero-start-action" onClick={accept}>Открыть набор логов <ArrowRight size={18} /></button>
        </section>
      </main>
    );
  }

  if (mission.status === 'completed') {
    const method = mission.assessment?.matchedSolutionFamilyId === 'solution.logs.jq' ? 'структурированный jq' : 'текстовый pipeline';
    const logMastery = runtime.store.mastery['data.logs'];
    const transferMastery = runtime.store.mastery['data.jsonl'];
    return (
      <main className="chapter-zero-complete chapter-zero-logs-complete">
        <section>
          <div className="chapter-zero-complete-icon"><ShieldCheck size={31} /></div>
          <p className="eyebrow">ГЛАВА 0.2 ЗАКРЫТА</p>
          <h1>Данные разобраны воспроизводимо</h1>
          <p>Сохранены команды, stdout, stderr, exit codes, использованные подсказки, найденные артефакты и связи evidence.</p>
          <div className="chapter-zero-debrief-grid">
            <article><span>TRANSFER</span><strong>{method}</strong></article>
            <article><span>КОМАНДЫ</span><strong>{commandEvents.length}</strong></article>
            <article><span>ПОДСКАЗКА</span><strong>{mission.assessment?.autonomy.highestHintTier ?? 0}/5</strong></article>
            <article><span>LOGS / JSONL</span><strong>{logMastery?.level ?? 0} / {transferMastery?.level ?? 0}</strong></article>
          </div>
          <div className="chapter-zero-next">
            <span>ДАЛЬШЕ</span>
            <h2>Глава 0.3 — CLINIC-01</h2>
            <p>Процессы, Python с hidden tests, гипотезы, решение, последствия и evidence report.</p>
          </div>
          <div className="chapter-zero-complete-actions">
            <button className="secondary-action" onClick={() => runtime.restartMission('logs-01', mission.seed + 1)}><RotateCcw size={16} /> Новый сгенерированный набор</button>
            <button className="primary-action" onClick={continueToClinic}>Продолжить CLINIC-01 <ArrowRight size={18} /></button>
          </div>
        </section>
      </main>
    );
  }

  const fullHint = phase.index <= 2
    ? `cd ${LOGS_HOME} && cat brief.txt`
    : phase.index === 3
      ? `grep "Failed password" logs/auth.log | wc -l`
      : phase.index === 4
        ? `grep "Failed password" logs/auth.log > /home/ilya/work/failed.log`
        : phase.index === 5
          ? `date -u -d "${environment.facts.localEventTime}"`
          : `grep '^{' ${environment.facts.transferFile} | jq -r 'select(.status=="failed") | .src' | sort | uniq -c`;

  return (
    <main className="chapter-zero-workspace chapter-zero-logs-workspace">
      <header className="chapter-zero-topbar">
        <div><span>FALSE ACCESS</span><strong>Глава 0.2 / Shell, логи и время</strong></div>
        <div><i>LOCAL</i><i>SOURCE READ ONLY</i><i>SEED {mission.seed}</i></div>
      </header>

      <div className="chapter-zero-layout chapter-zero-logs-layout">
        <aside className="chapter-zero-mission-panel">
          <p className="eyebrow">ТЕКУЩАЯ ЦЕЛЬ / {phase.index} ИЗ 8</p>
          <h1>{phase.title}</h1>
          <p>{phase.text}</p>
          <div className="chapter-zero-progress chapter-zero-progress-eight">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => <span key={step} className={step < phase.index ? 'done' : step === phase.index ? 'active' : ''}>{step < phase.index ? <Check size={12} /> : step}</span>)}
          </div>

          <section className="chapter-zero-concept">
            <strong>Рабочая модель</strong>
            <p><code>stdout</code> передаётся через <code>|</code>. Ошибка идёт в <code>stderr</code>. <code>exit code 0</code> означает успешное выполнение команды, но не истинность аналитического вывода.</p>
          </section>

          <div className="logs-format-strip">
            <span><TerminalSquare size={14} /> TXT</span>
            <span><Clock3 size={14} /> CSV / UTC</span>
            <span><FileJson size={14} /> JSONL</span>
          </div>

          <button className="chapter-zero-hint-button" onClick={requestHint} disabled={hintTier >= 5 || evidenceReady}>
            <CircleHelp size={16} /> Подсказка {Math.min(5, hintTier + 1)}/5
          </button>
          {hintTier > 0 && (
            <div className="chapter-zero-hint">
              <strong>Уровень {hintTier}</strong>
              <p>{hintTier <= 4 ? hintCopy[hintTier - 1] : fullHint}</p>
            </div>
          )}

          {criticalErrors.length > 0 && (
            <div className="chapter-zero-critical">
              <AlertTriangle size={17} />
              <div><strong>Критическая ошибка</strong><p>Исходные данные пытались изменить или команда вышла за границы локальной лаборатории.</p></div>
              <button onClick={runtime.resetActiveMission}><RotateCcw size={14} /> Reset</button>
            </div>
          )}
        </aside>

        <section className="chapter-zero-terminal-shell">
          <header><TerminalSquare size={17} /><span>LOG ANALYSIS SHELL</span><i>{cwd}</i></header>
          <div className="chapter-zero-terminal-output">
            <div className="chapter-zero-terminal-welcome">
              <strong>FALSE ACCESS LOCAL SHELL</strong>
              <span>Поддерживаются pipelines, stdout/stderr, exit codes и безопасная запись в /home/ilya/work.</span>
              <span>Напиши help. Готовые команды не вставляются.</span>
            </div>
            {commandEvents.map((event) => {
              const stdout = stringArray(event.payload.stdout);
              const stderr = stringArray(event.payload.stderr);
              return (
                <div className="chapter-zero-terminal-event" key={event.id}>
                  <div><b>ilya@false-access</b>:<span>{String(event.payload.cwd ?? '~')}</span>$ {String(event.payload.command ?? '')}</div>
                  {stdout.map((line, index) => <pre key={`out-${index}`}>{line || ' '}</pre>)}
                  {stderr.map((line, index) => <pre className="stderr" key={`err-${index}`}>{line}</pre>)}
                  <small className={Number(event.payload.exitCode ?? 0) === 0 ? 'exit-ok' : 'exit-bad'}>exit {String(event.payload.exitCode ?? 0)}</small>
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
          <EvidenceBoard suggestions={evidenceSuggestions} />
          <section className="chapter-zero-checks logs-facts-panel">
            <header><Braces size={17} /><strong>Проверка главы</strong></header>
            {mission.assessment?.rules.filter((rule) => !rule.critical).map((rule) => (
              <div key={rule.ruleId} className={rule.passed ? 'passed' : ''}>
                <span>{rule.passed ? <Check size={12} /> : '·'}</span>
                <p>{rule.ruleId.replace('rule.logs.', '').replaceAll('-', ' ')}</p>
              </div>
            ))}
            {evidenceReady && <button className="primary-action full" onClick={complete}>Закрыть главу <ArrowRight size={16} /></button>}
            {completionErrors.length > 0 && <p className="chapter-zero-completion-error">Не закрыто: {completionErrors.join(', ')}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
