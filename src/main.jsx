import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './queryClient';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { registerServiceWorker } from './pwa/serviceWorker';
import { startNetworkWatcher } from './pwa/network';
import { listenForInstallPrompt } from './pwa/install';
import '@fontsource/press-start-2p';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import './styles/index.css';

listenForInstallPrompt();
startNetworkWatcher();
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
