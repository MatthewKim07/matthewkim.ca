"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sounds } from "@/lib/sounds";

// Constants
const BALL_RADIUS      = 20;    // px, physics radius; display diameter = 2x
const GRAVITY          = 0.28;  // px/frame^2, downward pull
const RESTITUTION      = 0.72;  // velocity fraction kept on any bounce
const LINEAR_DAMPING   = 0.998; // per-frame horizontal drag
const SPAWN_VX         = 4.5;   // px/frame, horizontal launch speed
const SPAWN_VY         = -11;   // px/frame, upward launch velocity
const GRACE_MS         = 450;   // ms, skip DOM collisions after spawn
const SPIN_MULT        = 1.4;   // rotation degrees per px of horizontal movement
const SPAWN_ANIM_MS    = 280;   // ms, pop-in scale animation duration
const LIFETIME_MS      = 10000; // ms, total ball lifetime
const FADE_START_MS    = 8000;  // ms, when fade begins
const FADE_DURATION_MS = 2000;  // ms, fade duration
const COLLIDER_SEL          = "[data-basketball-collider]"; // marks solid page elements
const MAX_BALLS             = 5;    // max concurrent balls
const BALL_COLLISION_DAMPING = 0.88; // energy kept on ball-to-ball bounce
const MAX_BALL_SPEED        = 18;   // px/frame, post-collision speed cap

interface Ball {
  id: string;
  x: number; y: number;
  vx: number; vy: number;
  rotation: number;
  opacity: number;
  scale: number;
  startTime: number;
  bounceCount: number;
  lastBounceTime: number;
}

let _id = 0;

function getColliders(): DOMRect[] {
  return Array.from(document.querySelectorAll<HTMLElement>(COLLIDER_SEL))
    .map(el => el.getBoundingClientRect())
    .filter(r => r.width > 0 && r.height > 0);
}

// Circle-AABB collision: returns outward normal + penetration depth, or null.
// When center is inside rect, escapes through the closest edge (not always up).
function circleRect(
  cx: number, cy: number, r: number, rect: DOMRect
): { nx: number; ny: number; pen: number } | null {
  const clampedX = Math.max(rect.left, Math.min(cx, rect.right));
  const clampedY = Math.max(rect.top,  Math.min(cy, rect.bottom));
  const dx = cx - clampedX;
  const dy = cy - clampedY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= r * r) return null;
  const dist = Math.sqrt(distSq);
  if (dist < 0.001) {
    // Center is inside rect, so escape through the closest edge.
    const dL = cx - rect.left;
    const dR = rect.right  - cx;
    const dT = cy - rect.top;
    const dB = rect.bottom - cy;
    const m  = Math.min(dL, dR, dT, dB);
    if (m === dL) return { nx: -1, ny: 0, pen: r + dL };
    if (m === dR) return { nx:  1, ny: 0, pen: r + dR };
    if (m === dT) return { nx: 0, ny: -1, pen: r + dT };
    return                 { nx: 0, ny:  1, pen: r + dB };
  }
  return { nx: dx / dist, ny: dy / dist, pen: r - dist };
}

