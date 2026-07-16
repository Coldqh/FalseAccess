const VERSION = '0.7.1';
const CACHE = `false-access-${VERSION}`;
const FALLBACK = './index.html';
const CORE = [
  './',
  './index.html',
  './version.json',
  './update.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-maskable.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
  './sites/site.css',
  './sites/clinic/index.html',
  './sites/ostrogorsk-news/index.html',
  './sites/sfera/index.html',
  './sites/marshrut/index.html',
  './sites/vanta/index.html',
  './pyodide/pyodide.mjs',
  './pyodide/pyodide.asm.js',
  './pyodide/pyodide.asm.wasm',
  './pyodide/python_stdlib.zip',
  './pyodide/pyodide-lock.json',
];

async function safePut(cache, url) {
  try {
    const response = await fetch(url, { cache: 'reload' });
    if (response.ok) await cache.put(url, response);
  } catch {
    // Optional files may be cached during the next online launch.
  }
}

async function cacheBuiltAssets(cache) {
  try {
    const response = await fetch('./index.html', { cache: 'reload' });
    if (!response.ok) return;
    const html = await response.clone().text();
    await cache.put('./index.html', response);
    const matches = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map((match) => match[1])
      .filter((url) => !url.startsWith('data:') && !url.startsWith('http'));
    await Promise.allSettled(matches.map((url) => safePut(cache, new URL(url, self.registration.scope).href)));
  } catch {
    // Runtime caching fills the rest.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(CORE.map((url) => safePut(cache, url)));
    await cacheBuiltAssets(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('false-access-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.allSettled(windows.map((client) => {
      const url = new URL(client.url);
      if (url.searchParams.get('sw_build') === VERSION) return undefined;
      url.searchParams.set('sw_build', VERSION);
      url.searchParams.set('t', String(Date.now()));
      return client.navigate(url.toString());
    }));
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(caches.open(CACHE).then((cache) => Promise.allSettled(event.data.urls.map((url) => safePut(cache, url)))));
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (requestUrl.pathname.endsWith('/version.json') || requestUrl.pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        await cache.put(event.request, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(event.request)) || (await caches.match(FALLBACK)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
