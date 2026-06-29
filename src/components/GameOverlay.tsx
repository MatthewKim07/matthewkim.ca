"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useGame } from "@/context/GameContext";

// Phase 1 placeholder. Full-screen overlay that proves the open/close pipeline:
// scroll lock, focus management, Escape + button close. No game yet.
export default function GameOverlay() {
  const { isOpen, close } = useGame();
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll while open; restore exactly on close.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the overlay.
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Overworld"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white select-none"
      style={{ fontFamily: "var(--font-sf)" }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label="Close Overworld and return to portfolio"
        className="absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 transition-colors"
      >
        <X size={16} strokeWidth={1.5} />
      </button>

      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Overworld</h2>
      <p className="mt-3 text-sm text-white/50">a small world inside Matthew</p>
      <p className="mt-8 text-xs text-white/30">coming soon</p>
    </motion.div>
  );
}
