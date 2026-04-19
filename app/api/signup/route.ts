import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import db from '@/lib/db';
import { sendCheckinEmail } from '@/lib/mail';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (email) VALUES (?)');
  insertUser.run(email);
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email) as { id: number; email: string };

  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO checkins (token, user_id) VALUES (?, ?)').run(token, user.id);

  try {
    await sendCheckinEmail(email, token);
  } catch (err) {
    console.error('Email send failed:', err);
    return NextResponse.json({ error: 'Could not send email. Is SMTP running?' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
