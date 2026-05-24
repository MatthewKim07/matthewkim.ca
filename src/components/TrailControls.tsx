"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useMotionValue, animate } from "framer-motion";
import { CursorTrail } from "@/components/CursorTrail";

const PIVOT_X       = 23;
const PIVOT_Y       = 5;
const INACTIVE_ANGLE = 0;
const ACTIVE_ANGLE   = 45;

const DISC_OX = `${(12 / 32) * 100}%`; // 37.5%
const DISC_OY = `${(15 / 28) * 100}%`; // 53.571%

export function TrailControls() {
  const [active, setActive] = useState(false);
  const discControls = useAnimationControls();
  const armAngle = useMotionValue(INACTIVE_ANGLE);
  const armRef   = useRef<SVGGElement>(null);

  useEffect(() => {
    const setTransform = (a: number) => {
      armRef.current?.setAttribute(
        "transform",
        `translate(${PIVOT_X} ${PIVOT_Y}) rotate(${a})`
      );
    };
    setTransform(armAngle.get());
    return armAngle.on("change", setTransform);
  }, [armAngle]);

  useEffect(() => {
    if (active) {
      discControls.start({
        rotate: 360,
        transition: { duration: 3.5, ease: "linear", repeat: Infinity, repeatType: "loop" },
      });
      animate(armAngle, ACTIVE_ANGLE, { type: "tween", duration: 0.7, ease: [0.25, 0.1, 0.25, 1] });
    } else {
      discControls.stop();
      animate(armAngle, INACTIVE_ANGLE, { type: "tween", duration: 0.5, ease: [0.25, 0.1, 0.25, 1] });
    }
  }, [active, discControls, armAngle]);

  return (
    <>
      <button
        data-no-trail
        onClick={() => setActive((v) => !v)}
        aria-label={active ? "Turn off music trail" : "Turn on music trail"}
        className="transition-opacity hover:opacity-70 active:opacity-50"
      >
        <svg
          width="64"
          height="56"
          viewBox="0 0 32 28"
          fill="none"
          style={{ imageRendering: "pixelated" }}
          shapeRendering="crispEdges"
        >
          <motion.g
            animate={discControls}
            style={{ transformOrigin: `${DISC_OX} ${DISC_OY}` }}
          >
            <circle cx="12" cy="15" r="10"  fill="#111" />
            <circle cx="12" cy="15" r="8.5" fill="none" stroke="#1c1c1c" strokeWidth="0.6" />
            <circle cx="12" cy="15" r="6.5" fill="none" stroke="#222"   strokeWidth="0.6" />
            <circle cx="12" cy="15" r="4.5" fill="none" stroke="#1c1c1c" strokeWidth="0.6" />
            <circle cx="12" cy="15" r="3"   fill="none" stroke="#222"   strokeWidth="0.6" />
            <circle cx="12" cy="15" r="2.5" fill={active ? "#c0391e" : "#3a3a3a"} />
            <rect x="9.5"  y="14.5" width="5" height="1" fill={active ? "#9b2d18" : "#2a2a2a"} />
            <rect x="11.5" y="12.5" width="1" height="1" fill={active ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.1)"} />
            <circle cx="12" cy="15" r="0.9" fill="#d5d5d5" />
          </motion.g>

          <circle cx="12" cy="15" r="10" fill="none" stroke="#2a2a2a" strokeWidth="0.35" />

          <g
            ref={armRef}
            transform={`translate(${PIVOT_X} ${PIVOT_Y}) rotate(${INACTIVE_ANGLE})`}
          >
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
