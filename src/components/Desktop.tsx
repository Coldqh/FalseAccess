import { useEffect, useMemo, useState } from 'react';
import {
  Bell, BookOpenCheck, BriefcaseBusiness, ChevronUp, CircleUserRound, Code2,
  Globe2, Mail, Menu, MessageSquare, Minus, NotebookPen, Radar, Search,
  Settings as SettingsIcon, Shield, ShieldCheck, Signal, TerminalSquare, UserRoundCheck, Wifi, X, HeartPulse,
} from 'lucide-react';
import type { AppDefinition, AppId, WindowState } from '../types';
import { WindowFrame } from './WindowFrame';
import { MissionsApp } from '../apps/MissionsApp';
import { TerminalApp } from '../apps/TerminalApp';
import { ContractsApp } from '../apps/ContractsApp';
import { CodeApp } from '../apps/CodeApp';
import { MailApp } from '../apps/MailApp';
import { MessengerApp } from '../apps/MessengerApp';
import { BrowserApp } from '../apps/BrowserApp';
import { SiemApp } from '../apps/SiemApp';
import { SkillsApp } from '../apps/SkillsApp';
import { NotesApp } from '../apps/NotesApp';
import { InterviewApp } from '../apps/InterviewApp';
import { FirstShiftApp } from '../apps/FirstShiftApp';
import { SettingsApp } from '../apps/SettingsApp';
import { LifeApp } from '../apps/LifeApp';
import { useProgress } from '../system/ProgressContext';
import { APP_VERSION } from '../system/updateManager';
import { UpdateButton } from './UpdateControl';

const apps: AppDefinition[] = [
  { id: 'life', title: 'Life', shortTitle: 'Life', icon: HeartPulse, width: 1180, height: 740, accent: '#67c7c4' },
  { id: 'missions', title: 'Missions', shortTitle: 'Missions', icon: BookOpenCheck, width: 920, height: 670, accent: '#ff5a38' },
  { id: 'contracts', title: 'Work Queue', shortTitle: 'Contracts', icon: BriefcaseBusiness, width: 1180, height: 720, accent: '#efc46b' },
  { id: 'terminal', title: 'Terminal', shortTitle: 'Terminal', icon: TerminalSquare, width: 1080, height: 690, accent: '#9dcf74' },
  { id: 'code', title: 'Code Editor', shortTitle: 'Code', icon: Code2, width: 1180, height: 720, accent: '#70a5d8' },
  { id: 'mail', title: 'Mail', shortTitle: 'Mail', icon: Mail, width: 1080, height: 680, accent: '#efc46b' },
  { id: 'messenger', title: 'Messenger', shortTitle: 'Wire', icon: MessageSquare, width: 950, height: 650, accent: '#67c7c4' },
  { id: 'browser', title: 'Browser', shortTitle: 'Browser', icon: Globe2, width: 1080, height: 700, accent: '#b58bd8' },
  { id: 'siem', title: 'SIEM', shortTitle: 'SIEM', icon: Radar, width: 1080, height: 690, accent: '#ff5a38' },
  { id: 'interview', title: 'Technical Interview', shortTitle: 'Interview', icon: UserRoundCheck, width: 1080, height: 700, accent: '#efc46b' },
  { id: 'firstshift', title: 'First Shift', shortTitle: 'First Shift', icon: ShieldCheck, width: 1120, height: 720, accent: '#67c7c4' },
  { id: 'skills', title: 'Skills', shortTitle: 'Skills', icon: Shield, width: 900, height: 650, accent: '#9dcf74' },
  { id: 'notes', title: 'Notes / Report', shortTitle: 'Notes', icon: NotebookPen, width: 1000, height: 680, accent: '#efc46b' },
  { id: 'settings', title: 'Settings', shortTitle: 'Settings', icon: SettingsIcon, width: 960, height: 700, accent: '#8f949e' },
];

function appContent(id: AppId, openApp: (id: AppId) => void) {
  switch (id) {
    case 'life': return <LifeApp />;
    case 'missions': return <MissionsApp openApp={openApp} />;
    case 'contracts': return <ContractsApp />;
    case 'terminal': return <TerminalApp openApp={openApp} />;
    case 'code': return <CodeApp openApp={openApp} />;
    case 'mail': return <MailApp openApp={openApp} />;
    case 'messenger': return <MessengerApp openApp={openApp} />;
    case 'browser': return <BrowserApp />;
    case 'siem': return <SiemApp openApp={openApp} />;
    case 'interview': return <InterviewApp />;
    case 'firstshift': return <FirstShiftApp />;
    case 'skills': return <SkillsApp />;
    case 'notes': return <NotesApp openApp={openApp} />;
    case 'settings': return <SettingsApp />;
  }
}

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return time;
}

