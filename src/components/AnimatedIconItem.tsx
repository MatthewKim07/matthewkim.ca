"use client";

import { motion, useReducedMotion, type Target, type Transition } from "framer-motion";
import { Handshake, Lightbulb, Trophy, Star, Briefcase, type LucideIcon } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

export type IconName = "handshake" | "lightbulb" | "trophy" | "star" | "briefcase";

const ICONS: Record<IconName, LucideIcon> = {
  handshake: Handshake,
  lightbulb: Lightbulb,
  trophy: Trophy,
  star: Star,
  briefcase: Briefcase,
};

const REST: Target = {
  rotate: 0,
  rotateY: 0,
  scale: 1,
  y: 0,
  opacity: 1,
  filter: "drop-shadow(0 0 0px rgba(0,0,0,0))",
};

type IconConfig = {
  /** transform / glow keyframes on the wrapper */
  motion: Target;
  transition: Transition;
  /** stroke color (currentColor) applied to the icon while active */
  color?: string;
  /** fill applied to the icon while active (outline icons like the star) */
  fill?: string;
};

// Each icon gets a hover timeline tuned to what it represents.
const CONFIGS: Record<IconName, IconConfig> = {
  // Two hands meeting: a brisk up/down rock like an actual handshake.
  handshake: {
    motion: { rotate: [0, -16, 13, -11, 8, -4, 0], y: [0, -1.5, 1.5, -1, 0.5, 0] },
    transition: { duration: 0.62, ease: "easeInOut" },
  },
  // Bulb switching on: warm amber, a soft glow, and a quick flicker-to-steady.
  lightbulb: {
    motion: {
      scale: [1, 1.18, 1.06],
      opacity: [1, 0.55, 1, 0.75, 1],
      filter: [
        "drop-shadow(0 0 0px rgba(245,179,1,0))",
        "drop-shadow(0 0 7px rgba(245,179,1,0.85))",
      ],
    },
    transition: { duration: 0.5, ease: "easeOut" },
    color: "#F5B301",
  },
  // Trophy being rung: a gold tint with a settling side-to-side swing.
  trophy: {
    motion: {
      rotate: [0, -13, 13, -11, 9, -6, 4, 0],
      filter: [
        "drop-shadow(0 0 0px rgba(255,200,61,0))",
        "drop-shadow(0 0 8px rgba(255,200,61,0.85))",
      ],
    },
    transition: { duration: 0.72, ease: "easeInOut" },
    color: "#FFC83D",
  },
  // Star: fills yellow and spins a full turn with a little pop.
  star: {
    motion: {
      rotateY: [0, 360],
      scale: [1, 1.35, 1],
      filter: [
        "drop-shadow(0 0 0px rgba(250,204,21,0))",
        "drop-shadow(0 0 7px rgba(250,204,21,0.8))",
      ],
    },
    transition: { duration: 0.6, ease: "easeInOut" },
    color: "#FACC15",
    fill: "#FACC15",
  },
  // Briefcase: turns leather brown with a small lid-pop bob.
  briefcase: {
    motion: { y: [0, -2.5, 0], scale: [1, 1.12, 1], rotate: [0, -5, 4, 0] },
    transition: { duration: 0.5, ease: "easeOut" },
    color: "#8B5E3C",
  },
};

// Hand-drawn "shine" lines that burst out around the bulb when it lights up.
function LightRays({ active }: { active: boolean }) {
  const C = 13; // center of the 26x26 overlay
  // angles in degrees, 0 = straight up, sweeping the top hemisphere only
  const angles = [0, 42, -42, 78, -78];
  const ri = 8.5;
  const ro = 12.5;

  return (
    <motion.svg
      width={26}
      height={26}
      viewBox="0 0 26 26"
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ x: "-50%", y: "-58%" }}
      initial={false}
      animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-hidden
    >
      {angles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const dx = Math.sin(rad);
        const dy = -Math.cos(rad);
        return (
          <line
            key={i}
            x1={C + dx * ri}
            y1={C + dy * ri}
            x2={C + dx * ro}
            y2={C + dy * ro}
            stroke="#F5B301"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        );
      })}
    </motion.svg>
  );
}

export function AnimatedIconItem({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();
  const Icon = ICONS[icon];
  const config = CONFIGS[icon];

  // With reduced motion we keep the meaningful color/fill change but drop the
  // transform and flicker keyframes.
  const animate: Target = active && !reduceMotion ? config.motion : REST;
  const transition = active && !reduceMotion ? config.transition : { duration: 0.3 };

  const iconStyle: CSSProperties = {
    transition: "color 0.35s ease, fill 0.35s ease",
    color: active ? config.color : undefined,
    fill: active ? config.fill : undefined,
  };

  const activate = () => setActive(true);
  const deactivate = () => setActive(false);

  return (
    <li
      className="flex items-center gap-2.5"
      onMouseEnter={activate}
      onMouseLeave={deactivate}
      onFocus={activate}
      onBlur={deactivate}
    >
      <span className="relative shrink-0 inline-flex">
        <motion.span
          className="inline-flex"
          animate={animate}
          transition={transition}
          style={{ transformOrigin: "50% 80%", transformPerspective: 400 }}
          aria-hidden
        >
          <Icon size={15} className="text-gray-500 dark:text-gray-400" style={iconStyle} />
        </motion.span>
        {icon === "lightbulb" && !reduceMotion && <LightRays active={active} />}
      </span>
      {children}
    </li>
  );
}
