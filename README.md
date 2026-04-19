# Daily Check-In · Action for Happiness

An interactive Daily Check-In that guides a user through four calming steps — **breathe**, **reflect**, express **gratitude**, and set an **intention**.

Users sign up with their email, receive a link by email, and complete the check-in in a short, focused web flow.

## Quick start

```bash
docker compose up --build
```

Then:

- App: [http://localhost:3000](http://localhost:3000)
- Mailpit (email inbox): [http://localhost:8025](http://localhost:8025)

1. Enter any email on the home page and click **Send me my first check-in**.
2. Open Mailpit at [localhost:8025](http://localhost:8025), find the email, click **Begin your check-in**.
3. Walk through the four steps. Submit. Done.

## Stack

- **Next.js 15** (App Router, React Server Components, API Routes) + TypeScript
- **Tailwind CSS** for styling
- **SQLite** (`better-sqlite3`) for persistence — zero config, persisted in a Docker volume
- **Nodemailer** for email
- **Mailpit** for local SMTP + inbox UI
- **Docker Compose** ties it all together

## Project structure

```
app/
  page.tsx                    # Signup form
  api/signup/route.ts         # POST /api/signup — creates user + check-in token, sends email
  api/checkin/[token]/route.ts# POST — saves responses
  checkin/[token]/page.tsx    # Server component: looks up token, renders flow
  checkin/[token]/flow.tsx    # Client component: the 4-step experience
lib/
  db.ts                       # SQLite schema + connection
  mail.ts                     # Nodemailer transporter + email template
Dockerfile                    # Multi-stage build, Next standalone output
docker-compose.yml            # app + mailpit
```

## Running without Docker

```bash
npm install
# In another terminal: docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
npm run dev
```

## See also

- [REFLECTION.md](./REFLECTION.md) — trade-offs, limitations, and AI usage notes.
