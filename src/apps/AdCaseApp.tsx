import { useState } from 'react';
import {
  ArrowRight, CheckCircle2, ClipboardList, Code2, FileCheck2, FolderKey,
  KeyRound, LockKeyhole, Network, ServerCog, ShieldCheck, TerminalSquare,
  UsersRound, Waypoints, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  adArchitecture, adCaseOverview, adCodeQuestions, adContainmentSections,
  adFindingSections, adFoundationQuestions, adGpoObjectives, adIdentityObjectives,
  adIdentityQuestions, adIndependentCommands, adIndependentQuestions,
  adKerberosObjectives, adKerberosQuestions, adReportSections, adSecurePatch,
  adVulnerablePatch,
} from '../missions/ad01';

type HistoryEntry = { command: string; output: string; ok: boolean };
type SelectKey =
  | 'adCaseFoundationAnswers' | 'adCaseIdentityAnswers' | 'adCaseKerberosAnswers'
  | 'adCaseCodeAnswers' | 'adCaseContainmentSelections' | 'adCaseIndependentAnswers'
  | 'adCaseFindingSelections' | 'adCaseReportSelections';

const stages = ['Вводная', 'Основа', 'Учётки', 'Kerberos', 'GPO', 'Локализация', 'Второй домен', 'Готово'];
const normalize = (value: string) => value.trim().toLowerCase().replace(/["']/g, '').replace(/\\+/g, '\\').replace(/\s+/g, ' ');
const allCorrect = (
  sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[],
  selected: Record<string, string>,
) => sections.every((section) => section.options.find((option) => option.id === selected[section.id])?.correct);

export function AdCaseApp() {
  const { progress, setFlag, completeAdCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.adCaseStage));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [identityCommand, setIdentityCommand] = useState('');
  const [identityHistory, setIdentityHistory] = useState<HistoryEntry[]>([]);
  const [kerberosCommand, setKerberosCommand] = useState('');
  const [kerberosHistory, setKerberosHistory] = useState<HistoryEntry[]>([]);
  const [gpoCommand, setGpoCommand] = useState('');
  const [gpoHistory, setGpoHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showHints, setShowHints] = useState(false);

  const nextIdentity = adIdentityObjectives.find((item) => !progress.adCaseIdentityObjectives.includes(item.id));
  const nextKerberos = adKerberosObjectives.find((item) => !progress.adCaseKerberosObjectives.includes(item.id));
  const nextGpo = adGpoObjectives.find((item) => !progress.adCaseGpoObjectives.includes(item.id));
  const identityDone = adIdentityObjectives.every((item) => progress.adCaseIdentityObjectives.includes(item.id));
  const kerberosDone = adKerberosObjectives.every((item) => progress.adCaseKerberosObjectives.includes(item.id));
  const gpoDone = adGpoObjectives.every((item) => progress.adCaseGpoObjectives.includes(item.id));
  const independentDone = adIndependentCommands.every((item) => progress.adCaseIndependentObjectives.includes(item.id));

  const setStage = (value: number) => setFlag('adCaseStage', Math.max(progress.adCaseStage, Math.min(7, value)));
  const choose = (key: SelectKey, section: string, option: string) => {
    setFlag(key, { ...progress[key], [section]: option });
    setChecked((current) => ({ ...current, [key]: false }));
  };
  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    selections: Record<string, string>, key: SelectKey,
  ) => (
    <div className="windows-question-stack ad-question-stack">
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

  const matches = (expected: string, raw: string) => {
    const a = normalize(expected); const b = normalize(raw);
    if (a === b) return true;
    if (a.startsWith('get-addomain')) return b.includes('get-addomain');
    if (a.startsWith('get-aduser -filter')) return b.includes('get-aduser') && b.includes('-filter') && b.includes('lastlogondate');
    if (a.includes('domain admins')) return b.includes('get-adgroupmember') && b.includes('domain admins');
    if (a.includes('file operators')) return b.includes('get-adgroupmember') && b.includes('file operators');
    if (a.includes('svc_reports')) return b.includes('get-aduser') && b.includes('svc_reports') && b.includes('serviceprincipalname');
    if (a === 'klist') return b.includes('klist');
    if (a.includes('get-winevent')) return b.includes('get-winevent') && (b.includes('4769') || b.includes('security'));
    if (a.includes('get-smbsession')) return b.includes('get-smbsession');
    if (a.includes('gpresult')) return b.includes('gpresult');
    if (a.includes('get-gporeport')) return b.includes('get-gporeport') && b.includes('legacy sync agent');
    if (a.includes('get-content')) return b.includes('get-content') && b.includes('legacy-sync.ps1');
    if (a.includes('get-acl')) return b.includes('get-acl') && b.includes('legacy-sync.ps1');
    return false;
  };

  const runObjective = (
    command: string,
    setCommand: (value: string) => void,
    setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>,
    next: { id: string; title: string; command: string; output: string } | undefined,
    key: 'adCaseIdentityObjectives' | 'adCaseKerberosObjectives' | 'adCaseGpoObjectives',
  ) => {
    if (!next || !command.trim()) return;
    const ok = matches(next.command, command);
    setHistory((current) => [...current, { command, output: ok ? next.output : `Сейчас нужно: ${next.title}.`, ok }]);
    setCommand('');
    if (ok && !progress[key].includes(next.id)) setFlag(key, [...progress[key], next.id]);
  };

  const runIndependent = () => {
    if (!independentCommand.trim()) return;
    const normalized = normalize(independentCommand);
    const found = adIndependentCommands.find((item) => {
      const expected = normalize(item.command);
      if (expected === normalized) return true;
      if (expected.includes('get-adtrust')) return normalized.includes('get-adtrust');
      if (expected.includes('get-adcomputer')) return normalized.includes('get-adcomputer') && normalized.includes('ou=branch');
      if (expected.includes('branch backup operators')) return normalized.includes('get-adgroupmember') && normalized.includes('branch backup operators');
      if (expected.includes('get-winevent')) return normalized.includes('get-winevent') && normalized.includes('branch-security.evtx');
      if (expected.includes('get-acl')) return normalized.includes('get-acl') && normalized.includes('svc_backup');
      return false;
    });
    setIndependentHistory((current) => [...current, { command: independentCommand, output: found ? found.output : 'В копии второго сегмента такого артефакта нет.', ok: Boolean(found) }]);
    setIndependentCommand('');
    if (found && !progress.adCaseIndependentObjectives.includes(found.id)) {
      setFlag('adCaseIndependentObjectives', [...progress.adCaseIndependentObjectives, found.id]);
    }
  };

  const insert = (value: string, target: 'identity' | 'kerberos' | 'gpo' | 'independent') => {
    if (target === 'identity') setIdentityCommand(value);
    if (target === 'kerberos') setKerberosCommand(value);
    if (target === 'gpo') setGpoCommand(value);
    if (target === 'independent') setIndependentCommand(value);
    setFlag('adCaseHintUses', progress.adCaseHintUses + 1);
  };

  const patchCorrect = () => {
    const code = progress.adCasePatch;
    return /Disable-ADAccount\s+-Identity\s+ctr_kalinin/i.test(code)
      && /Remove-ADGroupMember[\s\S]*File Operators[\s\S]*ctr_kalinin/i.test(code)
      && /Set-ADUser[\s\S]*svc_reports[\s\S]*TrustedForDelegation\s+\$false/i.test(code)
      && /AccountNotDelegated\s+\$true/i.test(code)
      && !/Start-Process[\s\S]*sync-agent\.exe/i.test(code);
  };

  const verify = (key: SelectKey, sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[], next: number) => {
    setChecked((current) => ({ ...current, [key]: true }));
    if (allCorrect(sections, progress[key])) setStage(next);
  };

  const verifyGpo = () => {
    setChecked((current) => ({ ...current, adCaseCodeAnswers: true }));
    if (gpoDone && patchCorrect() && allCorrect(adCodeQuestions, progress.adCaseCodeAnswers)) setStage(5);
  };

  const verifyFinal = () => {
    setChecked((current) => ({
      ...current,
      adCaseIndependentAnswers: true,
      adCaseFindingSelections: true,
      adCaseReportSelections: true,
    }));
    if (independentDone
      && allCorrect(adIndependentQuestions, progress.adCaseIndependentAnswers)
      && allCorrect(adFindingSections, progress.adCaseFindingSelections)
      && allCorrect(adReportSections, progress.adCaseReportSelections)) setStage(7);
  };

  const renderConsole = (
    next: { title: string; command: string } | undefined,
    command: string,
    setCommand: (value: string) => void,
    history: HistoryEntry[],
    run: () => void,
    target: 'identity' | 'kerberos' | 'gpo',
  ) => <>
    <div className="windows-theory"><strong>{next?.title ?? 'Сбор завершён'}</strong><p>{next ? 'Команда читает данные из изолированной копии домена.' : 'Теперь свяжи результаты и переходи дальше.'}</p>{next && <code>{next.command}</code>}</div>
    <div className="windows-terminal-box ad-terminal-box">
      <div className="windows-terminal-history">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><code>PS&gt; {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
      {next && <div className="windows-terminal-input"><span>PS&gt;</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && run()} placeholder="Get-AD..." /><button onClick={() => insert(next.command, target)}>Вставить</button><button className="primary-action" onClick={run}>Выполнить</button></div>}
    </div>
  </>;

  return <div className="route-case-app windows-case-app network-case-app web-case-app ad-case-app">
    <aside className="route-case-sidebar windows-case-sidebar ad-case-sidebar">
      <header><p className="eyebrow">IRONROOT-06</p><h2>Active Directory</h2><span>IRONROOT.LOCAL</span></header>
      <nav>{stages.map((name, index) => <button key={name} disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
      <footer><LockKeyhole size={15} /><div><strong>DOMAIN CLONE</strong><span>synthetic directory</span></div></footer>
    </aside>

    <main className="route-case-main windows-case-main ad-case-main app-scroll">
      {stage === 0 && <section className="route-brief-stage windows-brief-stage ad-brief-stage">
        <header><Waypoints size={29} /><div><p className="eyebrow">CASE / IRONROOT-06</p><h1>Старый подрядчик всё ещё внутри.</h1></div></header>
        <div className="route-brief-grid windows-brief-grid">{adCaseOverview.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        <div className="windows-theory warning"><strong>Игорь</strong><p>Ночью через старую учётку прошли на jump-host, файловый сервер и приложение. Домен уже клонирован. Нужны путь, закрепление и масштаб. Контроллеры не ломай.</p></div>
        <div className="ad-architecture-grid">{adArchitecture.map((item) => <article key={item.id}><span>{item.role}</span><ServerCog size={22} /><strong>{item.title}</strong><p>{item.subtitle}</p><code>{item.address}</code></article>)}</div>
        <button className="primary-action full" onClick={() => setStage(1)}>Разобрать устройство домена<ArrowRight size={17} /></button>
      </section>}

      {stage === 1 && <section className="route-choice-stage ad-foundation-stage">
        <header><UsersRound size={23} /><div><p className="eyebrow">AD FOUNDATIONS</p><h2>Объекты, группы, Kerberos и GPO</h2></div></header>
        <div className="network-theory-strip ad-theory-strip">
          <article><strong>DIRECTORY</strong><p>AD хранит пользователей, компьютеры, группы и политики.</p></article>
          <article><strong>GROUPS</strong><p>Права обычно выдаются группам, а не отдельным людям.</p></article>
          <article><strong>KERBEROS</strong><p>TGT подтверждает вход, service ticket даёт доступ к сервису.</p></article>
          <article><strong>GPO</strong><p>Одна политика может изменить сразу сотни машин.</p></article>
          <article><strong>ACL</strong><p>Права на объект определяют, кто может его читать или менять.</p></article>
        </div>
        {renderOptions(adFoundationQuestions, progress.adCaseFoundationAnswers, 'adCaseFoundationAnswers')}
        <button className="primary-action full" onClick={() => verify('adCaseFoundationAnswers', adFoundationQuestions, 2)}>Проверить основу<ArrowRight size={17} /></button>
      </section>}

      {stage === 2 && <section className="windows-terminal-stage ad-identity-stage">
        <header><UsersRound size={23} /><div><p className="eyebrow">IDENTITIES / GROUPS</p><h2>Найди старый доступ и лишние права</h2></div></header>
        {renderConsole(nextIdentity, identityCommand, setIdentityCommand, identityHistory, () => runObjective(identityCommand, setIdentityCommand, setIdentityHistory, nextIdentity, 'adCaseIdentityObjectives'), 'identity')}
        {identityDone && <>{renderOptions(adIdentityQuestions, progress.adCaseIdentityAnswers, 'adCaseIdentityAnswers')}<button className="primary-action full" onClick={() => verify('adCaseIdentityAnswers', adIdentityQuestions, 3)}>Перейти к билетам и событиям<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 3 && <section className="windows-terminal-stage ad-kerberos-stage">
        <header><KeyRound size={23} /><div><p className="eyebrow">KERBEROS / EVENT LOGS</p><h2>Восстанови путь между машинами</h2></div></header>
        <div className="ad-path-strip"><article><strong>WS-27</strong><span>initial logon</span></article><ArrowRight size={17} /><article><strong>JUMP-01</strong><span>remote session</span></article><ArrowRight size={17} /><article><strong>FILE-02</strong><span>CIFS ticket</span></article><ArrowRight size={17} /><article><strong>APP-03</strong><span>HTTP ticket</span></article></div>
        {renderConsole(nextKerberos, kerberosCommand, setKerberosCommand, kerberosHistory, () => runObjective(kerberosCommand, setKerberosCommand, setKerberosHistory, nextKerberos, 'adCaseKerberosObjectives'), 'kerberos')}
        {kerberosDone && <>{renderOptions(adKerberosQuestions, progress.adCaseKerberosAnswers, 'adCaseKerberosAnswers')}<button className="primary-action full" onClick={() => verify('adCaseKerberosAnswers', adKerberosQuestions, 4)}>Проверить GPO и SYSVOL<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 4 && <section className="web-code-stage ad-gpo-stage">
        <header><FolderKey size={23} /><div><p className="eyebrow">GPO / SYSVOL / ACL</p><h2>Убери массовое закрепление</h2></div></header>
        {renderConsole(nextGpo, gpoCommand, setGpoCommand, gpoHistory, () => runObjective(gpoCommand, setGpoCommand, setGpoHistory, nextGpo, 'adCaseGpoObjectives'), 'gpo')}
        {gpoDone && <>
          <div className="web-code-layout ad-code-layout">
            <article className="web-code-card vulnerable"><header><b>Текущий вариант</b><span>legacy-sync.ps1</span></header><pre>{adVulnerablePatch}</pre></article>
            <article className="web-code-card"><header><b>Исправление</b><button onClick={() => { setFlag('adCasePatch', adSecurePatch); setFlag('adCaseHintUses', progress.adCaseHintUses + 1); }}>Вставить безопасный вариант</button></header><textarea value={progress.adCasePatch} onChange={(event) => setFlag('adCasePatch', event.target.value)} spellCheck={false} placeholder="# response.ps1" /></article>
          </div>
          {renderOptions(adCodeQuestions, progress.adCaseCodeAnswers, 'adCaseCodeAnswers')}
          {checked.adCaseCodeAnswers && !patchCorrect() && <div className="web-inline-error">В исправлении должны быть отключение ctr_kalinin, удаление лишнего членства, запрет делегации у svc_reports и отсутствие запуска sync-agent.exe.</div>}
          <button className="primary-action full" onClick={verifyGpo}>Проверить исправление<ArrowRight size={17} /></button>
        </>}
      </section>}

      {stage === 5 && <section className="route-choice-stage ad-containment-stage">
        <header><ShieldCheck size={23} /><div><p className="eyebrow">CONTAINMENT</p><h2>Останови доступ и не уничтожь доказательства</h2></div></header>
        <div className="windows-theory"><strong>Порядок имеет значение</strong><p>Сначала фиксируются артефакты. Потом отключаются учётки, сессии, GPO и лишние права. Изменения сервисной учётки согласуются с владельцем APP-03.</p></div>
        {renderOptions(adContainmentSections, progress.adCaseContainmentSelections, 'adCaseContainmentSelections')}
        <button className="primary-action full" onClick={() => verify('adCaseContainmentSelections', adContainmentSections, 6)}>Перейти ко второму сегменту<ArrowRight size={17} /></button>
      </section>}

      {stage === 6 && <section className="windows-independent-stage ad-independent-stage">
        <header><Network size={23} /><div><p className="eyebrow">INDEPENDENT / BRANCH DOMAIN</p><h2>Второй сегмент без готового порядка</h2></div></header>
        <div className="windows-theory warning"><strong>Условия</strong><p>В branch-сегменте есть собственный файловый сервер, временная helpdesk-учётка и сервис резервного копирования. Сам выбери, какие артефакты читать и в каком порядке.</p></div>
        <button className="secondary-action" onClick={() => setShowHints((value) => !value)}>{showHints ? 'Скрыть доступные команды' : 'Показать список артефактов'}</button>
        {showHints && <div className="windows-command-bank ad-command-bank">{adIndependentCommands.map((item) => <button key={item.id} onClick={() => insert(item.command, 'independent')}><strong>{item.id}</strong><code>{item.command}</code></button>)}</div>}
        <div className="windows-terminal-box ad-terminal-box"><div className="windows-terminal-history">{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><code>PS&gt; {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div><div className="windows-terminal-input"><span>PS&gt;</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runIndependent()} placeholder="Выбери команду сам" /><button className="primary-action" onClick={runIndependent}>Выполнить</button></div></div>
        {independentDone && <>
          {renderOptions(adIndependentQuestions, progress.adCaseIndependentAnswers, 'adCaseIndependentAnswers')}
          <div className="ad-final-grid"><section><header><FileCheck2 size={20} /><strong>Выводы</strong></header>{renderOptions(adFindingSections, progress.adCaseFindingSelections, 'adCaseFindingSelections')}</section><section><header><ClipboardList size={20} /><strong>Отчёт</strong></header>{renderOptions(adReportSections, progress.adCaseReportSelections, 'adCaseReportSelections')}</section></div>
          <button className="primary-action full" onClick={verifyFinal}>Проверить расследование<ArrowRight size={17} /></button>
        </>}
      </section>}

      {stage === 7 && <section className="route-complete-stage windows-complete-stage ad-complete-stage">
        <ShieldCheck size={52} /><p className="eyebrow">IRONROOT-06 / CLOSED</p><h1>Домен очищен. Масштаб зафиксирован.</h1><p>Старая учётка отключена, вредная GPO убрана, права SYSVOL и сервисной учётки исправлены. Второй сегмент включён в расследование.</p>
        <div className="route-result-grid"><article><span>ЭКЗАМЕН</span><strong>ENTERPRISE ACCESS</strong></article><article><span>ОПЛАТА</span><strong>15 000 ₽</strong></article><article><span>ПОДСКАЗКИ</span><strong>{progress.adCaseHintUses}</strong></article></div>
        <button className="primary-action full" onClick={completeAdCase}>Закрыть IRONROOT-06<ArrowRight size={17} /></button>
      </section>}
    </main>
  </div>;
}
