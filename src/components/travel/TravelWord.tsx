"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTravelPlayer } from "@/context/TravelContext";
import { sounds } from "@/lib/sounds";

export function TravelWord() {
  const { enter, state } = useTravelPlayer();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state !== "transitioning-out" && state !== "idle") return;
    const id = setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 0);
    return () => clearTimeout(id);
  }, [state]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (state !== "idle") return;
        sounds.planeFlyby();
        enter();
      }
    },
    [enter, state]
  );

  // Anything but idle means a transition owns the screen. Leaving the exit out
  // of this let a click during the landing play the flyby sound while enter()
  // quietly refused, which read as the trigger being broken.
  const disabled = state !== "idle";

  return (
    <button
      ref={btnRef}
      onClick={() => { if (state !== "idle") return; sounds.planeFlyby(); enter(); }}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label="travel (click to open travel gallery)"
      className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded-sm disabled:opacity-40 disabled:cursor-default"
    >
      travel
    </button>
  );
}
