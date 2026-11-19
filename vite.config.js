import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { gamesApi } from './plugins/gamesApi.js';
import { serviceWorker } from './plugins/serviceWorker.js';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

export default defineConfig({
  base: '/ReactPWAHW/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react(), gamesApi(), serviceWorker()],
});
