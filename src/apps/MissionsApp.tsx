import { ArrowRight, BookOpenCheck, BriefcaseBusiness, FileSearch, Mail, MapPinned, MonitorCog, MessageSquare, ServerCog, ShieldCheck, UserRoundCheck } from 'lucide-react';
import type { AppId } from '../types';
import { useProgress } from '../system/ProgressContext';
import { getClinicStage } from '../missions/clinic01';

const shiftStages = [
  { title: 'Первый день', objective: 'Войти в офис и получить рабочий доступ.', dialogue: 'Ты Илья? Пропуск держи.', speaker: 'КЗ' },
  { title: 'Письмо в бухгалтерию', objective: 'Проверить отправителя, ссылку и вложение.', dialogue: 'Пользователь ничего не открыл. Начни с адреса.', speaker: 'КЗ' },
  { title: 'Word запустил PowerShell', objective: 'Разобрать событие 4688 и выбрать первое действие.', dialogue: 'Читай родительский процесс и командную строку.', speaker: 'КЗ' },
  { title: 'Повторяющиеся DNS-запросы', objective: 'Найти источник и описать подтверждённые факты.', dialogue: 'Узел уже изолирован. Теперь разберись, что он делал.', speaker: 'КЗ' },
  { title: 'Отчёт по смене', objective: 'Выбрать точную формулировку и закрыть смену.', dialogue: 'Укажи трафик. Не пиши то, чего мы не доказали.', speaker: 'КЗ' },
];

