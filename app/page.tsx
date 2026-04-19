'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setState('ok');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-block text-xs uppercase tracking-[0.25em] text-warm-700 mb-4">
            Action for Happiness
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4 text-warm-900">Your Daily Check-In</h1>
          <p className="text-warm-700 leading-relaxed max-w-md mx-auto">
            A small daily practice — breathe, reflect, feel grateful, and set a positive intention. Sign up and we'll send one to your inbox.
          </p>
        </div>

        {state === 'ok' ? (
          <div className="bg-white/70 backdrop-blur rounded-2xl p-8 text-center shadow-sm fadein">
            <div className="text-5xl mb-4">🌿</div>
            <h2 className="font-serif text-2xl mb-2 text-warm-900">Check your inbox</h2>
            <p className="text-warm-700">
              We've sent your first Daily Check-In to <span className="font-medium">{email}</span>.
            </p>
            <p className="text-sm text-warm-700/80 mt-4">
              Running locally? Open <a className="underline" href="http://localhost:8025" target="_blank" rel="noreferrer">Mailpit</a> to view it.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white/70 backdrop-blur rounded-2xl p-8 shadow-sm">
            <label htmlFor="email" className="block text-sm text-warm-700 mb-2">
              Your email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-warm-200 bg-white/80 px-4 py-3 outline-none focus:border-warm-500 focus:ring-2 focus:ring-warm-500/20"
              disabled={state === 'loading'}
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="mt-4 w-full rounded-full bg-warm-500 hover:bg-warm-700 transition-colors text-white font-medium py-3 disabled:opacity-60"
            >
              {state === 'loading' ? 'Sending…' : 'Send me my first check-in'}
            </button>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            <p className="mt-4 text-xs text-warm-700/70 text-center">
              Takes about 2 minutes · Your responses stay private
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
