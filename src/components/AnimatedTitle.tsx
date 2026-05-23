"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const NAME = "Matthew Kim";
const CHARS = NAME.split("");

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

export default function AnimatedTitle({ fontFamily, className }: { fontFamily: string; className?: string }) {
  const [seeds] = useState(() => buildSeeds(CHARS.length));

  return (
    <h1
      style={{ fontFamily }}
      className={className}
    >
      {CHARS.map((char, i) => {
        const s = seeds[i];
        return (
          <motion.span
            key={i}
            className="inline-block"
            initial={{
              x: s.x,
              y: s.y,
              rotate: s.rotate,
              scale: s.scale,
              opacity: 0,
            }}
            animate={{
              x: 0,
              y: 0,
              rotate: 0,
              scale: 1,
              opacity: 1,
            }}
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
    </h1>
  );
}
