import { ArrowRight, BookOpenCheck, BriefcaseBusiness, Mail, MessageSquare, ShieldCheck, UserRoundCheck } from 'lucide-react';
import type { AppId } from '../types';
import { useProgress } from '../system/ProgressContext';
import { getClinicStage } from '../missions/clinic01';

export function MissionsApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress } = useProgress();
  const clinic = getClinicStage(progress);

  let current: { caseId: string; time: string; title: string; context: string; objective: string; dialogue: string; speaker: string; target: AppId; button: string; icon: typeof BookOpenCheck };

  if (clinic.id !== 'complete') {
    current = {
      caseId: 'CLINIC-01', time: '14 МАРТА / 21:20', title: 'Компьютер регистратуры',
      context: 'Максим Белов работает системным администратором в городской клинике №4. Он прислал очищенную копию журналов с компьютера, который начал тормозить после ночных попыток входа.',
      objective: clinic.objective,
      dialogue: clinic.dialogue, speaker: 'МБ',
      target: clinic.app, button: clinic.action, icon: MessageSquare,
    };
  } else if (!progress.interviewComplete) {
    current = {
      caseId: 'INTERVIEW-01', time: '15 МАРТА / 11:30', title: 'Собеседование в «Сфере»',
      context: 'Максим передал отчёт Анне Соколовой. Она согласилась провести короткое техническое собеседование.',
      objective: 'Ответить на пять вопросов по CLINIC-01.',
      dialogue: '«Мне не нужны громкие слова. Объясни, что доказали данные и что ты сделал бы первым».', speaker: 'АС',
      target: 'interview', button: 'Начать собеседование', icon: UserRoundCheck,
    };
  } else if (!progress.jobAccepted) {
    current = {
      caseId: 'MAIL-01', time: '15 МАРТА / 16:42', title: 'Ответ от «Сферы»',
      context: 'Собеседование закончено. Во входящих появилось письмо от Анны Соколовой.',
      objective: 'Открыть предложение и дать ответ.',
      dialogue: '«Результат принят. Ответ нужен до завтра, 18:00».', speaker: 'АС',
      target: 'mail', button: 'Открыть Mail', icon: Mail,
    };
  } else if (!progress.firstShiftComplete) {
    current = {
      caseId: 'SHIFT-01', time: 'ПОНЕДЕЛЬНИК / 09:42', title: 'Первый тикет',
      context: 'Илья вышел на первую смену младшим аналитиком SOC. Бухгалтерия переслала подозрительное письмо.',
      objective: 'Разобрать тикет PHISH-2026-0041 и выбрать первые действия.',
      dialogue: '«Не открывай вложение. Сначала отправитель, ссылка и заголовки».', speaker: 'КЗ',
      target: 'firstshift', button: 'Открыть тикет', icon: ShieldCheck,
    };
  } else {
    current = {
      caseId: 'WORK//QUEUE', time: 'ПОСЛЕ СМЕНЫ', title: 'Свободные заказы',
      context: 'Первая смена закончена. Доступны повторяемые задачи по уже пройденным навыкам.',
      objective: 'Выбрать заказ или дождаться следующей сюжетной главы.',
      dialogue: '«Завтра покажу, как у нас устроены смены. Сегодня домой».', speaker: 'КЗ',
      target: 'contracts', button: 'Открыть Work Queue', icon: BriefcaseBusiness,
    };
  }

  const Icon = current.icon;

  return (
    <div className="missions-current-only app-scroll">
      <header><p className="eyebrow">{current.time}</p><span>{current.caseId}</span></header>
      <section className="current-mission-title"><Icon size={30} /><div><h2>{current.title}</h2><p>{current.context}</p></div></section>
      <section className="current-objective"><span>ТЕКУЩАЯ ЦЕЛЬ</span><h3>{current.objective}</h3></section>
      <section className="current-dialogue"><div>{current.speaker}</div><p>{current.dialogue}</p></section>
      <button className="primary-action current-mission-action" onClick={() => openApp(current.target)}>{current.button}<ArrowRight size={17} /></button>
    </div>
  );
}
