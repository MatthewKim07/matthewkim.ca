"use client";

import { motion } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";

const NAME = "Matthew Kim";
const CHARS = NAME.split("");
const KIM_START = 8; // index of "K" in CHARS ("Matthew " = 8 chars)

// ── Tunable ───────────────────────────────────────────────────────────────
const INTRO_DURATION_MS = (0.55 + 1.3) * 1000; // max seed delay + spring settle
const REVEAL_RADIUS     = 55;   // px — horizontal reveal radius per mark
const REVEAL_RADIUS_Y   = 200;  // px — vertical radius; large so a single mark fills full KIM height
const FADE_IN_MS        = 1400; // ms — fade-in duration (mirrors fade-out)
const MARK_LIFETIME_MS  = 2000; // ms — mark stays at full opacity
const FADE_DURATION_MS  = 1400; // ms — fade-out after lifetime ends
const MERGE_RADIUS      = 40;   // px — refresh nearby mark instead of stacking a new one
const MIN_MOVE_PX       = 12;   // px — min travel before adding a new mark
const MAX_MARKS         = 20;   // cap for KIM (only 3 letters, fewer needed)
// Flag image layer controls — only affect the hidden background, never the text.
// Asset (1764×891) is pre-framed at ~2:1 to match the KIM element's natural proportions.
// FLAG_SCALE must be > 1.0 to create vertical overflow, which FLAG_Y_OFFSET needs to work.
const FLAG_SCALE    = 1.15;  // 1.0 = fills height; >1 gives room for Y nudge (1.15 = minimal)
const FLAG_X        = 50;    // background-position X (%, 0 = left, 100 = right)
const FLAG_Y_OFFSET = -6;    // px — moves flag up (negative) or down (positive) from center
// ──────────────────────────────────────────────────────────────────────────

interface LetterSeed {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
  stiffness: number;
  damping: number;
}

function buildSeeds(count: number): LetterSeed[] {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 1400,
    y: (Math.random() - 0.5) * 900,
    rotate: (Math.random() - 0.5) * 540,
    scale: Math.random() * 1.5 + 0.2,
    delay: Math.random() * 0.55,
    stiffness: 40 + Math.random() * 60,
    damping: 10 + Math.random() * 10,
  }));
}

interface Mark {
  x: number;
  y: number;
  created: number;     // when mark was first placed — drives fade-in
  lastRefresh: number; // when mark was last refreshed — drives hold + fade-out
}

