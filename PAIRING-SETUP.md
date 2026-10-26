# KHALAF TV — Phone-to-TV Pairing (Ably)

## Features
- TV pairing dialog with an 8-digit code and QR code linking to `/remote?code=...`.
- Phone remote page at `/remote` with channel selection, play/pause, volume, mute, next/previous channel, and fullscreen commands.
- Ably Realtime messages are restricted to a single, unguessable channel per pairing session.
- The server issues short-lived Ably token requests only after validating the TV or phone's per-session secret.
- Pairing codes expire after 10 minutes. Native video controls are remotely controllable; third-party iframe players may not expose controls to the app.

## Environment variables
Set these in Vercel Project → Settings → Environment Variables (and in `.env.local` for local development):

- `ABLY_API_KEY` — **required**. A private Ably API key with token-issuing permission. Keep it server-side; never use `NEXT_PUBLIC_ABLY_API_KEY`.
- `DATABASE_URL` — **required**. Neon/Postgres connection string used to store pairing sessions across serverless instances. It is also used by the existing optional favorites feature.
- `NEXT_PUBLIC_APP_URL` — optional and not currently required by the implementation. QR URLs use the current site's origin.

## Setup steps
1. Create an Ably app and copy its API key from the Ably dashboard.
2. Create a Neon Postgres database and copy its connection string.
3. Run the complete `db/schema.sql` file against that database. It creates the existing favorites table and the new `pairing_sessions` table.
4. Add `ABLY_API_KEY` and `DATABASE_URL` to Vercel for the environments you deploy to.
5. Install dependencies (`npm install`) and deploy/redeploy the project.
6. On the TV, open KHALAF TV and click **Phone remote**. Scan the QR code or open `/remote` on the phone and enter the code.

## Local development
Copy `.env.example` to `.env.local`, fill in the two required values, run `npm install`, then `npm run dev`.

## Security notes
- The Ably API key must never be sent to a browser. Only a short-lived TokenRequest scoped to the unique pairing channel is returned to clients.
- The QR code contains the temporary pairing code; treat it like a one-time credential.
- Pairing sessions expire after ten minutes and old/expired rows are pruned when a new session is created.
- Use HTTPS in production. For stricter abuse protection on public deployments, add rate limiting to the join endpoint at the edge/WAF.


## Build compatibility note

The Ably dependency is pinned to `2.9.0` rather than using a floating `^2.10.0` range to avoid the reported Next.js 15 SWC parsing failure in the newer bundled SDK. After extracting this ZIP, run `npm install` to regenerate `package-lock.json`, then run `npm run build`. If the same parser error persists, share the complete build log before changing permissions or exposing the API key.
