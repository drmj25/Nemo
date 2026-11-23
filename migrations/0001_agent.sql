CREATE TABLE IF NOT EXISTS agent_goals (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, context TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'queued', result TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_run TEXT, next_run TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_due ON agent_goals(status,next_run);
CREATE TABLE IF NOT EXISTS agent_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, goal_id TEXT NOT NULL,
 event TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_events ON agent_events(goal_id,id);
