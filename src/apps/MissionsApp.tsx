import {
  ArrowRight, BookOpenCheck, Boxes, Braces, Building2, Check, Cloud, Crosshair,
  FileSearch, Fingerprint, HardDrive, Mail, MailWarning, MapPinned, MonitorCog,
  Network, Router, ServerCog, ShieldAlert, ShieldCheck, Smartphone, UserRoundCheck,
  Waypoints, Workflow,
} from 'lucide-react';
import type { AppId } from '../types';
import { useProgress } from '../system/ProgressContext';
import { useMissionRuntime } from '../system/MissionRuntimeContext';
import { getClinicStage } from '../missions/clinic01';

interface CampaignEntry {
  id: string;
  act: string;
  title: string;
  subtitle: string;
  target: AppId;
  icon: typeof BookOpenCheck;
  complete: boolean;
  available: boolean;
}

interface CurrentMission {
  id: string;
  act: string;
  time: string;
  title: string;
  context: string;
  objective: string;
  dialogue: string;
  speaker: string;
  target: AppId;
  button: string;
  icon: typeof BookOpenCheck;
}

function currentAfterClinic(progress: any): CurrentMission {
  if (!progress.interviewComplete) return {
    id: 'INTERVIEW-01', act: 'АКТ 1 / СФЕРА', time: '15 МАРТА / 11:30', title: 'Техническое собеседование',
    context: 'Анна получила evidence report по CLINIC-01.', objective: 'Разобрать собственные решения и границы доказанного.',
    dialogue: 'Мне важнее ход работы, чем выученные определения.', speaker: 'АС', target: 'interview', button: 'Ответить на звонок', icon: UserRoundCheck,
  };
  if (!progress.jobAccepted) return {
    id: 'MAIL-01', act: 'АКТ 1 / СФЕРА', time: '15 МАРТА / 16:42', title: 'Предложение от «Сферы»',
    context: 'Во входящих письмо от Анны.', objective: 'Прочитать условия и принять решение.',
    dialogue: 'Ответ нужен до завтра, 18:00.', speaker: 'АС', target: 'mail', button: 'Открыть Mail', icon: Mail,
  };
  if (!progress.firstShiftComplete) return {
    id: 'FIRST-SHIFT', act: 'АКТ 1 / СФЕРА', time: 'ПОНЕДЕЛЬНИК', title: 'Первая смена',
    context: 'Очередь связанных алертов: почта, endpoint и DNS.', objective: 'Разбирать данные, фиксировать scope и не принимать сигнал за доказанный инцидент.',
    dialogue: 'Очередь сама себя не закроет. Смотри источники.', speaker: 'КЗ', target: 'firstshift', button: 'Продолжить смену', icon: ShieldCheck,
  };
  if (progress.criminalContactUnlocked && !progress.criminalContactResponse) return {
    id: 'WIRE-UNKNOWN', act: 'ПЕРЕХОД', time: 'ПОНЕДЕЛЬНИК / 19:27', title: 'Новый контакт',
    context: 'После смены написал незнакомый номер.', objective: 'Прочитать предложение и решить, вступать ли в серую линию.',
    dialogue: 'Есть подработка по логам. Оплата после результата.', speaker: '?', target: 'messenger', button: 'Открыть Messenger', icon: Network,
  };
  if (progress.criminalContactResponse === 'interested' && !progress.routeCaseAccepted) return {
    id: 'MARSHRUT-01', act: 'АКТ 2 / МАРШРУТ', time: 'ВЕЧЕР', title: 'Встреча с Игорем',
    context: 'Материалы не отправляют в переписке.', objective: 'Приехать в кафе и получить локальную копию.',
    dialogue: 'Столик у стены.', speaker: 'И', target: 'city', button: 'Открыть City', icon: MapPinned,
  };

  const sequence: Array<[boolean, CurrentMission]> = [
    [!progress.routeCaseComplete, { id:'MARSHRUT-01', act:'АКТ 2 / МАРШРУТ', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'HTTP, JSONL и временная линия', context:'Служба доставки, спорная сессия и конфликт интересов заказчика.', objective:'Связать HTTP, учётку, время и действия. Затем решить, кому передать результат.', dialogue:'Нужен воспроизводимый путь, не три значения из формы.', speaker:'И', target:'routecase', button:'Открыть MARSHRUT-01', icon:FileSearch }],
    [!progress.windowsCaseComplete, { id:'NORTHLINE-07', act:'АКТ 3 / ХОСТЫ И СЕТИ', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'Windows workstation', context:'Две машины, process tree и возможное persistence.', objective:'Связать процессы, командные строки, файлы и закрепление.', dialogue:'Сначала цепочка. Потом вывод.', speaker:'И', target:'windowscase', button:'Открыть NORTHLINE-07', icon:MonitorCog }],
    [!progress.linuxCaseComplete, { id:'REDTABLE-02', act:'АКТ 3 / ХОСТЫ И СЕТИ', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'Linux server', context:'SSH, sudo, systemd и работающий резерв.', objective:'Восстановить вход, привилегии, persistence и безопасный recovery.', dialogue:'Не ломай сервис, который ещё жив.', speaker:'И', target:'linuxcase', button:'Открыть REDTABLE-02', icon:ServerCog }],
    [!progress.networkCaseComplete, { id:'BLACKWIRE-03', act:'АКТ 3 / ХОСТЫ И СЕТИ', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'Network investigation', context:'DHCP, DNS, gateway и отдельный сегмент камер.', objective:'Разобрать сетевую причину и выбрать точечный containment.', dialogue:'Не выключай весь DNS из-за одного узла.', speaker:'И', target:'networkcase', button:'Открыть BLACKWIRE-03', icon:Router }],
    [!progress.webCaseComplete, { id:'VANTA-04', act:'АКТ 4 / ДОСТУП', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'Web / API / SQL', context:'Обычная сессия получает чужой объект.', objective:'Отделить authentication от authorization и исправить серверный контроль.', dialogue:'Прод не трогай. Локальный стенд готов.', speaker:'И', target:'webcase', button:'Открыть VANTA-04', icon:Braces }],
    [!progress.mobileCaseComplete, { id:'MIRRORCELL-05', act:'АКТ 4 / ДОСТУП', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'Mobile sessions', context:'Телефон, backup, токены и MDM.', objective:'Связать пакет, полномочия, сохранённую сессию и удалённую активность.', dialogue:'Нужна цепочка, а не страшное разрешение.', speaker:'И', target:'mobilecase', button:'Открыть MIRRORCELL-05', icon:Smartphone }],
    [!progress.adCaseComplete, { id:'IRONROOT-06', act:'АКТ 4 / ДОСТУП', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'Active Directory', context:'Старая учётка, Kerberos, GPO и несколько хостов.', objective:'Восстановить identity path и исправить избыточные права.', dialogue:'Домен клонирован. Докажи путь.', speaker:'И', target:'adcase', button:'Открыть IRONROOT-06', icon:Waypoints }],
    [!progress.mailCaseComplete, { id:'BLACKPOST-07', act:'АКТ 4 / ДОСТУП', time:`ДЕНЬ ${progress.simulation.clock.day}`, title:'Mail security', context:'Raw EML, вложение, endpoint и OAuth.', objective:'Связать заголовки, сессию, правило пересылки и масштаб кампании.', dialogue:'Received сначала. Вывод потом.', speaker:'И', target:'mailcase', button:'Открыть BLACKPOST-07', icon:MailWarning }],
    [!progress.darknetComplete, { id:'DARKNET-00', act:'ПЕРЕХОД', time:'НОЧЬ', title:'Неизвестное приглашение', context:'Локальный пакет с onion-адресом и подписью.', objective:'Проверить полный адрес и работать только в учебной сети.', dialogue:'Обычный браузер здесь не нужен.', speaker:'?', target:'tor', button:'Открыть Tor Browser', icon:Network }],
    [!progress.forensicsCaseComplete, { id:'DEADFRAME-08', act:'АКТ 5 / ИНЦИДЕНТ', time:'НОЧЬ', title:'Disk & memory forensics', context:'E01, RAM и второй образ без готового порядка.', objective:'Сохранить integrity, построить timeline и связать disk, browser, registry и memory.', dialogue:'Оригиналы не трогай.', speaker:'?', target:'forensicscase', button:'Открыть DEADFRAME-08', icon:HardDrive }],
    [!progress.incidentCaseComplete, { id:'GREYLOCK-09', act:'АКТ 5 / ИНЦИДЕНТ', time:'АКТИВНЫЙ ИНЦИДЕНТ', title:'Incident Response', context:'Gateway, identity и критический расчётный контур.', objective:'Доказать scope, локализовать и вернуть сервисы поэтапно.', dialogue:'Не глуши чистые системы из страха.', speaker:'G', target:'incidentcase', button:'Открыть GREYLOCK-09', icon:ShieldAlert }],
    [!progress.huntCaseComplete, { id:'NIGHTGLASS-10', act:'АКТ 5 / ИНЦИДЕНТ', time:'HUNT', title:'Threat Hunting', context:'Готового алерта нет.', objective:'Сформулировать гипотезу, проверить baseline и перевести находку в detection.', dialogue:'IOC наугад не ищут.', speaker:'G', target:'huntcase', button:'Открыть NIGHTGLASS-10', icon:Crosshair }],
    [!progress.cryptoCaseComplete, { id:'CIPHERFALL-11', act:'АКТ 6 / ЦЕПОЧКА ДОВЕРИЯ', time:'EVIDENCE', title:'Cryptography & malware', context:'TLS, подпись и два безопасных учебных бинарника.', objective:'Отделить доверие к каналу от доверия к файлу.', dialogue:'Подпись не делает код честным.', speaker:'G', target:'cryptocase', button:'Открыть CIPHERFALL-11', icon:Fingerprint }],
    [!progress.cloudCaseComplete, { id:'SKYVAULT-12', act:'АКТ 6 / ЦЕПОЧКА ДОВЕРИЯ', time:'CLOUD', title:'Cloud identity', context:'Workload identity, bucket и KMS.', objective:'Показать, какая identity выполнила каждое действие и как ограничить доступ.', dialogue:'Private не означает недоступный.', speaker:'G', target:'cloudcase', button:'Открыть SKYVAULT-12', icon:Cloud }],
    [!progress.supplyCaseComplete, { id:'CHAINBREAK-13', act:'АКТ 6 / ЦЕПОЧКА ДОВЕРИЯ', time:'SUPPLY CHAIN', title:'Containers & CI/CD', context:'Commit, pipeline, image, RBAC и cloud role.', objective:'Восстановить provenance и поставить проверяемые release gates.', dialogue:'Свяжи всю цепочку.', speaker:'G', target:'supplycase', button:'Открыть CHAINBREAK-13', icon:Boxes }],
    [!progress.architectureCaseComplete, { id:'BASTION-14', act:'АКТ 7 / КОМАНДОВАНИЕ', time:'DESIGN REVIEW', title:'Security architecture', context:'Три города, ограниченный бюджет и критичный settlement.', objective:'Расставить приоритеты, владельцев, controls и recovery checks.', dialogue:'Список продуктов не является архитектурой.', speaker:'G', target:'architecturecase', button:'Открыть BASTION-14', icon:Building2 }],
    [!progress.capstoneCaseComplete, { id:'BLACKSKY-15', act:'АКТ 7 / КОМАНДОВАНИЕ', time:'CAPSTONE', title:'Enterprise incident', context:'Identity, CI, Kubernetes и cloud в одной активной цепочке.', objective:'Самостоятельно выбрать источники, стратегию ответа и коммуникацию.', dialogue:'Первое решение будет иметь последствия.', speaker:'G', target:'capstonecase', button:'Открыть BLACKSKY-15', icon:Workflow }],
  ];
  return sequence.find(([condition]) => condition)?.[1] ?? {
    id:'FREEPLAY', act:'СВОБОДНАЯ ИГРА', time:'ПОСЛЕ КАМПАНИИ', title:'Повторяемые операции', context:'Основная линия завершена.', objective:'Брать валидированные контракты и развивать специализации.', dialogue:'Теперь форма задачи заранее не известна.', speaker:'G', target:'contracts', button:'Открыть Work Queue', icon:Network,
  };
}

