import {
  Check, Circle, Code2, Database, Globe2, LockKeyhole, MailWarning, Network, Radar, FileCode2, Shield, ShieldCheck,
  Smartphone, TerminalSquare, UserRoundCheck, Waypoints, BookOpenCheck, ExternalLink,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import type { SimulationSkillId } from '../simulation/types';
import { getMiddleReadiness } from '../simulation/mastery';
import { curriculumModules, curriculumSources } from '../data/curriculum';

const skillMeta: Array<{ id: SimulationSkillId; name: string; icon: typeof TerminalSquare }> = [
  { id: 'linux', name: 'Linux', icon: TerminalSquare },
  { id: 'networking', name: 'Networking', icon: Network },
  { id: 'python', name: 'Python', icon: Code2 },
  { id: 'soc', name: 'SOC / IR', icon: Radar },
  { id: 'windows', name: 'Windows', icon: Shield },
  { id: 'web', name: 'Web Security', icon: Globe2 },
  { id: 'sql', name: 'SQL', icon: Database },
  { id: 'appsec', name: 'Application Security', icon: ShieldCheck },
  { id: 'mobileSecurity', name: 'Mobile Security', icon: Smartphone },
  { id: 'activeDirectory', name: 'Active Directory', icon: Waypoints },
  { id: 'emailSecurity', name: 'Email Security', icon: MailWarning },
  { id: 'forensics', name: 'Forensics', icon: LockKeyhole },
  { id: 'threatHunting', name: 'Threat Hunting', icon: Radar },
  { id: 'detectionEngineering', name: 'Detection Engineering', icon: ShieldCheck },
  { id: 'threatIntelligence', name: 'Threat Intelligence', icon: Globe2 },
  { id: 'cryptography', name: 'Cryptography / PKI', icon: LockKeyhole },
  { id: 'malwareAnalysis', name: 'Malware Analysis', icon: FileCode2 },
  { id: 'cloud', name: 'Cloud Security', icon: Globe2 },
  { id: 'containerSecurity', name: 'Container Security', icon: ShieldCheck },
  { id: 'devsecops', name: 'DevSecOps / Supply Chain', icon: Code2 },
  { id: 'vulnerabilityManagement', name: 'Vulnerability Management', icon: Radar },
  { id: 'architecture', name: 'Security Architecture', icon: Network },
  { id: 'governanceRisk', name: 'Governance / Risk', icon: BookOpenCheck },
  { id: 'businessContinuity', name: 'BCP / DR', icon: Shield },
  { id: 'communication', name: 'Communication', icon: UserRoundCheck },
];

function total(track: { theory: number; guided: number; independent: number; production: number }) {
  return Math.round(track.theory * 0.15 + track.guided * 0.2 + track.independent * 0.3 + track.production * 0.35);
}

export function SkillsApp() {
  const { progress } = useProgress();
  const tracks = progress.simulation.skills;
  const readiness = getMiddleReadiness(progress.simulation);
  const milestones = [
    ['Пройти навигацию Linux', progress.terminalObjectives.includes('inspect-processes')],
    ['Собрать первую программу', progress.pythonComplete],
    ['Разобрать первый алерт', progress.alertReviewed],
    ['Сдать технический отчёт', progress.reportSubmitted],
    ['Закрыть первую смену', progress.firstShiftComplete],
    ['Разобрать Web / API / SQL', progress.webCaseComplete],
    ['Разобрать мобильный инцидент', progress.mobileCaseComplete],
    ['Разобрать корпоративный домен', progress.adCaseComplete],
    ['Разобрать почтовую цепочку', progress.mailCaseComplete],
    ['Закрыть DFIR-дело', progress.forensicsCaseComplete],
    ['Провести Incident Response', progress.incidentCaseComplete],
    ['Закрыть Threat Hunt без готового алерта', progress.huntCaseComplete],
    ['Разобрать PKI и два бинарных формата', progress.cryptoCaseComplete],
    ['Закрыть Cloud Security', progress.cloudCaseComplete],
    ['Закрыть Container / Supply Chain', progress.supplyCaseComplete],
    ['Спроектировать Security Architecture', progress.architectureCaseComplete],
    ['Пройти BLACKSKY-15', progress.capstoneCaseComplete],
    ['Закрыть заказ без подсказки', progress.completedContracts.some((item) => item.clean)],
  ];
  const moduleDone = (key?: string) => key ? Boolean((progress as unknown as Record<string, unknown>)[key]) : false;

  return (
    <div className="skills-app app-scroll skills-app-v5 curriculum-hardened">
      <header className="skills-header">
        <div><p className="eyebrow">ПРОФИЛЬ / ПОДТВЕРЖДЁННЫЕ КОМПЕТЕНЦИИ</p><h2>Одна глава — один модуль, а не освоенное направление</h2><p>Теория, практика с подсказкой, самостоятельная работа и опыт считаются отдельно. MODULE I даёт фундамент; глубина приходит в MODULE II и capstone.</p></div>
        <div className="profile-badge"><span>{readiness.total}</span><small>middle-ready</small></div>
      </header>

      <section className="mastery-summary"><div><strong>{readiness.total}%</strong><span>Общая готовность</span></div><p>Процент не заменяет доказательства: нужны разные модули, самостоятельные лаборатории и производственный опыт.</p></section>

      <section className="skill-track-grid">
        {skillMeta.map((meta) => {
          const track = tracks[meta.id]; const Icon = meta.icon; const score = total(track);
          return <article key={meta.id} className={score === 0 ? 'locked' : ''}>
            <header><span><Icon size={19} /></span><strong>{meta.name}</strong><b>{score}</b></header>
            <div className="skill-total"><i style={{ width: `${score}%` }} /></div>
            <dl><div><dt>Теория</dt><dd>{track.theory}</dd></div><div><dt>С куратором</dt><dd>{track.guided}</dd></div><div><dt>Самостоятельно</dt><dd>{track.independent}</dd></div><div><dt>Рабочий опыт</dt><dd>{track.production}</dd></div></dl>
          </article>;
        })}
      </section>

      <section className="curriculum-panel">
        <header><div><p className="eyebrow">CURRICULUM MAP</p><h3>Покрытие программы</h3></div><BookOpenCheck size={22} /></header>
        <div className="curriculum-grid">{curriculumModules.map((module) => {
          const done = moduleDone(module.statusKey);
          return <article key={module.id} className={done ? 'done' : module.statusKey ? '' : 'planned'}>
            <div><span>{module.level}</span><b>{done ? 'ПРОЙДЕНО' : module.statusKey ? 'НЕ ЗАКРЫТО' : 'ДАЛЬШЕ'}</b></div>
            <h4>{module.title}</h4><p>{module.topics.join(' · ')}</p><small>{module.mappings.join(' / ')}</small>
          </article>;
        })}</div>
      </section>

      <section className="curriculum-sources">
        <header><div><p className="eyebrow">SOURCE BASELINE</p><h3>На чём строится теория</h3></div><ExternalLink size={20} /></header>
        <div>{curriculumSources.map((source) => <article key={source.id}><strong>{source.authority}</strong><span>{source.title}</span><b>{source.version}</b><p>{source.scope}</p></article>)}</div>
      </section>

      <section className="milestone-panel">
        <div><p className="eyebrow">ПОДТВЕРЖДЁННЫЕ ДЕЙСТВИЯ</p><h3>Кампания и симулятор</h3><MailWarning size={20} /></div>
        <div className="milestone-list">{milestones.map(([label, done]) => <div key={label as string} className={done ? 'done' : ''}><span>{done ? <Check size={14} /> : <Circle size={12} />}</span><strong>{label as string}</strong></div>)}</div>
      </section>
    </div>
  );
}
