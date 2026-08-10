"use client";

import { useEffect, useRef, useState } from "react";

const TARGET = 47000;
const DURATION_MS = 1600;

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Анимированный счётчик: нарастает от 0 до TARGET, когда секция попадает в вьюпорт.
 */
export function SavingsCounter() {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(TARGET * eased);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      className="tabular-nums"
      aria-label={`$${formatNumber(TARGET)}+`}
    >
      ${formatNumber(value)}+
    </span>
  );
}
