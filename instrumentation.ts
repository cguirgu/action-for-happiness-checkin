/**
 * Next 15 instrumentation hook — runs once when the server boots.
 * We use it to start an hourly cron that nudges inactive users with a fresh
 * check-in link. Module-scoped `started` flag makes the hook idempotent
 * (HMR, multiple worker attaches, etc).
 */

let started = false;

export async function register() {
  if (started) return;
  // Only in Node runtime, not edge.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // Don't spam during local dev unless explicitly opted in.
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DAILY_CRON !== 'true') return;

  started = true;

  const cron = (await import('node-cron')).default;
  const crypto = await import('node:crypto');
  const { getUsersDueForReminder, createCheckinToken, deleteCheckinToken } = await import('./lib/db');
  const { sendCheckinEmail } = await import('./lib/mail');

  // Hourly sweep — catches misses across short downtimes.
  cron.schedule('0 * * * *', async () => {
    try {
      const users = getUsersDueForReminder();
      for (const user of users) {
        const token = crypto.randomBytes(24).toString('hex');
        createCheckinToken(user.id, token, 48);
        try {
          await sendCheckinEmail(user.email, token, user.name);
        } catch (err) {
          console.error('[cron] send failed for', user.email, err);
          deleteCheckinToken(token);
        }
      }
      if (users.length > 0) {
        console.log(`[cron] sent ${users.length} daily check-in${users.length === 1 ? '' : 's'}`);
      }
    } catch (err) {
      console.error('[cron] sweep failed:', err);
    }
  });

  console.log('[cron] daily check-in sweep scheduled (hourly)');
}
