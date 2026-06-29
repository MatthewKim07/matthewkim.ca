"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { GameContextValue, GameState } from "@/game/types";

// Lightweight open/close state for the hidden game, modeled after
// TravelContext. The heavy overlay/engine lives elsewhere and is code-split;
// this provider only holds a small state machine.
const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>("idle");

  // Phase 1 jumps straight idle <-> playing. The opening/closing transition
  // states are wired in a later phase via additional _advance* handlers.
  const open  = useCallback(() => setState((s) => (s === "idle" ? "playing" : s)), []);
  const close = useCallback(() => setState("idle"), []);

  const value = useMemo<GameContextValue>(
    () => ({ state, isOpen: state !== "idle", open, close }),
    [state, open, close]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
