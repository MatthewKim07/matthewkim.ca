"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame, useMotionValue, animate } from "framer-motion";
import { CursorTrail } from "@/components/CursorTrail";
import { sounds } from "@/lib/sounds";

const PIVOT_X = 23;
const PIVOT_Y = 5;
const INACTIVE_ANGLE = 0;
const ACTIVE_ANGLE = 45;
const DISC_CX = 12;
const DISC_CY = 15;
const DISC_PERIOD_MS = 3500;

export function TrailControls() {
  const [active, setActive] = useState(false);

  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  const discAngle = useMotionValue(0);
  const discRef = useRef<SVGGElement>(null);
  const armAngle = useMotionValue(INACTIVE_ANGLE);
  const armRef = useRef<SVGGElement>(null);

  useAnimationFrame((_, delta) => {
    if (!activeRef.current) return;
    discAngle.set((discAngle.get() + (delta * 360) / DISC_PERIOD_MS) % 360);
  });

  useEffect(() => {
    return discAngle.on("change", (a) => {
      discRef.current?.setAttribute("transform", `rotate(${a} ${DISC_CX} ${DISC_CY})`);
    });
  }, [discAngle]);

  useEffect(() => {
    const sync = (a: number) => {
      armRef.current?.setAttribute(
        "transform",
        `translate(${PIVOT_X} ${PIVOT_Y}) rotate(${a})`
      );
    };
    sync(armAngle.get());
    return armAngle.on("change", sync);
  }, [armAngle]);

  useEffect(() => {
    animate(armAngle, active ? ACTIVE_ANGLE : INACTIVE_ANGLE, {
      type: "tween",
      duration: active ? 0.7 : 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    });
  }, [active, armAngle]);

  return (
    <>
      <button
        data-no-trail
        onClick={() => setActive((v) => { const next = !v; next ? sounds.vinylStart() : sounds.vinylStop(); return next; })}
        aria-label={active ? "Turn off music trail" : "Turn on music trail"}
        className="transition-opacity hover:opacity-70 active:opacity-50"
      >
        <svg width="64" height="56" viewBox="0 0 32 28" fill="none">
          <g ref={discRef}>
            <image
              href="/images/vinyl-record-icon.png"
              x="2" y="5" width="20" height="20"
            />
          </g>

          <g ref={armRef} transform={`translate(${PIVOT_X} ${PIVOT_Y}) rotate(${INACTIVE_ANGLE})`}>
            <line x1="0" y1="0" x2="-1.1" y2="-2.3"
              stroke="#aaa" strokeWidth="0.9" strokeLinecap="square" />
            <rect x="-1.8" y="-3.0" width="1.5" height="1.5" fill="#666" />
            <path
              d="M 0 0 Q 3 5.5 4.5 9.5"
              stroke="#aaa" strokeWidth="0.9" fill="none" strokeLinecap="square"
            />
            <line x1="4.5" y1="9.5" x2="3.7" y2="11.3"
              stroke="#ccc" strokeWidth="1.1" strokeLinecap="square" />
          </g>

          <circle cx={PIVOT_X} cy={PIVOT_Y} r="1.0" fill="#444" />
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="0.5" fill="#999" />
        </svg>
      </button>

      <CursorTrail active={active} />
    </>
  );
}
