"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MatrixRain } from "@/components/MatrixRain";

const RAIN_DURATION_MS = 2500;

export function SoftwareEngineeringWord() {
  const [raining, setRaining] = useState(false);
  const [stopping, setStopping] = useState(false);
  const reducedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const trigger = useCallback(() => {
    if (reducedRef.current) return;
    setStopping(false);
    setRaining(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStopping(true), RAIN_DURATION_MS);
  }, []);

  const handleComplete = useCallback(() => {
    setRaining(false);
    setStopping(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    trigger();
  };

  return (
    <>
      <button
        onClick={trigger}
        onKeyDown={handleKeyDown}
        aria-label="software engineering (click for a surprise)"
        className="cursor-pointer hover:text-lime-500 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded-sm"
      >
        software engineering
      </button>

      {raining && <MatrixRain stopping={stopping} onComplete={handleComplete} />}
    </>
  );
}
