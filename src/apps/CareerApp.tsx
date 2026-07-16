import { useMemo, useState } from 'react';
import {
  BadgeCheck, BriefcaseBusiness, Check, ChevronRight, CircleDashed, Code2, GraduationCap,
  LockKeyhole, Route, Shield, Target, Trophy, UsersRound,
} from 'lucide-react';
import { jobsCatalog } from '../simulation/catalog';
import {
  getContractAccess, getCurrentStage, getJobAccess, getNextStage, getSkillTotal,
  getStageAccess, progressionStages, skillLabels, specializations, trackLabels,
} from '../simulation/progression';
import type { SimulationSkillId, SpecializationId } from '../simulation/types';
import { useProgress } from '../system/ProgressContext';

const tabs = [
  { id: 'route', label: 'Путь', icon: Route },
  { id: 'skills', label: 'Навыки', icon: Code2 },
  { id: 'access', label: 'Доступ', icon: BriefcaseBusiness },
  { id: 'specializations', label: 'Специализации', icon: Target },
] as const;

type TabId = typeof tabs[number]['id'];

function trackBar(value: number) {
  return <i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />;
}

export function CareerApp() {
  const { progress, toggleSpecialization } = useProgress();
  const [tab, setTab] = useState<TabId>('route');
  const stage = getCurrentStage(progress);
  const stageDefinition = progressionStages.find((item) => item.id === stage)!;
  const next = getNextStage(progress);
  const selected = progress.simulation.progression.selectedSpecializations;
  const skills = useMemo(() => Object.entries(progress.simulation.skills) as Array<[SimulationSkillId, typeof progress.simulation.skills[SimulationSkillId]]>, [progress.simulation.skills]);

  return (
    <div className="career-app">
      <aside className="career-sidebar">
        <header>
          <div className="career-stage-mark">{stage}</div>
          <div><strong>{stageDefinition.shortTitle}</strong><span>Этап подготовки</span></div>
        </header>
        <nav>
          {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><Icon size={17} /><span>{item.label}</span><ChevronRight size={14} /></button>; })}
        </nav>
        <footer>
          <span>MIDDLE-READY</span>
          <strong>{Math.round(skills.reduce((sum, [, value]) => sum + getSkillTotal(value), 0) / skills.length)}%</strong>
          <small>Нужны самостоятельные задачи и рабочий опыт</small>
        </footer>
      </aside>

      <main className="career-main app-scroll">
        <header className="career-topbar">
          <div><p className="eyebrow">PROGRESSION / 0.5.1</p><h2>{tabs.find((item) => item.id === tab)?.label}</h2></div>
          <div className="career-current-chip"><Shield size={17} /><div><strong>Этап {stage}</strong><span>{stageDefinition.title}</span></div></div>
        </header>

        {tab === 'route' && (
          <>
            <section className="career-stage-rail">
              {progressionStages.map((item) => {
                const access = getStageAccess(progress, item.id);
                const complete = item.id <= stage;
                const current = item.id === stage;
                return <article key={item.id} className={`${complete ? 'done' : ''} ${current ? 'current' : ''}`}><div>{complete ? <Check size={15} /> : access.unlocked ? <BadgeCheck size={15} /> : <LockKeyhole size={14} />}</div><span>{item.id}</span><strong>{item.shortTitle}</strong></article>;
              })}
            </section>

            <section className="career-route-grid">
              <article className="career-stage-card current">
                <header><Trophy size={21} /><span>ТЕКУЩИЙ ЭТАП</span></header>
                <h3>{stageDefinition.title}</h3>
                <p>{stageDefinition.description}</p>
                <div className="career-stage-tags"><span>Работа: {progress.simulation.career.status === 'employed' ? progress.simulation.career.title : 'нет'}</span><span>Контракты: {progress.completedContracts.length}</span></div>
              </article>

              {next ? (
                <article className="career-stage-card next">
                  <header><GraduationCap size={21} /><span>СЛЕДУЮЩИЙ ЭТАП</span></header>
                  <h3>{next.definition.title}</h3>
                  <p>{next.definition.description}</p>
                  <div className="career-gap-summary"><strong>{next.gaps.filter((gap) => gap.complete).length}/{next.gaps.length}</strong><span>требований закрыто</span></div>
                </article>
              ) : (
                <article className="career-stage-card next"><header><Trophy size={21} /><span>МАКСИМУМ</span></header><h3>Все этапы открыты</h3><p>Остаются специализации, большие операции и финальные проверки.</p></article>
              )}
            </section>

            {next && (
              <section className="career-requirements">
                <header><div><h3>Что нужно для этапа {next.definition.id}</h3><p>{next.definition.examTitle}</p></div><strong>{next.gaps.filter((gap) => gap.complete).length}/{next.gaps.length}</strong></header>
                <div>{next.gaps.map((gap) => <article key={gap.id} className={gap.complete ? 'done' : ''}>{gap.complete ? <Check size={15} /> : gap.kind === 'exam' || gap.kind === 'story' ? <GraduationCap size={15} /> : <CircleDashed size={15} />}<div><strong>{gap.label}</strong><span>{gap.kind === 'skill' ? `${gap.current}/${gap.required}` : gap.complete ? 'пройдено' : 'не пройдено'}</span></div></article>)}</div>
              </section>
            )}

            <section className="career-exams">
              <header><h3>Итоговые проверки</h3><span>Одна на каждый переход</span></header>
              <div>{progressionStages.slice(1).map((item) => {
                const access = getStageAccess(progress, item.id);
                const complete = item.id <= stage;
                return <article key={item.id} className={complete ? 'done' : ''}><span>{item.id}</span><div><strong>{item.examTitle}</strong><small>{complete ? 'Пройдено' : access.gaps.filter((gap) => !gap.complete && gap.kind === 'skill').length === 0 ? 'Можно запускать после появления миссии' : 'Не хватает навыков'}</small></div>{complete ? <BadgeCheck size={19} /> : <LockKeyhole size={17} />}</article>;
              })}</div>
            </section>
          </>
        )}

        {tab === 'skills' && (
          <section className="career-skill-grid">
            {skills.map(([id, track]) => <article key={id}><header><div><strong>{skillLabels[id]}</strong><span>{getSkillTotal(track)}%</span></div><b>{Math.max(track.theory, track.guided, track.independent, track.production) > 0 ? 'ACTIVE' : 'LOCKED'}</b></header><div className="career-track-list">{(Object.keys(trackLabels) as Array<keyof typeof track>).map((key) => <div key={key}><span>{trackLabels[key]}</span><div>{trackBar(track[key])}</div><strong>{track[key]}</strong></div>)}</div></article>)}
          </section>
        )}

        {tab === 'access' && (
          <>
            <section className="career-access-head"><div><h3>Вакансии</h3><p>Проверяются этап, репутация и конкретный вид практики.</p></div><BriefcaseBusiness size={24} /></section>
            <section className="career-job-list">{jobsCatalog.map((job) => {
              const access = getJobAccess(progress, job);
              return <article key={job.id} className={access.available ? '' : 'locked'}><header><span>{job.employer}</span><strong>{job.monthlySalary.toLocaleString('ru-RU')} ₽</strong></header><h3>{job.title}</h3><p>{job.description}</p><footer><div>{access.available ? <><BadgeCheck size={15} />Доступна</> : <><LockKeyhole size={15} />{access.reasons[0]}</>}</div><span>этап {job.requiredStage ?? 0}</span></footer></article>;
            })}</section>

            <section className="career-access-head contracts"><div><h3>Текущие заказы</h3><p>Сложность заказа повышает требуемый этап.</p></div><UsersRound size={24} /></section>
            <section className="career-contract-list">{progress.contractOffers.map((contract) => {
              const access = getContractAccess(contract, progress);
              return <article key={contract.id} className={access.available ? '' : 'locked'}><span>{contract.factionName}</span><strong>{contract.title}</strong><small>{contract.skill.toUpperCase()} · {contract.difficulty} · этап {access.requiredStage}</small><p>{access.available ? 'Можно принять в Work Queue' : access.reasons[0]}</p></article>;
            })}</section>
          </>
        )}

        {tab === 'specializations' && (
          <>
            <section className="career-specialization-intro"><Target size={28} /><div><h3>Выбери два глубоких направления</h3><p>Выбор открывается на этапе 3. Общая база остаётся обязательной.</p></div><strong>{selected.length}/2</strong></section>
            <section className="career-specialization-grid">{specializations.map((item) => {
              const active = selected.includes(item.id);
              const disabled = stage < 3 || (!active && selected.length >= 2);
              return <button key={item.id} className={active ? 'active' : ''} disabled={disabled} onClick={() => toggleSpecialization(item.id as SpecializationId)}><header>{active ? <BadgeCheck size={20} /> : stage < 3 ? <LockKeyhole size={19} /> : <Target size={19} />}<strong>{item.title}</strong></header><p>{item.description}</p><div>{item.skills.map((skill) => <span key={skill}>{skillLabels[skill]}</span>)}</div><footer>{active ? 'Выбрано' : stage < 3 ? 'Откроется на этапе 3' : selected.length >= 2 ? 'Два направления уже выбраны' : 'Выбрать'}</footer></button>;
            })}</section>
          </>
        )}
      </main>
    </div>
  );
}
