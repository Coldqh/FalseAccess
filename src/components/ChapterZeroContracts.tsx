import { useMemo, useState } from 'react';
import { ArrowRight, Banknote, BriefcaseBusiness, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { CaseShellPanel } from './CaseShellPanel';
import { EvidenceBoard } from './EvidenceBoard';
import { createAct0ContractEnvironment } from '../content/contracts/act0/environment';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import { useProgress } from '../system/ProgressContext';

export const act0ContractIds = ['act0-contract-files', 'act0-contract-logs', 'act0-contract-process'] as const;

export function ChapterZeroContracts() {
  const runtime = useMissionRuntime();
  const { progress, setFlag } = useProgress();
  const mission = runtime.activeMission;
  const [reasons, setReasons] = useState<string[]>([]);
  const bundle = useMemo(() => mission ? createAct0ContractEnvironment(mission.missionId, mission.seed) : null, [mission]);
  if (!mission || !bundle || !act0ContractIds.includes(mission.missionId as any)) return <main className="chapter-zero-loading">Контракт не найден.</main>;

  const index = act0ContractIds.indexOf(mission.missionId as any);
  const complete = () => {
    const result = runtime.completeActiveMission();
    setReasons(result.reasons);
    if (!result.completed) return;
    if (!progress.completedContracts.some((item) => item.id === mission.missionId)) {
      setFlag('balance', progress.balance + bundle.pay);
      setFlag('completedContracts', [{ id: mission.missionId, title: bundle.title, factionId: bundle.client, pay: bundle.pay, completedAt: new Date().toISOString(), clean: true }, ...progress.completedContracts]);
    }
  };

  const next = () => {
    const nextId = act0ContractIds[index + 1];
    if (nextId) runtime.ensureMission(nextId);
    else runtime.ensureMission('foundation-check-01');
  };

  if (mission.status === 'completed') {
    return <main className="act0-complete-screen"><section><ShieldCheck size={34} /><p className="eyebrow">СЛОЙ 2 / КОНТРАКТ {index + 1}/3</p><h1>{bundle.title}</h1><p>Задача закрыта без подсказок. Seed, команды, exit codes и evidence сохранены.</p><div className="act0-score-grid"><article><span>ЗАКАЗЧИК</span><strong>{bundle.client}</strong></article><article><span>ОПЛАТА</span><strong>{bundle.pay.toLocaleString('ru-RU')} ₽</strong></article><article><span>АВТОНОМНОСТЬ</span><strong>без помощи</strong></article><article><span>ПРОГРЕСС</span><strong>{index + 1}/3</strong></article></div><button className="primary-action" onClick={next}>{index < 2 ? 'Следующий контракт' : 'Контрольная операция'} <ArrowRight size={17} /></button></section></main>;
  }

  return <main className="act0-contract-screen">
    <header><div><p className="eyebrow">АКТ 0 / СЛОЙ 2 / КОНТРАКТ {index + 1}/3</p><h1>{bundle.title}</h1><p>{bundle.objective}</p></div><div className="act0-contract-pay"><Banknote size={18} /><strong>{bundle.pay.toLocaleString('ru-RU')} ₽</strong><span>{bundle.client}</span></div></header>
    <section className="act0-contract-rules"><BriefcaseBusiness size={18} /><div><strong>Самостоятельная работа</strong><span>Нет подсказок, готовых команд и правильных ответов. Можно использовать help и любой допустимый read-only путь.</span></div></section>
    <section className="act0-contract-grid">
      <CaseShellPanel environment={bundle.shell} title="CONTRACT SHELL" />
      <aside className="act0-contract-evidence"><EvidenceBoard suggestions={[bundle.evidenceSuggestion]} /><button className="secondary-action" onClick={() => runtime.restartMission(mission.missionId, mission.seed + 1)}><RotateCcw size={15} />Новый seed</button></aside>
    </section>
    <footer className="act0-case-footer"><div>{act0ContractIds.map((id, itemIndex) => <span key={id} className={runtime.store.missions[id]?.status === 'completed' ? 'done' : ''}>{runtime.store.missions[id]?.status === 'completed' && <Check size={12} />}{itemIndex + 1}</span>)}</div><button className="primary-action" onClick={complete}>Проверить результат</button>{reasons.length > 0 && <p>Не закрыто: {reasons.join(' · ')}</p>}</footer>
  </main>;
}
