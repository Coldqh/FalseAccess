import { useState } from 'react';
import { CheckCheck, MoreHorizontal, Paperclip, Phone, Search, Send, ShieldCheck } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

const chats = [
  { id: 'maxim', name: 'Максим', status: 'был 3 мин назад', preview: 'Не называй это взломом без доказательств.', unread: 2, initials: 'МБ' },
  { id: 'mother', name: 'Мама', status: 'в сети', preview: 'Ты завтра дома будешь?', unread: 0, initials: 'МА' },
  { id: 'kirill', name: 'Кирилл Зорин', status: 'SOC / Сфера', preview: 'Тестовое у тебя нормальное.', unread: 0, initials: 'КЗ' },
];

const messages = {
  maxim: [
    { mine: false, text: 'Я отправил копию журналов на почту.', time: '21:17' },
    { mine: false, text: 'Начни с auth.log. Потом посмотри процессы.', time: '21:17' },
    { mine: true, text: 'Если найду внешний IP, писать, что систему взломали?', time: '21:18' },
    { mine: false, text: 'Нет. IP и попытки входа ещё ничего не доказывают.', time: '21:18' },
    { mine: false, text: 'Пиши только то, что видно в данных.', time: '21:19' },
  ],
  mother: [
    { mine: false, text: 'Ты завтра дома будешь?', time: '20:04' },
    { mine: true, text: 'До обеда. Потом по делам.', time: '20:06' },
    { mine: false, text: 'Хлеб купи.', time: '20:06' },
  ],
  kirill: [
    { mine: false, text: 'Привет. Анна дала твой контакт.', time: '18:32' },
    { mine: false, text: 'Тестовое у тебя нормальное. На собесе спросят про порядок triage.', time: '18:33' },
  ],
};

export function MessengerApp() {
  const { markMessageRead } = useProgress();
  const [activeId, setActiveId] = useState<keyof typeof messages>('maxim');
  const activeChat = chats.find((chat) => chat.id === activeId)!;

  return (
    <div className="messenger-app">
      <aside className="chat-list">
        <header><div><ShieldCheck size={19} /><strong>WIRE//LOCAL</strong></div><button><MoreHorizontal size={18} /></button></header>
        <div className="chat-search"><Search size={15} /><input placeholder="Поиск" /></div>
        <div className="chat-items">
          {chats.map((chat) => (
            <button key={chat.id} className={activeId === chat.id ? 'active' : ''} onClick={() => { setActiveId(chat.id as keyof typeof messages); markMessageRead(chat.id); }}>
              <span className="chat-avatar">{chat.initials}</span>
              <div><header><strong>{chat.name}</strong><time>21:{chat.id === 'maxim' ? '19' : '06'}</time></header><p>{chat.preview}</p></div>
              {chat.unread > 0 && <b>{chat.unread}</b>}
            </button>
          ))}
        </div>
      </aside>
      <section className="conversation">
        <header><div className="chat-avatar">{activeChat.initials}</div><div><strong>{activeChat.name}</strong><span>{activeChat.status}</span></div><div><button><Phone size={17} /></button><button><Search size={17} /></button><button><MoreHorizontal size={17} /></button></div></header>
        <div className="message-stream app-scroll">
          <div className="day-separator">14 МАРТА</div>
          {messages[activeId].map((message, index) => (
            <div key={index} className={`message-bubble ${message.mine ? 'mine' : ''}`}><p>{message.text}</p><span>{message.time}{message.mine && <CheckCheck size={13} />}</span></div>
          ))}
        </div>
        <footer><button><Paperclip size={18} /></button><input placeholder="Сообщение" /><button className="send"><Send size={17} /></button></footer>
      </section>
    </div>
  );
}
