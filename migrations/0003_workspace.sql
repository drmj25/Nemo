CREATE TABLE IF NOT EXISTS nemo_memories (
 id TEXT PRIMARY KEY,
 content TEXT NOT NULL,
 category TEXT NOT NULL DEFAULT 'note',
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nemo_memories_created ON nemo_memories(created_at DESC);
