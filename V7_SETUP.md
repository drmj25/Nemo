# NEMO v7 — activate completed deliverables
The v7 code is committed but requires a D1 migration and Worker deployment.

1. Open Cloudflare → Storage & databases → D1 → nemo-agent → Console.
2. Execute the SQL in `migrations/0002_deliverables.sql`:
```sql
CREATE TABLE IF NOT EXISTS agent_deliverables (id INTEGER PRIMARY KEY AUTOINCREMENT, goal_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_deliverable_goal ON agent_deliverables(goal_id,id);
```
3. Confirm your existing `NEMO_DB` binding is still attached to the `nemo-ai` Worker.
4. Check Workers & Pages → nemo-ai → Deployments. The latest deployment must contain `deliverables.js` and the updated `worker.js`; GitHub commits alone do not prove deployment.
5. Open NEMO, refresh to v7, find an approved goal and select Generate deliverable now, or allow the 15-minute scheduled job to generate it. Then select View completed draft.

**Limitations:** Approved plans trigger draft generation automatically (up to 2 per scheduled run), but no external actions occur. The draft is AI-generated without live research or citations. Never use sensitive clinical/patient data. Existing approved goals will be eligible after deployment. Do not treat an AI draft as verified advice. Review every deliverable.
