import { createStore } from './createStore';

const store = createStore({ fromCache: false, savedAt: null });

export function trackResponse(response) {
  const fromCache = response.headers.get('x-sw-source') === 'cache';
  const savedAt = fromCache ? response.headers.get('x-sw-cached-at') : null;
  const current = store.get();
  if (current.fromCache === fromCache && current.savedAt === savedAt) return;
  store.set({ fromCache, savedAt });
}

export const useDataSource = store.useValue;
