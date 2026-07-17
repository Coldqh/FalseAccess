import { useEffect, useMemo, useState } from 'react';
import {
  Bell, BookOpenCheck, Braces, BriefcaseBusiness, CalendarClock, ChartNoAxesCombined, ChevronUp, CircleUserRound, Code2,
  FileSearch, Globe2, HardDrive, HeartPulse, Mail, MailWarning, MapPinned, Menu, MessageSquare, Minus, MonitorCog, NotebookPen, Radar, Search,
  Settings as SettingsIcon, Router, ServerCog, Shield, ShieldAlert, ShieldCheck, Signal, Smartphone, Network, TerminalSquare, UserRoundCheck, Waypoints, Wifi, X,
} from 'lucide-react';
import type { AppDefinition, AppId, ProgressState, WindowState } from '../types';
import { WindowFrame } from './WindowFrame';
import { MissionsApp } from '../apps/MissionsApp';
import { TerminalApp } from '../apps/TerminalApp';
import { ContractsApp } from '../apps/ContractsApp';
import { CodeApp } from '../apps/CodeApp';
import { MailApp } from '../apps/MailApp';
import { MessengerApp } from '../apps/MessengerApp';
import { BrowserApp } from '../apps/BrowserApp';
import { TorBrowserApp } from '../apps/TorBrowserApp';
import { SiemApp } from '../apps/SiemApp';
import { SkillsApp } from '../apps/SkillsApp';
import { NotesApp } from '../apps/NotesApp';
import { InterviewApp } from '../apps/InterviewApp';
import { FirstShiftApp } from '../apps/FirstShiftApp';
import { SettingsApp } from '../apps/SettingsApp';
import { LifeApp } from '../apps/LifeApp';
import { CareerApp } from '../apps/CareerApp';
import { CityApp } from '../apps/CityApp';
import { RouteCaseApp } from '../apps/RouteCaseApp';
import { WindowsCaseApp } from '../apps/WindowsCaseApp';
import { LinuxCaseApp } from '../apps/LinuxCaseApp';
import { NetworkCaseApp } from '../apps/NetworkCaseApp';
import { WebCaseApp } from '../apps/WebCaseApp';
import { MobileCaseApp } from '../apps/MobileCaseApp';
import { AdCaseApp } from '../apps/AdCaseApp';
import { MailCaseApp } from '../apps/MailCaseApp';
import { ForensicsCaseApp } from '../apps/ForensicsCaseApp';
import { IncidentResponseCaseApp } from '../apps/IncidentResponseCaseApp';
import { useProgress } from '../system/ProgressContext';
import { APP_VERSION } from '../system/updateManager';
import { UpdateButton } from './UpdateControl';

interface RuntimeAppDefinition extends AppDefinition {
  kind: 'core' | 'temporary';
  visible: (progress: ProgressState) => boolean;
  locked?: (progress: ProgressState) => boolean;
}

const always = () => true;

