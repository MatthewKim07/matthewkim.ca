"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface MusicContextValue {
  isPanelOpen: boolean;
  hasActivated: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const openPanel = useCallback(() => {
    setHasActivated(true);
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const togglePanel = useCallback(() => {
    setHasActivated(true);
    setIsPanelOpen((o) => !o);
  }, []);

  return (
    <MusicContext.Provider
      value={{ isPanelOpen, hasActivated, isPlaying, setIsPlaying, openPanel, closePanel, togglePanel }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicProvider");
  return ctx;
}
