# Reflection

## What I built

A single Next.js 15 (App Router) app backed by SQLite, with Nodemailer sending check-in emails through a local Mailpit container. Two services in `docker-compose.yml`: `app` + `mailpit`. One command (`docker compose up --build`) stands up the whole stack.

The check-in flow is four steps — **Breathe** (8-second inhale/exhale animation), **Reflect**, **Gratitude**, **Intention** — each revealed one at a time with a warm, quiet visual style meant to feel like a pause, not a form.

## Trade-offs

- **One app, not two services.** I deliberately avoided splitting frontend and backend. For a 90-minute scope, a Next.js app with API routes is both the fastest to build and the most faithful to how a real internal tool of this size would actually ship. Splitting would've cost me 20+ min on plumbing that adds no user value here.
- **SQLite instead of Postgres.** One fewer container, zero config, persists in a named Docker volume. Trade-off: no concurrent writers, no horizontal scaling. Fine for a single-instance side app; wrong for production. Swapping to Postgres is a one-file change to `lib/db.ts`.
- **Magic-link tokens, no real auth.** Each signup issues a 48-char random token that acts as the user's key to their check-in. Cheap, email-gated, and good enough to demo the flow. I did not add login, rate limiting, or CSRF — see Limitations.
- **Server Component + Client Component split for the check-in page.** The server component loads the token from SQLite and handles the "already completed" state (so that UX is instant and not flash-of-loading). The interactive flow is client-side. This keeps the bundle small and removes a round trip.
- **Synchronous email send in the signup handler.** With Mailpit on the same compose network, this is fine. In production I'd push it onto a queue (BullMQ/Resque) and return `202 Accepted` immediately, so a flaky SMTP can't block user signup.
- **Visual design over feature count.** Given the brief is literally about helping people feel better, a cold default-styled form felt wrong. I spent ~10 min on a warm palette, serif display type, and a breathing animation. I believe this is load-bearing for the product, not polish.

### What I'd do differently with more time

- Scheduled daily emails (cron/Inngest), not just on-signup. The brief says "daily" but the 90-min window forced me to pick; I chose making the signup + check-in flow solid.
- Persist and visualize a user's history — "you've been grateful for ___ 7 days running" is the whole point.
- Real auth (magic-link login by email) so users can revisit past entries.
- Tests: at minimum, a happy-path Playwright run from signup → Mailpit → open link → complete flow.
- Migrate from SQLite to Postgres, move SMTP to a real provider (Resend/Postmark), and move the emails to a queue.

## Limitations — what breaks first in production

- **No rate limiting on `/api/signup`.** Someone could hammer signups to send email from my SMTP to arbitrary addresses. First thing to add: per-IP + per-email rate limit, and only send mail to addresses that have confirmed.
- **Tokens don't expire.** A link sent today still works next year. Should be 24–48h TTL.
- **SQLite in a single container.** Surviving the container is fine (volume), but scaling out or zero-downtime deploys is not. Concurrent writes serialize.
- **Email send blocks the request.** If the SMTP server is slow or down, signup UX suffers. Queue it.
- **No input sanitization beyond length clamp.** Responses are only ever shown back to the same user who wrote them, so XSS risk is low — but if we ever display them anywhere else, I'd need to escape output.
- **No observability.** No structured logs, metrics, or error tracking. Would wire up Sentry and pino for a real deployment.
- **WAL mode + Docker volume** is generally fine on Linux bind mounts but can misbehave on certain network filesystems. Named volumes (what I use) are safe.

## AI usage

I used Claude (this assistant) to scaffold the project end-to-end. My approach:

- **Pre-planned the stack before the timer started.** I committed to Next.js + SQLite + Mailpit + Nodemailer in advance so I wouldn't burn minutes deliberating.
- **Claude wrote the bulk of the files** in one pass — `package.json`, Dockerfile, compose file, API routes, the check-in flow UI, the styling system — based on my explicit architectural decisions. I reviewed every file as it was written.
- **I directed, AI drafted, I verified.** Claude doesn't know what a great Daily Check-In *feels* like; I made the product calls (warm palette, breathing timer duration, one-thing-per-screen pacing, "without judgement" copy). Claude handled the plumbing.
- **What I had to fix/redo:**
  - A JSX apostrophe bug (`'Whenever you're ready.'` — the inner apostrophe broke the string literal). Caught on first `next build`.
  - The standalone build output initially didn't include `better-sqlite3` in `node_modules` the way I expected; I verified Next's tracer did include it, and kept explicit `COPY` lines in the Dockerfile as a belt-and-braces measure.
  - I also validated every HTTP route locally (`curl` against the dev server) to catch issues before trying the full Docker build, since the evaluator will judge `docker compose up` and I didn't want a surprise there.

Overall, AI let me focus 90% of my attention on product decisions (what the experience should feel like, what to cut, what to keep) instead of boilerplate. I treated it like a fast junior — capable, literal, and in need of clear direction.
