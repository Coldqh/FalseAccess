import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowRight, CheckCircle2, ClipboardList, FileCheck2, FileSearch, KeyRound,
  LockKeyhole, MailWarning, Network, ScanSearch, ShieldCheck, TerminalSquare, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  mailArchitecture, mailAttachmentObjectives, mailAttachmentQuestions, mailCaseOverview,
  mailContainmentSections, mailFindingSections, mailFoundationQuestions, mailGatewayObjectives,
  mailHeaderObjectives, mailHeaderQuestions, mailIndependentCommands, mailIndependentQuestions,
  mailPolicyQuestions, mailReportSections, mailSecurePolicy, mailVulnerablePolicy,
} from '../missions/mail01';

type HistoryEntry = { command: string; output: string; ok: boolean };
type SelectKey =
  | 'mailCaseFoundationAnswers' | 'mailCaseHeaderAnswers' | 'mailCaseAttachmentAnswers'
  | 'mailCasePolicyAnswers' | 'mailCaseContainmentSelections' | 'mailCaseIndependentAnswers'
  | 'mailCaseFindingSelections' | 'mailCaseReportSelections';
type ObjectiveKey = 'mailCaseHeaderObjectives' | 'mailCaseAttachmentObjectives' | 'mailCaseGatewayObjectives';
type Objective = { id: string; title: string; command: string; output: string };

