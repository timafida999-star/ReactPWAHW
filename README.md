# Save Point

A library of famous indie games, built with React and React Router. This version turns Save Point into an installable Progressive Web App that works offline and on phones from 320px wide. Everything from the previous homeworks is kept: routing, Firebase Authentication and cached server data with TanStack Query.

Live: https://timafida999-star.github.io/ReactPWAHW/

## Pages

| Route         | Page                                           |
| ------------- | ---------------------------------------------- |
| `/`           | Home                                           |
| `/about`      | About the project                              |
| `/games`      | All games: search, filters, sorting, pages     |
| `/games/:id`  | Game page                                      |
| `/games/new`  | Add a game (logged in players only)            |
| `/wishlist`   | Wishlist                                       |
| `/dashboard`  | Statistics (logged in players only)            |
| `/login`      | Email/password and Google login                |
| `/signup`     | Registration with validation                   |
| `/profile`    | Email, UID, age group and logout (protected)   |
| `/offline`    | Offline page with a Retry Connection button    |
| `*`           | 404                                            |

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the config of your Firebase web app:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

`.env.local` is ignored by git. In Firebase Console enable Email/Password and Google in Authentication, and add the deployment domain to Authorized domains.

Open http://localhost:5173/ReactPWAHW/

The Service Worker is registered only in the production build. To try the PWA locally:

```bash
npm run build
npm run preview
```

Open http://localhost:4173/ReactPWAHW/

## PWA

### Manifest and installation

- `public/manifest.json` has `name`, `short_name`, `start_url`, `scope`, `display: "standalone"`, `theme_color`, `background_color`, 192×192 and 512×512 icons (normal and maskable) and shortcuts to Games and Wishlist.
- `index.html` links the manifest, the theme color and the Apple touch icon.
- The browser shows its own install button. When the browser fires `beforeinstallprompt`, the menu also shows an **Install app** button (`src/pwa/install.js`).

### Service Worker

The Service Worker is written by hand in `src/sw.js`. The Vite plugin `plugins/serviceWorker.js` builds it: it takes the list of built files, adds the public shell files, computes a version hash from their content and writes `dist/sw.js`.

| Event      | What happens                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `install`  | Pre-caches the app shell into `save-point-shell-<version>`: `index.html`, all built JS and CSS, the Latin font files, icons, `manifest.json` and `offline.html`. |
| `activate` | Deletes every `save-point-*` cache that is not used by this version, then takes control of open pages (`clients.claim`). |
| `fetch`    | Picks a strategy for each request (see the table below).                                         |
| `message`  | `SKIP_WAITING` activates a waiting version, `CACHE_URLS` saves the files the first visit loaded before the worker took control. |

**Updates.** `src/pwa/serviceWorker.js` registers the worker with `updateViaCache: 'none'` and checks for a new version every 30 minutes and when the tab becomes visible. When a new version is installed and waiting, a banner says **New version available** with an **Update now** button. The button sends `SKIP_WAITING`; the new worker activates, removes the old shell cache, and the page reloads once on `controllerchange`. The user never has to clear storage. The version number is shown in the footer.

### Runtime caching

| Request                                              | Strategy                                                      | Cache                       | Limit                 |
| ---------------------------------------------------- | ------------------------------------------------------------- | --------------------------- | --------------------- |
| Page navigation                                      | App shell from the pre-cache, then network, then `offline.html` | `save-point-shell-<version>` | replaced every version |
| `api/games.json` (list), `api/games/:id.json` (details) | **Network-first** with a 4 second timeout, cache as fallback  | `save-point-api-v1`         | 60 entries, 7 days    |
| Images (Steam covers), fonts, icons                  | **Cache-first**                                               | `save-point-static-v1`      | 100 entries           |
| Firebase Auth, Google sign-in, requests with an `Authorization` header, non-GET requests | Not cached, always network | none | none |

- When the API answer comes from the cache, the worker adds the headers `x-sw-source: cache` and `x-sw-cached-at`. The pages show a **Cached** badge with the time the data was saved.
- If a request fails and nothing is cached, the worker returns a network error and the app shows the offline page instead of crashing.
- Tokens and user data are never stored in these caches. The Firebase session stays in Firebase's own storage.

### Offline mode

