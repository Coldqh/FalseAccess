import { useMemo, useState } from 'react';
import {
  ArrowRight, Braces, CheckCircle2, ClipboardList, Code2, Cookie, Database,
  FileCheck2, Globe2, KeyRound, LockKeyhole, ShieldCheck, TerminalSquare, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  webArchitecture, webCaseOverview, webCodeQuestions, webFindingSections,
  webFoundationQuestions, webGuidedObjectives, webIndependentCommands,
  webIndependentQuestions, webReportSections, webSecureRoute, webSessionQuestions,
  webSqlObjectives, webVulnerableRoute,
} from '../missions/web01';

type HistoryEntry = { command: string; output: string; ok: boolean };

const stageNames = ['Портал', 'HTTP', 'API', 'Сессии', 'Код и SQL', 'Второй сервис', 'Отчёт', 'Готово'];

function normalizeCommand(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*;\s*$/, ';');
}

function isCorrect(option: unknown) {
  return Boolean(option && typeof option === 'object' && 'correct' in option && (option as { correct?: boolean }).correct);
}

function allCorrect(
  sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[],
  selections: Record<string, string>,
) {
  return sections.every((section) => isCorrect(section.options.find((option) => option.id === selections[section.id])));
}

export function WebCaseApp() {
  const { progress, setFlag, completeWebCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.webCaseStage));
  const [foundationChecked, setFoundationChecked] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [codeChecked, setCodeChecked] = useState(false);
  const [independentChecked, setIndependentChecked] = useState(false);
  const [findingsChecked, setFindingsChecked] = useState(false);
  const [reportChecked, setReportChecked] = useState(false);
  const [httpCommand, setHttpCommand] = useState('');
  const [httpHistory, setHttpHistory] = useState<HistoryEntry[]>([]);
  const [sqlCommand, setSqlCommand] = useState('');
  const [sqlHistory, setSqlHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showIndependentHints, setShowIndependentHints] = useState(false);

  const setStage = (value: number) => setFlag('webCaseStage', Math.min(7, Math.max(progress.webCaseStage, value)));
  const nextHttp = webGuidedObjectives.find((item) => !progress.webCaseHttpObjectives.includes(item.id));
  const httpDone = webGuidedObjectives.every((item) => progress.webCaseHttpObjectives.includes(item.id));
  const nextSql = webSqlObjectives.find((item) => !progress.webCaseSqlObjectives.includes(item.id));
  const sqlDone = webSqlObjectives.every((item) => progress.webCaseSqlObjectives.includes(item.id));
  const independentDone = webIndependentCommands.every((item) => progress.webCaseIndependentObjectives.includes(item.id));

  const siteSrc = useMemo(() => `${new URL('.', window.location.href).href}sites/vanta/index.html`, []);

  const choose = (
    key: 'webCaseFoundationAnswers' | 'webCaseSessionAnswers' | 'webCaseCodeAnswers' | 'webCaseIndependentAnswers' | 'webCaseFindingSelections' | 'webCaseReportSelections',
    sectionId: string,
    optionId: string,
  ) => {
    setFlag(key, { ...progress[key], [sectionId]: optionId });
    if (key === 'webCaseFoundationAnswers') setFoundationChecked(false);
    if (key === 'webCaseSessionAnswers') setSessionChecked(false);
    if (key === 'webCaseCodeAnswers') setCodeChecked(false);
    if (key === 'webCaseIndependentAnswers') setIndependentChecked(false);
    if (key === 'webCaseFindingSelections') setFindingsChecked(false);
    if (key === 'webCaseReportSelections') setReportChecked(false);
  };

  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    selections: Record<string, string>,
    checked: boolean,
    key: 'webCaseFoundationAnswers' | 'webCaseSessionAnswers' | 'webCaseCodeAnswers' | 'webCaseIndependentAnswers' | 'webCaseFindingSelections' | 'webCaseReportSelections',
  ) => (
    <div className="windows-question-stack web-question-stack">
      {sections.map((section) => (
        <article key={section.id} className="windows-question-card">
          <h3>{section.label}</h3>
          <div>
            {section.options.map((option) => {
              const selected = selections[section.id] === option.id;
              const status = checked && selected ? (option.correct ? 'correct' : 'wrong') : '';
              return (
                <button key={option.id} className={`${selected ? 'selected' : ''} ${status}`} onClick={() => choose(key, section.id, option.id)}>
                  <span>{selected ? '●' : '○'}</span><p>{option.text}</p>{checked && selected && (option.correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />)}
                </button>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );

  const httpMatches = (id: string, raw: string) => {
    const cmd = normalizeCommand(raw);
    if (!cmd.includes('curl')) return false;
    if (id === 'me') return cmd.includes('/api/v1/me') && cmd.includes('sid=sid_41_a71c');
    if (id === 'own') return cmd.includes('/settlements/901') && cmd.includes('sid=sid_41_a71c');
    if (id === 'foreign') return cmd.includes('/settlements/902') && cmd.includes('sid=sid_41_a71c');
    if (id === 'anonymous') return cmd.includes('/settlements/902') && !cmd.includes('cookie:') && !cmd.includes('sid=');
    return false;
  };

  const executeHttp = () => {
    if (!httpCommand.trim() || !nextHttp) return;
    const ok = httpMatches(nextHttp.id, httpCommand);
    setHttpHistory((current) => [...current, {
      command: httpCommand,
      output: ok ? nextHttp.output : `Запрос не проверяет текущую цель. Сейчас нужно: ${nextHttp.title}.`,
      ok,
    }]);
    setHttpCommand('');
    if (ok) setFlag('webCaseHttpObjectives', [...progress.webCaseHttpObjectives, nextHttp.id]);
  };

  const sqlMatches = (id: string, raw: string) => {
    const cmd = normalizeCommand(raw);
    if (!cmd.startsWith('select')) return false;
    if (id === 'own-rows') return cmd.includes('from settlements') && cmd.includes('owner_id = 41') && cmd.includes('order by id');
    if (id === 'audit') return cmd.includes('from audit_log') && cmd.includes("session_id = 'sid_41_a71c'") && cmd.includes('order by time');
    return false;
  };

  const executeSql = () => {
    if (!sqlCommand.trim() || !nextSql) return;
    const ok = sqlMatches(nextSql.id, sqlCommand);
    setSqlHistory((current) => [...current, {
      command: sqlCommand,
      output: ok ? nextSql.output : `Запрос не возвращает нужный набор. Сейчас нужно: ${nextSql.title}.`,
      ok,
    }]);
    setSqlCommand('');
    if (ok) setFlag('webCaseSqlObjectives', [...progress.webCaseSqlObjectives, nextSql.id]);
  };

  const executeIndependent = () => {
    if (!independentCommand.trim()) return;
    const normalized = normalizeCommand(independentCommand);
    const match = webIndependentCommands.find((item) => normalizeCommand(item.command) === normalized || (
      item.id === 'route' && /cat\s+.*routes-files\.js/.test(normalized)
    ) || (
      item.id === 'schema' && /cat\s+.*schema\.sql/.test(normalized)
    ));
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: match ? match.output : 'Команда доступна, но не возвращает нужный артефакт из этого снимка.',
      ok: Boolean(match),
    }]);
    setIndependentCommand('');
    if (match && !progress.webCaseIndependentObjectives.includes(match.id)) {
      setFlag('webCaseIndependentObjectives', [...progress.webCaseIndependentObjectives, match.id]);
    }
  };

  const insertHint = (value: string, target: 'http' | 'sql' | 'independent') => {
    if (target === 'http') setHttpCommand(value);
    if (target === 'sql') setSqlCommand(value);
    if (target === 'independent') setIndependentCommand(value);
    setFlag('webCaseHintUses', progress.webCaseHintUses + 1);
  };

  const patchIsCorrect = () => {
    const code = progress.webCasePatch;
    return /owner_id\s*=\s*\$2/i.test(code)
      && /\[\s*id\s*,\s*req\.user\.id\s*\]/i.test(code)
      && /not_found/.test(code)
      && !/where\s+id\s*=\s*\$1["'`]/i.test(code);
  };

  const checkFoundation = () => {
    setFoundationChecked(true);
    if (allCorrect(webFoundationQuestions, progress.webCaseFoundationAnswers)) setStage(2);
  };

  const checkSession = () => {
    setSessionChecked(true);
    if (allCorrect(webSessionQuestions, progress.webCaseSessionAnswers)) setStage(4);
  };

  const checkCode = () => {
    setCodeChecked(true);
    if (patchIsCorrect() && sqlDone && allCorrect(webCodeQuestions, progress.webCaseCodeAnswers)) setStage(5);
  };

  const checkIndependent = () => {
    setIndependentChecked(true);
    if (independentDone && allCorrect(webIndependentQuestions, progress.webCaseIndependentAnswers)) setStage(6);
  };

  const checkFinal = () => {
    setFindingsChecked(true);
    setReportChecked(true);
    if (allCorrect(webFindingSections, progress.webCaseFindingSelections) && allCorrect(webReportSections, progress.webCaseReportSelections)) setStage(7);
  };

  return (
    <div className="route-case-app windows-case-app linux-case-app network-case-app web-case-app">
      <aside className="route-case-sidebar windows-case-sidebar web-case-sidebar">
        <header><p className="eyebrow">VANTA-04</p><h2>Web / API / SQL</h2><span>VANTA LEDGER</span></header>
        <nav>{stageNames.map((name, index) => <button key={name} type="button" disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
        <footer><LockKeyhole size={15} /><div><strong>LAB CLONE</strong><span>synthetic records</span></div></footer>
      </aside>

      <main className="route-case-main windows-case-main web-case-main app-scroll">
        {stage === 0 && (
          <section className="route-brief-stage windows-brief-stage web-brief-stage">
            <header><Globe2 size={28} /><div><p className="eyebrow">CASE / VANTA-04</p><h1>Чужие расчёты по прямой ссылке</h1></div></header>
            <div className="route-brief-grid windows-brief-grid">
              {webCaseOverview.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
            </div>
            <div className="windows-theory warning"><strong>Игорь</strong><p>У обычного клиента открылся чужой расчёт. Копия портала здесь. Проверь API, сессии и код. Прод ничего не трогай.</p></div>
            <div className="web-architecture-grid">
              {webArchitecture.map((node) => <article key={node.id}><span>{node.role}</span><Braces size={20} /><strong>{node.title}</strong><p>{node.subtitle}</p><code>{node.address}</code></article>)}
            </div>
            <div className="web-site-frame"><div><Globe2 size={15} /><span>https://vanta.local</span></div><iframe src={siteSrc} title="VANTA Ledger" sandbox="allow-scripts allow-forms allow-same-origin" /></div>
            <button className="primary-action full" onClick={() => setStage(1)}>Разобрать HTTP и архитектуру<ArrowRight size={17} /></button>
          </section>
        )}

        {stage === 1 && (
          <section className="route-choice-stage web-foundation-stage">
            <header><Globe2 size={22} /><div><p className="eyebrow">HTTP FOUNDATIONS</p><h2>Раздели браузер, API, сессию и базу</h2></div></header>
            <div className="network-theory-strip web-theory-strip">
              <article><strong>METHOD</strong><p>GET читает, POST обычно передаёт данные или запускает действие.</p></article>
              <article><strong>STATUS</strong><p>Код ответа сообщает результат обработки запроса.</p></article>
              <article><strong>COOKIE</strong><p>Браузер хранит идентификатор, сервер хранит состояние сессии.</p></article>
              <article><strong>AUTHZ</strong><p>Сервер проверяет право на каждый объект и действие.</p></article>
              <article><strong>SQL</strong><p>Запрос к базе должен быть параметризован и ограничен нужными строками.</p></article>
            </div>
            {renderOptions(webFoundationQuestions, progress.webCaseFoundationAnswers, foundationChecked, 'webCaseFoundationAnswers')}
            <button className="primary-action full" onClick={checkFoundation}>Проверить основу</button>
          </section>
        )}

        {stage === 2 && (
          <section className="route-terminal-stage windows-terminal-stage web-http-stage">
            <header><TerminalSquare size={22} /><div><p className="eyebrow">HTTP CLIENT / READ ONLY</p><h2>{nextHttp?.title ?? 'Запросы собраны'}</h2></div></header>
            {nextHttp && <div className="mission-guide-strip web-guide"><div className="mission-guide-speaker">И</div><div className="mission-guide-copy"><strong>{nextHttp.title}</strong><p>{nextHttp.explanation}</p></div><code>{nextHttp.command}</code><div className="mission-guide-actions"><button onClick={() => insertHint(nextHttp.command, 'http')}>Вставить</button></div></div>}
            <div className="route-terminal-console windows-terminal-console web-terminal-console">
              <div className="route-terminal-history"><p>analyst@lab:/cases/vanta-04$</p>{httpHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b>$ {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>$</span><input value={httpCommand} onChange={(event) => setHttpCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeHttp()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeHttp}>RUN</button></div>
            </div>
            {httpDone && <button className="primary-action full windows-next" onClick={() => setStage(3)}>Разобрать сессии и права<ArrowRight size={17} /></button>}
          </section>
        )}

        {stage === 3 && (
          <section className="route-choice-stage web-session-stage">
            <header><Cookie size={22} /><div><p className="eyebrow">SESSION / AUTHORIZATION</p><h2>Сессия рабочая. Доступ всё равно сломан</h2></div></header>
            <div className="web-session-flow">
              <article><KeyRound size={19} /><strong>Аутентификация</strong><p>Кто отправил запрос?</p><code>sid → user 41</code></article>
              <ArrowRight size={18} />
              <article className="danger"><LockKeyhole size={19} /><strong>Авторизация</strong><p>Можно ли user 41 читать object 902?</p><code>проверки нет</code></article>
            </div>
            {renderOptions(webSessionQuestions, progress.webCaseSessionAnswers, sessionChecked, 'webCaseSessionAnswers')}
            <button className="primary-action full" onClick={checkSession}>Проверить вывод</button>
          </section>
        )}

        {stage === 4 && (
          <section className="web-code-stage">
            <header><Code2 size={22} /><div><p className="eyebrow">NODE API / POSTGRESQL</p><h2>Исправь маршрут и проверь масштаб</h2></div></header>
            <div className="web-code-layout">
              <article className="web-code-card vulnerable"><header><span>routes-settlements.js</span><b>ИСХОДНИК</b></header><pre>{webVulnerableRoute}</pre></article>
              <article className="web-code-card editor"><header><span>patch.js</span><button onClick={() => { setFlag('webCasePatch', webSecureRoute); setFlag('webCaseHintUses', progress.webCaseHintUses + 1); }}>Вставить безопасный вариант</button></header><textarea value={progress.webCasePatch} onChange={(event) => { setFlag('webCasePatch', event.target.value); setCodeChecked(false); }} spellCheck={false} autoCapitalize="none" autoCorrect="off" placeholder="Добавь серверную проверку владельца объекта..." /></article>
            </div>
            {renderOptions(webCodeQuestions, progress.webCaseCodeAnswers, codeChecked, 'webCaseCodeAnswers')}
            <div className="web-sql-panel">
              <header><Database size={20} /><div><p className="eyebrow">LEDGER-DB / READ ONLY</p><h3>{nextSql?.title ?? 'SQL-проверка завершена'}</h3></div></header>
              {nextSql && <div className="mission-guide-strip web-guide"><div className="mission-guide-speaker">SQL</div><div className="mission-guide-copy"><strong>{nextSql.title}</strong><p>{nextSql.explanation}</p></div><code>{nextSql.command}</code><div className="mission-guide-actions"><button onClick={() => insertHint(nextSql.command, 'sql')}>Вставить</button></div></div>}
              <div className="route-terminal-console web-sql-console">
                <div className="route-terminal-history"><p>ledger=&gt;</p>{sqlHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b>{entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
                <div className="route-terminal-input"><span>SQL</span><input value={sqlCommand} onChange={(event) => setSqlCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeSql()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeSql}>RUN</button></div>
              </div>
            </div>
            <button className="primary-action full" onClick={checkCode} disabled={!sqlDone}>Проверить патч и SQL</button>
            {codeChecked && !patchIsCorrect() && <div className="web-inline-error">Маршрут должен выбирать объект по <code>id</code> и <code>owner_id</code>, передавать значения параметрами и возвращать 404 при отсутствии доступной строки.</div>}
          </section>
        )}

        {stage === 5 && (
          <section className="windows-independent-stage web-independent-stage">
            <header><Braces size={22} /><div><p className="eyebrow">VAULT API / САМОСТОЯТЕЛЬНО</p><h2>Проверь второй сервис</h2></div></header>
            <div className="windows-theory warning"><strong>Новый контекст</strong><p>Аккаунт ops-17 работает с файлами. Порядок действий не задан. Собери личность, два объекта, маршрут и схему.</p></div>
            <button className="secondary-action windows-hint-toggle" onClick={() => { setShowIndependentHints((value) => !value); if (!showIndependentHints) setFlag('webCaseHintUses', progress.webCaseHintUses + 1); }}>{showIndependentHints ? 'Скрыть команды' : 'Показать доступные команды'}</button>
            {showIndependentHints && <div className="windows-command-bank web-command-bank">{webIndependentCommands.map((item) => <button key={item.id} disabled={progress.webCaseIndependentObjectives.includes(item.id)} onClick={() => insertHint(item.command, 'independent')}><strong>{item.id.toUpperCase()}</strong><code>{item.command}</code></button>)}</div>}
            <div className="route-terminal-console windows-terminal-console independent web-terminal-console">
              <div className="route-terminal-history"><p>analyst@lab:/cases/vanta-04/vault$</p>{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b>$ {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>$</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeIndependent()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeIndependent}>RUN</button></div>
            </div>
            {renderOptions(webIndependentQuestions, progress.webCaseIndependentAnswers, independentChecked, 'webCaseIndependentAnswers')}
            <button className="primary-action full" onClick={checkIndependent} disabled={!independentDone}>Проверить второй сервис</button>
          </section>
        )}

        {stage === 6 && (
          <section className="route-choice-stage web-report-stage">
            <header><ClipboardList size={22} /><div><p className="eyebrow">APPLICATION SECURITY REPORT</p><h2>Собери вывод по двум API</h2></div></header>
            <div className="linux-evidence-row web-evidence-row"><span><Globe2 size={16} />HTTP</span><span><Cookie size={16} />SESSION</span><span><Braces size={16} />API</span><span><Database size={16} />SQL</span><span><FileCheck2 size={16} />AUDIT</span></div>
            <h3 className="linux-section-title">Факты</h3>
            {renderOptions(webFindingSections, progress.webCaseFindingSelections, findingsChecked, 'webCaseFindingSelections')}
            <h3 className="linux-section-title">Отчёт</h3>
            {renderOptions(webReportSections, progress.webCaseReportSelections, reportChecked, 'webCaseReportSelections')}
            <button className="primary-action full" onClick={checkFinal}>Проверить и закрыть расследование</button>
          </section>
        )}

        {stage === 7 && (
          <section className="route-wrap windows-wrap linux-wrap network-wrap web-wrap"><ShieldCheck size={50} /><p className="eyebrow">VANTA-04 / ЗАВЕРШЕНО</p><h1>Доступ к объектам закрыт</h1><p>Ты разделил аутентификацию и авторизацию, доказал чтение чужих объектов, исправил два API-маршрута, проверил SQL и собрал требования к сессиям и тестам.</p><div><strong>Отработано:</strong><span>HTTP</span><span>status codes</span><span>cookies</span><span>sessions</span><span>REST API</span><span>BOLA / IDOR</span><span>SQL</span><span>parameterization</span><span>server-side authorization</span></div><small>Подсказок использовано: {progress.webCaseHintUses}</small><button className="primary-action" onClick={completeWebCase}>Закрыть дело</button></section>
        )}
      </main>
    </div>
  );
}
