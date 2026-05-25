"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type TravelState = "idle" | "transitioning-in" | "gallery" | "transitioning-out";

interface TravelContextValue {
  state: TravelState;
  enter: () => void;
  exit: () => void;
  /** called by the overlay when the enter animation finishes */
  _advanceToGallery: () => void;
  /** called by the overlay when the exit animation finishes */
  _advanceToIdle: () => void;
}

const TravelContext = createContext<TravelContextValue | null>(null);

export function TravelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TravelState>("idle");

  const enter             = useCallback(() => setState((s) => s === "idle" ? "transitioning-in" : s), []);
  const exit              = useCallback(() => setState((s) => s === "gallery" ? "transitioning-out" : s), []);
  const _advanceToGallery = useCallback(() => setState("gallery"), []);
  const _advanceToIdle    = useCallback(() => setState("idle"), []);

  return (
    <TravelContext.Provider value={{ state, enter, exit, _advanceToGallery, _advanceToIdle }}>
      {children}
    </TravelContext.Provider>
  );
}

export function useTravelPlayer() {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error("useTravelPlayer must be used within TravelProvider");
  return ctx;
}
