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

export async function sendCheckinEmail(email: string, token: string) {
  const link = `${appUrl}/checkin/${token}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #fdf8f3; color: #3b2112;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">Good morning 🌅</h1>
      <p style="line-height: 1.6;">It's time for your Daily Check-In — a small, quiet moment to breathe, reflect, feel grateful, and set a positive intention for today.</p>
      <p style="margin: 28px 0;">
        <a href="${link}" style="background: #d48c52; color: white; padding: 14px 24px; border-radius: 999px; text-decoration: none; display: inline-block;">Begin your check-in</a>
      </p>
      <p style="font-size: 13px; color: #8a5028;">Takes about 2 minutes. Your responses stay private.</p>
      <hr style="border: none; border-top: 1px solid #f0d4ae; margin: 28px 0;" />
      <p style="font-size: 12px; color: #8a5028;">With gratitude,<br/>Action for Happiness</p>
    </div>
  `;
  const text = `Your Daily Check-In is ready.\n\nBegin here: ${link}\n\nWith gratitude,\nAction for Happiness`;
  return transporter.sendMail({ from, to: email, subject: 'Your Daily Check-In 🌿', html, text });
}
