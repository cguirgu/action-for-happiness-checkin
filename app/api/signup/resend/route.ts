import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getUserByEmail, upsertUser, createCheckinToken, deleteCheckinToken } from '@/lib/db';
import { sendCheckinEmail } from '@/lib/mail';
import { ResendSchema, fieldErrors } from '@/lib/validation';
import { checkRate, clientKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Issue a new check-in link. Used by the "your link rested" recovery screen.
 * Intentionally returns the same success shape whether or not the email is
 * already known — don't leak which addresses have accounts.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = ResendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check your email address.', fieldErrors: fieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const rate = checkRate(`resend:${clientKey(req)}`);
  if (!rate.allowed) {
    const minutes = Math.ceil(rate.retryAfterSeconds / 60);
    return NextResponse.json(
      { error: `You've asked a few times recently. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const { email } = parsed.data;
  const user = getUserByEmail(email) ?? upsertUser(email);
  const token = crypto.randomBytes(24).toString('hex');
  createCheckinToken(user.id, token, 48);

  try {
    await sendCheckinEmail(email, token, user.name);
  } catch (err) {
    console.error('Resend failed:', err);
    deleteCheckinToken(token);
    return NextResponse.json(
      { error: "We couldn't send that. Mind trying again in a moment?" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