const apps: RuntimeAppDefinition[] = [
  { id: 'life', title: 'Life', shortTitle: 'Life', icon: HeartPulse, width: 1180, height: 740, accent: '#67c7c4', kind: 'core', visible: always },
  { id: 'city', title: 'City', shortTitle: 'City', icon: MapPinned, width: 1240, height: 760, accent: '#70a5d8', kind: 'core', visible: always },
  { id: 'career', title: 'Career', shortTitle: 'Career', icon: ChartNoAxesCombined, width: 1180, height: 740, accent: '#9dcf74', kind: 'core', visible: always },
  { id: 'missions', title: 'Missions', shortTitle: 'Missions', icon: BookOpenCheck, width: 920, height: 670, accent: '#ff5a38', kind: 'core', visible: always },
  { id: 'contracts', title: 'Work Queue', shortTitle: 'Contracts', icon: BriefcaseBusiness, width: 1180, height: 720, accent: '#efc46b', kind: 'core', visible: always },
  { id: 'terminal', title: 'Terminal', shortTitle: 'Terminal', icon: TerminalSquare, width: 1080, height: 690, accent: '#9dcf74', kind: 'core', visible: always },
  { id: 'code', title: 'Code Editor', shortTitle: 'Code', icon: Code2, width: 1180, height: 720, accent: '#70a5d8', kind: 'core', visible: always },
  { id: 'mail', title: 'Mail', shortTitle: 'Mail', icon: Mail, width: 1080, height: 680, accent: '#efc46b', kind: 'core', visible: always },
  { id: 'messenger', title: 'Messenger', shortTitle: 'Wire', icon: MessageSquare, width: 950, height: 650, accent: '#67c7c4', kind: 'core', visible: always },
  { id: 'browser', title: 'Browser', shortTitle: 'Browser', icon: Globe2, width: 1080, height: 700, accent: '#b58bd8', kind: 'core', visible: always },
  { id: 'tor', title: 'Tor Browser', shortTitle: 'Tor', icon: Network, width: 1220, height: 780, accent: '#7d4698', kind: 'core', visible: (progress) => progress.mailCaseComplete },
  { id: 'siem', title: 'SIEM', shortTitle: 'SIEM', icon: Radar, width: 1080, height: 690, accent: '#ff5a38', kind: 'core', visible: always, locked: (progress) => !progress.pythonComplete },
  { id: 'skills', title: 'Skills', shortTitle: 'Skills', icon: Shield, width: 900, height: 650, accent: '#9dcf74', kind: 'core', visible: always },
  { id: 'notes', title: 'Notes / Report', shortTitle: 'Notes', icon: NotebookPen, width: 1000, height: 680, accent: '#efc46b', kind: 'core', visible: always },
  { id: 'settings', title: 'Settings', shortTitle: 'Settings', icon: SettingsIcon, width: 960, height: 700, accent: '#8f949e', kind: 'core', visible: always },
  {
    id: 'interview', title: 'Technical Interview', shortTitle: 'Interview', icon: UserRoundCheck,
    width: 1080, height: 700, accent: '#efc46b', kind: 'temporary',
    visible: (progress) => progress.clinicWrapupComplete && !progress.interviewComplete,
  },
  {
    id: 'firstshift', title: 'First Shift', shortTitle: 'First Shift', icon: ShieldCheck,
    width: 1120, height: 720, accent: '#67c7c4', kind: 'temporary',
    visible: (progress) => progress.jobAccepted && !progress.firstShiftComplete,
  },
  {
    id: 'routecase', title: 'MARSHRUT-01', shortTitle: 'Route-01', icon: FileSearch,
    width: 1240, height: 760, accent: '#67c7c4', kind: 'temporary',
    visible: (progress) => progress.routeCaseAccepted && !progress.routeCaseComplete,
  },
  {
    id: 'windowscase', title: 'NORTHLINE-07', shortTitle: 'Win-07', icon: MonitorCog,
    width: 1260, height: 780, accent: '#70a5d8', kind: 'temporary',
    visible: (progress) => progress.routeCaseComplete && !progress.windowsCaseComplete,
  },
  {
    id: 'linuxcase', title: 'REDTABLE-02', shortTitle: 'Linux-02', icon: ServerCog,
    width: 1260, height: 780, accent: '#9dcf74', kind: 'temporary',
    visible: (progress) => progress.windowsCaseComplete && !progress.linuxCaseComplete,
  },
  {
    id: 'networkcase', title: 'BLACKWIRE-03', shortTitle: 'Net-03', icon: Router,
    width: 1280, height: 800, accent: '#67c7c4', kind: 'temporary',
    visible: (progress) => progress.linuxCaseComplete && !progress.networkCaseComplete,
  },
  {
    id: 'webcase', title: 'VANTA-04', shortTitle: 'Web-04', icon: Braces,
    width: 1300, height: 820, accent: '#b58bd8', kind: 'temporary',
    visible: (progress) => progress.networkCaseComplete && !progress.webCaseComplete,
  },
  {
    id: 'mobilecase', title: 'MIRRORCELL-05', shortTitle: 'Mob-05', icon: Smartphone,
    width: 1300, height: 820, accent: '#ff7f6e', kind: 'temporary',
    visible: (progress) => progress.webCaseComplete && !progress.mobileCaseComplete,
  },
  {
    id: 'adcase', title: 'IRONROOT-06', shortTitle: 'AD-06', icon: Waypoints,
    width: 1320, height: 840, accent: '#e0b86a', kind: 'temporary',
    visible: (progress) => progress.mobileCaseComplete && !progress.adCaseComplete,
  },
  {
    id: 'mailcase', title: 'BLACKPOST-07', shortTitle: 'Mail-07', icon: MailWarning,
    width: 1320, height: 840, accent: '#f0b06a', kind: 'temporary',
    visible: (progress) => progress.adCaseComplete && !progress.mailCaseComplete,
  },
  {
    id: 'forensicscase', title: 'DEADFRAME-08', shortTitle: 'DFIR-08', icon: HardDrive,
    width: 1340, height: 850, accent: '#86b8d8', kind: 'temporary',
    visible: (progress) => progress.darknetComplete && !progress.forensicsCaseComplete,
  },
  {
    id: 'incidentcase', title: 'GREYLOCK-09', shortTitle: 'IR-09', icon: ShieldAlert,
    width: 1360, height: 860, accent: '#ef7d63', kind: 'temporary',
    visible: (progress) => progress.forensicsCaseComplete && !progress.incidentCaseComplete,
  },
];