export function MissionsApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress } = useProgress();
  const clinic = getClinicStage(progress);

  let current: { caseId: string; time: string; title: string; context: string; objective: string; dialogue: string; speaker: string; target: AppId; button: string; icon: typeof BookOpenCheck };

  if (clinic.id !== 'complete') {
    current = {
      caseId: 'CLINIC-01', time: '14 МАРТА / 21:20', title: 'Компьютер регистратуры',
      context: 'Максим прислал копию журналов с компьютера клиники.',
      objective: clinic.objective,
      dialogue: clinic.dialogue, speaker: 'МБ',
      target: clinic.app, button: clinic.action, icon: MessageSquare,
    };
  } else if (!progress.interviewComplete) {
    current = {
      caseId: 'INTERVIEW-01', time: '15 МАРТА / 11:30', title: 'Собеседование',
      context: 'Анна Соколова получила отчёт от Максима.',
      objective: 'Ответить на пять вопросов по делу CLINIC-01.',
      dialogue: 'Пять вопросов. Где не знаешь — не выдумывай.', speaker: 'АС',
      target: 'interview', button: 'Ответить на звонок', icon: UserRoundCheck,
    };
  } else if (!progress.jobAccepted) {
    current = {
      caseId: 'MAIL-01', time: '15 МАРТА / 16:42', title: 'Ответ от «Сферы»',
      context: 'Во входящих письмо от Анны.',
      objective: 'Открыть письмо и дать ответ.',
      dialogue: 'Ответ нужен до завтра, 18:00.', speaker: 'АС',
      target: 'mail', button: 'Открыть Mail', icon: Mail,
    };
  } else if (!progress.firstShiftComplete) {
    const stage = shiftStages[Math.min(progress.firstShiftStage, shiftStages.length - 1)];
    current = {
      caseId: 'SHIFT-01', time: progress.firstShiftStage === 0 ? 'ПОНЕДЕЛЬНИК / 08:57' : 'ПОНЕДЕЛЬНИК', title: stage.title,
      context: 'Первая смена Ильи в SOC «Сферы».',
      objective: stage.objective,
      dialogue: stage.dialogue, speaker: stage.speaker,
      target: 'firstshift', button: progress.firstShiftStage === 0 ? 'Войти в офис' : 'Продолжить смену', icon: ShieldCheck,
    };
  } else if (progress.criminalContactUnlocked && !progress.criminalContactResponse) {
    current = {
      caseId: 'WIRE-UNKNOWN', time: 'ПОНЕДЕЛЬНИК / 19:27', title: 'Новый контакт',
      context: 'После смены написал незнакомый номер.',
      objective: 'Открыть Messenger и прочитать сообщение.',
      dialogue: 'Есть подработка по логам. 8 тысяч после результата.', speaker: '?',
      target: 'messenger', button: 'Открыть Messenger', icon: MessageSquare,
    };
  } else if (progress.criminalContactResponse === 'interested' && !progress.routeCaseAccepted) {
    current = {
      caseId: 'MARSHRUT-01', time: 'ВЕЧЕР', title: 'Встреча с Игорем',
      context: 'Игорь ждёт в кафе «Сигнал». Он не прислал архив в переписке.',
      objective: 'Приехать в кафе и забрать копию журналов.',
      dialogue: 'Столик у стены. Не опаздывай.', speaker: 'И',
      target: 'city', button: 'Открыть карту', icon: MapPinned,
    };
  } else if (progress.routeCaseAccepted && !progress.routeCaseComplete) {
    const routeObjectives = ['Прочитать условия работы.', 'Разобраться с HTTP-запросами.', 'Осмотреть журналы в терминале.', 'Собрать временную линию в Python.', 'Выбрать подтверждённые факты.', 'Составить отчёт.', 'Решить, что отправить Игорю.', 'Закрыть дело.'];
    current = {
      caseId: 'MARSHRUT-01', time: `ДЕНЬ ${progress.simulation.clock.day}`, title: 'Ночная сессия',
      context: 'Архив службы доставки «Маршрут» открыт в отдельном рабочем пространстве.',
      objective: routeObjectives[Math.min(progress.routeCaseStage, routeObjectives.length - 1)],
      dialogue: progress.routeCaseStage < 6 ? 'Нужны IP, время и учётка. Остальное потом.' : 'Скинь IP, время, учётку и cookie.', speaker: 'И',
      target: 'routecase', button: 'Продолжить дело', icon: FileSearch,
    };
  } else if (!progress.windowsCaseComplete) {
    const windowsObjectives = [
      'Прочитать условия и данные по FIN-WS-07.',
      'Разобрать дерево процессов.',
      'Собрать артефакты PowerShell-командами.',
      'Написать сборщик collect-artifacts.ps1.',
      'Самостоятельно разобрать OPS-WS-12.',
      'Выбрать подтверждённые выводы.',
      'Составить отчёт по двум машинам.',
      'Закрыть дело.',
    ];
    current = {
      caseId: 'NORTHLINE-07', time: `ДЕНЬ ${progress.simulation.clock.day}`, title: 'Рабочая станция',
      context: 'Игорь передал изолированные снимки двух Windows-машин со склада «Северной линии».',
      objective: windowsObjectives[Math.min(progress.windowsCaseStage, windowsObjectives.length - 1)],
      dialogue: progress.windowsCaseStage === 0 ? 'Машина уже без сети. Сначала пойми, что запустилось.' : 'Нужны цепочка, файл, закрепление и соседние узлы.', speaker: 'И',
      target: 'windowscase', button: 'Открыть NORTHLINE-07', icon: MonitorCog,
    };
  } else if (!progress.linuxCaseComplete) {
    const linuxObjectives = [
      'Прочитать условия по BET-CORE-02.',
      'Разобрать пользователей и права.',
      'Восстановить SSH, sudo, systemd и сетевую цепочку.',
      'Написать Bash-сборщик артефактов.',
      'Выбрать безопасный план изоляции и восстановления.',
      'Самостоятельно разобрать EDGE-BET-04.',
      'Собрать вывод и отчёт по двум серверам.',
      'Закрыть дело.',
    ];
    current = {
      caseId: 'REDTABLE-02', time: `ДЕНЬ ${progress.simulation.clock.day}`, title: 'Linux-сервер',
      context: 'На сервере подпольной букмекерской сети пропала очередь расчётов. Администратор отрицает изменения.',
      objective: linuxObjectives[Math.min(progress.linuxCaseStage, linuxObjectives.length - 1)],
      dialogue: progress.linuxCaseStage === 0 ? 'Основной трафик уже на резерве. Не ломай то, что осталось.' : 'Нужны вход, sudo, закрепление и точный масштаб.', speaker: 'И',
      target: 'linuxcase', button: 'Открыть REDTABLE-02', icon: ServerCog,
    };
  } else {
    current = {
      caseId: 'WORK//QUEUE', time: 'ВЕЧЕР', title: 'Свободные заказы',
      context: 'REDTABLE-02 закрыт. Открылись задания по SSH, systemd, cron и Bash.',
      objective: 'Выбрать заказ или продолжить следующую главу.',
      dialogue: 'Следующая крупная работа — сеть офиса.', speaker: 'И',
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
