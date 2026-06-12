"use client";

import { useEffect, useRef } from "react";

interface MatrixRainProps {
  fontSize?: number;
  color?: string;
  characters?: string;
  trailLength?: number;
  speed?: number;
  /** Stop spawning new columns; let what's on screen fall off, then call onComplete. */
  stopping?: boolean;
  onComplete?: () => void;
}

function hexToRgba(hex: string, alpha: number) {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function MatrixRain({
  fontSize = 16,
  color = "#00ff00",
  characters = "01",
  trailLength = 14,
  speed = 1,
  stopping = false,
  onComplete,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stoppingRef = useRef(stopping);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { stoppingRef.current = stopping; }, [stopping]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const chars = characters.split("");
    const columnCount = Math.floor(canvas.width / fontSize);
    const drops = Array.from({ length: columnCount }, () => Math.random() * -100);
    let completed = false;

    const draw = () => {
      // Fully transparent each frame so the page underneath stays visible —
      // the falling streaks themselves carry the trail via per-glyph alpha.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = "top";

      const stop = stoppingRef.current;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      let allOffscreen = true;

      for (let i = 0; i < drops.length; i++) {
        for (let j = 0; j < trailLength; j++) {
          // drops track position in document space, so the rain falls
          // through the page rather than tracking the viewport on scroll.
          const screenY = (drops[i] - j) * fontSize - scrollY;
          if (screenY < -fontSize || screenY > canvas.height) continue;
          const alpha = j === 0 ? 1 : (1 - j / trailLength) * 0.6;
          ctx.fillStyle = hexToRgba(color, alpha);
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, screenY);
        }

        if ((drops[i] - trailLength) * fontSize <= docHeight) allOffscreen = false;

        if (!stop && drops[i] * fontSize > docHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speed;
      }

      if (stop && allOffscreen && !completed) {
        completed = true;
        onCompleteRef.current?.();
      }
    };

    const interval = setInterval(draw, 33 / speed);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [fontSize, color, characters, trailLength, speed]);

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 z-30 pointer-events-none" />;
}
