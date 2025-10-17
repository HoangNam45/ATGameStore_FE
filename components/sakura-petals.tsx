"use client";

import { useMemo } from "react";

export function SakuraPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 12}s`,
        duration: `${10 + Math.random() * 12}s`,
        size: `${8 + Math.random() * 8}px`,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute will-change-transform"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationName: "sakura-fall",
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            animationIterationCount: "infinite",
            animationTimingFunction: "linear",
            background:
              "radial-gradient(ellipse at center, #ffc0cb 0%, #ffb6c1 50%, #ff69b4 100%)",
            borderRadius: "50% 0 50% 0",
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}
