'use client';

import { useState } from 'react';

type FormState = 'idle' | 'loading' | 'ok' | 'error';

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [serverName, setServerName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setError('');
    setFieldErrors({});
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setFieldErrors(data.fieldErrors || {});
        setState('error');
        return;
      }
      setServerName(data.name ?? null);
      setState('ok');
    } catch {
      setError('We couldn’t reach the server. Check your connection and try again.');
      setState('error');
    }
  }

  if (state === 'ok') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl fadein">
          <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-4" aria-hidden>🌿</div>
            <h2 className="font-serif text-3xl text-warm-900 mb-3">
              {serverName ? `You're all set, ${serverName}.` : `You're all set.`}
            </h2>
            <p className="text-warm-700 leading-relaxed">
              We've sent your first Daily Check-In to <span className="font-medium">{email}</span>.
            </p>
            <p className="text-sm text-warm-700/80 mt-5">
              Running locally? Open{' '}
              <a className="underline decoration-warm-300 hover:decoration-warm-500" href="http://localhost:8025" target="_blank" rel="noreferrer">
                Mailpit
              </a>{' '}
              to view it.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const loading = state === 'loading';

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10 fadein">
          <div className="inline-block text-[11px] uppercase tracking-[0.28em] text-warm-700/80 mb-4">
            Action for Happiness
          </div>
          <h1 className="font-serif text-5xl md:text-6xl mb-5 text-warm-900 leading-[1.05] tracking-tight">
            Your Daily Check-In
          </h1>
          <p className="text-warm-700 leading-relaxed max-w-md mx-auto">
            A small daily practice — breathe, reflect, feel grateful, and set a positive intention. Sign up and we'll send one to your inbox.
          </p>
        </div>

        <form onSubmit={onSubmit} className="bg-white/70 backdrop-blur rounded-2xl p-8 shadow-sm fadein" noValidate>
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm text-warm-700 mb-2">
              What should we call you? <span className="text-warm-700/60">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Christina"
              maxLength={60}
              className={`w-full rounded-lg border bg-white/80 px-4 py-3 outline-none transition-colors focus:ring-2 focus:ring-warm-500/20 ${
                fieldErrors.name ? 'border-amber-500' : 'border-warm-200 focus:border-warm-500'
              }`}
              disabled={loading}
            />
            {fieldErrors.name && <p className="mt-2 text-sm text-amber-700">{fieldErrors.name}</p>}
          </div>

          <div className="mb-2">
            <label htmlFor="email" className="block text-sm text-warm-700 mb-2">
              Your email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full rounded-lg border bg-white/80 px-4 py-3 outline-none transition-colors focus:ring-2 focus:ring-warm-500/20 ${
                fieldErrors.email ? 'border-amber-500' : 'border-warm-200 focus:border-warm-500'
              }`}
              disabled={loading}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-err' : undefined}
            />
            {fieldErrors.email && (
              <p id="email-err" className="mt-2 text-sm text-amber-700">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-warm-500 hover:bg-warm-700 transition-colors text-white font-medium py-3.5 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading && (
              <span
                aria-hidden
                className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
            )}
            {loading ? 'Sending your first check-in…' : 'Send me my first check-in'}
          </button>

          {state === 'error' && error && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900"
            >
              {error}
            </div>
          )}

          <p className="mt-5 text-xs text-warm-700/70 text-center">
            Takes about 2 minutes · Your responses stay private
          </p>
        </form>
      </div>
    </main>
  );
}
