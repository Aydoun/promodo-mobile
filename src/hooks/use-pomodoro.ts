import { useCallback, useEffect, useState } from 'react';

export type Phase = 'focus' | 'shortBreak' | 'longBreak';

const MINUTE = 60 * 1000;

export const PhaseDurations: Record<Phase, number> = {
  focus: 25 * MINUTE,
  shortBreak: 5 * MINUTE,
  longBreak: 15 * MINUTE,
};

/** Focus sessions per cycle; a long break follows the last one. */
export const SessionsPerCycle = 4;

const TICK_MS = 250;

/**
 * Pomodoro timer state. Time is tracked against an end timestamp rather than
 * by counting ticks, so the countdown stays accurate if the JS thread stalls.
 * When a phase ends, the timer moves to the next phase and waits to be started.
 */
export function usePomodoro() {
  const [phase, setPhase] = useState<Phase>('focus');
  const [endAt, setEndAt] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState(PhaseDurations.focus);
  const [now, setNow] = useState(() => Date.now());
  // Focus sessions finished (or skipped) in the current cycle, 0..SessionsPerCycle.
  const [cycleCount, setCycleCount] = useState(0);
  const [today, setToday] = useState({ sessions: 0, focusMs: 0 });

  const isRunning = endAt !== null;
  const remainingMs = endAt !== null ? Math.max(0, endAt - now) : pausedRemaining;
  const durationMs = PhaseDurations[phase];

  const advance = useCallback(
    (completed: boolean) => {
      let next: Phase;
      if (phase === 'focus') {
        if (completed) {
          setToday((t) => ({
            sessions: t.sessions + 1,
            focusMs: t.focusMs + PhaseDurations.focus,
          }));
        }
        const nextCount = cycleCount + 1;
        setCycleCount(nextCount);
        next = nextCount >= SessionsPerCycle ? 'longBreak' : 'shortBreak';
      } else {
        if (phase === 'longBreak') setCycleCount(0);
        next = 'focus';
      }
      setPhase(next);
      setEndAt(null);
      setPausedRemaining(PhaseDurations[next]);
    },
    [phase, cycleCount],
  );

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      if (t >= endAt) advance(true);
      else setNow(t);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [endAt, advance]);

  const toggle = useCallback(() => {
    if (endAt !== null) {
      setPausedRemaining(Math.max(0, endAt - Date.now()));
      setEndAt(null);
    } else {
      const t = Date.now();
      setNow(t);
      setEndAt(t + pausedRemaining);
    }
  }, [endAt, pausedRemaining]);

  const reset = useCallback(() => {
    setEndAt(null);
    setPausedRemaining(PhaseDurations[phase]);
  }, [phase]);

  const skip = useCallback(() => advance(false), [advance]);

  return {
    phase,
    isRunning,
    remainingMs,
    durationMs,
    progress: 1 - remainingMs / durationMs,
    cycleCount,
    today,
    toggle,
    reset,
    skip,
  };
}
