# AI Pulse

A personal, free daily digest of AI news — focused on Anthropic, OpenAI, Google
(Gemini/DeepMind), xAI (Grok), and emerging players — plus a second beat on AI
being used to find security vulnerabilities (autonomous bug-hunting agents,
AI-found zero-days/CVEs, AI in CTFs/bug bounties). Built as a PWA so it can be
installed on your iPhone home screen with no App Store and no fees.

## How it works

1. A daily cron job (`/api/cron/daily-digest`) fetches the last 24h of items
   from official company blogs, AI news RSS feeds, security news outlets, and
   Hacker News.
2. Those items are sent to Claude (Haiku) to cluster, summarize, classify by
   category (general AI industry news vs. AI-driven security research) and
   company, and **fact-check**: stories from official blogs or corroborated by
   2+ sources are marked "Verified"; single-source/rumor stories are marked
   "Unverified" with an explanation.
3. The digest is stored in Upstash Redis (via the Vercel KV integration) and
   rendered as a card feed at `/`.
4. A web push notification is sent to subscribed devices when the digest is
   ready.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Without any env vars configured, `/` shows sample data so you can see the UI
immediately.

To test the full pipeline locally, set `ANTHROPIC_API_KEY` (and optionally the
KV vars) in `.env.local`, then hit the cron route directly:

```bash
curl http://localhost:3000/api/cron/daily-digest
```

## One-time setup (all free)

### 1. Anthropic API key
Get a key from the [Anthropic Console](https://console.anthropic.com/). This
is the only piece with a real (tiny) cost — summarizing one day of news with
Haiku is typically a few cents per day. Set `ANTHROPIC_API_KEY`.

### 2. Vercel + KV (Upstash Redis)
- Create a free [Vercel](https://vercel.com) account and import this repo.
- In the project's **Storage** tab, add the **Upstash Redis** integration
  (free tier). This sets `KV_REST_API_URL` / `KV_REST_API_TOKEN` automatically
  in your Vercel project — copy them into `.env.local` for local dev too.

### 3. Web push (VAPID keys)
Generate a keypair once:

```bash
npx web-push generate-vapid-keys
```

Set:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — the public key
- `VAPID_PRIVATE_KEY` — the private key
- `VAPID_CONTACT_EMAIL` — e.g. `mailto:you@example.com`

### 4. (Optional) Cron secret
Set `CRON_SECRET` to any random string. Vercel automatically sends it as a
Bearer token when triggering scheduled cron requests, which prevents random
visitors from triggering the digest job.

## Deploy

```bash
npx vercel deploy
```

Add the env vars above in the Vercel project settings (Production +
Preview), then redeploy. The cron schedule is defined in `vercel.json` (daily
at 08:00 UTC — edit the `schedule` field to change the time).

## Install on iPhone

1. Open the deployed URL in **Safari** on your iPhone.
2. Tap the Share icon → **Add to Home Screen**.
3. Open the app from the home screen and tap **Enable daily notifications**
   to subscribe to push alerts (requires iOS 16.4+).

## Project structure

- `app/page.tsx` — main card feed
- `app/api/cron/daily-digest/route.ts` — daily pipeline (fetch → summarize/fact-check → store → push)
- `app/api/push/subscribe/route.ts` — saves push subscriptions
- `lib/sources.ts` — RSS feed + news source configuration (incl. security feeds)
- `lib/fetchNews.ts` — fetches RSS feeds + Hacker News
- `lib/digest.ts` — Claude-based clustering, summarization, fact-checking
- `lib/kv.ts` — Redis storage for digests and push subscriptions
- `lib/push.ts` — sends web push notifications
- `components/` — card feed UI
- `public/sw.js` — service worker (handles push notifications)
