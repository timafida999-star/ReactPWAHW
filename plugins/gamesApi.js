import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = resolve('public/api/games.json');
const SIMILAR_COUNT = 4;

function readGames() {
  return JSON.parse(readFileSync(SOURCE, 'utf8'));
}

function toDetails(games, game) {
  const similar = games
    .filter((item) => item.genre === game.genre && item.id !== game.id)
    .slice(0, SIMILAR_COUNT);
  return { game, similar };
}

export function gamesApi() {
  return {
    name: 'games-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/\/api\/games\/([^/?]+)\.json(\?|$)/);
        if (!match) return next();
        const games = readGames();
        const game = games.find((item) => String(item.id) === match[1]);
        res.statusCode = game ? 200 : 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(game ? toDetails(games, game) : { error: 'Not found' }));
      });
    },
    generateBundle() {
      const games = readGames();
      for (const game of games) {
        this.emitFile({
          type: 'asset',
          fileName: `api/games/${game.id}.json`,
          source: JSON.stringify(toDetails(games, game)),
        });
      }
    },
  };
}
