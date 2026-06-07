"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { useMusicPlayer } from "@/context/MusicContext";
import { sounds } from "@/lib/sounds";

function EqualizerBars({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-end gap-[2px] mb-[1px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-[3px] bg-current rounded-full"
          animate={active ? { scaleY: [0.35, 1, 0.5, 0.85, 0.35] } : { scaleY: 0.35 }}
          transition={
            active
              ? { duration: 0.7 + i * 0.14, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          style={{ height: 11, originY: 1 }}
        />
      ))}
    </span>
  );
}

export function MusicWord() {
  const { isPanelOpen, isPlaying, togglePanel } = useMusicPlayer();

  const handleClick = useCallback(() => {
    sounds.musicClick();
    togglePanel();
  }, [togglePanel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={isPanelOpen ? "close music panel" : "music (click to open playlist)"}
      aria-expanded={isPanelOpen}
      className="cursor-pointer hover:text-green-500 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded-sm inline-flex items-center gap-1.5"
    >
      music
      <EqualizerBars active={isPlaying} />
    </button>
  );
}
