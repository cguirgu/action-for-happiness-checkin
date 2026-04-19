/**
 * Tiny in-memory sliding-window rate limiter.
 * Single-instance only — fine for our Docker setup; would need Redis if we scaled out.
 */

type Hit = number; // unix ms
const buckets = new Map<string, Hit[]>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = 5;

export function checkRate(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const hits = (buckets.get(key) || []).filter((t) => t > cutoff);

  if (hits.length >= LIMIT) {
    const oldest = hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    buckets.set(key, hits);
    return { allowed: false, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup to stop the map from growing forever.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      const fresh = v.filter((t) => t > cutoff);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Extract a client IP from request headers, falling back to "unknown".
 * Good enough for a local / single-host deploy behind a reverse proxy.
 */
export function clientKey(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
