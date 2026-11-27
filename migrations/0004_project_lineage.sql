-- NEMO v10: parent-child project relationships and duplicate detection.
CREATE TABLE IF NOT EXISTS nemo_project_links (
 child_id TEXT PRIMARY KEY,
 parent_id TEXT NOT NULL,
 instruction TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nemo_project_parent ON nemo_project_links(parent_id,created_at);
