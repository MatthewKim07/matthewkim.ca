"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { sounds } from "@/lib/sounds";

const SITE_GREEN = "#5fae6b";

export function MatthewExeLauncher() {
  const { open } = useGame();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      data-no-trail
      aria-label="Play game"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={() => {
        sounds.mouseClick();
        open();
      }}
      className="cursor-pointer rounded-full border border-white/45 px-6 py-2 text-sm text-white transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] motion-reduce:transition-none dark:border-gray-900/45 dark:text-gray-900 sm:px-7 sm:py-2.5 sm:text-base"
      style={
        hovered
          ? {
              backgroundColor: SITE_GREEN,
              borderColor: SITE_GREEN,
              color: "#ffffff",
            }
          : undefined
      }
    >
      play game
    </button>
  );
}
