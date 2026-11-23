# NEMO v6 — Autonomous Intelligence Engine (phase 1)

**Implementation:** A bounded, supervised planning engine. It stores cloud goals in Cloudflare D1 and checks queued goals on a 15-minute Cron Trigger. It calls the configured OpenAI model to prepare a JSON plan, records an event and waits for review. It does **not** send emails, modify files, execute tools, run continuous reasoning or self-modify. Approving a plan marks it approved only.

## Activate
1. In Cloudflare create a D1 database named `nemo-agent`. Record its database ID.
2. In `wrangler.jsonc` add `"d1_databases": [{"binding":"NEMO_DB","database_name":"nemo-agent","database_id":"YOUR_ACTUAL_D1_DATABASE_ID"}]`. Do not guess the ID.
3. Apply `migrations/0001_agent.sql` to that D1 database. From a locally configured Wrangler CLI: `npx wrangler d1 execute nemo-agent --remote --file=migrations/0001_agent.sql`.
4. Deploy the updated Worker, ensuring `agent.js`, `gmail.js` and `worker.js` are bundled and the existing secrets `OPENAI_API_KEY` and `NEMO_ACCESS_TOKEN` are configured. From the repository directory: `npx wrangler deploy`.
5. Confirm the Cron Trigger `*/15 * * * *` is active. Open NEMO v6, enter the existing private access token, create a cloud goal, then choose Refresh cloud goals after the next scheduled run. Or use Plan now.

## Operational limitations
- One-owner system: every holder of the shared NEMO access token can access all cloud goals. Do not share the token. Use proper per-user auth before offering NEMO to anyone else.
- Cron processes at most 3 queued goals per run. AI planning calls may fail; errored goals can be retried manually.
- Goal content is sent to OpenAI with `store:false` for planning. Do not include patient-identifiable, confidential workplace or other sensitive information.
- No Gmail integration into cloud planning yet. Gmail read-only integration from v5.1 remains separately configured.
- Cloudflare Worker and D1 are hosted services, not a private self-hosted cloud.
- No claim of general or superintelligence: this is a persistent task planning service, not a self-improving model.
