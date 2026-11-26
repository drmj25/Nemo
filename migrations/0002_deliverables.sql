CREATE TABLE IF NOT EXISTS agent_deliverables (id INTEGER PRIMARY KEY AUTOINCREMENT, goal_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_deliverable_goal ON agent_deliverables(goal_id,id);
