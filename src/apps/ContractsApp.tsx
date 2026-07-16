import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Banknote, BriefcaseBusiness, CheckCircle2, ChevronRight, CircleDollarSign, Code2,
  FileSearch, Flag, Play, RefreshCw, RotateCcw, ShieldCheck, TerminalSquare, UsersRound, XCircle,
} from 'lucide-react';
import { contractSkillUnlocked, factions } from '../data/contracts';
import { getContractAccess } from '../simulation/progression';
import type { GeneratedContract } from '../types';
import { useProgress } from '../system/ProgressContext';

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[.,;:]+$/g, '');
}

function answerMatches(value: string, accepted: string[]) {
  const candidate = normalize(value);
  return accepted.some((answer) => {
    const expected = normalize(answer);
    return candidate === expected || (expected.length >= 5 && candidate.includes(expected));
  });
}

function contractQuickCommands(contract: GeneratedContract) {
  const fileCommands = contract.files.slice(0, 2).map((item) => `cat ${item.name}`);
  const analysis: Record<string, string[]> = {
    AUTH_LOG: ['grep -c "Failed password" auth.log', 'grep "Failed password" auth.log'],
    DNS_BEACON: ['cat dns.log', 'cat assets.txt'],
    PROCESS_TRIAGE: ['cat processes.txt', 'cat connections.txt'],
    PYTHON_JSONL: ['cat events.jsonl', 'wc -l events.jsonl'],
    EXPOSED_SECRET: ['cat .env', 'cat .gitignore'],
    WEB_AUTH: ['grep " 401 " access.log', 'grep " 302 " access.log'],
  };
  return Array.from(new Set([...(analysis[contract.type] ?? []), ...fileCommands])).slice(0, 4);
}

function insertContractPythonSolution(code: string) {
  const block = '    if event["status"] == "failed":\n        failed += 1';
  if (/if\s+event\[(?:"status"|'status')\]\s*==\s*(?:"failed"|'failed')\s*:/.test(code) && /failed\s*\+=\s*1/.test(code)) return code;
  return code.replace('    # Добавь условие и увеличь failed.', block);
}

function runContractCommand(contract: GeneratedContract, raw: string): string[] {
  const command = raw.trim();
  if (!command) return [];
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) ?? [];
  const [name, ...args] = parts;
  const file = (fileName: string | undefined) => contract.files.find((item) => item.name === fileName);

  if (name === 'help') return [
    'КОМАНДЫ ЛАБОРАТОРИИ',
    'ls                       список файлов',
    'cat <file>               открыть файл',
    'grep <text> <file>       найти строки',
    'grep -c <text> <file>    посчитать строки',
    'head <file>              первые 5 строк',
    'tail <file>              последние 5 строк',
    'wc -l <file>             число строк',
    'clear                    очистить вывод',
  ];
  if (name === 'ls') return [contract.files.map((item) => item.name).join('  ')];
  if (name === 'pwd') return [`/contracts/${contract.id}`];
  if (name === 'cat') {
    const target = file(args[0]);
    return target ? target.content.split('\n') : [`cat: ${args[0] ?? ''}: No such file`];
  }
  if (name === 'head' || name === 'tail') {
    const target = file(args[0]);
    if (!target) return [`${name}: ${args[0] ?? ''}: No such file`];
    const lines = target.content.split('\n');
    return name === 'head' ? lines.slice(0, 5) : lines.slice(-5);
  }
  if (name === 'wc' && args[0] === '-l') {
    const target = file(args[1]);
    return target ? [`${target.content.split('\n').length} ${target.name}`] : [`wc: ${args[1] ?? ''}: No such file`];
  }
  if (name === 'grep') {
    const countOnly = args[0] === '-c';
    const text = countOnly ? args[1] : args[0];
    const target = file(countOnly ? args[2] : args[1]);
    if (!text || !target) return ['usage: grep [-c] <text> <file>'];
    const matches = target.content.split('\n').filter((line) => line.toLowerCase().includes(text.toLowerCase()));
    return countOnly ? [String(matches.length)] : matches;
  }
  return [`${name}: command not found. Напиши help.`];
}


