import { useState } from 'react';
import {
  Activity, ArrowRight, Cable, CheckCircle2, ClipboardList, FileCheck2, Network,
  Radar, Router, ShieldCheck, TerminalSquare, Wifi, XCircle,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  networkCaptureObjectives, networkCaseOverview, networkContainmentSections,
  networkFindingSections, networkFoundationQuestions, networkGuidedObjectives,
  networkIndependentCommands, networkIndependentQuestions, networkProtocolQuestions,
  networkReportSections, networkTopology,
} from '../missions/network01';

type HistoryEntry = { command: string; output: string; ok: boolean };

const stageNames = ['Сеть', 'Основа', 'Маршрутизатор', 'Трафик', 'Изоляция', 'Второй сегмент', 'Отчёт', 'Готово'];

function normalizeCommand(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*\|\s*/g, ' | ');
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

export function NetworkCaseApp() {
  const { progress, setFlag, completeNetworkCase } = useProgress();
  const stage = Math.min(7, Math.max(0, progress.networkCaseStage));
  const [foundationChecked, setFoundationChecked] = useState(false);
  const [protocolChecked, setProtocolChecked] = useState(false);
  const [containmentChecked, setContainmentChecked] = useState(false);
  const [independentChecked, setIndependentChecked] = useState(false);
  const [findingsChecked, setFindingsChecked] = useState(false);
  const [reportChecked, setReportChecked] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [captureCommand, setCaptureCommand] = useState('');
  const [captureHistory, setCaptureHistory] = useState<HistoryEntry[]>([]);
  const [independentCommand, setIndependentCommand] = useState('');
  const [independentHistory, setIndependentHistory] = useState<HistoryEntry[]>([]);
  const [showIndependentHints, setShowIndependentHints] = useState(false);

  const setStage = (value: number) => setFlag('networkCaseStage', Math.min(7, Math.max(progress.networkCaseStage, value)));
  const nextGuided = networkGuidedObjectives.find((item) => !progress.networkCaseObjectives.includes(item.id));
  const guidedDone = networkGuidedObjectives.every((item) => progress.networkCaseObjectives.includes(item.id));
  const nextCapture = networkCaptureObjectives.find((item) => !progress.networkCaseCaptureObjectives.includes(item.id));
  const captureDone = networkCaptureObjectives.every((item) => progress.networkCaseCaptureObjectives.includes(item.id));
  const independentDone = networkIndependentCommands.every((item) => progress.networkCaseIndependentObjectives.includes(item.id));

  const choose = (
    key: 'networkCaseFoundationAnswers' | 'networkCaseProtocolAnswers' | 'networkCaseContainmentSelections' | 'networkCaseIndependentAnswers' | 'networkCaseFindingSelections' | 'networkCaseReportSelections',
    sectionId: string,
    optionId: string,
  ) => {
    setFlag(key, { ...progress[key], [sectionId]: optionId });
    if (key === 'networkCaseFoundationAnswers') setFoundationChecked(false);
    if (key === 'networkCaseProtocolAnswers') setProtocolChecked(false);
    if (key === 'networkCaseContainmentSelections') setContainmentChecked(false);
    if (key === 'networkCaseIndependentAnswers') setIndependentChecked(false);
    if (key === 'networkCaseFindingSelections') setFindingsChecked(false);
    if (key === 'networkCaseReportSelections') setReportChecked(false);
  };

  const renderOptions = (
    sections: readonly { id: string; label: string; options: readonly { id: string; text: string; correct?: boolean }[] }[],
    selections: Record<string, string>,
    checked: boolean,
    key: 'networkCaseFoundationAnswers' | 'networkCaseProtocolAnswers' | 'networkCaseContainmentSelections' | 'networkCaseIndependentAnswers' | 'networkCaseFindingSelections' | 'networkCaseReportSelections',
  ) => (
    <div className="windows-question-stack network-question-stack">
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

  const guidedMatches = (id: string, raw: string, expected: string) => {
    const cmd = normalizeCommand(raw);
    if (cmd === normalizeCommand(expected)) return true;
    if (id === 'interfaces') return /ip\s+-br\s+addr/.test(cmd);
    if (id === 'routes') return /ip\s+route/.test(cmd);
    if (id === 'dhcp') return /(cat|less|sed).*(dhcp-events)/.test(cmd);
    if (id === 'neighbors') return /ip\s+neigh/.test(cmd) && /vlan10/.test(cmd);
    if (id === 'dns-trusted') return /dig/.test(cmd) && /10\.44\.0\.53/.test(cmd);
    if (id === 'dns-rogue') return /dig/.test(cmd) && /10\.44\.10\.254/.test(cmd);
    if (id === 'nat') return /(nft|iptables)/.test(cmd) && /nat/.test(cmd);
    if (id === 'sockets') return /(ss|netstat)/.test(cmd) && /(tupna|tunap|plant)/.test(cmd);
    return false;
  };

  const executeGuided = () => {
    if (!command.trim() || !nextGuided) return;
    const ok = guidedMatches(nextGuided.id, command, nextGuided.command);
    setHistory((current) => [...current, { command, output: ok ? nextGuided.output : `Команда не даёт нужный артефакт. Текущая задача: ${nextGuided.title}.`, ok }]);
    setCommand('');
    if (ok) setFlag('networkCaseObjectives', [...progress.networkCaseObjectives, nextGuided.id]);
  };

  const captureMatches = (id: string, raw: string, expected: string) => {
    const cmd = normalizeCommand(raw);
    if (cmd === normalizeCommand(expected)) return true;
    if (!/tcpdump/.test(cmd) || !/office\.pcap/.test(cmd)) return false;
    if (id === 'dhcp') return /(67|68|dhcp)/.test(cmd);
    if (id === 'dns') return /(port 53|dns)/.test(cmd);
    if (id === 'tcp') return /10\.44\.10\.27/.test(cmd) && /(443|tcp)/.test(cmd);
    return false;
  };

  const executeCapture = () => {
    if (!captureCommand.trim() || !nextCapture) return;
    const ok = captureMatches(nextCapture.id, captureCommand, nextCapture.command);
    setCaptureHistory((current) => [...current, { command: captureCommand, output: ok ? nextCapture.output : `Фильтр не выделяет нужный трафик. Текущая задача: ${nextCapture.title}.`, ok }]);
    setCaptureCommand('');
    if (ok) setFlag('networkCaseCaptureObjectives', [...progress.networkCaseCaptureObjectives, nextCapture.id]);
  };

  const executeIndependent = () => {
    if (!independentCommand.trim()) return;
    const normalized = normalizeCommand(independentCommand);
    const match = networkIndependentCommands.find((item) => normalizeCommand(item.command) === normalized || (
      item.id === 'flow' && /show\s+flow/.test(normalized)
    ));
    setIndependentHistory((current) => [...current, {
      command: independentCommand,
      output: match ? match.output : 'Команда доступна, но в этом снимке она не возвращает нужный артефакт.',
      ok: Boolean(match),
    }]);
    setIndependentCommand('');
    if (match && !progress.networkCaseIndependentObjectives.includes(match.id)) {
      setFlag('networkCaseIndependentObjectives', [...progress.networkCaseIndependentObjectives, match.id]);
    }
  };

  const insertHint = (value: string, target: 'guided' | 'capture' | 'independent') => {
    if (target === 'guided') setCommand(value);
    if (target === 'capture') setCaptureCommand(value);
    if (target === 'independent') setIndependentCommand(value);
    setFlag('networkCaseHintUses', progress.networkCaseHintUses + 1);
  };

  const checkFoundation = () => {
    setFoundationChecked(true);
    if (allCorrect(networkFoundationQuestions, progress.networkCaseFoundationAnswers)) setStage(2);
  };

  const checkProtocols = () => {
    setProtocolChecked(true);
    if (captureDone && allCorrect(networkProtocolQuestions, progress.networkCaseProtocolAnswers)) setStage(4);
  };

  const checkContainment = () => {
    setContainmentChecked(true);
    if (allCorrect(networkContainmentSections, progress.networkCaseContainmentSelections)) setStage(5);
  };

  const checkIndependent = () => {
    setIndependentChecked(true);
    if (independentDone && allCorrect(networkIndependentQuestions, progress.networkCaseIndependentAnswers)) setStage(6);
  };

  const checkFinal = () => {
    setFindingsChecked(true);
    setReportChecked(true);
    if (allCorrect(networkFindingSections, progress.networkCaseFindingSelections) && allCorrect(networkReportSections, progress.networkCaseReportSelections)) setStage(7);
  };

  return (
    <div className="route-case-app windows-case-app linux-case-app network-case-app">
      <aside className="route-case-sidebar windows-case-sidebar network-case-sidebar">
        <header><p className="eyebrow">BLACKWIRE-03</p><h2>Office Network</h2><span>EDGE-RTR-01</span></header>
        <nav>{stageNames.map((name, index) => <button key={name} type="button" disabled className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}><span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{name}</strong></button>)}</nav>
        <footer><Wifi size={15} /><div><strong>REMOTE TAP</strong><span>read-only capture</span></div></footer>
      </aside>

      <main className="route-case-main windows-case-main network-case-main app-scroll">
        {stage === 0 && (
          <section className="route-brief-stage windows-brief-stage network-brief-stage">
            <header><Network size={28} /><div><p className="eyebrow">CASE / BLACKWIRE-03</p><h1>Два шлюза в одной сети</h1></div></header>
            <div className="route-brief-grid windows-brief-grid">
              {networkCaseOverview.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
            </div>
            <div className="windows-theory warning"><strong>Игорь</strong><p>Часть операторов открывает внутреннюю кассу, а попадает наружу. Платёжный сегмент пока работает. Сначала разложи сеть, потом трогай порты.</p></div>
            <div className="network-topology-grid">
              {networkTopology.map((node) => <article key={node.id} className={node.state}><span>{node.role}</span><Router size={19} /><strong>{node.title}</strong><p>{node.subtitle}</p><code>{node.address}</code></article>)}
            </div>
            <button className="primary-action full" onClick={() => setStage(1)}>Разобрать устройство сети<ArrowRight size={17} /></button>
          </section>
        )}

        {stage === 1 && (
          <section className="route-choice-stage network-foundation-stage">
            <header><Cable size={22} /><div><p className="eyebrow">NETWORK FOUNDATIONS</p><h2>Пойми, кто за что отвечает</h2></div></header>
            <div className="network-theory-strip">
              <article><strong>IP + MASK</strong><p>Определяют адрес узла и границы локальной подсети.</p></article>
              <article><strong>GATEWAY</strong><p>Маршрутизирует трафик в другие сети.</p></article>
              <article><strong>DHCP</strong><p>Выдаёт сетевые параметры клиенту.</p></article>
              <article><strong>DNS</strong><p>Преобразует имена в записи, часто в IP.</p></article>
              <article><strong>NAT</strong><p>Сопоставляет внутренние адреса с внешним интерфейсом.</p></article>
            </div>
            {renderOptions(networkFoundationQuestions, progress.networkCaseFoundationAnswers, foundationChecked, 'networkCaseFoundationAnswers')}
            <button className="primary-action full" onClick={checkFoundation}>Проверить основу</button>
          </section>
        )}

        {stage === 2 && (
          <section className="route-terminal-stage windows-terminal-stage network-terminal-stage">
            <header><TerminalSquare size={22} /><div><p className="eyebrow">EDGE-RTR-01 / READ ONLY</p><h2>{nextGuided?.title ?? 'Снимок маршрутизатора собран'}</h2></div></header>
            {nextGuided && <div className="mission-guide-strip network-guide"><div className="mission-guide-speaker">И</div><div className="mission-guide-copy"><strong>{nextGuided.title}</strong><p>{nextGuided.explanation}</p></div><code>{nextGuided.command}</code><div className="mission-guide-actions"><button onClick={() => insertHint(nextGuided.command, 'guided')}>Вставить</button></div></div>}
            <div className="route-terminal-console windows-terminal-console network-terminal-console">
              <div className="route-terminal-history"><p>analyst@tap:/cases/blackwire-03$</p>{history.map((entry, index) => <div key={`${entry.command}-${index}`}><b>$ {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeGuided()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeGuided}>RUN</button></div>
            </div>
            {guidedDone && <button className="primary-action full windows-next" onClick={() => setStage(3)}>Перейти к захвату трафика<ArrowRight size={17} /></button>}
          </section>
        )}

        {stage === 3 && (
          <section className="route-terminal-stage network-packet-stage">
            <header><Radar size={22} /><div><p className="eyebrow">OFFICE.PCAP</p><h2>{nextCapture?.title ?? 'Фильтры готовы'}</h2></div></header>
            {nextCapture && <div className="mission-guide-strip network-guide"><div className="mission-guide-speaker">И</div><div className="mission-guide-copy"><strong>{nextCapture.title}</strong><p>{nextCapture.explanation}</p></div><code>{nextCapture.command}</code><div className="mission-guide-actions"><button onClick={() => insertHint(nextCapture.command, 'capture')}>Вставить</button></div></div>}
            <div className="route-terminal-console network-packet-console">
              <div className="route-terminal-history"><p>analyst@tap:/captures$</p>{captureHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b>$ {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>$</span><input value={captureCommand} onChange={(event) => setCaptureCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeCapture()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeCapture}>RUN</button></div>
            </div>
            {renderOptions(networkProtocolQuestions, progress.networkCaseProtocolAnswers, protocolChecked, 'networkCaseProtocolAnswers')}
            <button className="primary-action full" onClick={checkProtocols} disabled={!captureDone}>Проверить протоколы и трафик</button>
          </section>
        )}

        {stage === 4 && (
          <section className="route-choice-stage network-containment-stage">
            <header><ShieldCheck size={22} /><div><p className="eyebrow">CONTAINMENT / NETWORK</p><h2>Закрой перенаправление и не положи офис</h2></div></header>
            <div className="windows-theory warning"><strong>Порядок важен</strong><p>Сначала сохраняется текущая конфигурация и трафик. Потом отключается конкретный источник. После этого клиенты получают доверенные параметры.</p></div>
            {renderOptions(networkContainmentSections, progress.networkCaseContainmentSelections, containmentChecked, 'networkCaseContainmentSelections')}
            <button className="primary-action full" onClick={checkContainment}>Выполнить план</button>
          </section>
        )}

        {stage === 5 && (
          <section className="windows-independent-stage network-independent-stage">
            <header><Activity size={22} /><div><p className="eyebrow">VLAN 30 / САМОСТОЯТЕЛЬНО</p><h2>Проверь сеть камер</h2></div></header>
            <div className="windows-theory warning"><strong>Отдельная проблема</strong><p>Rogue DHCP найден в VLAN 10. Камеры используют статические адреса. Найди, почему один узел свободно выходит наружу.</p></div>
            <button className="secondary-action windows-hint-toggle" onClick={() => { setShowIndependentHints((value) => !value); if (!showIndependentHints) setFlag('networkCaseHintUses', progress.networkCaseHintUses + 1); }}>{showIndependentHints ? 'Скрыть команды' : 'Показать доступные команды'}</button>
            {showIndependentHints && <div className="windows-command-bank network-command-bank">{networkIndependentCommands.map((item) => <button key={item.id} disabled={progress.networkCaseIndependentObjectives.includes(item.id)} onClick={() => insertHint(item.command, 'independent')}><strong>{item.id.toUpperCase()}</strong><code>{item.command}</code></button>)}</div>}
            <div className="route-terminal-console windows-terminal-console independent network-terminal-console">
              <div className="route-terminal-history"><p>switch@core#</p>{independentHistory.map((entry, index) => <div key={`${entry.command}-${index}`}><b># {entry.command}</b><pre className={entry.ok ? '' : 'error'}>{entry.output}</pre></div>)}</div>
              <div className="route-terminal-input"><span>#</span><input value={independentCommand} onChange={(event) => setIndependentCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && executeIndependent()} autoCapitalize="none" autoCorrect="off" spellCheck={false} /><button onClick={executeIndependent}>RUN</button></div>
            </div>
            {renderOptions(networkIndependentQuestions, progress.networkCaseIndependentAnswers, independentChecked, 'networkCaseIndependentAnswers')}
            <button className="primary-action full" onClick={checkIndependent} disabled={!independentDone}>Проверить VLAN 30</button>
          </section>
        )}

        {stage === 6 && (
          <section className="route-choice-stage network-report-stage">
            <header><ClipboardList size={22} /><div><p className="eyebrow">NETWORK INCIDENT REPORT</p><h2>Собери вывод по двум сегментам</h2></div></header>
            <div className="linux-evidence-row network-evidence-row"><span><FileCheck2 size={16} />DHCP</span><span><Wifi size={16} />DNS</span><span><Network size={16} />TCP / FLOW</span><span><Router size={16} />NAT / ACL</span></div>
            <h3 className="linux-section-title">Факты</h3>
            {renderOptions(networkFindingSections, progress.networkCaseFindingSelections, findingsChecked, 'networkCaseFindingSelections')}
            <h3 className="linux-section-title">Отчёт</h3>
            {renderOptions(networkReportSections, progress.networkCaseReportSelections, reportChecked, 'networkCaseReportSelections')}
            <button className="primary-action full" onClick={checkFinal}>Проверить и закрыть расследование</button>
          </section>
        )}

        {stage === 7 && (
          <section className="route-wrap windows-wrap linux-wrap network-wrap"><ShieldCheck size={50} /><p className="eyebrow">BLACKWIRE-03 / ЗАВЕРШЕНО</p><h1>Сеть очищена</h1><p>Ты восстановил адресацию, нашёл rogue DHCP/DNS, связал IP с MAC и портом, разобрал TCP и DNS в захвате, исправил egress камеры и сохранил доказательства.</p><div><strong>Отработано:</strong><span>IP / subnet</span><span>routing</span><span>DHCP</span><span>DNS</span><span>ARP</span><span>NAT</span><span>TCP / UDP</span><span>tcpdump</span><span>VLAN / ACL</span></div><small>Подсказок использовано: {progress.networkCaseHintUses}</small><button className="primary-action" onClick={completeNetworkCase}>Закрыть дело</button></section>
        )}
      </main>
    </div>
  );
}
