import nodemailer from 'nodemailer';
import { quoteForToday, actionForToday, evidenceForToday } from './content';

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
    morning: 'Your morning check-in',
    afternoon: 'A quiet pause for this afternoon',
    evening: 'Your evening check-in',
  }[tod];
}

function introFor(tod: TimeOfDay): string {
  return {
    morning: 'A small, quiet moment to begin the day — breathe, reflect, feel grateful, and set a positive intention.',
    afternoon: 'A gentle pause in the middle of the day — breathe, notice how you are, and choose one kind thing to carry forward.',
    evening: 'A soft close to your day — breathe, reflect, and set an intention for tomorrow.',
  }[tod];
}

/** Minimal inline-SVG icons for the email header (emoji-free, email-client safe). */
function headerIcon(tod: TimeOfDay): string {
  const stroke = '#8a5028';
  const base = `width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`;
  if (tod === 'morning') {
    // Sunrise
    return `<svg xmlns="http://www.w3.org/2000/svg" ${base}><path d="M12 2v6"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m17.66 12.34 1.41-1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`;
  }
  if (tod === 'afternoon') {
    // Sun
    return `<svg xmlns="http://www.w3.org/2000/svg" ${base}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
  }
  // Moon
  return `<svg xmlns="http://www.w3.org/2000/svg" ${base}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
}

export async function sendCheckinEmail(email: string, token: string, name?: string | null) {
  const tod = timeOfDay();
  const hello = name ? `${greeting()}, ${esc(name)}` : greeting();
  const link = `${appUrl}/checkin/${token}`;
  const intro = introFor(tod);

  const quote = quoteForToday();
  const action = actionForToday();
  const icon = headerIcon(tod);

  const preheader = `${quote.text.slice(0, 90)}${quote.text.length > 90 ? '…' : ''}`;

  // Inline-styled, table-based for consistent rendering in Gmail / Apple Mail / Outlook.
  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subjectFor(tod)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fdf8f3;font-family:Georgia,'Times New Roman',serif;color:#3b2112;-webkit-font-smoothing:antialiased;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf8f3;">
      <tr>
        <td align="center" style="padding:24px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #f0d4ae;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:20px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#8a5028;">Action for Happiness</span>
                    </td>
                    <td align="right" style="vertical-align:middle;">${icon}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 28px 8px;">
                <h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;font-weight:500;color:#3b2112;">${hello}.</h1>
                <p style="margin:0 0 8px;font-size:16px;line-height:1.7;color:#3b2112;">${intro}</p>
                <p style="margin:0 0 0;font-size:14px;line-height:1.6;color:#8a5028;">It takes about two minutes.</p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:20px 28px 8px;">
                <a href="${link}" style="display:inline-block;background:#d48c52;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;">Begin your check-in</a>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 28px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf8f3;border:1px solid #f0d4ae;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:#8a5028;">Today's invitation</p>
                      <p style="margin:0;font-size:15px;line-height:1.6;color:#3b2112;">${esc(action)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 28px;">
                <blockquote style="margin:0;padding:4px 0 4px 14px;border-left:3px solid #e6b984;font-style:italic;font-size:16px;line-height:1.6;color:#3b2112;">
                  “${esc(quote.text)}”
                  <br />
                  <span style="display:inline-block;margin-top:6px;font-style:normal;font-size:13px;color:#8a5028;">— ${esc(quote.author)}</span>
                </blockquote>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 28px 16px;">
                <hr style="border:none;border-top:1px solid #f0d4ae;margin:0 0 16px;" />
                <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a5028;">Go deeper</p>
                <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13.5px;line-height:1.7;color:#3b2112;">
                  <a href="https://actionforhappiness.org/10-keys-to-happier-living" style="color:#8a5028;text-decoration:underline;">The 10 Keys to Happier Living</a><br />
                  <a href="https://actionforhappiness.org/calendar" style="color:#8a5028;text-decoration:underline;">This month's action calendar</a><br />
                  <a href="https://actionforhappiness.org/10-days" style="color:#8a5028;text-decoration:underline;">10 Days of Happiness — a free online course</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 28px 24px;">
                <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;line-height:1.6;color:#a87547;text-align:center;">
                  Your link rests after 48 hours — ask for a fresh one any time.
                  <br />
                  <span style="color:#8a5028;letter-spacing:1.5px;">Happier &middot; Kinder &middot; Together</span>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${hello}.

${intro}

Begin your check-in: ${link}

Today's invitation: ${action}

"${quote.text}"
— ${quote.author}

Go deeper:
 • The 10 Keys to Happier Living — https://actionforhappiness.org/10-keys-to-happier-living
 • This month's action calendar — https://actionforhappiness.org/calendar
 • 10 Days of Happiness (free course) — https://actionforhappiness.org/10-days

Happier · Kinder · Together`;

  return transporter.sendMail({
    from,
    to: email,
    subject: subjectFor(tod),
    html,
    text,
  });
}