function ContractPythonRunner({ contract, onPassed }: { contract: GeneratedContract; onPassed: () => void }) {
  const starter = contract.starterCode ?? '';
  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState('Скрипт ещё не запускался.');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const pyodideRef = useRef<any>(null);

  const run = async () => {
    setState('loading');
    setOutput('Запуск Python...');
    try {
      if (!pyodideRef.current) {
        const base = new URL('.', window.location.href).href;
        const module = await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`) as { loadPyodide: (options: { indexURL: string }) => Promise<any> };
        pyodideRef.current = await module.loadPyodide({ indexURL: `${base}pyodide/` });
      }
      const pyodide = pyodideRef.current;
      try { pyodide.FS.mkdirTree('/home/pyodide'); } catch { /* exists */ }
      contract.files.forEach((item) => pyodide.FS.writeFile(`/home/pyodide/${item.name}`, item.content));
      await pyodide.runPythonAsync(`
import sys, io
_contract_capture = io.StringIO()
_contract_stdout = sys.stdout
sys.stdout = _contract_capture
`);
      try {
        await pyodide.runPythonAsync(code);
      } finally {
        await pyodide.runPythonAsync(`
sys.stdout = _contract_stdout
_contract_result = _contract_capture.getvalue()
`);
      }
      const result = String(pyodide.globals.get('_contract_result') ?? '').trim();
      const passed = Boolean(contract.expectedOutput && result.includes(contract.expectedOutput));
      setState(passed ? 'success' : 'error');
      setOutput(passed ? `${result}\n\nВывод совпадает с данными.` : `${result || '(нет вывода)'}\n\nОжидаемый формат: ${contract.expectedOutput}`);
      if (passed) onPassed();
    } catch (error) {
      setState('error');
      setOutput(error instanceof Error ? error.message : String(error));
    }
  };

  const codeReady = /if\s+event\[(?:"status"|'status')\]\s*==\s*(?:"failed"|'failed')\s*:/.test(code) && /failed\s*\+=\s*1/.test(code);

  return (
    <section className="contract-python">
      <header><div><Code2 size={16} /><span>PYTHON TASK</span></div><div><button onClick={() => { setCode(starter); setState('idle'); setOutput('Код сброшен.'); }}><RotateCcw size={14} /></button></div></header>
      <div className="contract-python-help">
        <p>Проверь status каждой записи. Если значение равно failed, увеличь счётчик.</p>
        <code>if event["status"] == "failed":</code>
        <code>    failed += 1</code>
        <div><button onClick={() => setCode((current) => insertContractPythonSolution(current))}>Вставить строки</button><button className={codeReady ? 'ready' : ''} onClick={run} disabled={state === 'loading'}><Play size={13} />{state === 'loading' ? 'Проверка...' : 'Проверить готово'}</button></div>
      </div>
      <textarea value={code} onChange={(event) => { setCode(event.target.value); setState('idle'); }} spellCheck={false} />
      <pre className={state}>{output}</pre>
    </section>
  );
}

function ContractWorkspace({ contract }: { contract: GeneratedContract }) {
  const { abandonContract, completeContract } = useProgress();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([
    `FALSE ACCESS CONTRACT SHELL / ${contract.id}`,
    'Изолированная копия данных. Напиши help.',
  ]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [pythonPassed, setPythonPassed] = useState(contract.skill !== 'python');

  const results = contract.questions.map((question) => answerMatches(answers[question.id] ?? '', question.answers));
  const passed = results.every(Boolean) && pythonPassed;
  const quickCommands = contractQuickCommands(contract);

  const execute = () => {
    if (!command.trim()) return;
    if (command.trim() === 'clear') setHistory([]);
    else setHistory((current) => [...current, `ilya@contract:$ ${command}`, ...runContractCommand(contract, command)]);
    setCommand('');
  };

  return (
    <div className="contract-workspace">
      <header className="contract-workspace-header">
        <button className="contract-back" onClick={abandonContract}><ArrowLeft size={16} />Доска</button>
        <div><p className="eyebrow">АКТИВНЫЙ ЗАКАЗ / {contract.factionName}</p><h2>{contract.title}</h2></div>
        <div className="contract-pay"><Banknote size={18} /><strong>{contract.pay.toLocaleString('ru-RU')} ₽</strong></div>
      </header>

      <div className="contract-work-grid">
        <aside className="contract-brief app-scroll">
          <div className="contract-tag-row"><span>{contract.skill.toUpperCase()}</span><span>{contract.difficulty}</span></div>
          <h3>{contract.client}</h3>
          <p>{contract.summary}</p>
          <div className="constraint-box"><Flag size={16} /><div><strong>Ограничение</strong><span>{contract.constraint}</span></div></div>
          <div className="file-index">
            <span>ФАЙЛЫ</span>
            {contract.files.map((item) => <button key={item.name} onClick={() => setCommand(`cat ${item.name}`)}><FileSearch size={14} />{item.name}<ChevronRight size={13} /></button>)}
          </div>
          <button className="secondary-action full" onClick={() => setHintVisible((value) => !value)}>{hintVisible ? 'Скрыть подсказку' : 'Открыть подсказку'}</button>
          {hintVisible && <div className="contract-hint">{contract.hint}</div>}
        </aside>

        <section className="contract-terminal">
          <header><TerminalSquare size={16} /><span>CONTRACT SHELL</span><i>LOCAL / NO NETWORK</i></header>
          <pre>{history.join('\n')}</pre>
          <div className="contract-quick-commands">
            <span>ВСТАВИТЬ КОМАНДУ</span>
            <div>{quickCommands.map((item) => <button key={item} onClick={() => setCommand(item)}><code>{item}</code></button>)}</div>
          </div>
          <div className="contract-command-line"><span>ilya@contract:$</span><input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && execute()} autoComplete="off" spellCheck={false} /><button onClick={execute}>RUN</button></div>
        </section>

        <aside className="contract-answer app-scroll">
          {contract.skill === 'python' && <ContractPythonRunner contract={contract} onPassed={() => setPythonPassed(true)} />}
          <p className="eyebrow">ТЕХНИЧЕСКИЙ ВЫВОД</p>
          <h3>Зафиксируй факты</h3>
          {contract.questions.map((question, index) => (
            <label key={question.id} className={checked ? (results[index] ? 'answer-ok' : 'answer-bad') : ''}>
              <span>{question.label}</span>
              <input value={answers[question.id] ?? ''} placeholder={question.placeholder} onChange={(event) => { setAnswers((current) => ({ ...current, [question.id]: event.target.value })); setChecked(false); }} />
              {checked && (results[index] ? <CheckCircle2 size={15} /> : <XCircle size={15} />)}
            </label>
          ))}
          <button className="primary-action full" onClick={() => setChecked(true)}>Проверить вывод</button>
          {checked && passed && (
            <div className="contract-pass">
              <ShieldCheck size={22} />
              <div><strong>Факты подтверждены</strong><span>Оплата и репутация будут записаны локально.</span></div>
              <button onClick={() => completeContract(!hintVisible)}>Закрыть заказ</button>
            </div>
          )}
          {checked && !passed && <div className="contract-fail">{contract.skill === 'python' && !pythonPassed ? 'Сначала добейся правильного вывода Python. ' : ''}Часть ответа не совпадает с данными. Вернись к файлам и проверь вывод.</div>}
        </aside>
      </div>
    </div>
  );
}

export function ContractsApp() {
  const { progress, acceptContract, refreshContracts } = useProgress();
  const [section, setSection] = useState<'offers' | 'factions' | 'history'>('offers');
  const completedTotal = progress.completedContracts.length;
  const unlockedCount = progress.contractOffers.filter((contract) => contractSkillUnlocked(contract, progress)).length;
  const repTotal = Object.values(progress.factionRep).reduce((sum, value) => sum + value, 0);
  const lastContracts = useMemo(() => progress.completedContracts.slice(0, 8), [progress.completedContracts]);

  if (progress.activeContract) return <ContractWorkspace contract={progress.activeContract} />;

  return (
    <div className="contracts-app">
      <aside className="contracts-sidebar">
        <div className="contracts-logo"><BriefcaseBusiness size={22} /><div><strong>WORK//QUEUE</strong><span>локальная доска</span></div></div>
        <button className={section === 'offers' ? 'active' : ''} onClick={() => setSection('offers')}><FileSearch size={17} />Заказы <b>{unlockedCount}</b></button>
        <button className={section === 'factions' ? 'active' : ''} onClick={() => setSection('factions')}><UsersRound size={17} />Заказчики</button>
        <button className={section === 'history' ? 'active' : ''} onClick={() => setSection('history')}><CheckCircle2 size={17} />История <b>{completedTotal}</b></button>
        <div className="contracts-wallet"><span>СЧЁТ</span><strong>{progress.balance.toLocaleString('ru-RU')} ₽</strong><small>репутация: {repTotal}</small></div>
      </aside>

      <main className="contracts-main app-scroll">
        {section === 'offers' && (
          <>
            <header className="contracts-head">
              <div><p className="eyebrow">ПОВТОРЯЕМАЯ ПРАКТИКА</p><h2>Заказы по освоенным навыкам</h2><p>Данные и ответы меняются. Инструменты остаются теми же. Всё выполняется внутри локальной лаборатории.</p></div>
              <button className="secondary-action" onClick={refreshContracts}><RefreshCw size={16} />Обновить</button>
            </header>
            <section className="contracts-stats">
              <div><CircleDollarSign size={18} /><span>Баланс</span><strong>{progress.balance.toLocaleString('ru-RU')} ₽</strong></div>
              <div><BriefcaseBusiness size={18} /><span>Выполнено</span><strong>{completedTotal}</strong></div>
              <div><ShieldCheck size={18} /><span>Доступно сейчас</span><strong>{unlockedCount}/3</strong></div>
            </section>
            <section className="contract-offers">
              {progress.contractOffers.map((contract) => {
                const access = getContractAccess(contract, progress);
                const unlocked = contractSkillUnlocked(contract, progress);
                return (
                  <article key={contract.id} className={unlocked ? '' : 'locked'}>
                    <header><span>{contract.factionName}</span><b>{contract.difficulty}</b></header>
                    <div className="contract-card-skill">{contract.skill.toUpperCase()}</div>
                    <h3>{contract.title}</h3>
                    <p>{contract.summary}</p>
                    {!unlocked && <div className="contract-lock-reason">{access.reasons[0]}</div>}
                    <div className="contract-client"><span>ЗАКАЗЧИК</span><strong>{contract.client}</strong></div>
                    <footer><strong>{contract.pay.toLocaleString('ru-RU')} ₽</strong><button disabled={!unlocked} onClick={() => acceptContract(contract)}>{unlocked ? 'Принять' : 'Навык закрыт'}<ChevronRight size={15} /></button></footer>
                  </article>
                );
              })}
            </section>
            <div className="contract-rule"><TerminalSquare size={18} /><p><strong>CLEAN RESULT.</strong> Закрой заказ без подсказки — получишь больше репутации.</p></div>
          </>
        )}

        {section === 'factions' && (
          <>
            <header className="contracts-head"><div><p className="eyebrow">РАБОТОДАТЕЛИ</p><h2>У каждого свои деньги и пределы</h2><p>В полной игре переход между сторонами будет менять доступные цепочки, врагов и сюжетные последствия.</p></div></header>
            <section className="faction-grid">
              {factions.map((faction) => (
                <article key={faction.id}>
                  <header><span>{faction.type}</span><strong>{progress.factionRep[faction.id] ?? 0} REP</strong></header>
                  <h3>{faction.name}</h3>
                  <p>{faction.description}</p>
                  <div className="rep-bar"><i style={{ width: `${Math.min(100, (progress.factionRep[faction.id] ?? 0) * 8)}%` }} /></div>
                </article>
              ))}
            </section>
          </>
        )}

        {section === 'history' && (
          <>
            <header className="contracts-head"><div><p className="eyebrow">ЛОКАЛЬНЫЙ ЖУРНАЛ</p><h2>Выполненные заказы</h2><p>История хранится на устройстве вместе с сохранением.</p></div></header>
            <section className="contract-history">
              {lastContracts.length === 0 ? <div className="contracts-empty"><BriefcaseBusiness size={36} /><strong>Пока пусто</strong><span>Закончи первый доступный заказ.</span></div> : lastContracts.map((item) => {
                const faction = factions.find((entry) => entry.id === item.factionId);
                return <article key={`${item.id}-${item.completedAt}`}><CheckCircle2 size={18} /><div><strong>{item.title}</strong><span>{faction?.name ?? item.factionId} · {new Date(item.completedAt).toLocaleString('ru-RU')}</span></div><b>+{item.pay.toLocaleString('ru-RU')} ₽</b><i>{item.clean ? 'CLEAN' : 'GUIDED'}</i></article>;
              })}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
