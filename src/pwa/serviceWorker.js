import { createStore } from './createStore';

const BASE = import.meta.env.BASE_URL;
const UPDATE_INTERVAL = 30 * 60 * 1000;
const WARM_UP_TYPES = ['img', 'fetch', 'css', 'link'];

const store = createStore({ updateReady: false, offlineReady: false });
let registration = null;
let updateRequested = false;
let reloading = false;

function patch(changes) {
  store.set({ ...store.get(), ...changes });
}

function watchInstalling(worker) {
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      patch({ updateReady: true });
    }
  });
}

function warmUpCache() {
  const urls = performance
    .getEntriesByType('resource')
    .filter((entry) => WARM_UP_TYPES.includes(entry.initiatorType))
    .map((entry) => entry.name);
  navigator.serviceWorker.controller?.postMessage({ type: 'CACHE_URLS', urls });
}

function checkForUpdate() {
  registration?.update().catch(() => {});
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController || updateRequested) {
      if (reloading) return;
      reloading = true;
      window.location.reload();
      return;
    }
    warmUpCache();
    patch({ offlineReady: true });
  });

  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register(`${BASE}sw.js`, {
        scope: BASE,
        updateViaCache: 'none',
      });
    } catch {
      return;
    }

    if (registration.waiting && navigator.serviceWorker.controller) patch({ updateReady: true });
    registration.addEventListener('updatefound', () => watchInstalling(registration.installing));

    setInterval(checkForUpdate, UPDATE_INTERVAL);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });
  });
}

export function applyUpdate() {
  updateRequested = true;
  if (registration?.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  else window.location.reload();
}

export function dismissUpdate() {
  patch({ updateReady: false });
}

export function dismissOfflineReady() {
  patch({ offlineReady: false });
}

export const useServiceWorker = store.useValue;
