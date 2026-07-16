import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCheck, MoreHorizontal, Paperclip, Phone, Search, Send, ShieldCheck } from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import { getClinicStage } from '../missions/clinic01';
import type { AppId } from '../types';

type ChatId = 'maxim' | 'mother' | 'kirill';
type ChatMessage = { mine: boolean; text: string; time: string };

const chats = [
  { id: 'maxim' as ChatId, name: 'Максим Белов', role: 'Системный администратор · Клиника №4', preview: 'Есть дело по регистратуре.', initials: 'МБ' },
  { id: 'mother' as ChatId, name: 'Мама', role: 'в сети', preview: 'Хлеб купи.', initials: 'МА' },
  { id: 'kirill' as ChatId, name: 'Кирилл Зорин', role: 'SOC · Сфера', preview: 'На собесе спросят про triage.', initials: 'КЗ' },
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
    { mine: false, text: 'На собесе спросят про порядок triage.', time: '18:33' },
  ],
};

export function MessengerApp({ openApp }: { openApp: (id: AppId) => void }) {
  const { progress, markMessageRead, setFlag } = useProgress();
  const [activeId, setActiveId] = useState<ChatId>('maxim');
  const [mobileScreen, setMobileScreen] = useState<'list' | 'chat'>('list');
  const [callOpen, setCallOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<ChatId, ChatMessage[]>>({ maxim: [], mother: [], kirill: [] });
  const stage = getClinicStage(progress);
  const activeChat = chats.find((chat) => chat.id === activeId)!;

  const messages = useMemo(() => {
    const result = [...baseMessages[activeId], ...localMessages[activeId]];
    if (activeId === 'maxim' && progress.clinicIntroComplete) {
      result.push({ mine: false, text: 'Архив клиники у тебя. Не удаляй файлы и не называй это взломом без успешного входа.', time: '21:19' });
    }
    if (activeId === 'maxim' && progress.reportSubmitted) {
      result.push({ mine: true, text: 'Шесть неудачных входов. Внешний успешный вход не подтверждён. PID 911 нужно сохранить и проверить.', time: '22:03' });
    }
    if (activeId === 'maxim' && progress.clinicWrapupComplete) {
      result.push({ mine: false, text: 'Принял. Я передам отчёт Анне из «Сферы».', time: '22:04' });
    }
    return result;
  }, [activeId, localMessages, progress.clinicIntroComplete, progress.clinicWrapupComplete, progress.reportSubmitted]);

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

  const hasIncomingCall = activeId === 'maxim' && (!progress.clinicIntroComplete || (progress.reportSubmitted && !progress.clinicWrapupComplete));

  return (
    <div className={`messenger-app messenger-app-v4 mobile-${mobileScreen}`}>
      <aside className="chat-list">
        <header><div><ShieldCheck size={19} /><strong>WIRE</strong></div><button><MoreHorizontal size={18} /></button></header>
        <div className="chat-search"><Search size={15} /><input placeholder="Поиск" /></div>
        <div className="chat-items">
          {chats.map((chat) => (
            <button key={chat.id} className={activeId === chat.id ? 'active' : ''} onClick={() => openChat(chat.id)}>
              <span className="chat-avatar">{chat.initials}</span>
              <div><header><strong>{chat.name}</strong><time>{chat.id === 'maxim' ? '21:19' : '20:06'}</time></header><p>{chat.preview}</p><small>{chat.role}</small></div>
              {chat.id === 'maxim' && hasIncomingCall && <b>1</b>}
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

        <div className="message-stream app-scroll">
          <div className="day-separator">14 МАРТА</div>
          {messages.map((message, index) => <div key={`${message.time}-${index}`} className={`message-bubble ${message.mine ? 'mine' : ''}`}><p>{message.text}</p><span>{message.time}{message.mine && <CheckCheck size={13} />}</span></div>)}

          {activeId === 'maxim' && !progress.clinicIntroComplete && !callOpen && (
            <section className="incoming-call-card"><div className="chat-avatar large">МБ</div><div><strong>Максим Белов</strong><span>Клиника №4</span><p>Входящий звонок</p></div><button onClick={() => setCallOpen(true)}>Ответить</button></section>
          )}

          {activeId === 'maxim' && !progress.clinicIntroComplete && callOpen && (
            <section className="story-call-dialogue">
              <div className="message-bubble"><p>Илья, привет. В регистратуре клиники компьютер тормозит. Ночью ещё перебирали учётные записи по SSH.</p><span>21:17</span></div>
              <div className="message-bubble"><p>Я убрал данные пациентов и сделал копию журналов. Посмотришь? Сначала факты, потом выводы.</p><span>21:18</span></div>
              <button className="primary-action" onClick={startCase}>Посмотрю · открыть Terminal</button>
            </section>
          )}

          {activeId === 'maxim' && progress.reportSubmitted && !progress.clinicWrapupComplete && !callOpen && (
            <section className="incoming-call-card"><div className="chat-avatar large">МБ</div><div><strong>Максим Белов</strong><span>Клиника №4</span><p>Ждёт итог по делу</p></div><button onClick={() => setCallOpen(true)}>Ответить</button></section>
          )}

          {activeId === 'maxim' && progress.reportSubmitted && !progress.clinicWrapupComplete && callOpen && (
            <section className="story-call-dialogue">
              <div className="message-bubble"><p>Ну что там?</p><span>22:03</span></div>
              <div className="message-bubble mine"><p>Шесть отказов с внешнего IP. Успешного внешнего входа нет. PID 911 запущен из временной папки.</p><span>22:03</span></div>
              <div className="message-bubble"><p>Так и пиши. Процесс я изолирую и сниму копию. Отчёт перешлю знакомой из «Сферы».</p><span>22:04</span></div>
              <button className="primary-action" onClick={finishCase}>Закончить звонок</button>
            </section>
          )}
        </div>

        <footer><button><Paperclip size={18} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder="Сообщение" /><button className="send" onClick={send}><Send size={17} /></button></footer>
      </section>
    </div>
  );
}
