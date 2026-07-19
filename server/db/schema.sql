CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  host_token TEXT,
  status TEXT DEFAULT 'lobby',
  rounds_total INTEGER DEFAULT 5,
  current_round INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(id),
  name TEXT,
  connected INTEGER DEFAULT 1,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(id),
  round_number INTEGER,
  job_seeker_id TEXT REFERENCES players(id),
  job_title TEXT,
  job_description TEXT,
  human_resume TEXT,
  ai_resume TEXT,
  ai_verdict_text TEXT,
  ai_verdict_decision TEXT,
  human_submitted_at INTEGER,
  status TEXT DEFAULT 'writing'
);

CREATE TABLE IF NOT EXISTS assignments (
  round_id TEXT REFERENCES rounds(id),
  manager_id TEXT REFERENCES players(id),
  group_shown TEXT,
  PRIMARY KEY (round_id, manager_id)
);

CREATE TABLE IF NOT EXISTS votes (
  round_id TEXT REFERENCES rounds(id),
  manager_id TEXT REFERENCES players(id),
  decision TEXT,
  voted_at INTEGER,
  PRIMARY KEY (round_id, manager_id)
);
