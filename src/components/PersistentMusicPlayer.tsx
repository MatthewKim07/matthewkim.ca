"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useMusicPlayer } from "@/context/MusicContext";

const SPOTIFY_PLAYLIST_EMBED_URL =
  "https://open.spotify.com/embed/playlist/7xNT8ToU33ZEF2jj9uNZ1b?utm_source=generator";

function EqualizerBars({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-end gap-[2px] text-gray-400 dark:text-gray-500" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-[3px] bg-current rounded-full"
          animate={active ? { scaleY: [0.35, 1, 0.5, 0.85, 0.35] } : { scaleY: 0.35 }}
          transition={
            active
              ? { duration: 0.7 + i * 0.14, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          style={{ height: 11, originY: 1 }}
        />
      ))}
    </span>
  );
}

export function PersistentMusicPlayer() {
  const { isPanelOpen, hasActivated, isPlaying, setIsPlaying, closePanel } = useMusicPlayer();
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (!isPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPanelOpen, closePanel]);

  // Listen for Spotify embed postMessage playback events.
  // Spotify's embed sends { type: "playback_update", payload: { isPaused: bool } }
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin.includes("spotify.com")) return;
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "playback_update") {
          setIsPlaying(!data.payload?.isPaused);
        }
      } catch {
        // ignore malformed messages
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setIsPlaying]);

  if (!hasActivated) return null;

  const spring = prefersReducedMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 320, damping: 26 };

  return (
    <motion.div
      animate={
        isPanelOpen
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 18, scale: 0.96 }
      }
      transition={spring}
      style={{
        width: 320,
        maxWidth: "calc(100vw - 3rem)",
        pointerEvents: isPanelOpen ? "auto" : "none",
      }}
      className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      aria-hidden={!isPanelOpen}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <EqualizerBars active={isPlaying} />
          <span
            className="text-sm text-gray-500 dark:text-gray-400"
            style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}
          >
            currently listening
          </span>
        </div>
        <button
          onClick={closePanel}
          aria-label="close music panel"
          className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded p-0.5"
        >
          <X size={15} />
        </button>
      </div>

      {/* Never unmounted after first activation, so playback continues while hidden. */}
      <iframe
        src={SPOTIFY_PLAYLIST_EMBED_URL}
        width="100%"
        height="352"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        title="Spotify playlist"
        className="block"
      />
    </motion.div>
  );
}
