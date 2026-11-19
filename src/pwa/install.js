import { createStore } from './createStore';

const store = createStore(null);

export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    store.set(event);
  });
  window.addEventListener('appinstalled', () => store.set(null));
}

export async function promptInstall() {
  const event = store.get();
  if (!event) return;
  event.prompt();
  await event.userChoice;
  store.set(null);
}

export const useInstallPrompt = store.useValue;
