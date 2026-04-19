import { getCheckinByToken } from '@/lib/db';
import CheckinFlow from './flow';
import Expired from './expired';
import { notFound } from 'next/navigation';
import { Flower2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = getCheckinByToken(token);

  if (!row) notFound();

  if (row.completed_at) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md text-center fadein">
          <Flower2 aria-hidden className="w-10 h-10 mx-auto mb-4 text-warm-500" strokeWidth={1.5} />
          <h1 className="font-serif text-3xl text-warm-900 mb-3">You've already checked in.</h1>
          <p className="text-warm-700 leading-relaxed">
            Completed on{' '}
            {new Date(row.completed_at + 'Z').toLocaleString(undefined, {
              weekday: 'long',
              hour: 'numeric',
              minute: '2-digit',
            })}
            . See you tomorrow.
          </p>
          <p className="mt-8 text-[11px] tracking-[0.22em] uppercase text-warm-700/70">
            Happier &middot; Kinder &middot; Together
          </p>
        </div>
      </main>
    );
  }

  if (row.expires_at && new Date(row.expires_at + 'Z') < new Date()) {
    return <Expired email={row.user_email} />;
  }

  return (
    <CheckinFlow
      token={token}
      name={row.user_name}
      initialReflect={row.reflect ?? ''}
      initialGratitude={row.gratitude ?? ''}
      initialIntention={row.intention ?? ''}
    />
  );
}
