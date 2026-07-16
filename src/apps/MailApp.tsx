import { useMemo, useState } from 'react';
import { Archive, CheckCircle2, ChevronLeft, Inbox, Mail, Paperclip, Reply, Search, Send, Star } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import type { AppId } from '../types';

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

export function MailApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress, markMailRead, setFlag } = useProgress();
  const [activeId, setActiveId] = useState<string | null>(() => window.matchMedia('(max-width: 720px)').matches ? null : 'maxim-case');
  const [folder, setFolder] = useState<'inbox' | 'starred'>('inbox');

  const mails = useMemo<MailItem[]>(() => {
    const base: MailItem[] = [
      {
        id: 'maxim-case', sender: 'Максим Белов', address: 'm.belov@clinic-4.local', subject: 'Файлы CLINIC-01',
        preview: 'Копия журналов без данных пациентов...',
        body: [
          'Илья,',
          'Прикрепил очищенную копию журналов с компьютера регистратуры. Данные пациентов удалены.',
          'Ночью были попытки входа по SSH. Компьютер ещё и тормозит. Сначала проверь журнал и процессы. Не называй это взломом без успешного входа.',
          'Если возьмёшься — набери меня в Messenger.',
          '— Максим',
        ],
        time: '21:18', unread: !progress.readMail.includes('maxim-case'), attachment: 'clinic-01.evidence',
      },
      {
        id: 'linux-notes', sender: 'Локальные заметки', address: 'notes@local', subject: 'Linux: четыре команды',
        preview: 'pwd, ls, cd, cat...',
        body: ['pwd — текущая папка', 'ls — содержимое папки', 'cd — перейти в другую папку', 'cat — вывести текст файла'],
        time: '19:40', unread: !progress.readMail.includes('linux-notes'),
      },
    ];

    if (progress.jobOfferUnlocked) {
      base.unshift({
        id: 'job-offer', sender: 'Анна Соколова', address: 'a.sokolova@sfera-integration.local', subject: progress.jobAccepted ? 'Предложение принято' : 'Предложение о работе',
        preview: progress.jobAccepted ? 'Ждём вас в понедельник к 09:00.' : 'Готовы предложить позицию младшего аналитика SOC.',
        body: progress.jobAccepted ? [
          'Илья, подтверждение получено.',
          'Ждём вас в понедельник к 09:00. Офис: Острогорск, Промышленная, 18.',
          'На входе назовите фамилию. Кирилл выдаст временный пропуск.',
          'Анна Соколова\nРуководитель смены SOC',
        ] : [
          'Илья, добрый день.',
          `Результат собеседования: ${progress.interviewScore}/5.`,
          'Готовы предложить позицию младшего аналитика SOC. Выход в понедельник, 09:00.',
          'Ответ нужен до 18:00 завтра.',
          'Анна Соколова\nРуководитель смены SOC',
        ],
        time: 'СЕЙЧАС', unread: !progress.readMail.includes('job-offer'), attachment: 'offer_vorontsov.pdf', action: progress.jobAccepted ? 'open-shift' : 'accept-job',
      });
    }

    if (progress.jobAccepted) {
      base.unshift({
        id: 'first-ticket', sender: 'WATCHTOWER SOC', address: 'tickets@sfera-integration.local', subject: 'PHISH-2026-0041 назначен',
        preview: 'Бухгалтерия переслала подозрительное письмо...',
        body: ['Новый тикет: PHISH-2026-0041.', 'Бухгалтерия получила письмо об обновлении зарплатного кабинета.', 'Пользователь не открывал вложение. Проверь отправителя, ссылку и файл.'],
        time: '09:42', unread: !progress.readMail.includes('first-ticket'), action: 'open-shift',
      });
    }
    return base;
  }, [progress.interviewScore, progress.jobAccepted, progress.jobOfferUnlocked, progress.readMail]);

  const active = mails.find((mail) => mail.id === activeId) ?? null;
  const openMail = (id: string) => { setActiveId(id); markMailRead(id); };

  return (
    <div className={`mail-app mail-app-v4 ${active ? 'mobile-reader-open' : 'mobile-list-open'}`}>
      <aside className="mail-sidebar">
        <div className="mail-logo"><Mail size={20} /><strong>POST</strong></div>
        <button className="compose"><Send size={16} />Новое письмо</button>
        <nav><button className={folder === 'inbox' ? 'active' : ''} onClick={() => setFolder('inbox')}><Inbox size={17} />Входящие <b>{mails.filter((mail) => mail.unread).length}</b></button><button className={folder === 'starred' ? 'active' : ''} onClick={() => setFolder('starred')}><Star size={17} />Избранное</button><button><Archive size={17} />Архив</button></nav>
      </aside>

      <section className="mail-list">
        <header><div className="mail-search"><Search size={16} /><input placeholder="Поиск по почте" /></div><span>{mails.length}</span></header>
        <div className="mail-list-scroll">{mails.map((mail) => <button key={mail.id} className={`${active?.id === mail.id ? 'active' : ''} ${mail.unread ? 'unread' : ''}`} onClick={() => openMail(mail.id)}><div className="mail-avatar">{mail.sender.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><header><strong>{mail.sender}</strong><time>{mail.time}</time></header><h4>{mail.subject}</h4><p>{mail.preview}</p></div>{mail.attachment && <Paperclip size={13} />}</button>)}</div>
      </section>

      <article className="mail-reader app-scroll">
        {active ? <>
          <header className="reader-toolbar"><button onClick={() => setActiveId(null)}><ChevronLeft size={17} /></button><div><button><Archive size={16} /></button><button><Star size={16} /></button><button><Reply size={16} /></button></div></header>
          <div className="reader-content">
            <p className="eyebrow">{active.time}</p><h2>{active.subject}</h2>
            <div className="sender-line"><div className="mail-avatar large">{active.sender.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><strong>{active.sender}</strong><span>{active.address}</span></div></div>
            <div className="mail-body">{active.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            {active.attachment && <button className="attachment-card"><Paperclip size={18} /><div><strong>{active.attachment}</strong><span>Локальное вложение</span></div><small>OPEN</small></button>}
            {active.action === 'accept-job' && <button className="primary-action mail-action" onClick={() => setFlag('jobAccepted', true)}><CheckCircle2 size={17} />Принять предложение</button>}
            {active.action === 'open-shift' && <button className="primary-action mail-action" onClick={() => openApp('firstshift')}><CheckCircle2 size={17} />Открыть первую смену</button>}
          </div>
        </> : <div className="empty-state">Выбери письмо</div>}
      </article>
    </div>
  );
}
