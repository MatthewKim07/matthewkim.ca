"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { MusicProvider } from "@/context/MusicContext";
import { PersistentMusicPlayer } from "@/components/PersistentMusicPlayer";
import { TravelProvider } from "@/context/TravelContext";
import { TravelOverlay } from "@/components/travel/TravelOverlay";
import { DarkModeCursor } from "@/components/DarkModeCursor";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MusicProvider>
        <TravelProvider>
          {children}
          <DarkModeCursor />
          <PersistentMusicPlayer />
          <TravelOverlay />
        </TravelProvider>
      </MusicProvider>
    </ThemeProvider>
  );
}
