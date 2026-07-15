import { Check, Circle, Code2, FileTerminal, Globe2, LockKeyhole, Network, Radar, Shield, TerminalSquare } from 'lucide-react';
import { terminalObjectiveDefinitions } from '../data/content';
import { useProgress } from '../system/ProgressContext';

export function SkillsApp() {
  const { progress } = useProgress();
  const terminalRatio = progress.terminalObjectives.length / terminalObjectiveDefinitions.length;
  const contractSkills = (skill: string) => progress.completedContracts.filter((item) => item.skill === skill).length;
  const skills = [
    { name: 'Linux', icon: TerminalSquare, progress: Math.min(100, Math.round(terminalRatio * 18) + contractSkills('linux') * 4), state: terminalRatio >= 1 ? `Практика + ${contractSkills('linux')} заказов` : 'Идёт обучение' },
    { name: 'Python', icon: Code2, progress: Math.min(100, (progress.pythonComplete ? 14 : 4) + contractSkills('python') * 5), state: progress.pythonComplete ? `Скрипт + ${contractSkills('python')} заказов` : 'Синтаксис' },
    { name: 'SOC', icon: Radar, progress: Math.min(100, (progress.alertReviewed ? 12 : 2) + contractSkills('soc') * 5), state: progress.alertReviewed ? `Triage + ${contractSkills('soc')} заказов` : 'Не начато' },
    { name: 'Reports', icon: FileTerminal, progress: progress.reportSubmitted ? 10 : 0, state: progress.reportSubmitted ? 'Отчёт принят' : 'Не начато' },
    { name: 'Networking', icon: Network, progress: 3, state: 'Вводная' },
    { name: 'Web Security', icon: Globe2, progress: 0, state: 'Закрыто' },
    { name: 'Windows', icon: Shield, progress: 0, state: 'Закрыто' },
    { name: 'Forensics', icon: LockKeyhole, progress: 0, state: 'Закрыто' },
  ];

  const milestones = [
    ['Проверить путь в Linux', progress.terminalObjectives.includes('pwd')],
    ['Прочитать файл командой cat', progress.terminalObjectives.includes('read-brief')],
    ['Найти строки через grep', progress.terminalObjectives.includes('grep-failed')],
    ['Написать цикл на Python', progress.pythonComplete],
    ['Правильно разобрать алерт', progress.alertReviewed],
    ['Сдать технический отчёт', progress.reportSubmitted],
    ['Закрыть повторяемый заказ', progress.completedContracts.length > 0],
  ];

  return (
    <div className="skills-app app-scroll">
      <header className="skills-header">
        <div><p className="eyebrow">ПРОФИЛЬ / ИЛЬЯ ВОРОНЦОВ</p><h2>Навыки, а не уровень</h2><p>Здесь нет XP. Прогресс растёт после действий без подсказок и правильных объяснений.</p></div>
        <div className="profile-badge"><span>18</span><small>лет</small></div>
      </header>
      <section className="skill-grid">
        {skills.map((skill) => { const Icon = skill.icon; return (
          <article key={skill.name} className={skill.progress === 0 ? 'locked' : ''}>
            <header><span><Icon size={20} /></span><strong>{skill.name}</strong><b>{skill.progress}%</b></header>
            <div className="skill-bar"><i style={{ width: `${skill.progress}%` }} /></div>
            <small>{skill.state}</small>
          </article>
        ); })}
      </section>
      <section className="milestone-panel">
        <div><p className="eyebrow">ПОДТВЕРЖДЁННЫЕ ДЕЙСТВИЯ</p><h3>Первая глава</h3></div>
        <div className="milestone-list">
          {milestones.map(([label, done]) => <div key={label as string} className={done ? 'done' : ''}><span>{done ? <Check size={14} /> : <Circle size={12} />}</span><strong>{label as string}</strong></div>)}
        </div>
      </section>
    </div>
  );
}
