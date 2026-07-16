import { useState } from 'react';
import {
  ArrowRight, CheckCircle2, ClipboardList, Code2, FileArchive, FileCheck2,
  Fingerprint, KeyRound, LockKeyhole, Network, PackageSearch, ShieldCheck,
  Smartphone, TerminalSquare, UserRoundCheck, WifiOff, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  mobileArchitecture, mobileBackupObjectives, mobileCaseOverview, mobileCodeQuestions,
  mobileContainmentSections, mobileFindingSections, mobileFoundationQuestions,
  mobileGuidedObjectives, mobileIndependentCommands, mobileIndependentQuestions,
  mobileReportSections, mobileSecurePatch, mobileSessionQuestions, mobileTokenQuestions,
  mobileVulnerablePatch,
} from '../missions/mobile01';

type HistoryEntry = { command: string; output: string; ok: boolean };
type SelectKey =
  | 'mobileCaseFoundationAnswers' | 'mobileCaseSessionAnswers' | 'mobileCaseTokenAnswers'
  | 'mobileCaseCodeAnswers' | 'mobileCaseContainmentSelections' | 'mobileCaseIndependentAnswers'
  | 'mobileCaseFindingSelections' | 'mobileCaseReportSelections';

const stages = ['Вводная', 'Основа', 'Android', 'Токены', 'Hardening', 'Локализация', 'iOS / Отчёт', 'Готово'];
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const allCorrect = (
  sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[],
  selected: Record<string, string>,
) => sections.every((section) => section.options.find((option) => option.id === selected[section.id])?.correct);

