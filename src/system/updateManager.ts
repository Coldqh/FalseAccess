export const APP_VERSION = '0.8.1';

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
let lastCheckAt = 0;
let activeCheck: Promise<boolean> | null = null;
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

function timeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    promise.then((value) => {
      window.clearTimeout(timer);
      resolve(value);
    }, (error) => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
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
  const controller = new AbortController();
  const abortTimer = window.setTimeout(() => controller.abort(), 2400);
  try {
    const url = new URL('./version.json', window.location.href);
    url.searchParams.set('t', String(Date.now()));
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`version request failed: ${response.status}`);
    const payload = await response.json() as VersionPayload;
    if (!payload.version) throw new Error('version is missing');
    return payload.version;
  } finally {
    window.clearTimeout(abortTimer);
  }
}

async function clearGameCaches() {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.allSettled(keys.filter((key) => key.startsWith('false-access-')).map((key) => caches.delete(key)));
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
    const tasks: Promise<unknown>[] = [timeout(clearGameCaches(), 1800, 'cache cleanup')];
    if ('serviceWorker' in navigator) {
      tasks.push(timeout(navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        await Promise.allSettled(registrations.map(async (registration) => {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
          await registration.unregister();
        }));
      }), 1800, 'service worker cleanup'));
    }
    await Promise.allSettled(tasks);
  } finally {
    window.location.replace(buildFreshUrl(version));
  }
}

export function checkForUpdates(autoApply = true, announce = true): Promise<boolean> {
  if (activeCheck) return activeCheck;

  activeCheck = (async () => {
    if (!navigator.onLine) {
      if (announce) publish({ phase: 'offline', online: false, message: 'Нет подключения к интернету' });
      return false;
    }

    if (announce) publish({ phase: 'checking', online: true, message: 'Проверка обновлений...' });
    else publish({ online: true });

    try {
      const latestVersion = await fetchLatestVersion();
      let registration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        registration = await timeout(navigator.serviceWorker.getRegistration(), 1200, 'service worker lookup').catch(() => undefined);
        if (registration) await timeout(registration.update(), 1800, 'service worker update').catch(() => undefined);
      }
      const hasWaitingWorker = Boolean(registration?.waiting);
      const updateAvailable = latestVersion !== APP_VERSION || hasWaitingWorker;
      lastCheckAt = Date.now();

      if (updateAvailable) {
        publish({ phase: 'available', latestVersion, message: `Доступна версия ${latestVersion}` });
        if (autoApply) void forceRefreshToLatest(latestVersion);
        return true;
      }

      publish({
        phase: announce ? 'latest' : 'idle',
        latestVersion,
        message: announce ? `Установлена версия ${APP_VERSION}` : '',
      });
      return false;
    } catch {
      publish({
        phase: announce ? 'error' : 'idle',
        online: navigator.onLine,
        message: announce ? 'Проверка заняла слишком долго. Игра продолжает работать.' : '',
      });
      return false;
    } finally {
      activeCheck = null;
    }
  })();

  return activeCheck;
}

async function registerWorker() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await timeout(
    navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`, { updateViaCache: 'none' }),
    2500,
    'service worker registration',
  );

  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
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

  const backgroundCheck = () => {
    if (!navigator.onLine || document.visibilityState !== 'visible') return;
    if (Date.now() - lastCheckAt < 60_000) return;
    void checkForUpdates(true, false);
  };

  const syncOnlineState = () => {
    publish({
      online: navigator.onLine,
      phase: navigator.onLine ? 'idle' : 'offline',
      message: navigator.onLine ? '' : 'Нет подключения к интернету',
    });
    if (navigator.onLine) window.setTimeout(backgroundCheck, 150);
  };

  window.addEventListener('online', syncOnlineState);
  window.addEventListener('offline', syncOnlineState);
  document.addEventListener('visibilitychange', backgroundCheck);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadStarted) return;
      reloadStarted = true;
      window.location.reload();
    });
  }

  void registerWorker().catch(() => undefined);
  window.setTimeout(backgroundCheck, 250);

  window.setInterval(backgroundCheck, 5 * 60 * 1000);
}
