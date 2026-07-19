import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

import { initDb } from './db/init.js';
import { makeQueries } from './db/queries.js';
import { createApiRouter } from './api/routes.js';
import { createWsHandlers } from './ws/handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/game.sqlite';
const jobPoolPath = path.join(__dirname, '../data/jobDescriptions.json');
const jobPool = JSON.parse(fs.readFileSync(jobPoolPath, 'utf8'));

const config = {
  roundsTotal: Number(process.env.ROUNDS_TOTAL) || 5,
  writingSeconds: Number(process.env.WRITING_SECONDS) || 90,
  votingSeconds: Number(process.env.VOTING_SECONDS) || 20
};

const db = initDb(path.join(__dirname, '..', DB_PATH));
const q = makeQueries(db);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const { handleConnection, rooms } = createWsHandlers({ db, q, jobPool, config });
wss.on('connection', handleConnection);

app.use('/api', createApiRouter({ q, rooms, config }));

const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).end();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Client build not found. Run "npm run build" first, or use "npm run dev" for development.');
  });
}

server.listen(PORT, () => {
  console.log(`The Automation Test server listening on http://localhost:${PORT}`);
  console.log(`Mock AI mode: ${process.env.USE_MOCK_AI === 'true' || !process.env.GEMINI_API_KEY ? 'ON' : 'OFF'}`);
  console.log(`Rounds: ${config.roundsTotal} | Writing: ${config.writingSeconds}s | Voting: ${config.votingSeconds}s`);
});
