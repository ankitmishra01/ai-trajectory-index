"use client";

import { useState, useEffect, useRef } from "react";

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Re-runs whenever `target` changes.
 */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const from = 0;

    function step(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(from + (target - from) * easeOut(t)));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}
