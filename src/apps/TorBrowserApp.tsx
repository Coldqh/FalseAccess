import { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, CircleUserRound,
  Copy, Fingerprint, Flame, History, Home, KeyRound, LockKeyhole, Menu, MessageSquare,
  Network, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Star, UserRound, X,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';
import {
  darknetDirectory, darknetMessages, forumThreads, marketListings, onionAddresses,
  onionFingerprint, type OnionPageId,
} from '../data/darknet';

interface TabState { id: number; page: OnionPageId; title: string; }

const pageTitle: Record<OnionPageId, string> = {
  home: 'Tor Browser', index: 'The Index', forum: 'Salt Room', market: 'Black Ledger',
  escrow: 'Greylock', inbox: 'Dead Letter', 'fake-mirror': 'Salt Room Login',
};

const pageAddress = (page: OnionPageId) => page === 'home' ? 'about:tor' : `http://${onionAddresses[page]}/`;

function shortAddress(address: string) {
  if (address.length < 45) return address;
  return `${address.slice(0, 25)}…${address.slice(-18)}`;
}

export function TorBrowserApp() {
  const { progress, setFlag, completeDarknetCore } = useProgress();
  const [connected, setConnected] = useState(progress.darknetConnected);
  const [tabs, setTabs] = useState<TabState[]>([{ id: 1, page: 'home', title: 'Tor Browser' }]);
  const [activeTab, setActiveTab] = useState(1);
  const [addressInput, setAddressInput] = useState('about:tor');
  const [history, setHistory] = useState<OnionPageId[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showCircuit, setShowCircuit] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(progress.darknetAlias);
  const [copied, setCopied] = useState(false);
  const [challengeChecked, setChallengeChecked] = useState(false);

  const tab = tabs.find((item) => item.id === activeTab) ?? tabs[0];
  const page = tab.page;
  const address = pageAddress(page);
  const visited = progress.darknetVisited;

  const stageText = useMemo(() => {
    if (!progress.darknetConnected) return 'Подключиться к сети';
    if (!progress.darknetIdentityCreated) return 'Создать отдельный псевдоним';
    if (!visited.includes('index')) return 'Открыть подписанный каталог';
    if (!visited.includes('forum')) return 'Прочитать правила форума';
    if (!progress.darknetMirrorVerified) return 'Отличить настоящее зеркало от подделки';
    if (!progress.darknetInboxRead.includes('unknown-01')) return 'Прочитать сообщение неизвестного';
    if (!progress.darknetComplete) return 'Ответить на предложение';
    return 'Даркнет открыт';
  }, [progress.darknetConnected, progress.darknetIdentityCreated, progress.darknetMirrorVerified, progress.darknetInboxRead, progress.darknetComplete, visited]);

  const visit = (next: OnionPageId, record = true) => {
    setTabs((current) => current.map((item) => item.id === activeTab ? { ...item, page: next, title: pageTitle[next] } : item));
    setAddressInput(pageAddress(next));
    if (record) {
      const nextHistory = history.slice(0, historyIndex + 1).concat(next);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      if (!progress.darknetVisited.includes(next)) setFlag('darknetVisited', [...progress.darknetVisited, next]);
    }
    setShowMenu(false);
    setShowCircuit(false);
  };

  const submitAddress = () => {
    const value = addressInput.trim().toLowerCase();
    if (value === 'about:tor' || value === 'tor://home') return visit('home');
    const match = (Object.entries(onionAddresses) as Array<[Exclude<OnionPageId, 'home'>, string]>).find(([, onion]) => value.includes(onion));
    if (match) visit(match[0]);
  };

  const goHistory = (delta: number) => {
    const nextIndex = historyIndex + delta;
    if (nextIndex < 0 || nextIndex >= history.length) return;
    setHistoryIndex(nextIndex);
    visit(history[nextIndex], false);
  };

  const connect = () => {
    setConnected(true);
    setFlag('darknetConnected', true);
    setFlag('darknetStage', Math.max(progress.darknetStage, 1));
  };

  const createIdentity = () => {
    const alias = aliasDraft.trim().replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 24);
    if (alias.length < 3) return;
    setFlag('darknetAlias', alias);
    setFlag('darknetIdentityCreated', true);
    setFlag('darknetStage', Math.max(progress.darknetStage, 2));
    setShowIdentity(false);
  };

  const newTab = () => {
    const id = Math.max(...tabs.map((item) => item.id)) + 1;
    setTabs((current) => [...current, { id, page: 'home', title: 'New Tab' }]);
    setActiveTab(id);
    setAddressInput('about:tor');
  };

  const closeTab = (id: number) => {
    if (tabs.length === 1) return;
    const index = tabs.findIndex((item) => item.id === id);
    const next = tabs.filter((item) => item.id !== id);
    setTabs(next);
    if (activeTab === id) {
      const replacement = next[Math.max(0, index - 1)];
      setActiveTab(replacement.id);
      setAddressInput(pageAddress(replacement.page));
    }
  };

  const bookmark = () => {
    if (!progress.darknetBookmarks.includes(page)) setFlag('darknetBookmarks', [...progress.darknetBookmarks, page]);
  };

  const copyAddress = async () => {
    await navigator.clipboard?.writeText(address).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const verifyRealMirror = () => {
    setChallengeChecked(true);
    setFlag('darknetMirrorVerified', true);
    setFlag('darknetStage', Math.max(progress.darknetStage, 5));
  };

  const finish = (choice: 'accept' | 'ignore') => completeDarknetCore(choice);

  const renderHome = () => (
    <div className="tor-home-page">
      <div className="tor-home-mark"><Network size={54} /><span /></div>
      <h1>Explore. Privately.</h1>
      <p>{connected ? 'Connected to Tor' : 'Tor is not connected'}</p>
      {!connected ? <button className="tor-connect-button" onClick={connect}>Connect</button> : (
        <>
          <label className="tor-search"><Search size={18} /><input placeholder="Search with DuckDuckGo" /></label>
          <div className="tor-home-status"><ShieldCheck size={18} /><div><strong>Onion routing active</strong><span>Traffic for onion services stays inside the Tor network.</span></div></div>
          {!progress.darknetIdentityCreated && <button className="tor-connect-button secondary" onClick={() => setShowIdentity(true)}>Create separate identity</button>}
          {progress.darknetIdentityCreated && <button className="tor-connect-button secondary" onClick={() => visit('index')}>Open saved invitation</button>}
        </>
      )}
    </div>
  );

  const renderIndex = () => (
    <div className="onion-site onion-index-site">
      <header><div><span>THE INDEX</span><small>signed directory / revision 447</small></div><Fingerprint size={26} /></header>
      <section className="onion-signature"><strong>Directory fingerprint</strong><code>{onionFingerprint}</code><p>Адрес из приглашения и подпись должны совпасть полностью. Название и внешний вид страницы ничего не доказывают.</p></section>
      <div className="onion-directory-list">{darknetDirectory.map((item) => (
        <button key={item.id} onClick={() => visit(item.id)}><span>{item.category}</span><div><strong>{item.title}</strong><p>{item.description}</p><code>{shortAddress(onionAddresses[item.id])}</code></div><i>{item.status}</i></button>
      ))}</div>
      <button className="onion-danger-link" onClick={() => visit('fake-mirror')}><AlertTriangle size={16} /> Mirror reported by users — inspect safely</button>
    </div>
  );

  const renderForum = () => (
    <div className="onion-site onion-forum-site">
      <header><div><span>SALT ROOM</span><small>members: 18,403 / online: 227</small></div><div className="onion-user"><CircleUserRound size={17} />{progress.darknetAlias || 'guest'}</div></header>
      <nav><button>INDEX</button><button>OPS</button><button>DISPUTES</button><button>OPSEC</button><button>MARKET TALK</button></nav>
      <section className="forum-notice"><strong>READ BEFORE POSTING</strong><p>Не публикуй реальные данные, не повторяй псевдонимы и не доверяй ссылкам из личных сообщений. Арбитраж принимает только историю сделки и подписи.</p><button onClick={() => setFlag('darknetStage', Math.max(progress.darknetStage, 4))}>Правила прочитаны</button></section>
      <div className="forum-thread-list">{forumThreads.map((thread) => <article key={thread.title}><span>{thread.tag}</span><div><strong>{thread.title}</strong><p>{thread.excerpt}</p><small>{thread.author} · {thread.replies} replies</small></div></article>)}</div>
    </div>
  );

  const renderMarket = () => (
    <div className="onion-site onion-market-site">
      <header><div><span>BLACK LEDGER</span><small>escrow required / no direct deals</small></div><ShoppingBag size={23} /></header>
      <div className="market-warning"><AlertTriangle size={18} /><p>Все карточки вымышлены. Здесь нет реальных продавцов, контактов, изображений, схем оплаты или доставки.</p></div>
      <div className="market-grid">{marketListings.map((listing) => <article key={listing.title}><span>{listing.category}</span><h3>{listing.title}</h3><p>{listing.note}</p><div><strong>{listing.price}</strong><small>{listing.vendor} · {listing.rating}</small></div><button disabled>LOGIN REQUIRED</button></article>)}</div>
    </div>
  );

  const renderEscrow = () => (
    <div className="onion-site onion-escrow-site"><header><div><span>GREYLOCK</span><small>dispute desk / deposits</small></div><LockKeyhole size={24} /></header><section><h2>Escrow queue</h2><p>17 open disputes. 4 frozen deposits. Median review: 31 hours.</p><div className="escrow-row"><span>#A91F</span><strong>Deliverable changed after acceptance</strong><i>REVIEW</i></div><div className="escrow-row"><span>#B203</span><strong>Vendor identity mismatch</strong><i>FROZEN</i></div><div className="escrow-row"><span>#B244</span><strong>Unsigned archive submitted</strong><i>WAITING</i></div></section></div>
  );

  const renderFakeMirror = () => (
    <div className="onion-site fake-mirror-site">
      <header><span>SALT ROOM</span><small>session expired</small></header>
      <div className="fake-login"><Flame size={34} /><h2>Sign in</h2><input placeholder="username" /><input placeholder="PGP private key" type="password" /><button disabled>AUTHENTICATE</button><p>Страница просит секретный ключ. Настоящий форум этого не делает.</p></div>
      <section className={challengeChecked ? 'mirror-check passed' : 'mirror-check'}><strong>Проверка зеркала</strong><p>Адрес отличается от каталога, подписи нет, форма просит секрет. Это фишинговая копия.</p><button onClick={verifyRealMirror}>{challengeChecked ? <><Check size={16} /> Подделка отмечена</> : 'Отметить как подделку'}</button></section>
    </div>
  );

  const renderInbox = () => (
    <div className="onion-site onion-inbox-site">
      <header><div><span>DEAD LETTER</span><small>messages expire after 72h</small></div><MessageSquare size={22} /></header>
      <aside>{darknetMessages.map((message) => <button key={message.id} onClick={() => setFlag('darknetInboxRead', progress.darknetInboxRead.includes(message.id) ? progress.darknetInboxRead : [...progress.darknetInboxRead, message.id])} className={progress.darknetInboxRead.includes(message.id) ? 'read' : ''}><strong>{message.subject}</strong><span>{message.from}</span><time>{message.time}</time></button>)}</aside>
      <main>{progress.darknetInboxRead.includes('unknown-01') ? <article><span>FROM: 0000000000000000</span><h2>работа</h2><p>{darknetMessages[0].body}</p>{!progress.darknetComplete ? <div><button onClick={() => finish('accept')}>Принять контакт</button><button onClick={() => finish('ignore')}>Не отвечать</button></div> : <small>{progress.darknetChoice === 'accept' ? 'Ответ отправлен. Детали придут отдельным сообщением.' : 'Сообщение оставлено без ответа.'}</small>}</article> : <div className="inbox-empty"><MessageSquare size={34} /><p>Выбери сообщение слева.</p></div>}</main>
    </div>
  );

  const renderPage = () => {
    if (page === 'home') return renderHome();
    if (!connected) return renderHome();
    if (page === 'index') return renderIndex();
    if (page === 'forum') return renderForum();
    if (page === 'market') return renderMarket();
    if (page === 'escrow') return renderEscrow();
    if (page === 'fake-mirror') return renderFakeMirror();
    return renderInbox();
  };

  return <div className="tor-browser-app">
    <div className="tor-titlebar"><div className="tor-tabs">{tabs.map((item) => <button key={item.id} className={item.id === activeTab ? 'active' : ''} onClick={() => { setActiveTab(item.id); setAddressInput(pageAddress(item.page)); }}><Network size={13} /><span>{item.title}</span><i onClick={(event) => { event.stopPropagation(); closeTab(item.id); }}><X size={12} /></i></button>)}<button className="tor-new-tab" onClick={newTab}><Plus size={15} /></button></div></div>
    <div className="tor-toolbar">
      <button disabled={historyIndex <= 0} onClick={() => goHistory(-1)}><ArrowLeft size={18} /></button><button disabled={historyIndex >= history.length - 1} onClick={() => goHistory(1)}><ArrowRight size={18} /></button><button onClick={() => visit(page, false)}><RefreshCw size={16} /></button><button onClick={() => visit('home')}><Home size={16} /></button>
      <div className="tor-address"><button onClick={() => setShowCircuit((value) => !value)} className={page === 'home' ? '' : 'onion'}>{page === 'home' ? <ShieldCheck size={15} /> : <Network size={15} />}</button><input value={addressInput} onChange={(event) => setAddressInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submitAddress()} /><button onClick={copyAddress}>{copied ? <Check size={15} /> : <Copy size={15} />}</button><button onClick={bookmark} className={progress.darknetBookmarks.includes(page) ? 'saved' : ''}><Star size={16} /></button></div>
      <button className="tor-identity-button" onClick={() => setShowIdentity(true)} title="New Identity"><Fingerprint size={17} /></button><button onClick={() => setShowMenu((value) => !value)}><Menu size={19} /></button>
    </div>
    <div className="tor-progress-strip"><span>{stageText}</span><div><i style={{ width: `${Math.min(100, (progress.darknetStage / 6) * 100)}%` }} /></div><strong>{progress.darknetAlias || 'NO IDENTITY'}</strong></div>
    <div className="tor-page">{renderPage()}</div>

    {showCircuit && <div className="tor-popover tor-circuit-popover"><header><Network size={18} /><strong>Tor circuit for this site</strong></header><div><span>This browser</span><i /><span>Guard · Finland</span><i /><span>Middle · Netherlands</span><i /><span>{page === 'home' ? 'Tor network' : 'Onion service'}</span></div><button onClick={() => setShowCircuit(false)}>Close</button></div>}
    {showMenu && <div className="tor-popover tor-menu-popover"><button onClick={() => setShowIdentity(true)}><Fingerprint size={16} />New Identity</button><button onClick={() => setShowCircuit(true)}><Network size={16} />Tor circuit</button><button onClick={() => visit('index')}><Bookmark size={16} />Bookmarks</button><button><History size={16} />History</button><hr /><span>Security Level: Safer</span></div>}
    {showIdentity && <div className="tor-modal-layer"><section className="tor-identity-modal"><header><Fingerprint size={25} /><div><strong>{progress.darknetIdentityCreated ? 'New identity' : 'Create identity'}</strong><span>Отдельное имя для закрытых площадок</span></div><button onClick={() => setShowIdentity(false)}><X size={17} /></button></header><p>Псевдоним не должен повторять обычные аккаунты. Игра хранит его отдельно от имени героя.</p><label>Alias<input value={aliasDraft} onChange={(event) => setAliasDraft(event.target.value)} placeholder="lowercase_alias" maxLength={24} /></label><div><button className="secondary-action" onClick={() => setShowIdentity(false)}>Cancel</button><button className="primary-action" onClick={createIdentity}>Create</button></div></section></div>}
  </div>;
}
