"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { MusicProvider } from "@/context/MusicContext";
import { PersistentMusicPlayer } from "@/components/PersistentMusicPlayer";
import { TravelProvider } from "@/context/TravelContext";
import { TravelOverlay } from "@/components/travel/TravelOverlay";
import { DarkModeCursor } from "@/components/DarkModeCursor";
import { GameProvider } from "@/context/GameContext";
import { GameOverlayMount } from "@/components/GameOverlayMount";
import { GAME_ENABLED } from "@/game/config";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MusicProvider>
        <TravelProvider>
          <GameProvider>
            {children}
            <DarkModeCursor />
            <PersistentMusicPlayer />
            <TravelOverlay />
            {GAME_ENABLED && <GameOverlayMount />}
          </GameProvider>
        </TravelProvider>
      </MusicProvider>
    </ThemeProvider>
  );
}
