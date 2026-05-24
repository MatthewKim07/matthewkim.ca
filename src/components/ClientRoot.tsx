"use client";

import { MusicProvider } from "@/context/MusicContext";
import { PersistentMusicPlayer } from "@/components/PersistentMusicPlayer";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <MusicProvider>
      {children}
      <PersistentMusicPlayer />
    </MusicProvider>
  );
}
