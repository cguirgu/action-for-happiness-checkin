'use client';

import { useEffect, useState } from 'react';

type Step = 'breathe' | 'reflect' | 'gratitude' | 'intention' | 'complete';

const STEPS: Step[] = ['breathe', 'reflect', 'gratitude', 'intention'];
const BREATHE_SECONDS = 24;

export default function CheckinFlow({ token }: { token: string }) {
  const [step, setStep] = useState<Step>('breathe');
  const [reflect, setReflect] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [intention, setIntention] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const stepIndex = STEPS.indexOf(step);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/checkin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflect, gratitude, intention }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        {step !== 'complete' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i <= stepIndex ? 'bg-warm-500 w-10' : 'bg-warm-200 w-6'
                }`}
              />
            ))}
          </div>
        )}

        {step === 'breathe' && <Breathe onNext={() => setStep('reflect')} />}

        {step === 'reflect' && (
          <Prompt
            key="reflect"
            title="How are you feeling, right now?"
            subtitle="There's no right answer. Just notice, without judgement."
            placeholder="Today I'm feeling…"
            value={reflect}
            onChange={setReflect}
            onNext={() => setStep('gratitude')}
          />
        )}

        {step === 'gratitude' && (
          <Prompt
            key="gratitude"
            title="What's one thing you're grateful for today?"
            subtitle="However small. A warm drink, a kind word, a quiet moment."
            placeholder="I'm grateful for…"
            value={gratitude}
            onChange={setGratitude}
            onNext={() => setStep('intention')}
          />
        )}

        {step === 'intention' && (
          <Prompt
            key="intention"
            title="What's one positive thing you'd like to do today?"
            subtitle="One small step forward. Kindness, a walk, a message to a friend."
            placeholder="Today I will…"
            value={intention}
            onChange={setIntention}
            ctaLabel={submitting ? 'Saving…' : 'Complete check-in'}
            onNext={submit}
            disabled={submitting}
            error={error}
          />
        )}

        {step === 'complete' && (
          <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow-sm fadein">
            <div className="text-6xl mb-4">🌞</div>
            <h1 className="font-serif text-3xl text-warm-900 mb-3">Thank you for checking in</h1>
            <p className="text-warm-700 leading-relaxed">
              Carry this intention gently with you today. See you tomorrow.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Breathe({ onNext }: { onNext: () => void }) {
  const [remaining, setRemaining] = useState(BREATHE_SECONDS);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const i = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setPhase((p) => (p === 'in' ? 'out' : 'in')), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow-sm fadein">
      <h1 className="font-serif text-3xl text-warm-900 mb-2">Take a few deep breaths</h1>
      <p className="text-warm-700 mb-10">Let your shoulders drop. Follow the circle.</p>

      <div className="flex items-center justify-center h-56">
        <div className="breathe-circle w-40 h-40 rounded-full bg-gradient-to-br from-warm-200 to-warm-500 flex items-center justify-center shadow-inner">
          <span className="text-white font-serif text-xl">{phase === 'in' ? 'breathe in' : 'breathe out'}</span>
        </div>
      </div>

      <p className="text-sm text-warm-700/70 mt-6 mb-6">
        {remaining > 0 ? `${remaining}s remaining` : 'Whenever you are ready.'}
      </p>

      <button
        onClick={onNext}
        className="rounded-full bg-warm-500 hover:bg-warm-700 transition-colors text-white font-medium px-8 py-3"
      >
        Continue
      </button>
    </div>
  );
}

function Prompt({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  onNext,
  ctaLabel = 'Continue',
  disabled,
  error,
}: {
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  ctaLabel?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-8 md:p-10 shadow-sm fadein">
      <h1 className="font-serif text-3xl text-warm-900 mb-2">{title}</h1>
      <p className="text-warm-700 mb-6">{subtitle}</p>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-lg border border-warm-200 bg-white/80 px-4 py-3 outline-none focus:border-warm-500 focus:ring-2 focus:ring-warm-500/20 resize-none"
      />
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={disabled}
          className="rounded-full bg-warm-500 hover:bg-warm-700 transition-colors text-white font-medium px-8 py-3 disabled:opacity-60"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
