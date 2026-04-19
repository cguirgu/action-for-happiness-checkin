'use client';

import { useState } from 'react';
import { Loader2, Moon } from 'lucide-react';

export default function Expired({ email: initialEmail }: { email: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/signup/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setState('error');
        return;
      }
      setState('ok');
    } catch {
      setError('We couldn’t reach the server. Please try again.');
      setState('error');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg fadein">
        <div className="bg-white/70 backdrop-blur rounded-2xl p-10 shadow-sm">
          <div className="text-center mb-6">
            <Moon aria-hidden className="w-10 h-10 mx-auto mb-4 text-warm-500" strokeWidth={1.5} />
            <h1 className="font-serif text-3xl text-warm-900 mb-2">This link has taken a rest.</h1>
            <p className="text-warm-700 leading-relaxed">
              Links quietly expire after 48 hours. Want a fresh one?
            </p>
          </div>

          {state === 'ok' ? (
            <div className="text-center rounded-lg bg-warm-100/70 px-5 py-4 text-warm-900">
              A fresh link is on its way to <span className="font-medium">{email}</span>.
            </div>
          ) : (
            <form onSubmit={resend} className="space-y-4">
              <label htmlFor="resend-email" className="block text-sm text-warm-700">
                Your email
              </label>
              <input
                id="resend-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-warm-200 bg-white/80 px-4 py-3 outline-none focus:border-warm-500 focus:ring-2 focus:ring-warm-500/20"
                disabled={state === 'loading'}
              />
              <button
                type="submit"
                disabled={state === 'loading'}
                className="w-full rounded-full bg-warm-500 hover:bg-warm-700 transition-colors text-white font-medium py-3 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {state === 'loading' && <Loader2 aria-hidden className="w-4 h-4 animate-spin" />}
                {state === 'loading' ? 'Sending…' : 'Send me a fresh link'}
              </button>
              {state === 'error' && (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900"
                >
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-[11px] tracking-[0.22em] uppercase text-warm-700/70">
          Happier &middot; Kinder &middot; Together
        </p>
      </div>
    </main>
  );
}
