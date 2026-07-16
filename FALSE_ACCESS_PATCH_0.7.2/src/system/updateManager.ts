export const APP_VERSION = '0.7.2';

export type UpdatePhase = 'idle' | 'checking' | 'latest' | 'available' | 'updating' | 'offline' | 'error';

export interface AppUpdateState {
  phase: UpdatePhase;
  online: boolean;
  currentVersion: string;
  latestVersion: string;
  message: string;
}

interface VersionPayload {
  version?: string;
  build?: string;
}

const listeners = new Set<(state: AppUpdateState) => void>();
let initialized = false;
let reloadStarted = false;
let state: AppUpdateState = {
  phase: navigator.onLine ? 'idle' : 'offline',
  online: navigator.onLine,
  currentVersion: APP_VERSION,
  latestVersion: APP_VERSION,
  message: navigator.onLine ? '' : 'Нет подключения к интернету',
};

function publish(patch: Partial<AppUpdateState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
}

export function getUpdateState() {
  return state;
}

export function subscribeUpdateState(listener: (next: AppUpdateState) => void) {
  listeners.add(listener);
  listener(state);
  return () => { listeners.delete(listener); };
}

async function fetchLatestVersion(): Promise<string> {
  const url = new URL('./version.json', window.location.href);
  url.searchParams.set('t', String(Date.now()));
  const response = await fetch(url, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`version request failed: ${response.status}`);
  const payload = await response.json() as VersionPayload;
  if (!payload.version) throw new Error('version is missing');
  return payload.version;
}

async function clearGameCaches() {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith('false-access-')).map((key) => caches.delete(key)));
}

function buildFreshUrl(version: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('fa_update', version);
  url.searchParams.set('t', String(Date.now()));
  return url.toString();
}

export async function forceRefreshToLatest(version = state.latestVersion || APP_VERSION) {
  if (!navigator.onLine) {
    publish({ phase: 'offline', online: false, message: 'Для обновления нужен интернет' });
    return;
  }
  if (reloadStarted) return;
  reloadStarted = true;
  publish({ phase: 'updating', online: true, message: 'Обновление игры...' });
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async (registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        await registration.unregister();
      }));
    }
    await clearGameCaches();
    window.location.replace(buildFreshUrl(version));
  } catch {
    reloadStarted = false;
    publish({ phase: 'error', message: 'Не удалось обновить игру' });
  }
}

export async function checkForUpdates(autoApply = true) {
  if (!navigator.onLine) {
    publish({ phase: 'offline', online: false, message: 'Нет подключения к интернету' });
    return false;
  }

  publish({ phase: 'checking', online: true, message: 'Проверка обновлений...' });
  try {
    const latestVersion = await fetchLatestVersion();
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    await registration?.update();
    const hasWaitingWorker = Boolean(registration?.waiting);
    const updateAvailable = latestVersion !== APP_VERSION || hasWaitingWorker;

    if (updateAvailable) {
      publish({
        phase: 'available',
        latestVersion,
        message: `Доступна версия ${latestVersion}`,
      });
      if (autoApply) await forceRefreshToLatest(latestVersion);
      return true;
    }

    publish({
      phase: 'latest',
      latestVersion,
      message: `Установлена версия ${APP_VERSION}`,
    });
    return false;
  } catch {
    publish({ phase: 'error', message: 'Не удалось проверить обновления' });
    return false;
  }
}

async function registerWorker() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`, { updateViaCache: 'none' });

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        publish({ phase: 'available', latestVersion: state.latestVersion, message: 'Новая версия готова' });
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  });
}

export function initializeUpdateManager() {
  if (initialized) return;
  initialized = true;

  const syncOnlineState = () => {
    publish({
      online: navigator.onLine,
      phase: navigator.onLine ? 'idle' : 'offline',
      message: navigator.onLine ? '' : 'Нет подключения к интернету',
    });
    if (navigator.onLine) void checkForUpdates(true);
  };

  window.addEventListener('online', syncOnlineState);
  window.addEventListener('offline', syncOnlineState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) void checkForUpdates(true);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadStarted) return;
      reloadStarted = true;
      window.location.reload();
    });
  }

  void registerWorker()
    .then(() => checkForUpdates(true))
    .catch(() => publish({ phase: 'error', message: 'Service Worker не запустился' }));

  window.setInterval(() => {
    if (navigator.onLine && document.visibilityState === 'visible') void checkForUpdates(true);
  }, 5 * 60 * 1000);
}
