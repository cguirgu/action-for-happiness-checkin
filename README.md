# Daily Check-In · Action for Happiness

A thoughtful Daily Check-In: users sign up, receive a personalized email whose tone shifts with the time of day, and click through a calming four-step practice — **breathe**, **reflect**, **gratitude**, **intention** — then land on a personalized completion screen with a streak badge, a deterministic affirmation, and their most recent gratitude entries.

A background cron nudges inactive users with a fresh check-in link daily.

---

## ⚡ Run it — one command

**Prerequisite:** Docker Desktop (or any Docker engine with Compose v2) running on your machine.

```bash
git clone https://github.com/cguirgu/action-for-happiness-checkin.git
cd action-for-happiness-checkin
docker compose up --build
```

Then open two tabs:

| | URL |
|---|---|
| The app | [http://localhost:3000](http://localhost:3000) |
| Mailpit (caught emails) | [http://localhost:8025](http://localhost:8025) |

**Walk through the whole thing in under a minute:**

1. At [localhost:3000](http://localhost:3000) — enter any name and email → **Send me my first check-in**.
2. Switch to [localhost:8025](http://localhost:8025) — the email is waiting. Click **Begin your check-in**.
3. Breathe (4-7-8 rhythm, or skip), reflect, give thanks, set an intention → **Complete check-in**.
4. See your streak + affirmation.

Emails never leave your machine — Mailpit catches everything.

### Stopping

```bash
docker compose down           # stop containers, keep data
docker compose down -v        # stop and wipe the SQLite volume
```

---

## What makes this one different

- **Time-of-day-aware email + visual gradient.** Morning, afternoon, and evening get different subject lines, intros, and a subtly shifted background palette.
- **4-7-8 breathing** with a synced phase label (breathe in / hold / breathe out) and cycle counter. Users can skip any time.
- **`prefers-reduced-motion` respected** — not a disabled animation, a *different* experience: a calm numbered list of the 4-7-8 pattern.
- **Streak + last-3 gratitudes** on the completion screen. Shown once, at the end; never gamified.
- **Deterministic affirmations**: same intention → same closing words. One variant quotes the user back to themselves.
- **Amber, not red, errors.** This product never feels like it's yelling at someone.
- **Graceful expired-link recovery.** "This link has taken a rest." One click, fresh link.
- **Two-tab safety.** Submitting in tab B after tab A completes shows a gentle "already saved" screen, not a 409.
- **Personalization, used sparingly.** Name appears in the email greeting, the first prompt, and on the completion screen. Nowhere else.
- **Daily reminder cron** runs hourly in production; looks for users >24h since their last check-in and with no open link, sends them a fresh nudge.

---

## Stack

- **Next.js 15** (App Router, Server Components, API Routes) + TypeScript
- **Tailwind CSS** + `next/font` (Fraunces serif + Inter sans)
- **SQLite** (`better-sqlite3`) with WAL, persisted in a named Docker volume. Migrations are idempotent (`PRAGMA table_info` guards, safe to re-run).
- **Nodemailer** → **Mailpit** for local SMTP + inbox UI
- **Zod** for API validation with field-level errors
- **node-cron** for the hourly daily-nudge sweep
- In-memory **sliding-window rate limiter** (5 per IP per hour) on both signup endpoints

---

## Project structure

```
app/
  page.tsx                          # Signup form
  api/signup/route.ts               # validates, rate-limits, creates token, sends email, rolls back on SMTP fail
  api/signup/resend/route.ts        # one-click recovery for expired / lost links
  api/checkin/[token]/route.ts      # validates, saves, returns streak + affirmation + gratitude history
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
instrumentation.ts                  # Hourly cron for daily nudges (production-enabled by default)
Dockerfile                          # Multi-stage, standalone Next output
docker-compose.yml                  # app + mailpit with healthcheck
```

---

## Running without Docker (optional, for hacking)

```bash
npm install
brew install mailpit && mailpit    # or: docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
npm run dev                         # http://localhost:3000
```

Enable the daily cron locally:

```bash
ENABLE_DAILY_CRON=true npm run dev
```

---

## Things to test (if you want to verify every path)

| Path | How |
|---|---|
| Happy path | Sign up → check Mailpit → click link → complete |
| Validation | Submit empty form, bad email; check field-level amber messages |
| Rate limit | Sign up 6 times rapidly from the same origin; 6th shows friendly retry timer |
| Expired link | `docker compose exec app sqlite3 /app/data/checkin.sqlite "UPDATE checkins SET expires_at = datetime('now','-1 hour');"` then reopen link |
| Already-completed | Complete once, reopen link — gentle "you've already checked in" |
| Two-tab race | Open link in two tabs, complete in A, try to complete in B |
| Reduced motion | macOS System Settings → Accessibility → Reduce Motion → on, reload breathing screen |
| Cron | Watch `docker compose logs app` — `[cron] daily check-in sweep scheduled (hourly)` on startup |

---

## See also

- [REFLECTION.md](./REFLECTION.md) — trade-offs, limitations, AI usage.
