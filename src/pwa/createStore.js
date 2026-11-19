import { useSyncExternalStore } from 'react';

export function createStore(initial) {
  let value = initial;
  const listeners = new Set();

  const get = () => value;

  const set = (next) => {
    if (Object.is(next, value)) return;
    value = next;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useValue = () => useSyncExternalStore(subscribe, get);

  return { get, set, subscribe, useValue };
}
