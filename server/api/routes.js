import express from 'express';
import { nanoid, customAlphabet } from 'nanoid';

const genCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

export function createApiRouter({ q, rooms, config }) {
  const router = express.Router();
  router.use(express.json());

  router.post('/games', (req, res) => {
    const roundsTotal = Number(req.body?.roundsTotal) || config.roundsTotal;
    const id = nanoid();
    const code = genCode();
    const hostToken = nanoid(24);
    q.insertGame.run(id, code, hostToken, roundsTotal, Date.now());
    res.json({ gameId: id, code, hostToken, roundsTotal });
  });

  router.get('/games/:id/dashboard', (req, res) => {
    const room = rooms.get(req.params.id);
    if (room) return res.json(room.getDashboardForApi());

    // Fallback: game not in memory (e.g. server restarted) - build from DB directly.
    const game = q.getGameById.get(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const rounds = q.getRoundsByGame.all(req.params.id);
    res.json({
      rounds: rounds.map((r) => ({
        roundNumber: r.round_number,
        jobTitle: r.job_title,
        humanResume: r.human_resume,
        aiResume: r.ai_resume,
        aiVerdictDecision: r.ai_verdict_decision,
        aiVerdictReasoning: r.ai_verdict_text
      }))
    });
  });

  return router;
}
