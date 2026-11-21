# NEMO Gmail Intelligence v5.1 — setup

This is a **read-only pilot**, not a background autonomous agent. It reads up to 20 recent inbox message headers and Gmail snippets, generates rule-based priority suggestions, and lets you prepare local tasks or an AI reply prompt. It **cannot send, delete, archive or modify Gmail**. AI reply prompts are not sent until you press Send. No Gmail data is automatically passed to OpenAI.

## Google Cloud
1. Create or select a Google Cloud project. Enable **Gmail API**.
2. Configure the Google Auth Platform OAuth consent screen. Choose an appropriate audience and add your own Google account as a test user if in Testing. The Gmail read-only scope is sensitive; Google may require verification for broader distribution. Testing-mode refresh tokens can expire after seven days.
3. Create an OAuth client of type **Web application**. Add this exact authorized redirect URI:
   `https://nemo-ai.jeff7867.workers.dev/gmail/callback`
4. Copy the Client ID and Client Secret. Do not commit them.

## Cloudflare
1. Create a KV namespace, e.g. `NEMO_GMAIL`. Bind it to the Worker as `GMAIL_KV` in Cloudflare settings (or set its namespace ID in wrangler.jsonc under kv_namespaces).
2. Add **encrypted Worker secrets** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GMAIL_ENCRYPTION_KEY`. The encryption key must be 32 random bytes represented by 64 hex characters. Generate locally with `openssl rand -hex 32`. Never paste it into NEMO or GitHub.
3. Retain the existing `OPENAI_API_KEY` and `NEMO_ACCESS_TOKEN` secrets.
4. **Deploy the updated Worker** (including both `worker.js` and `gmail.js`). A GitHub commit alone does not redeploy Cloudflare unless your CI is configured to do so.
5. Open NEMO, enter the private connection token in Connection & privacy settings, choose Connect Gmail, complete Google consent, then Scan inbox.

## Security and limitations
- Access and refresh tokens are encrypted at rest using AES-GCM and a secret held by Cloudflare; the OAuth state is single-use with a ten-minute expiry.
- The Worker uses a single shared Gmail connection per Worker deployment. **Do not share the NEMO access token or use this deployment for multiple users**. For multiple accounts/users, implement per-user authentication and per-user encrypted token storage.
- Gmail metadata and snippets are displayed in the browser. Avoid scanning sensitive or patient-identifiable information on shared devices. Do not paste sensitive clinical data into the AI reply prompt.
- Disconnect deletes stored tokens from the Worker but may not revoke Google's authorization; revoke access separately in Google Account security settings.
- The Worker and KV are third-party hosted infrastructure, not your own private home cloud.
- No background email scanning, AI classification, full-body analysis, draft creation in Gmail, or approval queue is implemented yet.
