import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCheck, MoreHorizontal, Paperclip, Phone, Search, Send, ShieldCheck } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import { getClinicStage } from '../missions/clinic01';
import type { AppId } from '../types';

type ChatId = 'maxim' | 'mother' | 'kirill' | 'igor';
type ChatMessage = { mine: boolean; text: string; time: string };

interface ChatInfo {
  id: ChatId;
  name: string;
  role: string;
  preview: string;
  initials: string;
}

const baseChats: ChatInfo[] = [
  { id: 'maxim', name: 'Максим Белов', role: 'Системный администратор · Клиника №4', preview: 'Есть дело по регистратуре.', initials: 'МБ' },
  { id: 'mother', name: 'Мама', role: 'в сети', preview: 'Хлеб купи.', initials: 'МА' },
  { id: 'kirill', name: 'Кирилл Зорин', role: 'SOC · Сфера', preview: 'Пропуск не потеряй.', initials: 'КЗ' },
];

const baseMessages: Record<ChatId, ChatMessage[]> = {
  maxim: [
    { mine: false, text: 'Драйвер поставил?', time: '12:41' },
    { mine: true, text: 'Да. Старый системник снова работает.', time: '12:44' },
    { mine: false, text: 'Не лезь в блок питания. Остальное можешь разбирать.', time: '12:45' },
  ],
  mother: [
    { mine: false, text: 'Ты завтра дома будешь?', time: '20:04' },
    { mine: true, text: 'До обеда. Потом по делам.', time: '20:06' },
    { mine: false, text: 'Хлеб купи.', time: '20:06' },
  ],
  kirill: [
    { mine: false, text: 'Привет. Анна дала твой контакт.', time: '18:32' },
    { mine: false, text: 'На входе скажешь фамилию. Я вынесу пропуск.', time: '18:33' },
  ],
  igor: [],
};

