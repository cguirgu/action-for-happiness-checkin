import { NextRequest, NextResponse } from 'next/server';
import db, { getCheckinByToken, getStreak, getUserCheckinHistory } from '@/lib/db';
import { CheckinSchema, fieldErrors } from '@/lib/validation';
import { affirmationFor } from '@/lib/affirmations';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = CheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'One of your answers is a little long.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const row = getCheckinByToken(token);
  if (!row) return NextResponse.json({ error: 'This link doesn’t look familiar.' }, { status: 404 });
  if (row.completed_at) {
    return NextResponse.json({ error: 'This check-in is already complete.' }, { status: 409 });
  }
  if (row.expires_at && new Date(row.expires_at + 'Z') < new Date()) {
    return NextResponse.json(
      { error: 'This link has taken a rest. Ask for a fresh one from the home page.' },
      { status: 410 }
    );
  }

  const { reflect, gratitude, intention } = parsed.data;

  db.prepare(
    `UPDATE checkins
     SET reflect = ?, gratitude = ?, intention = ?, completed_at = CURRENT_TIMESTAMP
     WHERE token = ?`
  ).run(reflect, gratitude, intention, token);

  // Gather data for the completion screen so the client doesn't need a second round-trip.
  const streak = getStreak(row.user_id);
  const history = getUserCheckinHistory(row.user_id, 3)
    .map((c) => (c.gratitude || '').trim())
    .filter((g) => g.length > 0);
  const affirmation = affirmationFor(intention, row.user_name);

  return NextResponse.json({
    ok: true,
    streak,
    recentGratitudes: history,
    affirmation,
    name: row.user_name,
  });
}
