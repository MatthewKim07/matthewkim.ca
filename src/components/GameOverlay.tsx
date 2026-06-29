"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useGame } from "@/context/GameContext";

// Phase 2: a polished full-screen boot/start screen for the hidden game.
// No gameplay, canvas, sound, or construction transition yet — this is the
// entrance shell only. Accent color (#FED34C) matches the portfolio trigger.

type View = "menu" | "start" | "controls";

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function ShellButton({
  children,
  onClick,
  variant = "secondary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const base =
    "w-full rounded-md px-5 py-3 text-sm font-medium tracking-wide transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const styles =
    variant === "primary"
      ? "bg-[#FED34C] text-gray-950 hover:bg-[#ffdf73] focus-visible:outline-[#FED34C]"
      : "border border-white/15 text-white/80 hover:border-white/40 hover:text-white focus-visible:outline-white/60";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function ControlRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5">
      <span className="text-white/50">{label}</span>
      <span className="font-mono text-xs text-white/80">{keys}</span>
    </div>
  );
}

// Inner shell holds the view state. Mounted fresh on each open, so the view
// always resets to "menu" without a setState-in-effect.
function ShellContent({
  close,
  reduceMotion,
  dialogRef,
}: {
  close: () => void;
  reduceMotion: boolean;
  dialogRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [view, setView] = useState<View>("menu");

  // Focus the first meaningful control on mount and whenever the view changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [view, dialogRef]);

  const panelMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.15, ease: "easeOut" as const },
      };

  return (
    <div className="relative z-[1] w-full max-w-md">
      <AnimatePresence mode="wait" initial={false}>
        {view === "menu" && (
          <motion.div key="menu" {...panelMotion} className="flex flex-col items-center text-center">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-[#FED34C]">
              Hidden world initialized
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Overworld</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              A playable map of how I think, build, and grow.
            </p>
            <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
              <ShellButton variant="primary" onClick={() => setView("start")}>
                Start
              </ShellButton>
              <ShellButton onClick={() => setView("controls")}>Controls</ShellButton>
              <ShellButton onClick={close}>Back to Portfolio</ShellButton>
            </div>
            <p className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-white/25">
              Esc to exit
            </p>
          </motion.div>
        )}

        {view === "start" && (
          <motion.div key="start" {...panelMotion} className="flex flex-col items-center text-center">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-[#FED34C]">
              Spawn point
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">Under construction</h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              Spawn Point is under construction. The world is still being built.
            </p>
            <div className="mt-9 w-full max-w-xs">
              <ShellButton onClick={() => setView("menu")}>Back</ShellButton>
            </div>
          </motion.div>
        )}

        {view === "controls" && (
          <motion.div key="controls" {...panelMotion} className="flex flex-col items-center text-center">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-[#FED34C]">Controls</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">How to play</h3>
            <div className="mt-7 w-full max-w-xs text-left">
              <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Desktop</p>
              <div className="border-t border-white/10">
                <ControlRow label="Move" keys="WASD / Arrows" />
                <ControlRow label="Interact" keys="E" />
                <ControlRow label="Exit" keys="Esc" />
              </div>
              <p className="mt-5 mb-1 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Touch</p>
              <div className="border-t border-white/10">
                <ControlRow label="Move" keys="On-screen D-pad" />
                <ControlRow label="Interact" keys="Action button" />
                <ControlRow label="Exit" keys="Close button" />
              </div>
            </div>
            <div className="mt-8 w-full max-w-xs">
              <ShellButton onClick={() => setView("menu")}>Back</ShellButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GameOverlay() {
  const { isOpen, close } = useGame();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Scroll lock + Escape (always closes from anywhere) + Tab focus trap.
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const f = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Overworld"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gray-950 text-white select-none"
          style={{
            fontFamily: "var(--font-sf)",
            paddingTop: "max(1.5rem, env(safe-area-inset-top))",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
            paddingRight: "max(1.5rem, env(safe-area-inset-right))",
          }}
        >
          {/* Subtle retro texture: soft accent bloom + vignette + faint scanlines. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(254,211,76,0.06), transparent 60%), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6))",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, #fff 0, #fff 1px, transparent 1px, transparent 3px)",
            }}
          />

          {/* Content first so the first focusable control is Start, not the close button. */}
          <ShellContent close={close} reduceMotion={!!reduceMotion} dialogRef={dialogRef} />

          <button
            type="button"
            onClick={close}
            aria-label="Close Overworld and return to portfolio"
            className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