export function Desktop() {
  const { progress } = useProgress();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [zCounter, setZCounter] = useState(10);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileApp, setMobileApp] = useState<AppId | null>(null);
  const time = useClock();

  const activeWindowId = useMemo(() => [...windows].filter((win) => !win.minimized).sort((a, b) => b.z - a.z)[0]?.id, [windows]);
  const isLocked = (id: AppId) => (id === 'siem' && !progress.pythonComplete)
    || (id === 'interview' && !progress.clinicWrapupComplete)
    || (id === 'firstshift' && !progress.jobAccepted);

  const focusWindow = (id: AppId) => {
    setZCounter((value) => value + 1);
    setWindows((current) => current.map((windowState) => windowState.id === id ? { ...windowState, z: zCounter + 1, minimized: false } : windowState));
  };

  const openApp = (id: AppId) => {
    if (isLocked(id)) return;
    if (window.matchMedia('(max-width: 720px)').matches) {
      setMobileApp(id);
      return;
    }
    const app = apps.find((item) => item.id === id)!;
    setZCounter((value) => value + 1);
    setWindows((current) => {
      const existing = current.find((win) => win.id === id);
      if (existing) return current.map((win) => win.id === id ? { ...win, minimized: false, z: zCounter + 1 } : win);
      const offset = current.length * 28;
      return [...current, {
        id,
        x: Math.max(30, 140 + offset % 220),
        y: Math.max(50, 70 + offset % 150),
        width: Math.min(app.width, window.innerWidth - 100),
        height: Math.min(app.height, window.innerHeight - 120),
        z: zCounter + 1,
        minimized: false,
        maximized: false,
      }];
    });
    setLauncherOpen(false);
  };

  const updateWindow = (id: AppId, patch: Partial<WindowState>) => setWindows((current) => current.map((win) => win.id === id ? { ...win, ...patch } : win));
  const closeWindow = (id: AppId) => setWindows((current) => current.filter((win) => win.id !== id));

  const unread = (progress.jobOfferUnlocked && !progress.readMail.includes('job-offer') ? 1 : 0)
    + (!progress.readMessages.includes('maxim') ? 2 : 0)
    + (progress.criminalContactUnlocked && !progress.criminalContactResponse ? 2 : 0);
  const date = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(time);
  const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(time);

  return (
    <main className="desktop-shell">
      <div className="desktop-noise" />
      <div className="desktop-background">
        <div className="city-silhouette" />
        <div className="grid-horizon" />
        <div className="desktop-brand"><span>FALSE</span><strong>ACCESS</strong><i>SIMULATION BUILD / {APP_VERSION}</i></div>
        <div className="background-data"><span>OSTROGORSK</span><span>54.8121 N</span><span>LOCAL VAULT: ONLINE</span></div>
      </div>

      <header className="system-bar">
        <div className="system-left"><b>FALSE ACCESS</b><i>/</i><span>PROFILE: ILYA.V</span></div>
        <div className="system-right"><span className="system-balance">{progress.balance.toLocaleString('ru-RU')} ₽</span><span><Signal size={13} />LOCAL NET</span><span><Shield size={13} />SAFE LAB</span><UpdateButton compact /><button onClick={() => setNotificationOpen((value) => !value)}><Bell size={14} />{unread > 0 && <b>{unread}</b>}</button><span>{clock}</span></div>
      </header>

      <section className="desktop-icons">
        {apps.map((app) => {
          const Icon = app.icon;
          const locked = isLocked(app.id);
          return (
            <button key={app.id} onDoubleClick={() => !locked && openApp(app.id)} onClick={() => !locked && openApp(app.id)} className={locked ? 'locked' : ''}>
              <span className="desktop-icon" style={{ '--app-accent': app.accent } as React.CSSProperties}><Icon size={27} strokeWidth={1.45} /></span>
              <strong>{app.shortTitle}</strong>
              {app.id === 'mail' && progress.jobOfferUnlocked && !progress.readMail.includes('job-offer') && <i className="icon-badge">1</i>}
            </button>
          );
        })}
      </section>

      {windows.map((windowState) => {
        const app = apps.find((item) => item.id === windowState.id)!;
        return (
          <WindowFrame
            key={windowState.id}
            app={app}
            state={windowState}
            active={activeWindowId === windowState.id}
            onFocus={() => focusWindow(windowState.id)}
            onClose={() => closeWindow(windowState.id)}
            onMinimize={() => updateWindow(windowState.id, { minimized: true })}
            onToggleMaximize={() => updateWindow(windowState.id, { maximized: !windowState.maximized })}
            onMove={(x, y) => updateWindow(windowState.id, { x, y })}
          >
            {appContent(windowState.id, openApp)}
          </WindowFrame>
        );
      })}

      <footer className="taskbar">
        <button className={`launcher-button ${launcherOpen ? 'active' : ''}`} onClick={() => setLauncherOpen((value) => !value)}><Menu size={20} /><span>FA</span></button>
        <div className="taskbar-running">
          {windows.map((windowState) => {
            const app = apps.find((item) => item.id === windowState.id)!;
            const Icon = app.icon;
            return <button key={windowState.id} className={activeWindowId === windowState.id && !windowState.minimized ? 'active' : ''} title={app.title} onClick={() => windowState.minimized ? focusWindow(windowState.id) : activeWindowId === windowState.id ? updateWindow(windowState.id, { minimized: true }) : focusWindow(windowState.id)}><Icon size={18} /><span>{app.shortTitle}</span></button>;
          })}
        </div>
        <div className="taskbar-tray"><ChevronUp size={14} /><Wifi size={15} /><Shield size={15} /><div><strong>{clock}</strong><small>{date}</small></div></div>
      </footer>

      {launcherOpen && (
        <section className="launcher-panel">
          <header><div><CircleUserRound size={30} /><div><strong>Илья Воронцов</strong><span>Local profile</span></div></div><button onClick={() => setLauncherOpen(false)}><X size={17} /></button></header>
          <div className="launcher-search"><Search size={17} /><input autoFocus placeholder="Найти приложение" /></div>
          <div className="launcher-grid">{apps.map((app) => { const Icon = app.icon; const locked = isLocked(app.id); return <button key={app.id} disabled={locked} className={locked ? 'locked' : ''} onClick={() => !locked && openApp(app.id)}><span style={{ '--app-accent': app.accent } as React.CSSProperties}><Icon size={22} /></span><strong>{app.title}</strong></button>; })}</div>
          <footer><button onClick={() => openApp('settings')}><SettingsIcon size={16} />Настройки</button><span>FALSE ACCESS {APP_VERSION}</span></footer>
        </section>
      )}

      {notificationOpen && (
        <section className="notification-center">
          <header><strong>Уведомления</strong><button onClick={() => setNotificationOpen(false)}><X size={16} /></button></header>
          <button onClick={() => openApp('messenger')}><MessageSquare size={18} /><div><strong>Максим</strong><p>Я отправил копию журналов на почту.</p></div><time>21:17</time></button>
          {progress.jobOfferUnlocked && !progress.jobAccepted && <button className="important" onClick={() => openApp('mail')}><Mail size={18} /><div><strong>Анна Соколова</strong><p>Предложение о работе.</p></div><time>Сейчас</time></button>}
          {progress.criminalContactUnlocked && !progress.criminalContactResponse && <button className="important" onClick={() => openApp('messenger')}><MessageSquare size={18} /><div><strong>Незнакомый номер</strong><p>Есть подработка по логам.</p></div><time>19:27</time></button>}
        </section>
      )}

      <section className="mobile-os">
        <header className="mobile-status"><span>{clock}</span><strong>FALSE ACCESS</strong><div><Signal size={13} /><Wifi size={13} /><Shield size={13} /></div></header>
        {mobileApp ? (
          <div className="mobile-app-view">
            <header><button onClick={() => setMobileApp(null)}><ChevronUp size={18} /></button><strong>{apps.find((app) => app.id === mobileApp)?.title}</strong><button onClick={() => setMobileApp(null)}><Minus size={18} /></button></header>
            <div>{appContent(mobileApp, openApp)}</div>
          </div>
        ) : (
          <>
            <div className="mobile-hero"><p>ОСТРОГОРСК</p><strong>{clock}</strong><span>{date}</span></div>
            <div className="mobile-alert" onClick={() => openApp('life')}><HeartPulse size={20} /><div><strong>ЖИЗНЬ</strong><span>День {progress.simulation.clock.day} · {progress.simulation.career.status === 'employed' ? progress.simulation.career.title : 'без работы'}</span></div><ChevronUp size={17} /></div>
            <UpdateButton />
            <div className="mobile-grid">{apps.map((app) => { const Icon = app.icon; const locked = isLocked(app.id); return <button key={app.id} className={locked ? 'locked' : ''} disabled={locked} onClick={() => !locked && openApp(app.id)}><span style={{ '--app-accent': app.accent } as React.CSSProperties}><Icon size={23} /></span><strong>{app.shortTitle}</strong></button>; })}</div>
            <footer className="mobile-dock"><button onClick={() => openApp('messenger')}><MessageSquare size={22} /></button><button onClick={() => openApp('browser')}><Globe2 size={22} /></button><button onClick={() => openApp('terminal')}><TerminalSquare size={22} /></button><button onClick={() => openApp('mail')}><Mail size={22} /></button></footer>
          </>
        )}
      </section>

    </main>
  );
}
