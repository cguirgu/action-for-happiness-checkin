import db from '@/lib/db';
import CheckinFlow from './flow';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = db
    .prepare('SELECT token, completed_at FROM checkins WHERE token = ?')
    .get(token) as { token: string; completed_at: string | null } | undefined;

  if (!row) notFound();

  if (row.completed_at) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md text-center fadein">
          <div className="text-5xl mb-4">🌼</div>
          <h1 className="font-serif text-3xl text-warm-900 mb-3">You've already checked in</h1>
          <p className="text-warm-700">
            This check-in was completed on {new Date(row.completed_at + 'Z').toLocaleString()}. See you tomorrow.
          </p>
        </div>
      </main>
    );
  }

  return <CheckinFlow token={token} />;
}
