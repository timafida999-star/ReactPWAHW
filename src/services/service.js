import { PAGE_SIZE } from '../data/options';
import { loadCustomGames, saveCustomGames } from './storage';
import { trackResponse } from '../pwa/dataSource';
import { reportOffline } from '../pwa/network';

const API_URL = `${import.meta.env.BASE_URL}api`;
const SIMILAR_COUNT = 4;

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

function offlineError() {
  const error = new Error('No connection, and this data is not saved on your device yet.');
  error.offline = true;
  return error;
}

function notFoundError(id) {
  const error = new Error(`Game #${id} not found`);
  error.notFound = true;
  return error;
}

async function request(path, signal) {
  let response;
  try {
    response = await fetch(`${API_URL}/${path}`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    reportOffline();
    throw offlineError();
  }
  trackResponse(response);
  return response;
}

function isJson(response) {
  return Boolean(response.headers.get('content-type')?.includes('json'));
}

function findSimilar(games, game) {
  return games
    .filter((item) => item.genre === game.genre && item.id !== game.id)
    .slice(0, SIMILAR_COUNT);
}

async function loadGames(signal) {
  await wait(350, signal);
  const response = await request('games.json', signal);
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  const games = await response.json();
  return [...loadCustomGames(), ...games];
}

const sorters = {
  'rating-desc': (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  'year-desc': (a, b) => b.releaseYear - a.releaseYear,
  'year-asc': (a, b) => a.releaseYear - b.releaseYear,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'title-asc': (a, b) => a.title.localeCompare(b.title),
};

export async function getGames(params, signal) {
  const { q = '', genre, platform, mode, price, sort, page = 1 } = params;
  const games = await loadGames(signal);
  const search = q.trim().toLowerCase();

  let result = games.filter((game) => {
    if (search && !`${game.title} ${game.developer}`.toLowerCase().includes(search)) return false;
    if (genre && game.genre !== genre) return false;
    if (platform && !game.platforms.includes(platform)) return false;
    if (mode && game.mode !== mode) return false;
    if (price === 'free' && game.price > 0) return false;
    if (price === 'paid' && game.price === 0) return false;
    return true;
  });

  if (sorters[sort]) result = [...result].sort(sorters[sort]);

  const pages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);

  return {
    items: result.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    total: result.length,
    page: current,
    pages,
  };
}

export async function getGame(id, signal) {
  const custom = loadCustomGames();
  const own = custom.find((item) => String(item.id) === id);
  if (own) {
    const games = await loadGames(signal);
    return { game: own, similar: findSimilar(games, own) };
  }

  await wait(350, signal);
  const response = await request(`games/${encodeURIComponent(id)}.json`, signal);
  if (response.status === 404 || (response.ok && !isJson(response))) throw notFoundError(id);
  if (!response.ok) throw new Error(`Server error: ${response.status}`);

  const { game, similar } = await response.json();
  const ownSimilar = custom.filter((item) => item.genre === game.genre);
  return { game, similar: [...ownSimilar, ...similar].slice(0, SIMILAR_COUNT) };
}

export async function getAllGames(signal) {
  return loadGames(signal);
}

export async function getGamesByIds(ids, signal) {
  const games = await loadGames(signal);
  return games.filter((game) => ids.includes(game.id));
}

export async function createGame(values) {
  const games = await loadGames();
  const title = values.title.trim();
  if (games.some((game) => game.title.toLowerCase() === title.toLowerCase())) {
    throw new Error('A game with this title already exists');
  }
  const game = {
    ...values,
    id: Math.max(...games.map((item) => item.id)) + 1,
    title,
    developer: values.developer.trim(),
    description: values.description.trim(),
    releaseYear: Number(values.releaseYear),
    rating: Number(values.rating),
    price: Number(values.price),
    ageRating: Number(values.ageRating),
    playtime: Number(values.playtime),
    image: '',
  };
  saveCustomGames([game, ...loadCustomGames()]);
  return game;
}
