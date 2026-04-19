import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let body: { reflect?: string; gratitude?: string; intention?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const row = db.prepare('SELECT id, completed_at FROM checkins WHERE token = ?').get(token) as
    | { id: number; completed_at: string | null }
    | undefined;

  if (!row) return NextResponse.json({ error: 'Check-in not found.' }, { status: 404 });
  if (row.completed_at) return NextResponse.json({ error: 'This check-in is already complete.' }, { status: 409 });

  const reflect = (body.reflect || '').slice(0, 2000);
  const gratitude = (body.gratitude || '').slice(0, 2000);
  const intention = (body.intention || '').slice(0, 2000);

  db.prepare(
    `UPDATE checkins
     SET reflect = ?, gratitude = ?, intention = ?, completed_at = CURRENT_TIMESTAMP
     WHERE token = ?`
  ).run(reflect, gratitude, intention, token);

  return NextResponse.json({ ok: true });
}
