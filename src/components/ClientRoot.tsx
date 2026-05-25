"use client";

import { MusicProvider } from "@/context/MusicContext";
import { PersistentMusicPlayer } from "@/components/PersistentMusicPlayer";
import { TravelProvider } from "@/context/TravelContext";
import { TravelOverlay } from "@/components/travel/TravelOverlay";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <MusicProvider>
      <TravelProvider>
        {children}
        <PersistentMusicPlayer />
        <TravelOverlay />
      </TravelProvider>
    </MusicProvider>
  );
}