export function MessengerApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress, markMessageRead, setFlag } = useProgress();
  const chats = useMemo<ChatInfo[]>(() => progress.criminalContactUnlocked
    ? [...baseChats, { id: 'igor', name: 'Игорь', role: 'номер не сохранён', preview: progress.routeCaseComplete ? 'Если будет ещё — напишу.' : progress.routeCaseAccepted ? 'Архив route-01.' : 'Есть подработка по логам.', initials: 'И' }]
    : baseChats, [progress.criminalContactUnlocked, progress.routeCaseAccepted, progress.routeCaseComplete]);
  const [activeId, setActiveId] = useState<ChatId>('maxim');
  const [mobileScreen, setMobileScreen] = useState<'list' | 'chat'>('list');
  const [callOpen, setCallOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<ChatId, ChatMessage[]>>({ maxim: [], mother: [], kirill: [], igor: [] });
  const messageStreamRef = useRef<HTMLDivElement>(null);
  const stage = getClinicStage(progress);
  const activeChat = chats.find((chat) => chat.id === activeId) ?? chats[0];

  const messages = useMemo(() => {
    const result = [...baseMessages[activeId], ...localMessages[activeId]];
    if (activeId === 'maxim' && progress.clinicIntroComplete) {
      result.push({ mine: false, text: 'Архив клиники у тебя. Не удаляй файлы и не называй это взломом без успешного входа.', time: '21:19' });
    }
    if (activeId === 'maxim' && progress.reportSubmitted) {
      result.push({ mine: true, text: 'Шесть неудачных входов. Внешний успешный вход не подтверждён. PID 911 нужно сохранить и проверить.', time: '22:03' });
    }
    if (activeId === 'maxim' && progress.clinicWrapupComplete) {
      result.push({ mine: false, text: 'Принял. Я перешлю отчёт Анне.', time: '22:04' });
    }
    if (activeId === 'kirill' && progress.jobAccepted) {
      result.push({ mine: false, text: 'В понедельник к девяти. Промышленная, 18. Опоздаешь — Анна заметит.', time: '16:51' });
    }
    if (activeId === 'kirill' && progress.firstShiftComplete) {
      result.push({ mine: false, text: 'Нормально отработал. Завтра будет очередь побольше.', time: '18:09' });
    }
    if (activeId === 'igor' && progress.criminalContactUnlocked) {
      result.push(
        { mine: false, text: 'Привет. Ты сегодня по «Рубежу» тикет вёл?', time: '19:26' },
        { mine: false, text: 'Есть похожая подработка. Разобрать логи. 8 тысяч после результата.', time: '19:27' },
      );
      if (progress.criminalContactResponse === 'interested') {
        result.push(
          { mine: true, text: 'Что за логи?', time: '19:28' },
          { mine: false, text: 'Веб-сервер и авторизация. Встретимся в «Сигнале». Столик у стены.', time: '19:29' },
        );
      }
      if (progress.routeCaseAccepted) {
        result.push(
          { mine: false, text: 'Архив route-01 у тебя. Два дня. На живой сервер не лезь.', time: '20:14' },
        );
      }
      if (progress.routeCaseComplete) {
        const reply = progress.routeCaseChoice === 'full' ? 'Получил. Оплату отправил.'
          : progress.routeCaseChoice === 'safe' ? 'Cookie нет. Ладно, за остальное перевёл.'
            : progress.routeCaseChoice === 'lie' ? 'Странно. Проверю сам.'
              : progress.routeCaseChoice === 'owner' ? 'Ты им тоже написал? Понял.'
                : progress.routeCaseChoice === 'anna' ? 'Больше сюда не пиши.'
                  : 'Понял.';
        result.push({ mine: false, text: reply, time: 'сейчас' });
      }
      if (progress.criminalContactResponse === 'declined') {
        result.push(
          { mine: true, text: 'Неинтересно.', time: '19:28' },
          { mine: false, text: 'Понял.', time: '19:29' },
        );
      }
    }
    return result;
  }, [activeId, localMessages, progress]);

  useEffect(() => {
    const stream = messageStreamRef.current;
    if (!stream || mobileScreen !== 'chat' && window.matchMedia('(max-width: 720px)').matches) return;

    const frame = window.requestAnimationFrame(() => {
      stream.scrollTo({ top: stream.scrollHeight, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeId, messages.length, callOpen, mobileScreen, progress.criminalContactResponse, progress.clinicWrapupComplete]);

  const openChat = (id: ChatId) => {
    setActiveId(id);
    setMobileScreen('chat');
    markMessageRead(id);
    setCallOpen(false);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setLocalMessages((current) => ({ ...current, [activeId]: [...current[activeId], { mine: true, text, time: 'сейчас' }] }));
    setDraft('');
  };

  const startCase = () => {
    setFlag('clinicIntroComplete', true);
    setCallOpen(false);
    openApp('terminal');
  };

  const finishCase = () => {
    setFlag('clinicWrapupComplete', true);
    setCallOpen(false);
    openApp('missions');
  };

  const respondToIgor = (response: 'interested' | 'declined') => {
    setFlag('criminalContactResponse', response);
    markMessageRead('igor');
  };

  const hasIncomingCall = activeId === 'maxim' && (!progress.clinicIntroComplete || (progress.reportSubmitted && !progress.clinicWrapupComplete));

  return (
    <div className={`messenger-app messenger-app-v5 mobile-${mobileScreen}`}>
      <aside className="chat-list">
        <header><div><ShieldCheck size={19} /><strong>WIRE</strong></div><button><MoreHorizontal size={18} /></button></header>
        <div className="chat-search"><Search size={15} /><input placeholder="Поиск" /></div>
        <div className="chat-items">
          {chats.map((chat) => (
            <button key={chat.id} className={activeId === chat.id ? 'active' : ''} onClick={() => openChat(chat.id)}>
              <span className="chat-avatar">{chat.initials}</span>
              <div><header><strong>{chat.name}</strong><time>{chat.id === 'igor' ? '19:27' : chat.id === 'maxim' ? '21:19' : '20:06'}</time></header><p>{chat.preview}</p><small>{chat.role}</small></div>
              {chat.id === 'maxim' && hasIncomingCall && <b>1</b>}
              {chat.id === 'igor' && progress.criminalContactUnlocked && !progress.criminalContactResponse && <b>2</b>}
            </button>
          ))}
        </div>
      </aside>

      <section className="conversation">
        <header>
          <button className="mobile-chat-back" onClick={() => setMobileScreen('list')}><ArrowLeft size={18} /></button>
          <div className="chat-avatar">{activeChat.initials}</div>
          <div><strong>{activeChat.name}</strong><span>{activeChat.role}</span></div>
          <div><button onClick={() => activeId === 'maxim' && (hasIncomingCall ? setCallOpen(true) : openApp(stage.app))}><Phone size={17} /></button><button><Search size={17} /></button><button><MoreHorizontal size={17} /></button></div>
        </header>

        <div ref={messageStreamRef} className="message-stream app-scroll">
          <div className="day-separator">{activeId === 'igor' ? 'ПОНЕДЕЛЬНИК' : '14 МАРТА'}</div>
          {messages.map((message, index) => <div key={`${message.time}-${index}`} className={`message-bubble ${message.mine ? 'mine' : ''}`}><p>{message.text}</p><span>{message.time}{message.mine && <CheckCheck size={13} />}</span></div>)}

          {activeId === 'maxim' && !progress.clinicIntroComplete && !callOpen && (
            <section className="incoming-call-card"><div className="chat-avatar large">МБ</div><div><strong>Максим Белов</strong><span>Клиника №4</span><p>Входящий звонок</p></div><button onClick={() => setCallOpen(true)}>Ответить</button></section>
          )}

          {activeId === 'maxim' && !progress.clinicIntroComplete && callOpen && (
            <section className="story-call-dialogue">
              <div className="message-bubble"><p>Илья, привет. В регистратуре компьютер тормозит. Ночью ещё перебирали учётные записи по SSH.</p><span>21:17</span></div>
              <div className="message-bubble"><p>Я убрал данные пациентов и сделал копию журналов. Посмотришь?</p><span>21:18</span></div>
              <button className="primary-action" onClick={startCase}>Посмотрю · открыть Terminal</button>
            </section>
          )}

          {activeId === 'maxim' && progress.reportSubmitted && !progress.clinicWrapupComplete && !callOpen && (
            <section className="incoming-call-card"><div className="chat-avatar large">МБ</div><div><strong>Максим Белов</strong><span>Клиника №4</span><p>Ждёт итог</p></div><button onClick={() => setCallOpen(true)}>Ответить</button></section>
          )}

          {activeId === 'maxim' && progress.reportSubmitted && !progress.clinicWrapupComplete && callOpen && (
            <section className="story-call-dialogue">
              <div className="message-bubble"><p>Ну что там?</p><span>22:03</span></div>
              <div className="message-bubble mine"><p>Шесть отказов с внешнего IP. Успешного внешнего входа нет. PID 911 запущен из временной папки.</p><span>22:03</span></div>
              <div className="message-bubble"><p>Хорошо. Процесс я изолирую. Отчёт перешлю Анне.</p><span>22:04</span></div>
              <button className="primary-action" onClick={finishCase}>Закончить звонок</button>
            </section>
          )}

          {activeId === 'igor' && progress.criminalContactUnlocked && !progress.criminalContactResponse && (
            <section className="quick-replies">
              <button onClick={() => respondToIgor('interested')}>Что за логи?</button>
              <button onClick={() => respondToIgor('declined')}>Неинтересно</button>
            </section>
          )}
          {activeId === 'igor' && progress.routeCaseAccepted && !progress.routeCaseComplete && (
            <section className="quick-replies"><button onClick={() => openApp('routecase')}>Открыть route-01</button></section>
          )}
        </div>

        <footer><button><Paperclip size={18} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder="Сообщение" /><button className="send" onClick={send}><Send size={17} /></button></footer>
      </section>
    </div>
  );
}
