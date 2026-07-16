import { useEffect, useRef, useState } from 'react';
import {
  Check, CloudDownload, Database, Download, HardDrive, Import, RefreshCw,
  Save, Settings, ShieldCheck, Smartphone, Trash2, Wifi, WifiOff,
} from 'lucide-react';
import { useProgress } from '../system/ProgressContext';

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 MB';
  return `${(value / 1024 / 1024).toFixed(value > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function SettingsApp() {
  const { progress, resetProgress, saveNow, importProgress } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [savedAt, setSavedAt] = useState(localStorage.getItem('false-access-last-saved-at') ?? '');
  const [storage, setStorage] = useState({ usage: 0, quota: 0 });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    navigator.storage?.estimate().then((result) => setStorage({ usage: result.usage ?? 0, quota: result.quota ?? 0 })).catch(() => undefined);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  const manualSave = () => {
    const iso = saveNow();
    setSavedAt(iso);
    setStatus('Сохранено на устройстве');
  };

  const exportSave = () => {
    const payload = JSON.stringify({
      game: 'FALSE ACCESS',
      version: '0.4.0',
      exportedAt: new Date().toISOString(),
      progress,
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `false-access-save-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Файл сохранения скачан');
  };

  const importSaveFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { progress?: unknown } | unknown;
      const payload = typeof parsed === 'object' && parsed !== null && 'progress' in parsed ? (parsed as { progress: unknown }).progress : parsed;
      if (!importProgress(payload)) throw new Error('invalid save');
      setSavedAt(new Date().toISOString());
      setStatus('Сохранение загружено');
    } catch {
      setStatus('Файл не похож на сохранение FALSE ACCESS');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const forceUpdate = async () => {
    if (!online) {
      setStatus('Для обновления нужен интернет');
      return;
    }
    setBusy(true);
    setStatus('Проверка новой версии...');
    try {
      const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : [];
      await Promise.all(registrations.map((registration) => registration.update()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith('false-access-')).map((key) => caches.delete(key)));
      }
      setStatus('Обновление найдено. Перезапуск...');
      window.setTimeout(() => window.location.reload(), 350);
    } catch {
      setBusy(false);
      setStatus('Не удалось проверить обновление');
    }
  };

  const reset = () => {
    if (!window.confirm('Стереть весь прогресс, деньги, репутацию и историю заказов?')) return;
    resetProgress();
    setStatus('Прогресс сброшен');
  };

  const savedLabel = savedAt ? new Date(savedAt).toLocaleString('ru-RU') : 'автосохранение включено';
  const progressCount = progress.terminalObjectives.length
    + Number(progress.pythonComplete)
    + Number(progress.alertReviewed)
    + Number(progress.reportSubmitted)
    + Number(progress.interviewComplete)
    + Number(progress.firstShiftComplete);

  return (
    <div className="settings-app app-scroll">
      <header className="settings-hero">
        <div>
          <p className="eyebrow">FALSE ACCESS / DEVICE</p>
          <h2>Настройки</h2>
          <p>Сохранение лежит только на этом устройстве. Сервер и аккаунт не нужны.</p>
        </div>
        <div className={`connection-chip ${online ? 'online' : 'offline'}`}>
          {online ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span>{online ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </header>

      {status && <div className="settings-toast"><Check size={15} />{status}</div>}

      <section className="settings-grid">
        <article className="settings-card save-card">
          <header><span><Database size={19} /></span><div><strong>Сохранение</strong><small>{savedLabel}</small></div></header>
          <div className="settings-stat-row">
            <div><span>Прогресс</span><strong>{progressCount} этапов</strong></div>
            <div><span>Заказы</span><strong>{progress.completedContracts.length}</strong></div>
            <div><span>Баланс</span><strong>{progress.balance.toLocaleString('ru-RU')} ₽</strong></div>
          </div>
          <div className="settings-actions two">
            <button className="primary-action" onClick={manualSave}><Save size={16} />Сохранить сейчас</button>
            <button className="secondary-action" onClick={exportSave}><Download size={16} />Скачать файл</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(event) => importSaveFile(event.target.files?.[0])} />
          <button className="settings-link-button" onClick={() => fileRef.current?.click()}><Import size={15} />Загрузить сохранение из файла</button>
        </article>

        <article className="settings-card offline-card">
          <header><span><CloudDownload size={19} /></span><div><strong>Офлайн</strong><small>Сюжет, терминал и Python хранятся локально</small></div></header>
          <div className="offline-visual">
            <div className="offline-ring"><ShieldCheck size={29} /><i /></div>
            <div><strong>{online ? 'Готов к отключению сети' : 'Игра запущена без сети'}</strong><span>После первой загрузки приложение открывается из кэша.</span></div>
          </div>
          <div className="storage-line"><span><HardDrive size={14} />Занято</span><strong>{formatBytes(storage.usage)}</strong></div>
          <div className="storage-bar"><i style={{ width: storage.quota ? `${Math.max(3, Math.min(100, storage.usage / storage.quota * 100))}%` : '3%' }} /></div>
        </article>

        <article className="settings-card app-card">
          <header><span><Smartphone size={19} /></span><div><strong>Приложение</strong><small>BUILD 0.4.0</small></div></header>
          <dl>
            <div><dt>Режим</dt><dd>{standalone ? 'Установлено на устройство' : 'Браузер'}</dd></div>
            <div><dt>Хранилище</dt><dd>LocalStorage + Cache Storage</dd></div>
            <div><dt>Сеть</dt><dd>{online ? 'Доступна' : 'Отключена'}</dd></div>
          </dl>
          <button className="secondary-action full" disabled={busy} onClick={forceUpdate}><RefreshCw size={16} className={busy ? 'spin' : ''} />{busy ? 'Проверка...' : 'Принудительно обновить'}</button>
        </article>

        <article className="settings-card danger-card">
          <header><span><Settings size={19} /></span><div><strong>Данные игры</strong><small>Это действие нельзя отменить</small></div></header>
          <p>Перед сбросом скачай сохранение, если оно понадобится позже.</p>
          <button className="danger-action" onClick={reset}><Trash2 size={16} />Сбросить весь прогресс</button>
        </article>
      </section>

      <footer className="settings-footer"><span>FALSE ACCESS</span><i>LOCAL-FIRST PWA</i></footer>
    </div>
  );
}
