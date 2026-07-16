import { Check, Circle, Code2, FileTerminal, Globe2, GraduationCap, LockKeyhole, MailWarning, Network, Radar, Shield, TerminalSquare, UserRoundCheck } from 'lucide-react';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';

export function SkillsApp() {
  const { progress } = useProgress();
  const terminalRatio = progress.terminalObjectives.length / terminalObjectiveDefinitions.length;
  const contractSkills = (skill: string) => progress.completedContracts.filter((item) => item.skill === skill).length;
  const skills = [
    { name: 'Foundations', icon: GraduationCap, progress: Math.min(100, Math.round(terminalRatio * 45) + Math.round(progress.pythonLessonStep / 8 * 35) + (progress.alertReviewed ? 20 : 0)), state: 'Осваиваются внутри миссий' },
    { name: 'Linux', icon: TerminalSquare, progress: Math.min(100, Math.round(terminalRatio * 22) + contractSkills('linux') * 4), state: terminalRatio >= 1 ? `Навигация + ${contractSkills('linux')} заказов` : 'Пути и команды' },
    { name: 'Python', icon: Code2, progress: Math.min(100, (progress.pythonComplete ? 18 : Math.round(progress.pythonLessonStep / 8 * 14)) + contractSkills('python') * 5), state: progress.pythonComplete ? `Первая программа + ${contractSkills('python')} заказов` : `Шаг ${Math.min(8, progress.pythonLessonStep + 1)}/8` },
    { name: 'SOC', icon: Radar, progress: Math.min(100, (progress.alertReviewed ? 14 : 2) + (progress.phishingComplete ? 6 : 0) + (progress.powershellComplete ? 6 : 0) + (progress.dnsComplete ? 6 : 0) + contractSkills('soc') * 5), state: progress.firstShiftComplete ? 'Первая смена закрыта' : progress.alertReviewed ? 'Первый triage' : 'Не начато' },
    { name: 'Reports', icon: FileTerminal, progress: progress.reportSubmitted ? 12 : 0, state: progress.reportSubmitted ? 'Первый отчёт принят' : 'Не начато' },
    { name: 'Communication', icon: UserRoundCheck, progress: progress.interviewComplete ? 10 + progress.interviewScore * 2 : 0, state: progress.interviewComplete ? `Собеседование ${progress.interviewScore}/5` : 'Не начато' },
    { name: 'Phishing', icon: MailWarning, progress: progress.phishingComplete ? 16 : 0, state: progress.phishingComplete ? 'Письмо разобрано' : 'Закрыто' },
    { name: 'Networking', icon: Network, progress: Math.min(100, 4 + (progress.dnsComplete ? 14 : 0) + contractSkills('networking') * 4), state: progress.dnsComplete ? 'DNS и повторяющиеся запросы' : contractSkills('networking') > 0 ? `${contractSkills('networking')} заказов` : 'Вводная' },
    { name: 'Web Security', icon: Globe2, progress: contractSkills('web') * 4, state: contractSkills('web') > 0 ? `${contractSkills('web')} заказов` : 'Закрыто' },
    { name: 'Windows', icon: Shield, progress: progress.powershellComplete ? 14 : 0, state: progress.powershellComplete ? 'Event 4688 и PowerShell' : 'Закрыто' },
    { name: 'Forensics', icon: LockKeyhole, progress: 0, state: 'Следующие главы' },
  ];

  const milestones = [
    ['Понять путь во время работы с терминалом', progress.terminalObjectives.includes('cd-case')],
    ['Проверить путь в Linux', progress.terminalObjectives.includes('pwd')],
    ['Прочитать файл командой cat', progress.terminalObjectives.includes('read-brief')],
    ['Найти строки через grep', progress.terminalObjectives.includes('grep-failed')],
    ['Собрать программу из восьми частей', progress.pythonComplete],
    ['Правильно разобрать алерт', progress.alertReviewed],
    ['Сдать технический отчёт', progress.reportSubmitted],
    ['Пройти первое собеседование', progress.interviewComplete],
    ['Закрыть фишинговый тикет', progress.phishingComplete],
    ['Разобрать запуск PowerShell из Word', progress.powershellComplete],
    ['Найти повторяющиеся DNS-запросы', progress.dnsComplete],
    ['Закрыть первую смену', progress.firstShiftComplete],
    ['Закрыть повторяемый заказ', progress.completedContracts.length > 0],
  ];

  return (
    <div className="skills-app app-scroll">
      <header className="skills-header"><div><p className="eyebrow">ПРОФИЛЬ / ИЛЬЯ ВОРОНЦОВ</p><h2>Подтверждённые навыки</h2><p>Здесь записаны действия, которые Илья уже выполнил сам.</p></div><div className="profile-badge"><span>18</span><small>лет</small></div></header>
      <section className="skill-grid">{skills.map((skill) => { const Icon = skill.icon; return <article key={skill.name} className={skill.progress === 0 ? 'locked' : ''}><header><span><Icon size={20} /></span><strong>{skill.name}</strong><b>{skill.progress}%</b></header><div className="skill-bar"><i style={{ width: `${skill.progress}%` }} /></div><small>{skill.state}</small></article>; })}</section>
      <section className="milestone-panel"><div><p className="eyebrow">ПОДТВЕРЖДЁННЫЕ ДЕЙСТВИЯ</p><h3>Кампания 0.4</h3></div><div className="milestone-list">{milestones.map(([label, done]) => <div key={label as string} className={done ? 'done' : ''}><span>{done ? <Check size={14} /> : <Circle size={12} />}</span><strong>{label as string}</strong></div>)}</div></section>
    </div>
  );
}
