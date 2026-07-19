import { z } from 'zod';

export const schemas = {
  join_game: z.object({ code: z.string().min(1), name: z.string().min(1).max(30) }),
  rejoin_game: z.object({ code: z.string().min(1), playerId: z.string().min(1) }),
  host_connect: z.object({ gameId: z.string().min(1), hostToken: z.string().min(1) }),
  start_game: z.object({}),
  submit_resume: z.object({ text: z.string().max(2000) }),
  submit_vote: z.object({ decision: z.enum(['hire', 'automate']) })
};

export function parseMessage(type, payload) {
  const schema = schemas[type];
  if (!schema) return { ok: false, error: `Unknown message type: ${type}` };
  const result = schema.safeParse(payload ?? {});
  if (!result.success) return { ok: false, error: result.error.message };
  return { ok: true, data: result.data };
}