export function MissionsApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress: rawProgress } = useProgress();
  const progress = rawProgress as any;
  const runtime = useMissionRuntime();
  const clinic = getClinicStage(rawProgress);
  const workspace = runtime.store.missions['workspace-01'];
  const clinicComplete = clinic.id === 'complete';

  const current: CurrentMission = !clinicComplete ? {
    id: clinic.id === 'terminal' ? 'CLINIC-01 / 0.2' : clinic.id === 'code' ? 'CLINIC-01 / 0.3' : 'CLINIC-01',
    act: 'АКТ 0 / НЕТ ДОСТУПА',
    time: '14 МАРТА / ЛОКАЛЬНАЯ КОПИЯ',
    title: clinic.title,
    context: 'Первая операция теперь разбита на главы: рабочее место, журналы и процессы, автоматизация, проверка алерта и evidence report.',
    objective: clinic.objective,
    dialogue: clinic.dialogue,
    speaker: 'МБ',
    target: clinic.app,
    button: clinic.action,
    icon: BookOpenCheck,
  } : currentAfterClinic(progress);

  const campaign: CampaignEntry[] = [
    { id:'0.1', act:'АКТ 0', title:'Рабочее место', subtitle:'filesystem · paths · evidence', target:'missions', icon:BookOpenCheck, complete:workspace?.status === 'completed', available:true },
    { id:'0.2', act:'АКТ 0', title:'Журналы и процессы', subtitle:'auth.log · process snapshot', target:'terminal', icon:ServerCog, complete:progress.terminalObjectives?.includes('inspect-processes'), available:workspace?.status === 'completed' },
    { id:'0.3', act:'АКТ 0', title:'Автоматизация', subtitle:'Python · errors · repeatability', target:'code', icon:Braces, complete:progress.pythonComplete, available:progress.terminalObjectives?.includes('inspect-processes') },
    { id:'1', act:'АКТ 1', title:'Сфера', subtitle:'SOC · telemetry · first shift', target:'firstshift', icon:ShieldCheck, complete:progress.firstShiftComplete, available:progress.jobAccepted },
    { id:'2', act:'АКТ 2', title:'Маршрут', subtitle:'HTTP · JSONL · timeline', target:'routecase', icon:FileSearch, complete:progress.routeCaseComplete, available:progress.routeCaseAccepted },
    { id:'3', act:'АКТ 3', title:'Хосты и сети', subtitle:'Windows · Linux · Network', target:'windowscase', icon:Router, complete:progress.networkCaseComplete, available:progress.routeCaseComplete },
    { id:'4', act:'АКТ 4', title:'Доступ', subtitle:'Web · Mobile · AD · Mail', target:'webcase', icon:Waypoints, complete:progress.mailCaseComplete, available:progress.networkCaseComplete },
    { id:'5', act:'АКТ 5', title:'Инцидент', subtitle:'DFIR · IR · Hunting', target:'forensicscase', icon:ShieldAlert, complete:progress.huntCaseComplete, available:progress.darknetComplete },
    { id:'6', act:'АКТ 6', title:'Цепочка доверия', subtitle:'Crypto · Cloud · Supply Chain', target:'cryptocase', icon:Fingerprint, complete:progress.supplyCaseComplete, available:progress.huntCaseComplete },
    { id:'7', act:'АКТ 7', title:'Командование', subtitle:'Architecture · Capstone', target:'architecturecase', icon:Building2, complete:progress.capstoneCaseComplete, available:progress.supplyCaseComplete },
  ];

  const Icon = current.icon;

  return (
    <div className="missions-v2 app-scroll">
      <header className="missions-v2-header">
        <div><p className="eyebrow">{current.act}</p><h2>Основная кампания</h2></div>
        <span>{campaign.filter((entry) => entry.complete).length}/{campaign.length} глав</span>
      </header>

      <section className="missions-v2-current">
        <div className="missions-v2-current-code"><Icon size={27} /><span>{current.id}</span></div>
        <div className="missions-v2-current-copy">
          <p>{current.time}</p>
          <h1>{current.title}</h1>
          <span>{current.context}</span>
        </div>
        <div className="missions-v2-objective">
          <small>ТЕКУЩАЯ ЦЕЛЬ</small>
          <strong>{current.objective}</strong>
        </div>
        <div className="missions-v2-dialogue"><i>{current.speaker}</i><span>{current.dialogue}</span></div>
        <button className="primary-action" onClick={() => openApp(current.target)}>{current.button}<ArrowRight size={16} /></button>
      </section>

      <section className="missions-v2-path">
        <header><span>ПУТЬ ОБУЧЕНИЯ</span><small>Глава открывается доказанным действием, не количеством кликов.</small></header>
        <div>
          {campaign.map((entry) => {
            const EntryIcon = entry.icon;
            return (
              <button key={entry.id} disabled={!entry.available} className={`${entry.complete ? 'complete' : ''} ${entry.available && !entry.complete ? 'available' : ''}`} onClick={() => entry.available && openApp(entry.target)}>
                <span>{entry.complete ? <Check size={13} /> : entry.id}</span>
                <EntryIcon size={18} />
                <div><small>{entry.act}</small><strong>{entry.title}</strong><p>{entry.subtitle}</p></div>
                <ArrowRight size={14} />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