export function MobileCaseApp() {
  const { progress, setFlag, completeMobileCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.mobileCaseStage));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [backupCommand, setBackupCommand] = useState('');
  const [backupHistory, setBackupHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showHints, setShowHints] = useState(false);

  const nextGuided = mobileGuidedObjectives.find((item) => !progress.mobileCaseObjectives.includes(item.id));
  const nextBackup = mobileBackupObjectives.find((item) => !progress.mobileCaseBackupObjectives.includes(item.id));
  const guidedDone = mobileGuidedObjectives.every((item) => progress.mobileCaseObjectives.includes(item.id));
  const backupDone = mobileBackupObjectives.every((item) => progress.mobileCaseBackupObjectives.includes(item.id));
  const independentDone = mobileIndependentCommands.every((item) => progress.mobileCaseIndependentObjectives.includes(item.id));
  const independentPassed = progress.mobileCaseIndependentObjectives.includes('independent-verified');

  const setStage = (value: number) => setFlag('mobileCaseStage', Math.max(progress.mobileCaseStage, Math.min(7, value)));
  const choose = (key: SelectKey, section: string, option: string) => {
    setFlag(key, { ...progress[key], [section]: option });
    setChecked((current) => ({ ...current, [key]: false }));
  };
  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    selections: Record<string, string>, key: SelectKey,
  ) => (
    <div className="windows-question-stack mobile-question-stack">
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

  const commandMatch = (expected: string, raw: string) => {
    const a = normalize(expected); const b = normalize(raw);
    if (a === b) return true;
    if (a.includes('pm list packages')) return b.includes('pm list packages') && b.includes('-3');
    if (a.includes('dumpsys package')) return b.includes('dumpsys package') && b.includes('com.orbit.notes');
    if (a.includes('appops')) return b.includes('appops') && b.includes('com.orbit.notes');
    if (a.includes('enabled_accessibility_services')) return b.includes('enabled_accessibility_services');
    if (a.includes('device_policy')) return b.includes('device_policy');
    if (a.includes('network.log')) return b.includes('network.log');
    if (a.includes('manifest.txt')) return b.includes('manifest.txt');
    if (a.includes('session.xml')) return b.includes('session.xml');
    if (a.startsWith('grep')) return b.includes('rt_courier_71d9') && b.includes('auth.log');
    return false;
  };

  const runGuided = () => {
    if (!nextGuided || !command.trim()) return;
    const ok = commandMatch(nextGuided.command, command);
    setHistory((current) => [...current, { command, output: ok ? nextGuided.output : `Сейчас нужно: ${nextGuided.title}.`, ok }]);
    setCommand('');
    if (ok) setFlag('mobileCaseObjectives', [...progress.mobileCaseObjectives, nextGuided.id]);
  };
  const runBackup = () => {
    if (!nextBackup || !backupCommand.trim()) return;
    const ok = commandMatch(nextBackup.command, backupCommand);
    setBackupHistory((current) => [...current, { command: backupCommand, output: ok ? nextBackup.output : `Сейчас нужно: ${nextBackup.title}.`, ok }]);
    setBackupCommand('');
    if (ok) setFlag('mobileCaseBackupObjectives', [...progress.mobileCaseBackupObjectives, nextBackup.id]);
  };
  const runIndependent = () => {
    if (!independentCommand.trim()) return;
    const found = mobileIndependentCommands.find((item) => normalize(item.command) === normalize(independentCommand));
    setIndependentHistory((current) => [...current, { command: independentCommand, output: found ? found.output : 'В снимке нет такого артефакта.', ok: Boolean(found) }]);
    setIndependentCommand('');
    if (found && !progress.mobileCaseIndependentObjectives.includes(found.id)) setFlag('mobileCaseIndependentObjectives', [...progress.mobileCaseIndependentObjectives, found.id]);
  };
  const insert = (value: string, target: 'guided' | 'backup' | 'independent') => {
    if (target === 'guided') setCommand(value);
    if (target === 'backup') setBackupCommand(value);
    if (target === 'independent') setIndependentCommand(value);
    setFlag('mobileCaseHintUses', progress.mobileCaseHintUses + 1);
  };
  const patchCorrect = () => {
    const code = progress.mobileCasePatch;
    return /allowBackup="false"/i.test(code)
      && /usesCleartextTraffic="false"/i.test(code)
      && /EncryptedSharedPreferences/.test(code)
      && /MasterKey/.test(code)
      && !/READ_SMS/.test(code);
  };
  const verify = (key: SelectKey, sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[], next: number) => {
    setChecked((current) => ({ ...current, [key]: true }));
    if (allCorrect(sections, progress[key])) setStage(next);
  };

  return <div className="route-case-app windows-case-app linux-case-app network-case-app web-case-app mobile-case-app">
    <aside className="route-case-sidebar windows-case-sidebar mobile-case-sidebar">
      <header><p className="eyebrow">MIRRORCELL-05</p><h2>Mobile Security</h2><span>ANDROID / iOS</span></header>
      <nav>{stages.map((name, index) => <button key={name} disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
      <footer><LockKeyhole size={15} /><div><strong>FORENSIC CLONE</strong><span>no live targets</span></div></footer>
    </aside>

    <main className="route-case-main windows-case-main mobile-case-main app-scroll">
      {stage === 0 && <section className="route-brief-stage windows-brief-stage mobile-brief-stage">
        <header><Smartphone size={29} /><div><p className="eyebrow">CASE / MIRRORCELL-05</p><h1>Телефон вернули. Сессия осталась.</h1></div></header>
        <div className="route-brief-grid windows-brief-grid">{mobileCaseOverview.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        <div className="windows-theory warning"><strong>Игорь</strong><p>Курьер потерял телефон на два часа. Ночью кто-то выгрузил маршруты. Есть образ, MDM-журнал и копия OAuth-событий. Прод не трогай.</p></div>
        <div className="mobile-device-layout">
          <div className="mobile-phone-mock"><span>02:28</span><Smartphone size={42} /><strong>COURIER-A13</strong><small>Android 15 / isolated</small></div>
          <div className="mobile-architecture-grid">{mobileArchitecture.map((item) => <article key={item.id}><span>{item.role}</span><strong>{item.title}</strong><p>{item.subtitle}</p><code>{item.address}</code></article>)}</div>
        </div>
        <button className="primary-action full" onClick={() => setStage(1)}>Разобрать мобильную модель угроз<ArrowRight size={17} /></button>
      </section>}

      {stage === 1 && <section className="route-choice-stage mobile-foundation-stage">
        <header><Fingerprint size={23} /><div><p className="eyebrow">MOBILE FOUNDATIONS</p><h2>Разрешения, специальные доступы и токены</h2></div></header>
        <div className="network-theory-strip mobile-theory-strip">
          <article><strong>PERMISSIONS</strong><p>Обычные разрешения дают доступ к данным и датчикам.</p></article>
          <article><strong>SPECIAL ACCESS</strong><p>Accessibility и Device Admin дают глубокий контроль.</p></article>
          <article><strong>PROFILE</strong><p>MDM или VPN-профиль меняет политику и трафик устройства.</p></article>
          <article><strong>TOKEN</strong><p>Refresh token может пережить смену пароля и создать новую сессию.</p></article>
        </div>
        {renderOptions(mobileFoundationQuestions, progress.mobileCaseFoundationAnswers, 'mobileCaseFoundationAnswers')}
        <button className="primary-action full" onClick={() => verify('mobileCaseFoundationAnswers', mobileFoundationQuestions, 2)}>Проверить основу<ArrowRight size={17} /></button>
      </section>}

      {stage === 2 && <section className="windows-terminal-stage mobile-terminal-stage">
        <header><PackageSearch size={23} /><div><p className="eyebrow">ANDROID / ADB</p><h2>Найди пакет, полномочия и внешний канал</h2></div></header>
        <div className="windows-theory"><strong>{nextGuided?.title ?? 'Сбор завершён'}</strong><p>{nextGuided ? 'Вводи команду в копии образа. Она только читает артефакты.' : 'Теперь свяжи пакет, специальные доступы и сеть.'}</p>{nextGuided && <code>{nextGuided.command}</code>}</div>
        <div className="windows-terminal-box"><div className="windows-terminal-history">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
          {nextGuided && <div className="windows-terminal-input"><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runGuided()} placeholder="adb shell ..." /><button onClick={() => insert(nextGuided.command, 'guided')}>Вставить</button><button className="primary-action" onClick={runGuided}>Выполнить</button></div>}
        </div>
        {guidedDone && <>{renderOptions(mobileSessionQuestions, progress.mobileCaseSessionAnswers, 'mobileCaseSessionAnswers')}<button className="primary-action full" onClick={() => verify('mobileCaseSessionAnswers', mobileSessionQuestions, 3)}>Перейти к backup и токенам<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 3 && <section className="windows-terminal-stage mobile-token-stage">
        <header><KeyRound size={23} /><div><p className="eyebrow">BACKUP / OAUTH</p><h2>Восстанови цепочку сессии</h2></div></header>
        <div className="mobile-session-flow"><article><FileArchive size={22} /><strong>Backup</strong><span>session.xml</span></article><ArrowRight size={18} /><article><KeyRound size={22} /><strong>Refresh token</strong><span>rt_courier_71d9</span></article><ArrowRight size={18} /><article><Network size={22} /><strong>Remote use</strong><span>203.0.113.77</span></article></div>
        <div className="windows-theory"><strong>{nextBackup?.title ?? 'Цепочка собрана'}</strong><p>Сначала докажи, что токен был в backup, затем найди его использование на сервере.</p>{nextBackup && <code>{nextBackup.command}</code>}</div>
        <div className="windows-terminal-box"><div className="windows-terminal-history">{backupHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
          {nextBackup && <div className="windows-terminal-input"><span>$</span><input value={backupCommand} onChange={(event) => setBackupCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runBackup()} /><button onClick={() => insert(nextBackup.command, 'backup')}>Вставить</button><button className="primary-action" onClick={runBackup}>Выполнить</button></div>}
        </div>
        {backupDone && <>{renderOptions(mobileTokenQuestions, progress.mobileCaseTokenAnswers, 'mobileCaseTokenAnswers')}<button className="primary-action full" onClick={() => verify('mobileCaseTokenAnswers', mobileTokenQuestions, 4)}>Исправить мобильное приложение<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 4 && <section className="web-code-stage mobile-code-stage">
        <header><Code2 size={23} /><div><p className="eyebrow">ANDROID HARDENING</p><h2>Убери лишние разрешения и открытое хранение</h2></div></header>
        <div className="windows-theory"><strong>Задача</strong><p>Запрети backup и cleartext, убери READ_SMS, перенеси refresh token в EncryptedSharedPreferences с MasterKey.</p></div>
        <div className="web-code-workspace"><div className="web-code-reference"><span>Уязвимая версия</span><pre>{mobileVulnerablePatch}</pre></div><div className="web-code-editor"><span>Твой патч</span><textarea spellCheck={false} value={progress.mobileCasePatch} onChange={(event) => setFlag('mobileCasePatch', event.target.value)} /><button onClick={() => setFlag('mobileCasePatch', mobileSecurePatch)}>Вставить безопасный вариант</button></div></div>
        {renderOptions(mobileCodeQuestions, progress.mobileCaseCodeAnswers, 'mobileCaseCodeAnswers')}
        <button className="primary-action full" onClick={() => { setChecked((current) => ({ ...current, mobileCaseCodeAnswers: true })); if (patchCorrect() && allCorrect(mobileCodeQuestions, progress.mobileCaseCodeAnswers)) setStage(5); }}>Проверить hardening<ArrowRight size={17} /></button>
      </section>}

      {stage === 5 && <section className="route-choice-stage mobile-containment-stage">
        <header><WifiOff size={23} /><div><p className="eyebrow">CONTAINMENT</p><h2>Закрой доступ и не уничтожь доказательства</h2></div></header>
        {renderOptions(mobileContainmentSections, progress.mobileCaseContainmentSelections, 'mobileCaseContainmentSelections')}
        <button className="primary-action full" onClick={() => verify('mobileCaseContainmentSelections', mobileContainmentSections, 6)}>Перейти ко второму устройству<ArrowRight size={17} /></button>
      </section>}

      {stage === 6 && !independentPassed && <section className="windows-terminal-stage mobile-independent-stage">
        <header><Smartphone size={23} /><div><p className="eyebrow">OPS-IOS-08 / INDEPENDENT</p><h2>Разбери iPhone без готового порядка</h2></div></header>
        <div className="windows-theory"><strong>Дано</strong><p>Устройство управляется MDM. Проверь inventory, профили, backup, OAuth и сеть. Свяжи артефакты сам.</p></div>
        <div className="windows-terminal-box"><div className="windows-terminal-history">{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div><div className="windows-terminal-input"><span>$</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runIndependent()} placeholder="cat second-device/..." /><button onClick={() => setShowHints((value) => !value)}>Артефакты</button><button className="primary-action" onClick={runIndependent}>Выполнить</button></div></div>
        {showHints && <div className="mobile-artifact-grid">{mobileIndependentCommands.map((item) => <button key={item.id} onClick={() => insert(item.command, 'independent')}><TerminalSquare size={16} /><span>{item.command}</span></button>)}</div>}
        {independentDone && <>{renderOptions(mobileIndependentQuestions, progress.mobileCaseIndependentAnswers, 'mobileCaseIndependentAnswers')}<button className="primary-action full" onClick={() => { setChecked((current) => ({ ...current, mobileCaseIndependentAnswers: true })); if (allCorrect(mobileIndependentQuestions, progress.mobileCaseIndependentAnswers)) setFlag('mobileCaseIndependentObjectives', [...progress.mobileCaseIndependentObjectives, 'independent-verified']); }}>Проверить расследование<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 6 && independentPassed && <section className="route-choice-stage mobile-report-stage">
        <header><ClipboardList size={23} /><div><p className="eyebrow">FINAL REPORT</p><h2>Собери вывод по Android и iOS</h2></div></header>
        {renderOptions(mobileFindingSections, progress.mobileCaseFindingSelections, 'mobileCaseFindingSelections')}
        {renderOptions(mobileReportSections, progress.mobileCaseReportSelections, 'mobileCaseReportSelections')}
        <button className="primary-action full" onClick={() => { setChecked((current) => ({ ...current, mobileCaseFindingSelections: true, mobileCaseReportSelections: true })); if (allCorrect(mobileFindingSections, progress.mobileCaseFindingSelections) && allCorrect(mobileReportSections, progress.mobileCaseReportSelections)) setStage(7); }}>Сдать отчёт<ArrowRight size={17} /></button>
      </section>}

      {stage === 7 && <section className="route-complete-stage mobile-complete-stage">
        <ShieldCheck size={54} /><p className="eyebrow">MIRRORCELL-05 / COMPLETE</p><h1>Две мобильные сессии закрыты</h1><p>Ты связал приложение, специальные полномочия, backup, refresh token, VPN-профиль и серверные события.</p>
        <div className="route-complete-grid"><article><Fingerprint size={21} /><strong>Mobile Security</strong><span>permissions / profiles / tokens</span></article><article><FileCheck2 size={21} /><strong>DFIR</strong><span>images / manifests / logs</span></article><article><UserRoundCheck size={21} /><strong>Incident Response</strong><span>containment / revocation / fleet hunt</span></article></div>
        <button className="primary-action full" onClick={completeMobileCase}>Закрыть MIRRORCELL-05</button>
      </section>}
    </main>
  </div>;
}