export function BasketballWord() {
  const [balls, setBalls] = useState<Ball[]>([]);
  const ballsRef  = useRef<Map<string, Ball>>(new Map());
  const collidersRef = useRef<DOMRect[]>([]);
  const rafRef    = useRef<number | null>(null);
  const tickRef   = useRef<(now: number) => void>(() => {});
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const refresh = () => { collidersRef.current = getColliders(); };
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, { passive: true });
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const tick = useCallback((now: number) => {
    if (ballsRef.current.size === 0) { rafRef.current = null; return; }

    const W = window.innerWidth;
    const H = window.innerHeight;
    const r = BALL_RADIUS;
    const toDelete: string[] = [];
    const colliders = collidersRef.current;

    ballsRef.current.forEach((b, id) => {
      const elapsed = now - b.startTime;

      // Pop-in scale with slight overshoot
      if (elapsed < SPAWN_ANIM_MS) {
        const t = elapsed / SPAWN_ANIM_MS;
        b.scale = t < 0.6 ? (t / 0.6) * 1.15 : 1.15 - ((t - 0.6) / 0.4) * 0.15;
      } else {
        b.scale = 1;
      }

      // Physics — 3 substeps for stable narrow-gap collision resolution
      const NUM_SUBSTEPS = 3;
      const dampPerStep = Math.pow(LINEAR_DAMPING, 1 / NUM_SUBSTEPS);
      const preVy = b.vy;
      for (let step = 0; step < NUM_SUBSTEPS; step++) {
        b.vy += GRAVITY / NUM_SUBSTEPS;
        b.vx *= dampPerStep;
        b.x  += b.vx / NUM_SUBSTEPS;
        b.y  += b.vy / NUM_SUBSTEPS;

        // Viewport walls
        if (b.x - r < 0)  { b.x = r;     b.vx =  Math.abs(b.vx) * RESTITUTION; }
        if (b.x + r > W)  { b.x = W - r; b.vx = -Math.abs(b.vx) * RESTITUTION; }
        if (b.y - r < 0)  { b.y = r;     b.vy =  Math.abs(b.vy) * RESTITUTION; }
        if (b.y + r > H)  { b.y = H - r; b.vy = -Math.abs(b.vy) * RESTITUTION; }

        // DOM element collisions (skipped during grace period so ball can escape spawn area)
        if (elapsed > GRACE_MS) {
          for (const rect of colliders) {
            const hit = circleRect(b.x, b.y, r, rect);
            if (!hit) continue;
            b.x += hit.nx * (hit.pen + 0.5);
            b.y += hit.ny * (hit.pen + 0.5);
            const dot = b.vx * hit.nx + b.vy * hit.ny;
            if (dot < 0) {
              b.vx -= (1 + RESTITUTION) * dot * hit.nx;
              b.vy -= (1 + RESTITUTION) * dot * hit.ny;
            }
          }
        }
      }
      // Bounce sound: vy flipped from downward to upward with enough speed
      if (preVy > 1.5 && b.vy < -1.5) {
        const nowMs = performance.now();
        if (nowMs - b.lastBounceTime > 120) {
          b.lastBounceTime = nowMs;
          b.bounceCount += 1;
          sounds.basketballBounce(b.bounceCount);
        }
      }

      b.rotation += b.vx * SPIN_MULT;

      // Fade
      b.opacity = elapsed >= FADE_START_MS
        ? Math.max(0, 1 - (elapsed - FADE_START_MS) / FADE_DURATION_MS)
        : 1;

      if (elapsed >= LIFETIME_MS) toDelete.push(id);
    });

    toDelete.forEach(id => ballsRef.current.delete(id));

    // Ball-to-ball collision
    const ballArray = Array.from(ballsRef.current.values());
    for (let i = 0; i < ballArray.length; i++) {
      for (let j = i + 1; j < ballArray.length; j++) {
        const a = ballArray[i];
        const b = ballArray[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        const minDist = r * 2;
        if (distSq >= minDist * minDist) continue;
        const dist = Math.sqrt(distSq);
        const nx = dist < 0.001 ? 1 : dx / dist;
        const ny = dist < 0.001 ? 0 : dy / dist;
        const overlap = minDist - dist;
        a.x += nx * overlap / 2;
        a.y += ny * overlap / 2;
        b.x -= nx * overlap / 2;
        b.y -= ny * overlap / 2;
        const relVx = a.vx - b.vx;
        const relVy = a.vy - b.vy;
        const dot = relVx * nx + relVy * ny;
        if (dot < 0) {
          const imp = -(1 + BALL_COLLISION_DAMPING) / 2 * dot;
          a.vx += imp * nx; a.vy += imp * ny;
          b.vx -= imp * nx; b.vy -= imp * ny;
        }
      }
    }
    ballsRef.current.forEach(b => {
      const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (spd > MAX_BALL_SPEED) {
        b.vx = b.vx / spd * MAX_BALL_SPEED;
        b.vy = b.vy / spd * MAX_BALL_SPEED;
      }
    });

    setBalls(Array.from(ballsRef.current.values()).map(b => ({ ...b })));

    if (ballsRef.current.size > 0) {
      rafRef.current = requestAnimationFrame(tickRef.current);
    } else {
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const launch = useCallback(
    (wordRect: DOMRect) => {
      if (ballsRef.current.size >= MAX_BALLS) return;
      collidersRef.current = getColliders();
      const dir = Math.random() > 0.5 ? 1 : -1;
      const id = String(_id++);
      const ball: Ball = {
        id,
        x: wordRect.left + wordRect.width / 2,
        y: wordRect.top,
        vx: dir * SPAWN_VX * (0.8 + Math.random() * 0.4),
        vy: SPAWN_VY * (0.85 + Math.random() * 0.3),
        rotation: 0,
        opacity: 1,
        scale: 0,
        startTime: performance.now(),
        bounceCount: 0,
        lastBounceTime: 0,
      };
      sounds.basketballLaunch();
      ballsRef.current.set(id, ball);
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tickRef.current);
      }
    },
    []
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedRef.current) return;
    launch(e.currentTarget.getBoundingClientRect());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (reducedRef.current) return;
    launch(e.currentTarget.getBoundingClientRect());
  };

  return (
    <>
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="cursor-pointer hover:text-orange-500 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded-sm"
        aria-label="basketball (click for a surprise)"
      >
        basketball
      </button>

      {balls.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
          {balls.map(b => (
            <div
              key={b.id}
              style={{
                position: "absolute",
                left: b.x - BALL_RADIUS,
                top:  b.y - BALL_RADIUS,
                width:  BALL_RADIUS * 2,
                height: BALL_RADIUS * 2,
                opacity: b.opacity,
                transform: `scale(${b.scale}) rotate(${b.rotation}deg)`,
                transformOrigin: "center",
                willChange: "transform",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/basketball-icon.png"
                width={BALL_RADIUS * 2}
                height={BALL_RADIUS * 2}
                alt=""
                draggable={false}
                style={{ display: "block", userSelect: "none" }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
