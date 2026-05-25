"use client";

import { useEffect, useState } from "react";

/**
 * Animates a number from 0 to the target value with ease-out.
 * @param target - Final value to display
 * @param durationMs - Animation duration in milliseconds
 * @param delayMs - Optional delay before starting (e.g. to sync with card entrance)
 * @param enabled - Whether the animation is active (e.g. card in view)
 */
export function useCountUp(
  target: number,
  durationMs: number = 700,
  delayMs: number = 0,
  enabled: boolean = true,
): number {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setDisplayValue(target);
      return;
    }

    let rafId: number;
    let startTime: number | null = null;
    const delay = delayMs;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime - delay;

      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic: fast start, smooth end
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeOut * target);
      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs, delayMs, enabled]);

  return displayValue;
}
