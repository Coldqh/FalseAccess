import {
  Check, Circle, Code2, Database, Globe2, LockKeyhole, MailWarning, Network, Radar, Shield, ShieldCheck,
  TerminalSquare, UserRoundCheck,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import type { SimulationSkillId } from '../simulation/types';
import { getMiddleReadiness } from '../simulation/mastery';

const skillMeta: Array<{ id: SimulationSkillId; name: string; icon: typeof TerminalSquare }> = [
  { id: 'linux', name: 'Linux', icon: TerminalSquare },
  { id: 'networking', name: 'Networking', icon: Network },
  { id: 'python', name: 'Python', icon: Code2 },
  { id: 'soc', name: 'SOC / IR', icon: Radar },
  { id: 'windows', name: 'Windows', icon: Shield },
  { id: 'web', name: 'Web Security', icon: Globe2 },
  { id: 'sql', name: 'SQL', icon: Database },
  { id: 'appsec', name: 'Application Security', icon: ShieldCheck },
  { id: 'forensics', name: 'Forensics', icon: LockKeyhole },
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
    ['Пройти собеседование', progress.interviewComplete],
    ['Закрыть фишинговый тикет', progress.phishingComplete],
    ['Разобрать PowerShell', progress.powershellComplete],
    ['Найти DNS-маяк', progress.dnsComplete],
    ['Закрыть первую смену', progress.firstShiftComplete],
    ['Разобрать Web / API / SQL', progress.webCaseComplete],
    ['Закрыть заказ без подсказки', progress.completedContracts.some((item) => item.clean)],
  ];

  return (
    <div className="skills-app app-scroll skills-app-v5">
      <header className="skills-header">
        <div><p className="eyebrow">ПРОФИЛЬ / ИЛЬЯ ВОРОНЦОВ</p><h2>Навык подтверждается практикой</h2><p>Теория не равна рабочему опыту. Для сильных вакансий и операций нужны самостоятельные решения и задачи в реальных условиях стенда.</p></div>
        <div className="profile-badge"><span>{readiness.total}</span><small>middle-ready</small></div>
      </header>

      <section className="mastery-summary"><div><strong>{readiness.total}%</strong><span>Общая готовность</span></div><p>100% требует теории, самостоятельных решений и рабочего опыта по всем направлениям.</p></section>

      <section className="skill-track-grid">
        {skillMeta.map((meta) => {
          const track = tracks[meta.id];
          const Icon = meta.icon;
          const score = total(track);
          return <article key={meta.id} className={score === 0 ? 'locked' : ''}>
            <header><span><Icon size={19} /></span><strong>{meta.name}</strong><b>{score}</b></header>
            <div className="skill-total"><i style={{ width: `${score}%` }} /></div>
            <dl>
              <div><dt>Теория</dt><dd>{track.theory}</dd></div>
              <div><dt>С куратором</dt><dd>{track.guided}</dd></div>
              <div><dt>Самостоятельно</dt><dd>{track.independent}</dd></div>
              <div><dt>Рабочий опыт</dt><dd>{track.production}</dd></div>
            </dl>
          </article>;
        })}
      </section>

      <section className="milestone-panel">
        <div><p className="eyebrow">ПОДТВЕРЖДЁННЫЕ ДЕЙСТВИЯ</p><h3>Кампания и симулятор</h3><MailWarning size={20} /></div>
        <div className="milestone-list">{milestones.map(([label, done]) => <div key={label as string} className={done ? 'done' : ''}><span>{done ? <Check size={14} /> : <Circle size={12} />}</span><strong>{label as string}</strong></div>)}</div>
      </section>
    </div>
  );
}
