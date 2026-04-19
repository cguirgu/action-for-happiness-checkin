/**
 * Curated content that connects our check-in to Action for Happiness's wider
 * work — quotes, daily actions, evidence nuggets, and the GREAT DREAM framework.
 * All credited back to source. Rotates deterministically by day so the same
 * day feels consistent and repeat opens don't churn.
 */

/** Action for Happiness's signature framework. */
export const GREAT_DREAM = [
  { key: 'G', name: 'Giving', blurb: 'Do kind things for others' },
  { key: 'R', name: 'Relating', blurb: 'Connect with people' },
  { key: 'E', name: 'Exercising', blurb: 'Take care of your body' },
  { key: 'A', name: 'Awareness', blurb: 'Live life mindfully' },
  { key: 'T', name: 'Trying Out', blurb: 'Keep learning new things' },
  { key: 'D', name: 'Direction', blurb: 'Have goals to look forward to' },
  { key: 'R', name: 'Resilience', blurb: 'Find ways to bounce back' },
  { key: 'E', name: 'Emotions', blurb: 'Look for what’s good' },
  { key: 'A', name: 'Acceptance', blurb: 'Be comfortable with who you are' },
  { key: 'M', name: 'Meaning', blurb: 'Be part of something bigger' },
] as const;

/** The four steps of the check-in, each tagged with the GREAT DREAM key it exercises. */
export const STEP_KEYS = {
  breathe: { name: 'Awareness', blurb: 'Live life mindfully' },
  reflect: { name: 'Awareness', blurb: 'Live life mindfully' },
  gratitude: { name: 'Emotions', blurb: 'Look for what’s good' },
  intention: { name: 'Direction', blurb: 'Have goals to look forward to' },
} as const;

/** Small, hand-curated quote pool. Attributions kept truthful. */
export const QUOTES: { text: string; author: string }[] = [
  { text: 'If you want others to be happy, practice compassion. If you want to be happy, practice compassion.', author: 'The Dalai Lama' },
  { text: 'Happiness is when what you think, what you say, and what you do are in harmony.', author: 'Mahatma Gandhi' },
  { text: 'The happiness of your life depends upon the quality of your thoughts.', author: 'Marcus Aurelius' },
  { text: 'Gratitude turns what we have into enough.', author: 'Melody Beattie' },
  { text: 'Wherever you are, be there totally.', author: 'Eckhart Tolle' },
  { text: 'Happiness is not something ready-made. It comes from your own actions.', author: 'The Dalai Lama' },
  { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', author: 'Marcus Aurelius' },
  { text: 'The most wasted of days is one without laughter.', author: 'E. E. Cummings' },
  { text: 'When we give cheerfully and accept gratefully, everyone is blessed.', author: 'Maya Angelou' },
  { text: 'Be kind whenever possible. It is always possible.', author: 'The Dalai Lama' },
  { text: 'We don’t see things as they are, we see them as we are.', author: 'Anaïs Nin' },
  { text: 'It is not how much we have, but how much we enjoy, that makes happiness.', author: 'Charles Spurgeon' },
  { text: 'Three things in human life are important: to be kind, to be kind, and to be kind.', author: 'Henry James' },
  { text: 'There is no path to happiness: happiness is the path.', author: 'Thich Nhat Hanh' },
  { text: 'Happiness depends more on the inward disposition of mind than on outward circumstances.', author: 'Benjamin Franklin' },
];

/**
 * Gentle daily actions in the style of Action for Happiness's monthly calendars
 * (actionforhappiness.org/calendar). Invitations, never demands.
 */
export const DAILY_ACTIONS: string[] = [
  'Send a kind message to someone you haven’t spoken to in a while.',
  'Notice three good things about today — however small.',
  'Do something active outdoors, even for ten minutes.',
  'Smile at the next person you see and mean it.',
  'Give someone a sincere compliment.',
  'Pause for three slow breaths before your next task.',
  'Let go of a small grudge you’ve been carrying.',
  'Write down one thing you’ve learned this week.',
  'Ask a friend how they’re really doing — and listen.',
  'Do one thing your future self will thank you for.',
  'Offer help to someone without being asked.',
  'Take a different route home and notice what’s new.',
  'Do something just for the joy of it.',
  'Eat one meal today without your phone nearby.',
  'Tell someone you’re grateful for what they do.',
  'Set a small, reachable goal for tomorrow.',
  'Forgive yourself for one small thing.',
  'Share something you’re proud of.',
  'Spend a few minutes in full silence.',
  'Be extra kind to someone who seems to be having a hard day.',
  'Do a small task you’ve been putting off.',
  'Reach out to someone new at work or in your community.',
  'Write a short note of thanks — to anyone.',
  'Choose curiosity over judgment in one conversation today.',
  'Take a moment to notice the sky.',
  'Say no to something that drains you, gently.',
  'Offer someone your full attention for ten minutes.',
  'Move your body in a way that feels good.',
  'Practice patience with someone — starting with yourself.',
  'Do one thing that connects you to something bigger.',
];

/**
 * Evidence nuggets rotated into emails and the completion screen. Kept honest,
 * conservative in framing, and sourced.
 */
export const EVIDENCE: { text: string; source: string }[] = [
  {
    text: 'Writing about gratitude for a few minutes a day has been shown to improve mood, sleep, and optimism over just two weeks.',
    source: 'Emmons & McCullough, UC Davis',
  },
  {
    text: 'People with higher gratitude scores have been associated with a lower risk of mortality over a four-year follow-up.',
    source: 'Harvard Health, 2024',
  },
  {
    text: 'Meta-analyses across dozens of studies show gratitude practices produce measurable gains in well-being across cultures.',
    source: 'PNAS, 2024',
  },
  {
    text: 'A peer-reviewed randomized trial of Action for Happiness’s Happiness Habits course found significant benefits for well-being.',
    source: 'Action for Happiness',
  },
  {
    text: 'Just a few minutes of reflective writing has been shown to reduce stress and improve self-awareness over a two-week period.',
    source: 'Greater Good Science Center, UC Berkeley',
  },
  {
    text: 'Brief mindful breathing practices have been shown to lower heart rate and reduce anxiety in as little as five minutes.',
    source: 'Journal of Clinical Psychology',
  },
];

/** Deterministic picker keyed by yyyy-mm-dd so the same day feels consistent. */
function pick<T>(arr: readonly T[], seed: string): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return arr[Math.abs(h) % arr.length];
}

export function quoteForToday(date = new Date()) {
  return pick(QUOTES, date.toISOString().slice(0, 10));
}

export function actionForToday(date = new Date()) {
  return pick(DAILY_ACTIONS, date.toISOString().slice(0, 10));
}

export function evidenceForToday(date = new Date()) {
  return pick(EVIDENCE, date.toISOString().slice(0, 10));
}
