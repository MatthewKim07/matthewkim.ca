"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";

// Wraps the "Matthew" letters of the hero title in a focusable control that
// opens the game. Renders the letters as-is so their per-letter Framer Motion
// intro is untouched. "Kim" stays outside this wrapper, keeping its existing
// Korea-flag easter egg.
//
// Hidden-but-discoverable: identical to the title at rest. On hover/focus the
// whole word lifts slightly, picks up a warm drop-shadow, and a soft accent
// glow (#FED34C, the same accent used elsewhere on the site) blooms behind it,
// so it reads as clearly interactive without shouting "button". Reduced motion
// keeps the static glow and drops the lift/animation.
export function MatthewTrigger({ children }: { children: React.ReactNode }) {
  const { state, open } = useGame();
  const ref = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Return focus to the trigger when the overlay closes (focus handshake).
  useEffect(() => {
    if (state !== "idle") {
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      ref.current?.focus();
    }
  }, [state]);

  return (
    <button
      ref={ref}
      type="button"
      data-no-trail
      aria-label="Enter Matthew.exe"
      onClick={open}
      // Inherit all type styling so the title looks visually unchanged at rest.
      style={{ font: "inherit", letterSpacing: "inherit", color: "inherit" }}
      className="group relative isolate inline-block appearance-none border-0 bg-transparent p-0 m-0 align-baseline focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FED34C]"
    >
      {/* Soft accent glow behind the word. Absolute + z-0 so it never shifts
          layout and sits beneath the letters. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -inset-y-3 z-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(254,211,76,0.45),transparent_70%)] opacity-0 blur-xl scale-90 transition-[opacity,transform] duration-300 ease-out group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 motion-reduce:scale-100 motion-reduce:blur-lg motion-reduce:transition-none"
      />
      {/* Letters lift and gain a warm shadow on hover; sits above the glow. */}
      <span className="relative z-10 inline-block transition-[transform,filter] duration-300 ease-out group-hover:-translate-y-px group-hover:[filter:drop-shadow(0_1px_10px_rgba(254,211,76,0.5))] group-focus-visible:-translate-y-px group-focus-visible:[filter:drop-shadow(0_1px_10px_rgba(254,211,76,0.5))] motion-reduce:translate-y-0 motion-reduce:transition-none">
        {children}
      </span>
    </button>
  );
}