- The navbar shows an **Online/Offline** indicator. It does not trust `navigator.onLine` alone: it sends a real request (`HEAD manifest.json`) and checks again every 15 seconds while offline (`src/pwa/network.js`).
- A yellow bar under the navbar says when you are offline, and a green bar says when the connection is back.
- Pages and games you opened before work offline, and so do pages whose code is already pre-cached (About, Login, the 404 page).
- If a page needs data that is not cached (for example a game you never opened), the app goes to `/offline`. The page shows which address failed, the connection status and a **Retry Connection** button. When the connection returns, it goes back to that page by itself.
- `offline.html` is a separate static page in the pre-cache. The worker shows it if a navigation cannot be served at all.
- TanStack Query runs in `offlineFirst` mode, so requests still reach the Service Worker cache when the browser is offline. When the connection returns, queries are refetched and the Cached badge disappears.
- Login and signup show a message and disable their buttons offline, because Firebase needs the internet.

### Mobile

- Responsive navigation: below 1024px the links move into a burger menu with a backdrop. Escape, a tap outside or a route change closes it.
- Filters on the Games page fold into a **Filters** button on narrow screens.
- Cards, the game page, the facts table, the dashboard stats and bars, forms and the offline page all have layouts for 320–480px screens.
- Buttons and form controls are at least 44px high. Hover effects are turned off on touch screens so cards do not stay shifted after a tap.
- Checked with no horizontal scrolling at 320×568, 360×740, 375×667, 414×896, 568×320, 740×360, 844×390, 768×1024, 1024×768 and 1280×800.

### How to check it

1. Open the live site in Chrome. After a moment a message says **Ready to work offline**.
2. DevTools → Application → Manifest: no errors, the app is installable.
3. Application → Service workers: `sw.js` is activated. Cache storage shows the shell, api and static caches.
4. Open some games, then turn on **Offline** in the Network tab. Reload: the app, the opened games and the list still work, with the Cached badge.
5. Open a game you did not visit: the app goes to `/offline`. Turn the network back on and the game opens.
6. To test an update, change something, push, and reload the open tab. The **New version available** banner appears.

## Games API

`public/api/games.json` is the list endpoint. The Vite plugin `plugins/gamesApi.js` creates one details endpoint per game, `api/games/<id>.json`, with the game and similar games. In development the same endpoints are served by a dev server middleware.

## Authentication

- `src/firebase.js` initializes Firebase from the `VITE_` variables.
- `src/services/authService.js` wraps the Firebase calls and translates error codes.
- `AuthContext` exposes `user`, `loading`, `error`, `signup`, `login`, `loginWithGoogle` and `logout`, and follows the session with `onAuthStateChanged`.
- The session is stored with `browserLocalPersistence`, so it survives a refresh and works offline.
- `ProtectedRoute` waits for the loading state, then redirects guests to `/login`. Protected pages: `/games/new`, `/dashboard`, `/profile`.
- The NavBar shows Login and Signup for guests, Profile and Logout for logged in players.
- The age group that unlocks PEGI ratings is chosen on the profile page and stored per user id.

## Caching strategy (TanStack Query)

Server data is cached with TanStack Query. Components never call the API directly, they use the hooks from `src/hooks/useGames.js`, which call `src/services/service.js`.

| Query key                      | Data                                  |
| ------------------------------ | ------------------------------------- |
| `['games', 'list', params]`    | One page of the filtered games list   |
| `['games', 'detail', id]`      | One game and similar games            |
| `['games', 'everything']`      | All games for the dashboard           |
| `['games', 'by-ids', ids]`     | Wishlist games                        |

- Every filter, sort and page is part of the key, so each combination has its own cache entry and going back to a visited page is instant.
- Data is fresh for 1 minute (`staleTime`). After that it is shown from the cache and refetched in the background. Unused entries are removed after 5 minutes (`gcTime`). Stale data is also refetched when the window gets focus or the connection returns.
- Failed requests are retried once, except offline and "not found" errors.
- Adding a game is a mutation. On success all queries under the `['games']` prefix are invalidated, so the list, the dashboard and the wishlist are loaded again with the new game. Adding a game also works offline.
- Outdated requests cannot overwrite newer results: every response is stored under its own key, and the request signal is aborted when the query is no longer used.
- Loading, error (with retry) and empty states are handled on every page.

## Extra features

- PEGI age ratings: guests see games up to 12, older ones are locked until login.
- Dashboard bars and the top 5 are links to filtered lists and game pages.
- Similar games of the same genre on the game page.
- Wishlist with total price. Every player has their own wishlist, saved on the device under their user id. Logging out empties it, logging in shows that player's list. A guest list lives only until the page is reloaded.

## Images

Covers are loaded from the Steam store (`header.jpg` of each game) and cached by the Service Worker. If an image does not load, the card shows a pixel icon of the genre instead.
