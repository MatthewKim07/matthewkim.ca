"use client";

import { useCallback } from "react";
import { useTravelPlayer } from "@/context/TravelContext";

export function TravelWord() {
  const { enter, state } = useTravelPlayer();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enter();
      }
    },
    [enter]
  );

  const disabled = state !== "idle";

  return (
    <button
      onClick={enter}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label="travel (click to open travel gallery)"
      className="cursor-pointer hover:opacity-60 transition-opacity outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded-sm disabled:opacity-40 disabled:cursor-default"
    >
      travel
    </button>
  );
}
