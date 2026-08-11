"use client";

import { useMemo } from "react";

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#06b6d4",
  "#f97316",
];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  round: boolean;
}

/** Лёгкое CSS-конфетти без зависимостей (полный экран, поверх UI). */
export function Confetti({ show }: { show: boolean }) {
  const pieces = useMemo<Piece[]>(() => {
    if (!show) return [];
    return Array.from({ length: 110 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2.2 + Math.random() * 1.8,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#3b82f6",
      round: Math.random() > 0.5,
    }));
  }, [show]);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}