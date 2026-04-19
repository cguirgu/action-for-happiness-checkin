import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'localhost';
const port = Number(process.env.SMTP_PORT || 1025);
const from = process.env.MAIL_FROM || 'Action for Happiness <hello@actionforhappiness.local>';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  ignoreTLS: true,
});

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export function greeting(date = new Date()): string {
  return { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' }[timeOfDay(date)];
}

/** Minimal HTML escape for user-supplied name / intention fragments in emails. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function subjectFor(tod: TimeOfDay): string {
  return {
    morning: 'Your morning check-in 🌅',
    afternoon: 'A quiet pause for this afternoon 🌿',
    evening: 'An evening check-in 🌙',
  }[tod];
}

function introFor(tod: TimeOfDay): string {
  return {
    morning: 'A small, quiet moment to begin the day — breathe, reflect, feel grateful, and set a positive intention.',
    afternoon: 'A gentle pause in the middle of the day — breathe, notice how you are, and choose one kind thing to carry forward.',
    evening: 'A soft close to your day — breathe, reflect, and set an intention for tomorrow.',
  }[tod];
}

export async function sendCheckinEmail(email: string, token: string, name?: string | null) {
  const tod = timeOfDay();
  const hello = name ? `${greeting()}, ${esc(name)}` : greeting();
  const link = `${appUrl}/checkin/${token}`;
  const intro = introFor(tod);

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #fdf8f3; color: #3b2112;">
      <h1 style="font-size: 22px; margin: 0 0 12px; font-weight: 500;">${hello} 🌿</h1>
      <p style="line-height: 1.7; margin: 0 0 8px;">${intro}</p>
      <p style="line-height: 1.7; margin: 0 0 24px; color: #8a5028;">It takes about two minutes.</p>
      <p style="margin: 28px 0;">
        <a href="${link}" style="background: #d48c52; color: white; padding: 14px 28px; border-radius: 999px; text-decoration: none; display: inline-block; font-weight: 500;">Begin your check-in</a>
      </p>
      <p style="font-size: 13px; color: #8a5028; line-height: 1.6;">This link stays private to you. It will rest after 48 hours — just ask for a fresh one if you need it.</p>
      <hr style="border: none; border-top: 1px solid #f0d4ae; margin: 28px 0;" />
      <p style="font-size: 12px; color: #8a5028; margin: 0;">With gratitude,<br/>Action for Happiness</p>
    </div>
  `;
  const text = `${hello}\n\n${intro}\n\nBegin your check-in: ${link}\n\nWith gratitude,\nAction for Happiness`;

  return transporter.sendMail({
    from,
    to: email,
    subject: subjectFor(tod),
    html,
    text,
  });
}