function appContent(id: AppId, openApp: (id: AppId) => void) {
  switch (id) {
    case 'life': return <LifeApp openApp={openApp} />;
    case 'city': return <CityApp openApp={openApp} />;
    case 'career': return <CareerApp />;
    case 'missions': return <MissionsApp openApp={openApp} />;
    case 'contracts': return <ContractsApp />;
    case 'terminal': return <TerminalApp openApp={openApp} />;
    case 'code': return <CodeApp openApp={openApp} />;
    case 'mail': return <MailApp openApp={openApp} />;
    case 'messenger': return <MessengerApp openApp={openApp} />;
    case 'browser': return <BrowserApp />;
    case 'tor': return <TorBrowserApp />;
    case 'siem': return <SiemApp openApp={openApp} />;
    case 'interview': return <InterviewApp />;
    case 'firstshift': return <FirstShiftApp />;
    case 'routecase': return <RouteCaseApp />;
    case 'windowscase': return <WindowsCaseApp />;
    case 'linuxcase': return <LinuxCaseApp />;
    case 'networkcase': return <NetworkCaseApp />;
    case 'webcase': return <WebCaseApp />;
    case 'mobilecase': return <MobileCaseApp />;
    case 'adcase': return <AdCaseApp />;
    case 'mailcase': return <MailCaseApp />;
    case 'forensicscase': return <ForensicsCaseApp />;
    case 'incidentcase': return <IncidentResponseCaseApp />;
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

  const visibleApps = useMemo(() => apps.filter((app) => app.visible(progress)), [progress]);
  const visibleIds = useMemo(() => new Set(visibleApps.map((app) => app.id)), [visibleApps]);
  const visibleKey = visibleApps.map((app) => app.id).join('|');
  const activeWindowId = useMemo(() => [...windows].filter((win) => !win.minimized).sort((a, b) => b.z - a.z)[0]?.id, [windows]);
  const isLocked = (id: AppId) => Boolean(apps.find((app) => app.id === id)?.locked?.(progress));

  useEffect(() => {
    setWindows((current) => current.filter((windowState) => visibleIds.has(windowState.id)));
    setMobileApp((current) => current && !visibleIds.has(current) ? null : current);
  }, [visibleKey]);

  const focusWindow = (id: AppId) => {
    setZCounter((value) => value + 1);
    setWindows((current) => current.map((windowState) => windowState.id === id ? { ...windowState, z: zCounter + 1, minimized: false } : windowState));
  };

  const openApp = (id: AppId) => {
    const app = visibleApps.find((item) => item.id === id);
    if (!app || isLocked(id)) return;
    if (window.matchMedia('(max-width: 720px)').matches) {
      setMobileApp(id);
      return;
    }
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
        <div className="desktop-brand"><span>FALSE</span><strong>ACCESS</strong><i>CITY BUILD / {APP_VERSION}</i></div>
        <div className="background-data"><span>OSTROGORSK</span><span>54.8121 N</span><span>LOCAL VAULT: ONLINE</span></div>
      </div>

      <header className="system-bar">
        <div className="system-left"><b>FALSE ACCESS</b><i>/</i><span>PROFILE: ILYA.V</span></div>
        <div className="system-right"><span className="system-balance">{progress.balance.toLocaleString('ru-RU')} ₽</span><span><Signal size={13} />LOCAL NET</span><span><Shield size={13} />SAFE LAB</span><UpdateButton compact /><button onClick={() => setNotificationOpen((value) => !value)}><Bell size={14} />{unread > 0 && <b>{unread}</b>}</button><span>{clock}</span></div>
      </header>

      <section className="desktop-icons">
        {visibleApps.map((app) => {
          const Icon = app.icon;
          const locked = isLocked(app.id);
          return (
            <button key={app.id} onDoubleClick={() => !locked && openApp(app.id)} onClick={() => !locked && openApp(app.id)} className={`${locked ? 'locked' : ''} ${app.kind === 'temporary' ? 'temporary-app' : ''}`}>
              <span className="desktop-icon" style={{ '--app-accent': app.accent } as React.CSSProperties}><Icon size={27} strokeWidth={1.45} /></span>
              <strong>{app.shortTitle}</strong>
              {app.kind === 'temporary' && <i className="temporary-badge">STORY</i>}
              {app.id === 'mail' && progress.jobOfferUnlocked && !progress.readMail.includes('job-offer') && <i className="icon-badge">1</i>}
            </button>
          );
        })}
      </section>

      {windows.map((windowState) => {
        const app = visibleApps.find((item) => item.id === windowState.id);
        if (!app) return null;
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
            const app = visibleApps.find((item) => item.id === windowState.id);
            if (!app) return null;
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
          <div className="launcher-grid">{visibleApps.map((app) => { const Icon = app.icon; const locked = isLocked(app.id); return <button key={app.id} disabled={locked} className={`${locked ? 'locked' : ''} ${app.kind === 'temporary' ? 'temporary-app' : ''}`} onClick={() => !locked && openApp(app.id)}><span style={{ '--app-accent': app.accent } as React.CSSProperties}><Icon size={22} /></span><strong>{app.title}</strong>{app.kind === 'temporary' && <small>Сюжетный этап</small>}</button>; })}</div>
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
        <header className="mobile-status"><span>{clock}</span><strong>FALSE ACCESS</strong><span className="mobile-balance">{progress.balance.toLocaleString('ru-RU')} ₽</span><div><Signal size={13} /><Wifi size={13} /><Shield size={13} /></div></header>
        {mobileApp ? (
          <div className="mobile-app-view">
            <header><button onClick={() => setMobileApp(null)}><ChevronUp size={18} /></button><strong>{visibleApps.find((app) => app.id === mobileApp)?.title}</strong><button onClick={() => setMobileApp(null)}><Minus size={18} /></button></header>
            <div>{appContent(mobileApp, openApp)}</div>
          </div>
        ) : (
          <>
            <div className="mobile-hero"><p>ОСТРОГОРСК</p><strong>{clock}</strong><span>{date}</span></div>
            <div className="mobile-alert" onClick={() => openApp('city')}><CalendarClock size={20} /><div><strong>ОСТРОГОРСК</strong><span>{progress.simulation.world.currentLocationId === 'family-home' ? 'Ты дома' : 'Открыть карту города'}</span></div><ChevronUp size={17} /></div>
            <UpdateButton />
            <div className="mobile-grid">{visibleApps.map((app) => { const Icon = app.icon; const locked = isLocked(app.id); return <button key={app.id} className={`${locked ? 'locked' : ''} ${app.kind === 'temporary' ? 'temporary-app' : ''}`} disabled={locked} onClick={() => !locked && openApp(app.id)}><span style={{ '--app-accent': app.accent } as React.CSSProperties}><Icon size={23} /></span><strong>{app.shortTitle}</strong>{app.kind === 'temporary' && <i>STORY</i>}</button>; })}</div>
            <footer className="mobile-dock"><button onClick={() => openApp('messenger')}><MessageSquare size={22} /></button><button onClick={() => openApp('city')}><MapPinned size={22} /></button><button onClick={() => openApp('terminal')}><TerminalSquare size={22} /></button><button onClick={() => openApp('mail')}><Mail size={22} /></button></footer>
          </>
        )}
      </section>
    </main>
  );
}
