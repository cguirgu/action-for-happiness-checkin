# Daily Check-In · Action for Happiness

A thoughtful Daily Check-In web experience. Users sign up, receive a personalized email whose tone shifts with the time of day, and click through a calming four-step practice:

1. **Breathe** — a 4-7-8 breathing exercise (inhale 4, hold 7, exhale 8) with a live phase indicator and a skip option. Users with `prefers-reduced-motion` get a still, numbered variant.
2. **Reflect** — how are you feeling, right now?
3. **Gratitude** — one thing you're grateful for today.
4. **Intention** — one positive thing you'd like to do today.

On completion, they see a personalized affirmation (which may quote their own intention back), a streak badge, and their last few gratitude entries.

A background cron nudges inactive users with a fresh check-in link daily.

## Quick start

```bash
docker compose up --build
```

Then:

- App: [http://localhost:3000](http://localhost:3000)
- Mailpit (email inbox): [http://localhost:8025](http://localhost:8025)

1. Enter a name (optional) and email on the home page.
2. Open Mailpit at [localhost:8025](http://localhost:8025), find the email, click **Begin your check-in**.
3. Walk through the four steps. Submit. You'll see your affirmation + streak.

## Stack

- **Next.js 15** (App Router, Server Components, API Routes) + TypeScript
- **Tailwind CSS** + `next/font` (Fraunces serif + Inter sans)
- **SQLite** (`better-sqlite3`) with WAL, persisted in a Docker volume. Migrations are idempotent (`PRAGMA table_info` guards).
- **Nodemailer** + **Mailpit** for local SMTP
- **Zod** for API validation with field-level errors
- **node-cron** for the hourly daily-nudge sweep (behind `ENABLE_DAILY_CRON` flag in dev)
- **In-memory rate limiter** on `/api/signup` and `/api/signup/resend` (5 per IP per hour)
- **Docker Compose** ties it all together

## Project structure

```
app/
  page.tsx                          # Signup form (name + email, personalized success)
  api/signup/route.ts               # POST — validates, rate-limits, creates token, sends email, rolls back on SMTP fail
  api/signup/resend/route.ts        # POST — one-click recovery for expired / lost links
  api/checkin/[token]/route.ts      # POST — validates, saves, returns streak + affirmation + gratitude history
  checkin/[token]/page.tsx          # Server component: branches to flow / completed / expired / 404
  checkin/[token]/flow.tsx          # Client: 4-7-8 breathing + 3 prompts + completion screen
  checkin/[token]/expired.tsx       # Recovery UI for rested links
  layout.tsx                        # Fonts, time-of-day data attribute
  globals.css                       # Warm palette, motion vocabulary, reduced-motion fallbacks
lib/
  db.ts                             # Schema, idempotent migrations, query helpers (streak, history, due)
  mail.ts                           # Transporter + time-of-day greeting + subject
  validation.ts                     # Zod schemas
  rate-limit.ts                     # In-memory sliding-window limiter
  affirmations.ts                   # Six hand-written closings, deterministic selection
instrumentation.ts                  # Hourly cron for daily nudges (production / opt-in)
Dockerfile                          # Multi-stage, standalone Next output
docker-compose.yml                  # app + mailpit
```

## Thoughtful touches

- **Time-of-day-aware email + visual gradient.** Morning, afternoon, and evening get different subject lines, intros, and a subtly shifted background palette.
- **4-7-8 breathing** with a synced phase label and cycle counter. Users can skip any time.
- **Reduced-motion variant** — not a disabled animation, a *different* experience: a calm numbered list.
- **Streak + last-3 gratitudes** on the completion screen. Shown once, at the end, not gamified.
- **Deterministic affirmations**: same intention → same closing words. One variant quotes the user.
- **Amber, not red, errors.** Never alarming.
- **Graceful expired-link recovery.** The link "has taken a rest" — one click for a new one.
- **Two-tab safety.** Submitting in tab B after tab A has completed doesn't error — it shows a gentle "already saved" screen.
- **SMTP failure rolls back the token row** so we never leave orphans.

## Running without Docker

```bash
npm install
brew install mailpit && mailpit           # or: docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
npm run dev                                # http://localhost:3000
```

To enable the daily cron locally:

```bash
ENABLE_DAILY_CRON=true npm run dev
```

## See also

- [REFLECTION.md](./REFLECTION.md) — trade-offs, limitations, AI usage.