function buildMaskSvg(marks: Mark[], w: number, h: number, now: number): string {
  const defs: string[] = [];
  const shapes: string[] = [];

  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const refreshAge = now - m.lastRefresh;
    if (refreshAge >= MARK_LIFETIME_MS + FADE_DURATION_MS) continue;

    // Fade in from placement, fade out from last refresh — take the minimum so
    // the mark can't appear brighter than either curve allows.
    const fadeIn  = Math.min(1, (now - m.created) / FADE_IN_MS);
    const fadeOut = refreshAge < MARK_LIFETIME_MS
      ? 1
      : Math.max(0, 1 - (refreshAge - MARK_LIFETIME_MS) / FADE_DURATION_MS);
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= 0) continue;

    defs.push(
      `<radialGradient id="g${i}" cx="50%" cy="50%" r="50%">` +
        `<stop offset="0%" stop-color="white" stop-opacity="${alpha.toFixed(3)}"/>` +
        `<stop offset="55%" stop-color="white" stop-opacity="${(alpha * 0.28).toFixed(3)}"/>` +
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

export default function AnimatedTitle({
  fontFamily,
  className,
}: {
  fontFamily: string;
  className?: string;
}) {
  const [seeds] = useState(() => buildSeeds(CHARS.length));
  const [introComplete, setIntroComplete] = useState(false);
  const kimRef    = useRef<HTMLSpanElement>(null); // wrapper around KIM
  const flagRef   = useRef<HTMLSpanElement>(null); // flag overlay inside KIM wrapper
  const marksRef  = useRef<Mark[]>([]);
  const rafRef    = useRef<number | undefined>(undefined);
  const activeRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIntroComplete(true);
      activeRef.current = true;
    }, INTRO_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!activeRef.current) return;
    const rect = kimRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    const marks = marksRef.current;

    // Refresh nearby marks — only reset lastRefresh, keep created so fade-in isn't restarted
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
    } else {
      const last = marks[marks.length - 1];
      if (!last || Math.hypot(x - last.x, y - last.y) >= MIN_MOVE_PX) {
        const next = [...marks, { x, y, created: now, lastRefresh: now }];
        marksRef.current = next.length > MAX_MARKS ? next.slice(-MAX_MARKS) : next;
      }
    }
  }, []);

  // rAF: prune expired marks, rebuild SVG mask, write directly to DOM
  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      const maxAge = MARK_LIFETIME_MS + FADE_DURATION_MS;
      const span = flagRef.current;

      // Prune marks whose lastRefresh has fully expired
      marksRef.current = marksRef.current.filter(m => now - m.lastRefresh < maxAge);

      if (span) {
        const current = marksRef.current;
        if (current.length > 0) {
          const rect = kimRef.current?.getBoundingClientRect();
          const w = rect?.width ?? 200;
          const h = rect?.height ?? 100;
          const svg = buildMaskSvg(current, w, h, now);
          if (svg) {
            const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
            span.style.setProperty("mask-image", url);
            span.style.setProperty("-webkit-mask-image", url);
            span.style.opacity = "1";
          } else {
            span.style.opacity = "0";
          }
        } else {
          span.style.opacity = "0";
          span.style.setProperty("mask-image", "none");
          span.style.setProperty("-webkit-mask-image", "none");
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
    <h1
      style={{ fontFamily, position: "relative" }}
      className={className}
    >
      {/* MATTHEW + space: plain animated letters, no overlay ever */}
      {CHARS.slice(0, KIM_START).map((char, i) => {
        const s = seeds[i];
        return (
          <motion.span
            key={i}
            data-no-trail
            className="inline-block"
            initial={{ x: s.x, y: s.y, rotate: s.rotate, scale: s.scale, opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: s.stiffness,
              damping: s.damping,
              delay: s.delay,
              opacity: { duration: 0.01, delay: s.delay },
            }}
          >
            {char === " " ? " " : char}
          </motion.span>
        );
      })}

      {/* KIM: inline-block wrapper so the flag overlay positions relative to it */}
      <span
        ref={kimRef}
        data-no-trail
        style={{ position: "relative", display: "inline-block" }}
        onMouseMove={handleMouseMove}
      >
        {/* Base KIM letters — always dark, never modified */}
        {CHARS.slice(KIM_START).map((char, i) => {
          const s = seeds[KIM_START + i];
          return (
            <motion.span
              key={KIM_START + i}
              className="inline-block"
              initial={{ x: s.x, y: s.y, rotate: s.rotate, scale: s.scale, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: s.stiffness,
                damping: s.damping,
                delay: s.delay,
                opacity: { duration: 0.01, delay: s.delay },
              }}
            >
              {char}
            </motion.span>
          );
        })}

        {/* Flag overlay — mounts after intro, hidden until hover, clipped to KIM letter shapes */}
        {introComplete && (
          <span
            ref={flagRef}
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              backgroundImage: "url('/images/korea-flag.png')",
              backgroundSize: `auto ${FLAG_SCALE * 100}%`,
              backgroundPosition: `${FLAG_X}% calc(50% + ${FLAG_Y_OFFSET}px)`,
              backgroundRepeat: "no-repeat",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {CHARS.slice(KIM_START).map((char, i) => (
              <span key={i} className="inline-block">
                {char}
              </span>
            ))}
          </span>
        )}
      </span>
    </h1>
  );
}
