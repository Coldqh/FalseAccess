import { useMemo, useState } from 'react';
import { ArrowRight, Banknote, BriefcaseBusiness, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { CaseShellPanel } from './CaseShellPanel';
import { EvidenceBoard } from './EvidenceBoard';
import { createAct1ContractEnvironment } from '../content/contracts/act1/environment';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import { useProgress } from '../system/ProgressContext';

export const act1ContractIds = ['act1-contract-mail', 'act1-contract-endpoint', 'act1-contract-dns'] as const;

export function ChapterOneContracts() {
  const runtime = useMissionRuntime();
  const { progress, setFlag } = useProgress();
  const mission = runtime.activeMission;
  const [reasons, setReasons] = useState<string[]>([]);
  const bundle = useMemo(() => mission ? createAct1ContractEnvironment(mission.missionId, mission.seed) : null, [mission]);
  if (!mission || !bundle || !act1ContractIds.includes(mission.missionId as any)) return <main className="chapter-one-loading">Контракт первой линии не найден.</main>;

  const index = act1ContractIds.indexOf(mission.missionId as any);
  const complete = () => {
    const result = runtime.completeActiveMission();
    setReasons(result.reasons);
    if (!result.completed) return;
    if (!progress.completedContracts.some((item) => item.id === mission.missionId)) {
      setFlag('balance', progress.balance + bundle.pay);
      setFlag('completedContracts', [{ id: mission.missionId, title: bundle.title, factionId: 'sfera', pay: bundle.pay, completedAt: new Date().toISOString(), clean: true }, ...progress.completedContracts]);
      setFlag('factionRep', { ...progress.factionRep, sfera: (progress.factionRep.sfera ?? 0) + 1 });
    }
  };

  const next = () => {
    const nextId = act1ContractIds[index + 1];
    if (nextId) runtime.ensureMission(nextId);
    else runtime.ensureMission('sfera-shift-check-01');
  };

  if (mission.status === 'completed') {
    return <main className="chapter-one-complete"><section><ShieldCheck size={36} /><p className="eyebrow">АКТ 1 / СЛОЙ 2 / КОНТРАКТ {index + 1}/3</p><h1>{bundle.title}</h1><p>Задача закрыта без подсказок. Seed, команды, errors и evidence сохранены.</p><div className="chapter-one-score-grid"><article><span>ЗАКАЗЧИК</span><strong>{bundle.client}</strong></article><article><span>ОПЛАТА</span><strong>{bundle.pay.toLocaleString('ru-RU')} ₽</strong></article><article><span>АВТОНОМНОСТЬ</span><strong>без помощи</strong></article><article><span>ПРОГРЕСС</span><strong>{index + 1}/3</strong></article></div><button className="primary-action" onClick={next}>{index < 2 ? 'Следующий контракт' : 'Первая смена'} <ArrowRight size={17} /></button></section></main>;
  }

  return <main className="chapter-one-contract-screen">
    <header><div><p className="eyebrow">АКТ 1 / СЛОЙ 2 / КОНТРАКТ {index + 1}/3</p><h1>{bundle.title}</h1><p>{bundle.objective}</p></div><div className="chapter-one-pay"><Banknote size={18} /><strong>{bundle.pay.toLocaleString('ru-RU')} ₽</strong><span>{bundle.client}</span></div></header>
    <section className="chapter-one-contract-rules"><BriefcaseBusiness size={18} /><div><strong>Самостоятельная работа</strong><span>Нет подсказок, готовых команд и раскрытых ответов. Help показывает только доступные инструменты.</span></div></section>
    <section className="chapter-one-contract-grid"><CaseShellPanel environment={bundle.shell} title="SFERA CONTRACT SHELL" /><aside><EvidenceBoard suggestions={[bundle.evidenceSuggestion]} /><button className="secondary-action" onClick={() => runtime.restartMission(mission.missionId, mission.seed + 1)}><RotateCcw size={15} />Новый seed</button></aside></section>
    <footer className="chapter-one-footer"><div>{act1ContractIds.map((id, itemIndex) => <span key={id} className={runtime.store.missions[id]?.status === 'completed' ? 'done' : ''}>{runtime.store.missions[id]?.status === 'completed' && <Check size={12} />}{itemIndex + 1}</span>)}</div><button className="primary-action" onClick={complete}>Проверить контракт</button>{reasons.length > 0 && <p>Не закрыто: {reasons.join(' · ')}</p>}</footer>
  </main>;
}
