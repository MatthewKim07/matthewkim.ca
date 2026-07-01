"use client";

import { useGame } from "@/context/GameContext";
import { sounds } from "@/lib/sounds";

export function MatthewExeLauncher() {
  const { open } = useGame();

  return (
    <button
      type="button"
      data-no-trail
      aria-label="Play matthew.exe"
      onClick={() => {
        sounds.mouseClick();
        open();
      }}
      className="w-full bg-black px-6 py-4 text-center text-sm text-white hover:underline focus:outline-none focus-visible:underline sm:text-base"
      style={{ fontFamily: "var(--font-sf)" }}
    >
      matthew.exe
    </button>
  );
}