const stages = ['Вводная', 'Основа', 'Заголовки', 'Вложение', 'Шлюз', 'Локализация', 'Второе письмо', 'Готово'];
const normalize = (value: string) => value.trim().toLowerCase().replace(/["']/g, '').replace(/\\+/g, '\\').replace(/\s+/g, ' ');
const allCorrect = (
  sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[],
  selected: Record<string, string>,
) => sections.every((section) => section.options.find((option) => option.id === selected[section.id])?.correct);

export function MailCaseApp() {
  const { progress, setFlag, completeMailCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.mailCaseStage));
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [headerCommand, setHeaderCommand] = useState('');
  const [headerHistory, setHeaderHistory] = useState<HistoryEntry[]>([]);
  const [attachmentCommand, setAttachmentCommand] = useState('');
  const [attachmentHistory, setAttachmentHistory] = useState<HistoryEntry[]>([]);
  const [gatewayCommand, setGatewayCommand] = useState('');
  const [gatewayHistory, setGatewayHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showHints, setShowHints] = useState(false);

  const nextHeader = mailHeaderObjectives.find((item) => !progress.mailCaseHeaderObjectives.includes(item.id));
  const nextAttachment = mailAttachmentObjectives.find((item) => !progress.mailCaseAttachmentObjectives.includes(item.id));
  const nextGateway = mailGatewayObjectives.find((item) => !progress.mailCaseGatewayObjectives.includes(item.id));
  const headerDone = mailHeaderObjectives.every((item) => progress.mailCaseHeaderObjectives.includes(item.id));
  const attachmentDone = mailAttachmentObjectives.every((item) => progress.mailCaseAttachmentObjectives.includes(item.id));
  const gatewayDone = mailGatewayObjectives.every((item) => progress.mailCaseGatewayObjectives.includes(item.id));
  const independentDone = mailIndependentCommands.every((item) => progress.mailCaseIndependentObjectives.includes(item.id));

  const setStage = (value: number) => setFlag('mailCaseStage', Math.max(progress.mailCaseStage, Math.min(7, value)));

  const choose = (key: SelectKey, section: string, option: string) => {
    setFlag(key, { ...progress[key], [section]: option });
    setChecked((current) => ({ ...current, [key]: false }));
  };

  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    selections: Record<string, string>,
    key: SelectKey,
  ) => (
    <div className="windows-question-stack mail-question-stack">
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
    const a = normalize(expected);
    const b = normalize(raw);
    if (a === b) return true;
    if (a.startsWith('cat payment-update')) return b.includes('cat') && b.includes('payment-update.eml');
    if (a.includes("grep -i '^received:'")) return b.includes('grep') && b.includes('received') && b.includes('payment-update.eml');
    if (a.includes('authentication-results')) return b.includes('grep') && b.includes('authentication-results') && b.includes('payment-update.eml');
    if (a.startsWith('dig txt')) return b.includes('dig') && b.includes('_dmarc.cinderline-pay.com');
    if (a.startsWith('file settlement_change')) return b.includes('file') && b.includes('settlement_change.docm');
    if (a.startsWith('sha256sum')) return b.includes('sha256') && b.includes('settlement_change.docm');
    if (a.startsWith('strings')) return b.includes('strings') && b.includes('settlement_change.docm');
    if (a.includes('endpoint-events')) return b.includes('grep') && b.includes('endpoint-events.jsonl');
    if (a.includes('proxy.log')) return b.includes('grep') && b.includes('proxy.log');
    if (a.startsWith('cat gateway-policy')) return b.includes('cat') && b.includes('gateway-policy.yml');
    if (a.startsWith('cat mailbox-audit')) return b.includes('cat') && b.includes('mailbox-audit.jsonl');
    return false;
  };

  const runObjective = (
    command: string,
    setCommand: (value: string) => void,
    setHistory: Dispatch<SetStateAction<HistoryEntry[]>>,
    next: Objective | undefined,
    key: ObjectiveKey,
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
    const found = mailIndependentCommands.find((item) => {
      const expected = normalize(item.command);
      if (expected === normalized) return true;
      if (expected.startsWith('cat partner-reset')) return normalized.includes('cat') && normalized.includes('partner-reset.eml');
      if (expected.startsWith('cat url-rewrite')) return normalized.includes('cat') && normalized.includes('url-rewrite.log');
      if (expected.includes('oauth-audit')) return normalized.includes('grep') && normalized.includes('oauth-audit.jsonl');
      if (expected.includes('mailbox-activity')) return normalized.includes('grep') && normalized.includes('mailbox-activity.jsonl');
      if (expected.includes('tenant-audit')) return normalized.includes('grep') && normalized.includes('tenant-audit');
      return false;
    });
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: found ? found.output : 'В копии второго инцидента такого артефакта нет.',
      ok: Boolean(found),
    }]);
    setIndependentCommand('');
    if (found && !progress.mailCaseIndependentObjectives.includes(found.id)) {
      setFlag('mailCaseIndependentObjectives', [...progress.mailCaseIndependentObjectives, found.id]);
    }
  };

  const insert = (value: string, target: 'header' | 'attachment' | 'gateway' | 'independent') => {
    if (target === 'header') setHeaderCommand(value);
    if (target === 'attachment') setAttachmentCommand(value);
    if (target === 'gateway') setGatewayCommand(value);
    if (target === 'independent') setIndependentCommand(value);
    setFlag('mailCaseHintUses', progress.mailCaseHintUses + 1);
  };

  const verify = (key: SelectKey, sections: readonly { id: string; options: readonly { id: string; correct?: boolean }[] }[], next: number) => {
    setChecked((current) => ({ ...current, [key]: true }));
    if (allCorrect(sections, progress[key])) setStage(next);
  };

  const policyCorrect = () => {
    const value = progress.mailCasePolicy;
    return /action_on_fail:\s*quarantine/i.test(value)
      && /macro_documents:\s*sandbox/i.test(value)
      && /external_forwarding:\s*block/i.test(value)
      && /user_oauth_consent:\s*admin_approval/i.test(value)
      && /revoke_refresh_tokens:\s*true/i.test(value);
  };

  const verifyPolicy = () => {
    setChecked((current) => ({ ...current, mailCasePolicyAnswers: true }));
    if (gatewayDone && policyCorrect() && allCorrect(mailPolicyQuestions, progress.mailCasePolicyAnswers)) setStage(5);
  };

  const verifyFinal = () => {
    setChecked((current) => ({
      ...current,
      mailCaseIndependentAnswers: true,
      mailCaseFindingSelections: true,
      mailCaseReportSelections: true,
    }));
    if (independentDone
      && allCorrect(mailIndependentQuestions, progress.mailCaseIndependentAnswers)
      && allCorrect(mailFindingSections, progress.mailCaseFindingSelections)
      && allCorrect(mailReportSections, progress.mailCaseReportSelections)) setStage(7);
  };

  const renderConsole = (
    next: Objective | undefined,
    command: string,
    setCommand: (value: string) => void,
    history: HistoryEntry[],
    run: () => void,
    target: 'header' | 'attachment' | 'gateway',
  ) => <>
    <div className="windows-theory"><strong>{next?.title ?? 'Сбор завершён'}</strong><p>{next ? 'Команда читает только сохранённые артефакты.' : 'Теперь свяжи результаты.'}</p>{next && <code>{next.command}</code>}</div>
    <div className="windows-terminal-box mail-terminal-box">
      <div className="windows-terminal-history">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
      {next && <div className="windows-terminal-input"><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && run()} placeholder="Введи команду" /><button onClick={() => insert(next.command, target)}>Вставить</button><button className="primary-action" onClick={run}>Выполнить</button></div>}
    </div>
  </>;

  return <div className="route-case-app windows-case-app mail-case-app">
    <aside className="route-case-sidebar windows-case-sidebar mail-case-sidebar">
      <header><p className="eyebrow">BLACKPOST-07</p><h2>Mail Security</h2><span>SMTP / OAUTH / ENDPOINT</span></header>
      <nav>{stages.map((name, index) => <button key={name} disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
      <footer><LockKeyhole size={15} /><div><strong>MAIL CLONE</strong><span>synthetic evidence</span></div></footer>
    </aside>

    <main className="route-case-main windows-case-main mail-case-main app-scroll">
      {stage === 0 && <section className="route-brief-stage windows-brief-stage mail-brief-stage">
        <header><MailWarning size={29} /><div><p className="eyebrow">CASE / BLACKPOST-07</p><h1>Письмо пришло от своих. Деньги ушли не туда.</h1></div></header>
        <div className="route-brief-grid windows-brief-grid">{mailCaseOverview.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        <div className="windows-theory warning"><strong>Игорь</strong><p>Бухгалтер открыл новый реквизит из письма. Через две минуты на его машине пошёл PowerShell. Есть копия письма, шлюза, ящика и двух рабочих станций. Разбери всё.</p></div>
        <div className="mail-architecture-grid">{mailArchitecture.map((item) => <article key={item.id}><span>{item.role}</span><Network size={21} /><strong>{item.title}</strong><p>{item.subtitle}</p><code>{item.address}</code></article>)}</div>
        <button className="primary-action full" onClick={() => setStage(1)}>Разобрать почтовую цепочку<ArrowRight size={17} /></button>
      </section>}

      {stage === 1 && <section className="route-choice-stage mail-foundation-stage">
        <header><MailWarning size={23} /><div><p className="eyebrow">MAIL FOUNDATIONS</p><h2>From, SMTP, SPF, DKIM и DMARC</h2></div></header>
        <div className="network-theory-strip mail-theory-strip">
          <article><strong>ENVELOPE</strong><p>SMTP использует отдельный адрес возврата. Видимый From может отличаться.</p></article>
          <article><strong>SPF</strong><p>Проверяет, разрешён ли отправивший сервер для envelope-домена.</p></article>
          <article><strong>DKIM</strong><p>Проверяет подпись домена и целостность подписанных частей.</p></article>
          <article><strong>DMARC</strong><p>Сверяет видимый From со SPF/DKIM и применяет политику.</p></article>
          <article><strong>RECEIVED</strong><p>Показывает путь письма между почтовыми узлами.</p></article>
        </div>
        {renderOptions(mailFoundationQuestions, progress.mailCaseFoundationAnswers, 'mailCaseFoundationAnswers')}
        <button className="primary-action full" onClick={() => verify('mailCaseFoundationAnswers', mailFoundationQuestions, 2)}>Проверить основу<ArrowRight size={17} /></button>
      </section>}

      {stage === 2 && <section className="windows-terminal-stage mail-header-stage">
        <header><FileSearch size={23} /><div><p className="eyebrow">RAW EML / DNS</p><h2>Докажи подмену по заголовкам</h2></div></header>
        {renderConsole(nextHeader, headerCommand, setHeaderCommand, headerHistory, () => runObjective(headerCommand, setHeaderCommand, setHeaderHistory, nextHeader, 'mailCaseHeaderObjectives'), 'header')}
        {headerDone && <>{renderOptions(mailHeaderQuestions, progress.mailCaseHeaderAnswers, 'mailCaseHeaderAnswers')}<button className="primary-action full" onClick={() => verify('mailCaseHeaderAnswers', mailHeaderQuestions, 3)}>Перейти к вложению и машине<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 3 && <section className="windows-terminal-stage mail-attachment-stage">
        <header><ScanSearch size={23} /><div><p className="eyebrow">ATTACHMENT / ENDPOINT / PROXY</p><h2>Свяжи документ, процесс и сеть</h2></div></header>
        <div className="mail-chain-strip"><article><strong>OUTLOOK</strong><span>message opened</span></article><ArrowRight size={17} /><article><strong>WINWORD</strong><span>docm</span></article><ArrowRight size={17} /><article><strong>PowerShell</strong><span>preview.ps1</span></article><ArrowRight size={17} /><article><strong>TLS</strong><span>203.0.113.71</span></article></div>
        {renderConsole(nextAttachment, attachmentCommand, setAttachmentCommand, attachmentHistory, () => runObjective(attachmentCommand, setAttachmentCommand, setAttachmentHistory, nextAttachment, 'mailCaseAttachmentObjectives'), 'attachment')}
        {attachmentDone && <>{renderOptions(mailAttachmentQuestions, progress.mailCaseAttachmentAnswers, 'mailCaseAttachmentAnswers')}<button className="primary-action full" onClick={() => verify('mailCaseAttachmentAnswers', mailAttachmentQuestions, 4)}>Проверить шлюз и ящик<ArrowRight size={17} /></button></>}
      </section>}

      {stage === 4 && <section className="web-code-stage mail-policy-stage">
        <header><KeyRound size={23} /><div><p className="eyebrow">GATEWAY / MAILBOX</p><h2>Закрой доставку, пересылку и OAuth</h2></div></header>
        {renderConsole(nextGateway, gatewayCommand, setGatewayCommand, gatewayHistory, () => runObjective(gatewayCommand, setGatewayCommand, setGatewayHistory, nextGateway, 'mailCaseGatewayObjectives'), 'gateway')}
        {gatewayDone && <>
          <div className="web-code-layout mail-code-layout">
            <article className="web-code-card vulnerable"><header><b>Текущая политика</b><span>gateway-policy.yml</span></header><pre>{mailVulnerablePolicy}</pre></article>
            <article className="web-code-card"><header><b>Исправление</b><button onClick={() => { setFlag('mailCasePolicy', mailSecurePolicy); setFlag('mailCaseHintUses', progress.mailCaseHintUses + 1); }}>Вставить безопасный вариант</button></header><textarea value={progress.mailCasePolicy} onChange={(event) => setFlag('mailCasePolicy', event.target.value)} spellCheck={false} placeholder="gateway-policy.yml" /></article>
          </div>
          {renderOptions(mailPolicyQuestions, progress.mailCasePolicyAnswers, 'mailCasePolicyAnswers')}
          {checked.mailCasePolicyAnswers && !policyCorrect() && <div className="web-inline-error">Нужны карантин DMARC fail, sandbox для макросов, запрет внешней пересылки, admin approval для OAuth и отзыв refresh tokens.</div>}
          <button className="primary-action full" onClick={verifyPolicy}>Проверить политику<ArrowRight size={17} /></button>
        </>}
      </section>}

      {stage === 5 && <section className="route-choice-stage mail-containment-stage">
        <header><ShieldCheck size={23} /><div><p className="eyebrow">CONTAINMENT</p><h2>Останови цепочку и сохрани доказательства</h2></div></header>
        <div className="windows-theory"><strong>Не своди всё к удалению письма</strong><p>Инцидент затронул доставку, рабочую станцию, сетевой канал, правило ящика и OAuth-сессию.</p></div>
        {renderOptions(mailContainmentSections, progress.mailCaseContainmentSelections, 'mailCaseContainmentSelections')}
        <button className="primary-action full" onClick={() => verify('mailCaseContainmentSelections', mailContainmentSections, 6)}>Перейти ко второму письму<ArrowRight size={17} /></button>
      </section>}

      {stage === 6 && <section className="windows-independent-stage mail-independent-stage">
        <header><TerminalSquare size={23} /><div><p className="eyebrow">INDEPENDENT / OAUTH PHISH</p><h2>Второй инцидент без готового порядка</h2></div></header>
        <div className="windows-theory warning"><strong>Условия</strong><p>Вложений нет. SPF, DKIM и DMARC проходят. Один сотрудник дал приложению доступ к ящику. Сам восстанови цепочку и масштаб.</p></div>
        <button className="secondary-action" onClick={() => setShowHints((value) => !value)}>{showHints ? 'Скрыть артефакты' : 'Показать доступные артефакты'}</button>
        {showHints && <div className="windows-command-bank mail-command-bank">{mailIndependentCommands.map((item) => <button key={item.id} onClick={() => insert(item.command, 'independent')}><strong>{item.id}</strong><code>{item.command}</code></button>)}</div>}
        <div className="windows-terminal-box mail-terminal-box"><div className="windows-terminal-history">{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><code>$ {entry.command}</code><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div><div className="windows-terminal-input"><span>$</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runIndependent()} placeholder="Выбери артефакт сам" /><button className="primary-action" onClick={runIndependent}>Выполнить</button></div></div>
        {independentDone && <>
          {renderOptions(mailIndependentQuestions, progress.mailCaseIndependentAnswers, 'mailCaseIndependentAnswers')}
          <div className="mail-final-grid"><section><header><FileCheck2 size={20} /><strong>Выводы</strong></header>{renderOptions(mailFindingSections, progress.mailCaseFindingSelections, 'mailCaseFindingSelections')}</section><section><header><ClipboardList size={20} /><strong>Отчёт</strong></header>{renderOptions(mailReportSections, progress.mailCaseReportSelections, 'mailCaseReportSelections')}</section></div>
          <button className="primary-action full" onClick={verifyFinal}>Проверить расследование<ArrowRight size={17} /></button>
        </>}
      </section>}

      {stage === 7 && <section className="route-complete-stage windows-complete-stage mail-complete-stage">
        <ShieldCheck size={52} /><p className="eyebrow">BLACKPOST-07 / CLOSED</p><h1>Цепочка закрыта. Ящики и машины проверены.</h1><p>Ты связал SMTP, почтовую аутентификацию, вложение, процессы, прокси, правила ящика и OAuth. Второй инцидент разобран самостоятельно.</p>
        <div className="route-result-grid"><article><span>ЭКЗАМЕН</span><strong>MAIL INCIDENT</strong></article><article><span>ОПЛАТА</span><strong>16 500 ₽</strong></article><article><span>ПОДСКАЗКИ</span><strong>{progress.mailCaseHintUses}</strong></article></div>
        <button className="primary-action full" onClick={completeMailCase}>Закрыть BLACKPOST-07<ArrowRight size={17} /></button>
      </section>}
    </main>
  </div>;
}
