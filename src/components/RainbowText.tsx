"use client";

import { useState } from "react";

const RAINBOW = ["#FF4500","#FF8C00","#FFD700","#32CD32","#1E90FF","#6A0DAD","#9400D3"];

export function RainbowText({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {(() => {
        let idx = 0;
        return text.split("").map((char, i) => {
          if (char === " ") return <span key={i}> </span>;
          const color = hovered ? RAINBOW[idx++ % RAINBOW.length] : "inherit";
          return (
            <span key={i} style={{ color, transition: "color 0.2s" }}>
              {char}
            </span>
          );
        });
      })()}
    </span>
  );
}
