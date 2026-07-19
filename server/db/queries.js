export function makeQueries(db) {
  return {
    insertGame: db.prepare(
      `INSERT INTO games (id, code, host_token, rounds_total, created_at) VALUES (?, ?, ?, ?, ?)`
    ),
    getGameByCode: db.prepare(`SELECT * FROM games WHERE code = ?`),
    getGameById: db.prepare(`SELECT * FROM games WHERE id = ?`),
    updateGameStatus: db.prepare(`UPDATE games SET status = ? WHERE id = ?`),
    updateGameRound: db.prepare(`UPDATE games SET current_round = ? WHERE id = ?`),

    insertPlayer: db.prepare(
      `INSERT INTO players (id, game_id, name, created_at) VALUES (?, ?, ?, ?)`
    ),
    getPlayersByGame: db.prepare(
      `SELECT * FROM players WHERE game_id = ? AND connected = 1`
    ),
    setPlayerConnected: db.prepare(
      `UPDATE players SET connected = ? WHERE id = ?`
    ),
    getPlayer: db.prepare(`SELECT * FROM players WHERE id = ?`),

    insertRound: db.prepare(
      `INSERT INTO rounds (id, game_id, round_number, job_seeker_id, job_title, job_description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'writing')`
    ),
    setHumanResume: db.prepare(
      `UPDATE rounds SET human_resume = ?, human_submitted_at = ? WHERE id = ?`
    ),
    setAiResumeAndVerdict: db.prepare(
      `UPDATE rounds SET ai_resume = ?, ai_verdict_text = ?, ai_verdict_decision = ? WHERE id = ?`
    ),
    setRoundStatus: db.prepare(`UPDATE rounds SET status = ? WHERE id = ?`),
    getRound: db.prepare(`SELECT * FROM rounds WHERE id = ?`),
    getRoundsByGame: db.prepare(
      `SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number ASC`
    ),

    insertAssignment: db.prepare(
      `INSERT INTO assignments (round_id, manager_id, group_shown) VALUES (?, ?, ?)`
    ),
    getAssignmentsByRound: db.prepare(
      `SELECT * FROM assignments WHERE round_id = ?`
    ),
    getAssignmentForManager: db.prepare(
      `SELECT * FROM assignments WHERE round_id = ? AND manager_id = ?`
    ),

    insertVote: db.prepare(
      `INSERT OR REPLACE INTO votes (round_id, manager_id, decision, voted_at) VALUES (?, ?, ?, ?)`
    ),
    getVotesByRound: db.prepare(`SELECT * FROM votes WHERE round_id = ?`)
  };
}
