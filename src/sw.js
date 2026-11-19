const VERSION = '__BUILD_VERSION__';
const PRECACHE_URLS = __PRECACHE_URLS__;

const PREFIX = 'save-point';
const SHELL_CACHE = `${PREFIX}-shell-${VERSION}`;
const API_CACHE = `${PREFIX}-api-v1`;
const STATIC_CACHE = `${PREFIX}-static-v1`;
const CURRENT_CACHES = [SHELL_CACHE, API_CACHE, STATIC_CACHE];

const BASE = new URL(self.registration.scope).pathname;
const SHELL_URL = `${BASE}index.html`;
const OFFLINE_URL = `${BASE}offline.html`;
const PRECACHE_PATHS = new Set(PRECACHE_URLS.map((path) => BASE + path));

const API_MAX_ENTRIES = 60;
const API_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const STATIC_MAX_ENTRIES = 100;
const NETWORK_TIMEOUT = 4000;

const PRIVATE_HOSTS = [
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'firestore.googleapis.com',
  'www.googleapis.com',
  'apis.google.com',
  'accounts.google.com',
  'googleusercontent.com',
  'firebaseapp.com',
];
const STATIC_FILE = /\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i;
const OTHER_FILE = /\/[^/]+\.(?!html$)[a-z0-9]+$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(removeOutdatedCaches().then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CACHE_URLS') event.waitUntil(warmUp(event.data.urls));
});

self.addEventListener('fetch', (event) => {
  const handler = pickHandler(event.request);
  if (handler) event.respondWith(handler(event.request));
});

async function precache() {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(PRECACHE_URLS.map((path) => new Request(BASE + path, { cache: 'reload' })));
}

async function removeOutdatedCaches() {
  const names = await caches.keys();
  const outdated = names.filter((name) => name.startsWith(PREFIX) && !CURRENT_CACHES.includes(name));
  await Promise.all(outdated.map((name) => caches.delete(name)));
}

function isPrivate(url) {
  return PRIVATE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

function pickHandler(request) {
  if (request.method !== 'GET' || request.headers.has('authorization')) return null;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http') || isPrivate(url)) return null;

  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && !url.pathname.startsWith(BASE)) return null;

  if (sameOrigin && url.pathname.startsWith(`${BASE}api/`)) return networkFirst;
  if (sameOrigin && PRECACHE_PATHS.has(url.pathname)) return fromShell;
  if (request.mode === 'navigate') return sameOrigin && !OTHER_FILE.test(url.pathname) ? appShell : null;
  if (request.destination === 'image' || request.destination === 'font' || STATIC_FILE.test(url.pathname)) {
    return cacheFirst;
  }
  return null;
}

async function fromShell(request) {
  const cached = await caches.match(new URL(request.url).pathname, { cacheName: SHELL_CACHE });
  if (cached) return cached;
  try {
    return await fetch(request);
  } catch {
    return Response.error();
  }
}

async function appShell(request) {
  const shell = await caches.match(SHELL_URL, { cacheName: SHELL_CACHE });
  if (shell) return shell;
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE })) ?? Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  const network = fetch(request).then(async (response) => {
    if (response.ok && response.headers.get('content-type')?.includes('json')) {
      await cache.put(request, await stamp(response.clone()));
      await trimCache(API_CACHE, API_MAX_ENTRIES);
    }
    return response;
  });
  network.catch(() => {});

  try {
    return await Promise.race([network, timeout(NETWORK_TIMEOUT)]);
  } catch {
    const cached = await readCached(cache, request);
    if (cached) return cached;
    try {
      return await network;
    } catch {
      return Response.error();
    }
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone());
      await trimCache(STATIC_CACHE, STATIC_MAX_ENTRIES);
    }
    return response;
  } catch {
    return Response.error();
  }
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), ms));
}

async function stamp(response) {
  const headers = new Headers(response.headers);
  headers.set('x-sw-cached-at', new Date().toISOString());
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readCached(cache, request) {
  const cached = await cache.match(request);
  if (!cached) return null;

  const savedAt = Date.parse(cached.headers.get('x-sw-cached-at'));
  if (Date.now() - savedAt > API_MAX_AGE) {
    await cache.delete(request);
    return null;
  }

  const headers = new Headers(cached.headers);
  headers.set('x-sw-source', 'cache');
  return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
}

async function trimCache(name, maxEntries) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  const extra = keys.slice(0, Math.max(0, keys.length - maxEntries));
  await Promise.all(extra.map((key) => cache.delete(key)));
}

async function warmUp(urls) {
  if (!Array.isArray(urls)) return;
  await Promise.all(
    urls.map(async (href) => {
      let url;
      try {
        url = new URL(href);
      } catch {
        return;
      }
      const sameOrigin = url.origin === self.location.origin;
      const request = new Request(url, { mode: sameOrigin ? 'same-origin' : 'no-cors' });
      const handler = pickHandler(request);
      if (handler === networkFirst || handler === cacheFirst) await handler(request);
    }),
  );
}
