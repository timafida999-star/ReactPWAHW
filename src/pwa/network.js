import { onlineManager } from '@tanstack/react-query';
import { createStore } from './createStore';

const PING_URL = `${import.meta.env.BASE_URL}manifest.json`;
const RETRY_INTERVAL = 15 * 1000;

const store = createStore(navigator.onLine);

export async function checkConnection() {
  if (!navigator.onLine) {
    store.set(false);
    return false;
  }
  try {
    const response = await fetch(`${PING_URL}?ping=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    store.set(response.ok);
    return response.ok;
  } catch {
    store.set(false);
    return false;
  }
}

export function reportOffline() {
  store.set(false);
}

export function startNetworkWatcher() {
  window.addEventListener('online', checkConnection);
  window.addEventListener('offline', reportOffline);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkConnection();
  });
  setInterval(() => {
    if (!store.get()) checkConnection();
  }, RETRY_INTERVAL);

  onlineManager.setEventListener((setOnline) => {
    setOnline(store.get());
    return store.subscribe(() => setOnline(store.get()));
  });

  checkConnection();
}

export const useOnline = store.useValue;
