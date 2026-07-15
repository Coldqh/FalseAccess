import { Check, Circle, Code2, FileTerminal, Globe2, GraduationCap, LockKeyhole, MailWarning, Network, Radar, Shield, TerminalSquare, UserRoundCheck } from 'lucide-react';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';

export function SkillsApp() {
  const { progress } = useProgress();
  const terminalRatio = progress.terminalObjectives.length / terminalObjectiveDefinitions.length;
  const contractSkills = (skill: string) => progress.completedContracts.filter((item) => item.skill === skill).length;
  const skills = [
    { name: 'Foundations', icon: GraduationCap, progress: Math.min(100, Math.round(terminalRatio * 45) + Math.round(progress.pythonLessonStep / 8 * 35) + (progress.alertReviewed ? 20 : 0)), state: 'CLINIC-01' },
    { name: 'Linux', icon: TerminalSquare, progress: Math.min(100, Math.round(terminalRatio * 22) + contractSkills('linux') * 4), state: terminalRatio >= 1 ? `Навигация + ${contractSkills('linux')} заказов` : 'Пути и команды' },
    { name: 'Python', icon: Code2, progress: Math.min(100, (progress.pythonComplete ? 18 : Math.round(progress.pythonLessonStep / 8 * 14)) + contractSkills('python') * 5), state: progress.pythonComplete ? `Первая программа + ${contractSkills('python')} заказов` : `Шаг ${Math.min(8, progress.pythonLessonStep + 1)}/8` },
    { name: 'SOC', icon: Radar, progress: Math.min(100, (progress.alertReviewed ? 14 : 2) + (progress.firstShiftComplete ? 8 : 0) + contractSkills('soc') * 5), state: progress.firstShiftComplete ? 'Triage и фишинг' : progress.alertReviewed ? 'Первый triage' : 'Не начато' },
    { name: 'Reports', icon: FileTerminal, progress: progress.reportSubmitted ? 12 : 0, state: progress.reportSubmitted ? 'Первый отчёт принят' : 'Не начато' },
    { name: 'Communication', icon: UserRoundCheck, progress: progress.interviewComplete ? 10 + progress.interviewScore * 2 : 0, state: progress.interviewComplete ? `Собеседование ${progress.interviewScore}/5` : 'Не начато' },
    { name: 'Phishing', icon: MailWarning, progress: progress.firstShiftComplete ? 14 : 0, state: progress.firstShiftComplete ? 'Первый тикет закрыт' : 'Закрыто' },
    { name: 'Networking', icon: Network, progress: 4 + contractSkills('networking') * 4, state: contractSkills('networking') > 0 ? `${contractSkills('networking')} заказов` : 'Вводная' },
    { name: 'Web Security', icon: Globe2, progress: contractSkills('web') * 4, state: contractSkills('web') > 0 ? `${contractSkills('web')} заказов` : 'Закрыто' },
    { name: 'Windows', icon: Shield, progress: 0, state: 'Следующая глава' },
    { name: 'Forensics', icon: LockKeyhole, progress: 0, state: 'Следующие главы' },
  ];

  const milestones = [
    ['Перейти в каталог CLINIC-01', progress.terminalObjectives.includes('cd-case')],
    ['Проверить путь в Linux', progress.terminalObjectives.includes('pwd')],
    ['Прочитать файл командой cat', progress.terminalObjectives.includes('read-brief')],
    ['Найти строки через grep', progress.terminalObjectives.includes('grep-failed')],
    ['Запустить analyze_auth.py', progress.pythonComplete],
    ['Правильно разобрать алерт', progress.alertReviewed],
    ['Сдать технический отчёт', progress.reportSubmitted],
    ['Пройти первое собеседование', progress.interviewComplete],
    ['Закрыть фишинговый тикет', progress.firstShiftComplete],
    ['Закрыть повторяемый заказ', progress.completedContracts.length > 0],
  ];

  return (
    <div className="skills-app app-scroll">
      <header className="skills-header"><div><p className="eyebrow">ПРОФИЛЬ / ИЛЬЯ ВОРОНЦОВ</p><h2>Навыки</h2><p>Завершённые дела, скрипты, отчёты и заказы.</p></div><div className="profile-badge"><span>18</span><small>лет</small></div></header>
      <section className="skill-grid">{skills.map((skill) => { const Icon = skill.icon; return <article key={skill.name} className={skill.progress === 0 ? 'locked' : ''}><header><span><Icon size={20} /></span><strong>{skill.name}</strong><b>{skill.progress}%</b></header><div className="skill-bar"><i style={{ width: `${skill.progress}%` }} /></div><small>{skill.state}</small></article>; })}</section>
      <section className="milestone-panel"><div><p className="eyebrow">ПОДТВЕРЖДЁННЫЕ ДЕЙСТВИЯ</p><h3>Журнал действий</h3></div><div className="milestone-list">{milestones.map(([label, done]) => <div key={label as string} className={done ? 'done' : ''}><span>{done ? <Check size={14} /> : <Circle size={12} />}</span><strong>{label as string}</strong></div>)}</div></section>
    </div>
  );
}
