import { useState, useCallback, useEffect, useRef } from "react";

export default function useSequence(durations) {
  const total = durations.length;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef(null);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, total - 1)), [total]);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const reset = useCallback(() => {
    setStep(0);
    setPlaying(true);
  }, []);
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!playing) return;
    if (step >= total - 1) {
      setPlaying(false);
      return;
    }

    timerRef.current = setTimeout(next, durations[step]);
    return () => clearTimeout(timerRef.current);
  }, [step, playing, durations, total, next]);

  return { step, playing, next, prev, reset, togglePlay };
}
