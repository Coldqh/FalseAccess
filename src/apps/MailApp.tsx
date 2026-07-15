import { useMemo, useState } from 'react';
import { Archive, CheckCircle2, ChevronLeft, Inbox, Mail, Paperclip, Reply, Search, Send, Star } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

type MailItem = {
  id: string;
  sender: string;
  address: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread: boolean;
  attachment?: string;
  action?: 'accept-job' | 'open-shift';
};

export function MailApp() {
  const { progress, markMailRead, setFlag } = useProgress();
  const [activeId, setActiveId] = useState(progress.jobOfferUnlocked ? 'job-offer' : 'maxim-case');
  const [folder, setFolder] = useState<'inbox' | 'starred'>('inbox');

  const mails = useMemo<MailItem[]>(() => {
    const base: MailItem[] = [
      {
        id: 'maxim-case', sender: 'Максим Белов', address: 'm.belov@ostroclinic.local', subject: 'Копия журналов с регистратуры',
        preview: 'Я выгрузил только учебную копию. Оригиналы остались у нас...',
        body: [
          'Илья,',
          'Я выгрузил только учебную копию. Оригиналы остались у нас, данные пациентов удалены.',
          'Ночью кто-то перебирал учётные записи через SSH. Компьютер ещё и тормозит, поэтому проверь список процессов. Не называй это взломом, пока не увидишь успешный вход.',
          'Открой Missions и подключись к созвону. Я буду видеть учебный терминал и объяснять команды по ходу дела.',
          '— Максим',
        ],
        time: '21:18', unread: !progress.readMail.includes('maxim-case'), attachment: 'clinic-01.evidence',
      },
      {
        id: 'mentor-call', sender: 'Максим Белов', address: 'm.belov@ostroclinic.local', subject: 'Подключение к учебному терминалу',
        preview: 'Никаких лекций до дела. Будем разбирать всё на месте...',
        body: [
          'Илья,',
          'Никаких лекций до дела. Я подключусь к учебному экрану и буду давать по одному действию.',
          'Сначала ты введёшь команду. Потом увидишь результат. Только после этого разберём термин и пойдём дальше.',
          'Открой Missions и нажми «Подключиться».',
          '— Максим',
        ],
        time: '21:19', unread: !progress.readMail.includes('mentor-call'),
      },
    ];
    if (progress.jobOfferUnlocked) {
      base.unshift({
        id: 'job-offer', sender: 'Анна Соколова', address: 'a.sokolova@sfera-integration.local', subject: progress.jobAccepted ? 'Предложение принято' : 'Предложение о работе',
        preview: progress.jobAccepted ? 'Ждём вас в понедельник к 09:00...' : 'Результат собеседования принят. Готовы предложить позицию...',
        body: progress.jobAccepted ? [
          'Илья, подтверждение получено.',
          'Ждём вас в понедельник к 09:00. Офис: Острогорск, Промышленная, 18.',
          'На входе назовите фамилию. Кирилл выдаст временный пропуск и рабочую станцию.',
          'Анна Соколова\nРуководитель смены SOC\n«Сфера-Интеграция»',
        ] : [
          'Илья, добрый день.',
          `Результат собеседования принят: ${progress.interviewScore}/5. Вы не называли инцидент компрометацией без доказательств и понимали порядок сохранения данных.`,
          'Готовы предложить позицию младшего аналитика SOC. Выход в понедельник, 09:00. Офис: Острогорск, Промышленная, 18.',
          'Оклад на испытательный срок указан во вложении. Ответ нужен до 18:00 завтра.',
          'Анна Соколова\nРуководитель смены SOC\n«Сфера-Интеграция»',
        ],
        time: 'СЕЙЧАС', unread: !progress.readMail.includes('job-offer'), attachment: 'offer_vorontsov.pdf', action: progress.jobAccepted ? 'open-shift' : 'accept-job',
      });
    }
    if (progress.jobAccepted) {
      base.unshift({
        id: 'first-ticket', sender: 'WATCHTOWER SOC', address: 'tickets@sfera-integration.local', subject: 'Назначен тикет PHISH-2026-0041',
        preview: 'Бухгалтерия переслала подозрительное письмо...',
        body: [
          'Новый тикет назначен: PHISH-2026-0041.',
          'Бухгалтерия получила письмо об обновлении зарплатного кабинета. Пользователь не открывал вложение.',
          'Проверь отправителя, фактический адрес ссылки, формат вложения и выбери первые действия.',
          'Тикет доступен в приложении First Shift.',
        ],
        time: '09:42', unread: !progress.readMail.includes('first-ticket'), action: 'open-shift',
      });
    }
    return base;
  }, [progress.interviewScore, progress.jobAccepted, progress.jobOfferUnlocked, progress.readMail]);

  const active = mails.find((mail) => mail.id === activeId) ?? mails[0];
  const openMail = (id: string) => { setActiveId(id); markMailRead(id); };

  return (
    <div className="mail-app">
      <aside className="mail-sidebar">
        <div className="mail-logo"><Mail size={20} /><strong>POST//LOCAL</strong></div>
        <button className="compose"><Send size={16} />Новое письмо</button>
        <nav><button className={folder === 'inbox' ? 'active' : ''} onClick={() => setFolder('inbox')}><Inbox size={17} />Входящие <b>{mails.filter((m) => m.unread).length}</b></button><button className={folder === 'starred' ? 'active' : ''} onClick={() => setFolder('starred')}><Star size={17} />Избранное</button><button><Archive size={17} />Архив</button></nav>
        <div className="mail-storage"><span>LOCAL STORAGE</span><i><b style={{ width: '22%' }} /></i><small>3.1 MB / 128 MB</small></div>
      </aside>
      <section className="mail-list">
        <header><div className="mail-search"><Search size={16} /><input placeholder="Поиск по почте" /></div><span>{mails.length} писем</span></header>
        <div className="mail-list-scroll">{mails.map((mail) => <button key={mail.id} className={`${active?.id === mail.id ? 'active' : ''} ${mail.unread ? 'unread' : ''}`} onClick={() => openMail(mail.id)}><div className="mail-avatar">{mail.sender.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><header><strong>{mail.sender}</strong><time>{mail.time}</time></header><h4>{mail.subject}</h4><p>{mail.preview}</p></div>{mail.attachment && <Paperclip size={13} />}</button>)}</div>
      </section>
      <article className="mail-reader app-scroll">
        {active ? <><header className="reader-toolbar"><button><ChevronLeft size={17} /></button><div><button><Archive size={16} /></button><button><Star size={16} /></button><button><Reply size={16} /></button></div></header><div className="reader-content"><p className="eyebrow">{active.time}</p><h2>{active.subject}</h2><div className="sender-line"><div className="mail-avatar large">{active.sender.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><strong>{active.sender}</strong><span>{active.address}</span></div></div><div className="mail-body">{active.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{active.attachment && <button className="attachment-card"><Paperclip size={18} /><div><strong>{active.attachment}</strong><span>Локальное вложение</span></div><small>OPEN</small></button>}
          {active.action === 'accept-job' && <button className="primary-action mail-action" onClick={() => setFlag('jobAccepted', true)}><CheckCircle2 size={17} />Принять предложение</button>}
          {active.action === 'open-shift' && progress.jobAccepted && <div className="mail-confirmed"><CheckCircle2 size={18} /><div><strong>{active.id === 'first-ticket' ? 'Тикет доступен' : 'Предложение принято'}</strong><span>{active.id === 'first-ticket' ? 'Открой First Shift на рабочем столе.' : 'Первая смена открыта в Missions.'}</span></div></div>}
        </div></> : <div className="empty-state">Выбери письмо</div>}
      </article>
    </div>
  );
}
