/**
 * A small set of closing affirmations. Deterministic per-intention so the
 * same intention feels consistent on re-read, not random.
 *
 * One variant echoes the user's own words back in quotes; the rest are
 * universal, gentle, and deliberately *not* peppy.
 */

type Affirmation = (intention: string, name?: string | null) => string;

const AFFIRMATIONS: Affirmation[] = [
  (_intent, name) => (name ? `Carry that with you today, ${name}.` : 'Carry that with you today.'),
  (intent) => (intent ? `"${truncate(intent, 80)}" — a lovely intention.` : 'A lovely intention.'),
  () => 'Small steps. Kind ones. See you tomorrow.',
  (_intent, name) => (name ? `Thank you, ${name}. Be gentle with yourself today.` : 'Be gentle with yourself today.'),
  () => 'You showed up. That matters more than you might think.',
  () => 'Whatever today brings, you have already begun it well.',
];

function truncate(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trimEnd() + '…';
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function affirmationFor(intention: string, name?: string | null): string {
  const key = (intention || '').trim();
  // If we have no intention, skip the "echo" variant (index 1) to avoid an awkward empty-quote line.
  const pool = key.length === 0 ? AFFIRMATIONS.filter((_, i) => i !== 1) : AFFIRMATIONS;
  const picker = pool[hash(key || 'default') % pool.length];
  return picker(key, name);
}
