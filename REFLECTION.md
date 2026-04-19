# Reflection

## What I built

A single Next.js 15 (App Router) app backed by SQLite, with Nodemailer delivering emails through a local Mailpit container. `docker compose up --build` brings up two services — `app` + `mailpit` — and the whole thing is ready on `:3000` with the inbox on `:8025`.

The user journey:

1. **Sign up** at `/` with an email and optional first name.
2. **Receive an email** whose subject, greeting, and intro shift with the time of day ("Your morning check-in" / "A quiet pause for this afternoon" / "An evening check-in").
3. **Click the link** → 48-hour token opens a four-step flow: a **4-7-8 breathing** exercise with a live phase indicator, then **reflect**, **gratitude**, and **intention** prompts (each with a Back button, autofocus, and graceful error states).
4. **Submit** → a personalized completion screen: their name, a deterministic affirmation (that may quote their own intention back to them), a streak badge ("Your first check-in" or "N days in a row"), and their three most recent gratitude entries.
5. **Next day**: an hourly cron (opt-in via `ENABLE_DAILY_CRON=true` or on in production) looks for users who haven't checked in for >24h and have no open link, and sends them a fresh one. That's what makes this "Daily" and not just "a form".

## Trade-offs

- **One app, not a split frontend + backend.** For a 90-min scope, Next.js's unified API routes + SSR model was the fastest route to a coherent product. Splitting would have bought nothing.
- **SQLite + a volume.** Zero-config, atomic, journals cleanly, persists across `docker compose down`. Wrong for scale-out; right for this. A migration to Postgres is localized to `lib/db.ts`.
- **Tokens, not login.** The email is the authentication channel. Each signup mints a 48-hour token; the URL is the key. Expired tokens hit a recovery screen that offers a one-click resend, not a cold 404.
- **In-memory rate limiter.** 5 signups per IP per hour. Good against casual abuse; needs Redis if this ever runs on more than one node.
- **In-process hourly cron.** Reliable, idempotent, guarded behind an `ENABLE_DAILY_CRON` flag in dev so it doesn't spam your inbox while you're coding. A dedicated worker container or a platform cron (Inngest, Upstash) would be the next step.
- **Deterministic affirmations, not an LLM.** Six handwritten closings, chosen by a hash of the user's intention so the same intention feels consistent on re-read. LLM generation is too slow, too unpredictable, and too expensive for a mental-health ritual.
- **Name personalization, used sparingly.** Once in the email greeting, once at the top of the first prompt ("How are you, Christina?"), once on the completion screen. Nowhere else — personalization that's *everywhere* reads as creepy, not warm.
- **Reduced-motion users get a different breathing screen**, not a disabled one. Instead of the scaling circle, they see a tidy numbered list of the 4-7-8 pattern with the same tone of voice. The experience adapts; it doesn't degrade.
- **Every error is amber, never red.** This product should never feel like it's yelling at someone. The palette enforces that — validation errors and failed requests all use warm amber with an icon-less tone.

### What I'd do with more time

- **Real scheduled daily emails per user** (not just "has it been 24h"). Ask for a preferred time during signup, store timezone, and fire locally. Moves cron logic to a proper queue.
- **History view.** `GET /checkin/history` with a gentle visualization of streaks, gratitudes over time. Strong emotional payoff for regular users.
- **Magic-link login.** So users can revisit prior check-ins.
- **Auto-save drafts** on blur (scaffolded in the plan; cut for time). Would protect long reflections from refreshes.
- **Playwright smoke test**: signup → Mailpit API → extract token → complete → assert completion state. Wired into CI.
- **Copy review with someone from the charity.** Every word in a mental-health product earns its place; the current copy is my best judgement, but their voice should lead.

## Limitations — what breaks first in production

- **No authentication beyond email-delivered tokens.** Someone with a stolen link can submit on the user's behalf. For a journaling tool, the blast radius is low; for anything sensitive, this isn't enough.
- **Tokens live for 48h but aren't single-use-on-view.** You can open the link, start, refresh, continue — which is a feature. But a shared link could be submitted by someone else within the window.
- **SQLite ties us to one instance.** Scale-out would require Postgres.
- **The cron is at-most-once-per-hour.** If you want 9:00 AM sharp daily emails in the user's timezone, this won't deliver. Fine for a nudge, wrong for a scheduled product.
- **No observability.** I'd add structured logging (pino), metrics, and Sentry before putting this in front of users.
- **Email deliverability is a whole discipline I didn't touch.** SPF/DKIM/DMARC, reputation management, bounce handling, unsubscribe links. Mailpit is fine for the exercise; a real deployment needs a transactional sender (Postmark, Resend).
- **`MAX_MESSAGES` on Mailpit is set to 500** — enough for the exercise, but a real test environment would rotate.

## AI usage — honest account

I used Claude to build this with me, and treated it as a fast, literal junior engineer that I directed at every decision point.

**How it went well:**
- **Pre-planning before code.** Before starting the timer, I locked in the stack (Next.js + SQLite + Mailpit + Nodemailer). That saved me from arguing with the AI mid-build about Prisma vs raw SQL, or Postgres vs SQLite.
- **Claude drafted the boilerplate** (Dockerfile, compose, API routes, forms, schemas) very quickly and with care. I reviewed each file on first write.
- **Product decisions were mine.** Claude doesn't know what a Daily Check-In *should feel like*. I made the calls — 4-7-8 breathing instead of generic "inhale/exhale", warm palette over default Tailwind, streak shown once rather than as a dashboard, amber errors instead of red, personalized affirmations chosen deterministically rather than from an LLM.
- **I verified everything before shipping.** `npm run build` after every major chunk. `curl` against the running dev server for each API route. Checked Mailpit's HTTP API to confirm real tokens were landing in real emails. Caught a dev-cache bug in the SQLite migrations that would have shipped broken otherwise.

**What I had to fix / redo:**
- An apostrophe inside a JSX string broke compilation (`'Whenever you're ready.'`). Caught on first build, trivial fix.
- A stale `.next` cache after adding DB migrations caused `duplicate column` on build. Clean rebuild fixed it; I then added an idempotent `PRAGMA table_info` guard so future runs on an existing volume are safe.
- Tightened the AI's first-pass copy — "Please enter a valid email." became "That doesn't look like a valid email.", "Error" banners became inline amber notes.
- The streak query is mine, not Claude's first draft — the AI's first attempt counted all completions rather than consecutive calendar days.

**Meta.** AI let me spend more of the 90 minutes on *what the product should feel like* and less on boilerplate. That's the trade I want.
