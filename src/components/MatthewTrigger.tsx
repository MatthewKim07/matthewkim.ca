"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/context/GameContext";
import { useMatthewPixelWorldTexture } from "@/components/MatthewPixelWorldText";

const REVEAL_RADIUS = 80;
const REVEAL_RADIUS_Y = 210;
const FADE_IN_MS = 900;
const MARK_LIFETIME_MS = 1200;
const FADE_DURATION_MS = 1200;
const MERGE_RADIUS = 46;
const MIN_MOVE_PX = 14;
const MAX_MARKS = 18;
const HIDDEN_MASK = "linear-gradient(transparent, transparent)";

interface Mark {
  x: number;
  y: number;
  created: number;
  lastRefresh: number;
}

function buildMaskSvg(marks: Mark[], w: number, h: number, now: number): string {
  const defs: string[] = [];
  const shapes: string[] = [];

  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const refreshAge = now - m.lastRefresh;
    if (refreshAge >= MARK_LIFETIME_MS + FADE_DURATION_MS) continue;

    const fadeIn = Math.min(1, (now - m.created) / FADE_IN_MS);
    const fadeOut =
      refreshAge < MARK_LIFETIME_MS
        ? 1
        : Math.max(0, 1 - (refreshAge - MARK_LIFETIME_MS) / FADE_DURATION_MS);
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= 0) continue;

    defs.push(
      `<radialGradient id="g${i}" cx="50%" cy="50%" r="50%">` +
        `<stop offset="0%" stop-color="white" stop-opacity="${alpha.toFixed(3)}"/>` +
        `<stop offset="58%" stop-color="white" stop-opacity="${(alpha * 0.34).toFixed(3)}"/>` +
        `<stop offset="100%" stop-color="white" stop-opacity="0"/>` +
      `</radialGradient>`
    );
    shapes.push(
      `<ellipse cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" rx="${REVEAL_RADIUS}" ry="${REVEAL_RADIUS_Y}" fill="url(#g${i})"/>`
    );
  }

  if (shapes.length === 0) return "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<defs>${defs.join("")}</defs>` +
    shapes.join("") +
    `</svg>`
  );
}

// Wraps the "Matthew" letters of the hero title in a focusable control that
// opens the game. Renders the letters as-is so their per-letter Framer Motion
// intro is untouched. "Kim" stays outside this wrapper, keeping its existing
// Korea-flag easter egg.
//
// Hidden-but-discoverable: identical to the title at rest. Hover/focus reveals a
// miniature pixel world clipped into the word, foreshadowing matthew.exe without
// changing the normal hero layout.
export function MatthewTrigger({ children }: { children: React.ReactNode }) {
  const { state, open } = useGame();
  const ref = useRef<HTMLButtonElement>(null);
  const worldRef = useRef<HTMLSpanElement>(null);
  const marksRef = useRef<Mark[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const wasOpen = useRef(false);
  const [active, setActive] = useState(false);
  const texture = useMatthewPixelWorldTexture();

  // Return focus to the trigger when the overlay closes (focus handshake).
  useEffect(() => {
    if (state !== "idle") {
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      ref.current?.focus();
    }
  }, [state]);

  const addMark = useCallback((x: number, y: number) => {
    const now = performance.now();
    const marks = marksRef.current;

    let refreshed = false;
    const updated = marks.map((m) => {
      if (Math.hypot(x - m.x, y - m.y) < MERGE_RADIUS) {
        refreshed = true;
        return { ...m, lastRefresh: now };
      }
      return m;
    });

    if (refreshed) {
      marksRef.current = updated;
      return;
    }

    const last = marks[marks.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) >= MIN_MOVE_PX) {
      const next = [...marks, { x, y, created: now, lastRefresh: now }];
      marksRef.current = next.length > MAX_MARKS ? next.slice(-MAX_MARKS) : next;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      addMark(e.clientX - rect.left, e.clientY - rect.top);
    },
    [addMark]
  );

  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      const maxAge = MARK_LIFETIME_MS + FADE_DURATION_MS;
      const span = worldRef.current;

      marksRef.current = marksRef.current.filter((m) => now - m.lastRefresh < maxAge);

      if (span) {
        const current = marksRef.current;
        if (current.length > 0) {
          const rect = ref.current?.getBoundingClientRect();
          const w = rect?.width ?? 520;
          const h = rect?.height ?? 120;
          const svg = buildMaskSvg(current, w, h, now);
          if (svg) {
            const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
            span.style.setProperty("mask-image", url);
            span.style.setProperty("-webkit-mask-image", url);
            span.style.opacity = "1";
          } else {
            span.style.opacity = "0";
            span.style.setProperty("mask-image", HIDDEN_MASK);
            span.style.setProperty("-webkit-mask-image", HIDDEN_MASK);
          }
        } else {
          span.style.opacity = "0";
          span.style.setProperty("mask-image", HIDDEN_MASK);
          span.style.setProperty("-webkit-mask-image", HIDDEN_MASK);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      data-no-trail
      aria-label="Enter Matthew.exe"
      onClick={open}
      onMouseEnter={() => {
        setActive(true);
      }}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMouseMove}
      onFocus={() => {
        setActive(true);
        const rect = ref.current?.getBoundingClientRect();
        if (rect) addMark(rect.width / 2, rect.height / 2);
      }}
      onBlur={() => setActive(false)}
      // Inherit all type styling so the title looks visually unchanged at rest.
      style={{ font: "inherit", letterSpacing: "inherit", color: "inherit" }}
      className="group relative isolate inline-block appearance-none border-0 bg-transparent p-0 m-0 align-baseline focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FED34C]"
    >
      {/* A restrained edge glow keeps the reveal integrated with the page. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-3 -inset-y-2 z-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(254,211,76,0.18),transparent_72%)] opacity-0 blur-xl transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      />

      <span className="relative z-10 inline-block">
        {children}
      </span>
      <span
        ref={worldRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 inline-block opacity-0 transition-[filter] duration-300 ease-out motion-reduce:transition-none"
        style={{
          backgroundImage: texture ? `url("${texture}")` : undefined,
          backgroundClip: texture ? "text" : undefined,
          WebkitBackgroundClip: texture ? "text" : undefined,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "100% 100%",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          imageRendering: "pixelated",
          filter: active ? "drop-shadow(0 0 14px rgba(254,211,76,0.2))" : "none",
          userSelect: "none",
        }}
      >
        {children}
      </span>
    </button>
  );
}
