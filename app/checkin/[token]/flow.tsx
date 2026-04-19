'use client';

import { useEffect, useRef, useState } from 'react';

type Step = 'breathe' | 'reflect' | 'gratitude' | 'intention' | 'complete';
const STEPS: Step[] = ['breathe', 'reflect', 'gratitude', 'intention'];

type CompletionData = {
  streak: number;
  recentGratitudes: string[];
  affirmation: string;
  name: string | null;
};

export default function CheckinFlow({
  token,
  name,
  initialReflect,
  initialGratitude,
  initialIntention,
}: {
  token: string;
  name: string | null;
  initialReflect: string;
  initialGratitude: string;
  initialIntention: string;
}) {
  const [step, setStep] = useState<Step>('breathe');
  const [reflect, setReflect] = useState(initialReflect);
  const [gratitude, setGratitude] = useState(initialGratitude);
  const [intention, setIntention] = useState(initialIntention);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completion, setCompletion] = useState<CompletionData | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const goNext = (s: Step) => setStep(s);
  const goBack = (s: Step) => {
    setError('');
    setStep(s);
  };

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
      if (!res.ok) {
        // If someone already completed this check-in (e.g. second tab),
        // jump to a gentle completion screen rather than showing a red error.
        if (res.status === 409) {
          setCompletion({
            streak: 0,
            recentGratitudes: [],
            affirmation: 'This one is already saved. See you tomorrow.',
            name,
          });
          setStep('complete');
          return;
        }
        throw new Error(data.error || 'Could not save');
      }
      setCompletion({
        streak: data.streak ?? 1,
        recentGratitudes: data.recentGratitudes ?? [],
        affirmation: data.affirmation ?? 'See you tomorrow.',
        name: data.name ?? name,
      });
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        {step !== 'complete' && <Progress current={stepIndex} total={STEPS.length} />}

        {step === 'breathe' && <Breathe onNext={() => goNext('reflect')} />}

        {step === 'reflect' && (
          <Prompt
            key="reflect"
            title={name ? `How are you, ${name}?` : 'How are you feeling, right now?'}
            subtitle="There's no right answer. Just notice, without judgement."
            placeholder="Today I'm feeling…"
            value={reflect}
            onChange={setReflect}
            onNext={() => goNext('gratitude')}
            onBack={() => goBack('breathe')}
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
            onNext={() => goNext('intention')}
            onBack={() => goBack('reflect')}
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
            ctaLabel={submitting ? 'Saving your check-in…' : 'Complete check-in'}
            onNext={submit}
            onBack={() => goBack('gratitude')}
            disabled={submitting}
            loading={submitting}
            error={error}
          />
        )}

        {step === 'complete' && completion && <Completion data={completion} />}
      </div>
    </main>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
            i <= current ? 'bg-warm-500 w-10' : 'bg-warm-200 w-6'
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Breathing step — 4-7-8, JS-driven state machine                     */
/* ------------------------------------------------------------------ */

type Phase = 'in' | 'hold' | 'out';
const PHASE_MS: Record<Phase, number> = { in: 4000, hold: 7000, out: 8000 };
const NEXT_PHASE: Record<Phase, Phase> = { in: 'hold', hold: 'out', out: 'in' };
const PHASE_LABEL: Record<Phase, string> = { in: 'breathe in', hold: 'hold', out: 'breathe out' };
const TOTAL_CYCLES = 2;

function Breathe({ onNext }: { onNext: () => void }) {
  const reduceMotion = usePrefersReducedMotion();

  // Static variant for users who asked for less motion.
  if (reduceMotion) {
    return (
      <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow-sm fadein">
        <h1 className="font-serif text-4xl text-warm-900 mb-3 tracking-tight">Take a few deep breaths.</h1>
        <p className="text-warm-700 leading-relaxed mb-8 max-w-sm mx-auto">
          Let your shoulders drop. When you're ready, try the 4-7-8 pattern:
        </p>
        <div className="flex flex-col gap-3 items-stretch max-w-xs mx-auto text-warm-900 mb-10">
          <StaticStep n="4" label="Breathe in" />
          <StaticStep n="7" label="Hold" />
          <StaticStep n="8" label="Breathe out" />
        </div>
        <button
          onClick={onNext}
          className="rounded-full bg-warm-500 hover:bg-warm-700 transition-colors text-white font-medium px-8 py-3"
        >
          Continue
        </button>
      </div>
    );
  }

  return <BreatheAnimated onNext={onNext} />;
}

function StaticStep({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-warm-50/80 border border-warm-200 px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-warm-200 text-warm-900 font-serif text-lg flex items-center justify-center">
        {n}
      </div>
      <div className="text-left text-warm-900">{label}</div>
    </div>
  );
}

function BreatheAnimated({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<Phase>('in');
  const [cycle, setCycle] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const dur = PHASE_MS[phase];
    const t = setTimeout(() => {
      const next = NEXT_PHASE[phase];
      if (next === 'in') {
        const nextCycle = cycle + 1;
        if (nextCycle > TOTAL_CYCLES) {
          setDone(true);
          return;
        }
        setCycle(nextCycle);
      }
      setPhase(next);
    }, dur);
    return () => clearTimeout(t);
  }, [phase, cycle, done]);

  const phaseClass =
    phase === 'in' ? 'breathe-in' : phase === 'hold' ? 'breathe-hold' : 'breathe-out';

  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-8 md:p-10 text-center shadow-sm fadein">
      <h1 className="font-serif text-4xl text-warm-900 mb-2 tracking-tight">Take a few deep breaths.</h1>
      <p className="text-warm-700 mb-10">Let your shoulders drop. Follow the circle.</p>

      <div className="flex items-center justify-center h-60 mb-4" aria-hidden>
        <div
          key={`${cycle}-${phase}`}
          className={`${phaseClass} w-44 h-44 rounded-full bg-gradient-to-br from-warm-200 to-warm-500 flex items-center justify-center shadow-[0_10px_40px_-12px_rgba(212,140,82,0.5)]`}
        >
          <span className="text-white font-serif text-xl">{PHASE_LABEL[phase]}</span>
        </div>
      </div>

      <p className="text-sm text-warm-700/80 mb-1" aria-live="polite">
        {done ? 'Whenever you are ready.' : `Cycle ${cycle} of ${TOTAL_CYCLES} · ${PHASE_LABEL[phase]}`}
      </p>
      <p className="text-xs text-warm-700/60 mb-8">4 seconds in · 7 seconds hold · 8 seconds out</p>

      <button
        onClick={onNext}
        className={`rounded-full font-medium px-8 py-3 transition-all ${
          done
            ? 'bg-warm-500 hover:bg-warm-700 text-white'
            : 'bg-warm-100 hover:bg-warm-200 text-warm-900'
        }`}
      >
        Continue
      </button>
      {!done && (
        <div className="mt-4">
          <button
            onClick={onNext}
            className="text-sm text-warm-700/70 hover:text-warm-700 underline underline-offset-4 decoration-warm-200"
          >
            Skip to reflection
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prompt step                                                         */
/* ------------------------------------------------------------------ */

function Prompt({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  ctaLabel = 'Continue',
  disabled,
  loading,
  error,
}: {
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack?: () => void;
  ctaLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-8 md:p-10 shadow-sm fadein">
      <h1 className="font-serif text-[32px] md:text-4xl text-warm-900 mb-2 leading-tight tracking-tight">{title}</h1>
      <p className="text-warm-700 mb-6">{subtitle}</p>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        maxLength={2000}
        className="autogrow w-full rounded-lg border border-warm-200 bg-white/80 px-4 py-3 text-warm-900 outline-none focus:border-warm-500 focus:ring-2 focus:ring-warm-500/20 resize-none leading-relaxed"
        disabled={disabled}
      />

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900"
        >
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            className="text-sm text-warm-700/80 hover:text-warm-900 transition-colors disabled:opacity-40"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className="rounded-full bg-warm-500 hover:bg-warm-700 transition-colors text-white font-medium px-8 py-3 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading && (
            <span
              aria-hidden
              className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
            />
          )}
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Completion screen                                                   */
/* ------------------------------------------------------------------ */

function Completion({ data }: { data: CompletionData }) {
  const { streak, recentGratitudes, affirmation, name } = data;
  const firstTime = streak <= 1;
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow-sm fadein">
      <div className="text-6xl mb-4" aria-hidden>🌞</div>
      <h1 className="font-serif text-4xl text-warm-900 mb-3 tracking-tight">
        {name ? `Thank you, ${name}.` : 'Thank you for checking in.'}
      </h1>

      <p className="text-warm-700 leading-relaxed max-w-sm mx-auto">{affirmation}</p>

      <div className="mt-8 rounded-xl bg-warm-50/80 border border-warm-200 px-5 py-4 text-warm-900 inline-block">
        {firstTime ? (
          <span className="font-serif text-lg">🌱 Your first check-in. A lovely start.</span>
        ) : (
          <span className="font-serif text-lg">
            🌱 You've checked in <span className="font-semibold">{streak} days in a row</span>.
          </span>
        )}
      </div>

      {recentGratitudes.length > 1 && (
        <div className="mt-8 text-left max-w-sm mx-auto">
          <p className="text-xs uppercase tracking-[0.22em] text-warm-700/80 mb-3">This week you've been grateful for</p>
          <ul className="space-y-2">
            {recentGratitudes.slice(0, 3).map((g, i) => (
              <li key={i} className="text-warm-900 text-sm leading-relaxed italic before:content-['“'] after:content-['”']">
                {g.length > 140 ? g.slice(0, 137) + '…' : g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
