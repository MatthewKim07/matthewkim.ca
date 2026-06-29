"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { GameScene } from "@/components/game/GameScene";
import { OverworldTitleBackdrop } from "@/components/game/OverworldTitleBackdrop";

// Full-screen hidden-game overlay. Opens into the polished boot shell; Start
// switches into the playable scene. Accent color (#FED34C) matches the trigger.

type View = "menu" | "controls";
type Mode = "shell" | "scene";

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
    "group/btn relative flex w-full items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-sm font-medium tracking-wide transition-all focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const styles =
    variant === "primary"
      ? "bg-[#FED34C] text-gray-950 hover:bg-[#ffdf73] focus-visible:outline-[#FED34C]"
      : "border border-white/10 bg-white/[0.03] text-white/75 hover:border-white/25 hover:bg-white/[0.07] hover:text-white focus-visible:outline-white/60";
  // Leading marker that animates in on hover/focus (game-menu feel).
  const marker =
    variant === "primary"
      ? "bg-gray-950/70"
      : "bg-[#FED34C]";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      <span
        aria-hidden
        className={`h-4 w-[2px] shrink-0 origin-center scale-y-0 transition-transform duration-200 group-hover/btn:scale-y-100 group-focus-visible/btn:scale-y-100 ${marker}`}
      />
      <span>{children}</span>
    </button>
  );
}

function ControlRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5">
      <span className="text-white/50">{label}</span>
      <span className="text-xs text-white/80">{keys}</span>
    </div>
  );
}

// Boot shell. Mounted fresh each open / each return to the menu, so the view
// resets without a setState-in-effect.
function ShellContent({
  onStart,
  close,
  reduceMotion,
  dialogRef,
}: {
  onStart: () => void;
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

  // Esc closes the overlay from the shell.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const panelMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.15, ease: "easeOut" as const },
      };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
        paddingRight: "max(1.5rem, env(safe-area-inset-right))",
      }}
    >
      {/* Ambient pixel-world behind the title. */}
      <OverworldTitleBackdrop reduceMotion={reduceMotion} />
      {/* Very faint scanlines tying the UI to the retro world. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, #fff 0, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-[1] w-full max-w-sm">
        <AnimatePresence mode="wait" initial={false}>
          {view === "menu" && (
            <motion.div
              key="menu"
              {...panelMotion}
              className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/30 px-7 py-9 text-center backdrop-blur-sm"
            >
              <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.35em] text-[#FED34C]">
                <span aria-hidden className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#FED34C] motion-reduce:animate-none" />
                Hidden world initialized
              </p>
              <h2
                className="mt-5 text-5xl font-semibold tracking-tight md:text-6xl"
                style={{ textShadow: "0 0 28px rgba(254,211,76,0.25), 0 2px 0 rgba(0,0,0,0.4)" }}
              >
                Overworld
              </h2>
              <div aria-hidden className="mt-3 flex items-center gap-2">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/30" />
                <span className="h-1 w-1 rotate-45 bg-[#FED34C]" />
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/30" />
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
                A playable map of how I think, build, and grow.
              </p>
              <div className="mt-8 flex w-full max-w-[15rem] flex-col gap-2.5">
                <ShellButton variant="primary" onClick={onStart}>
                  Start
                </ShellButton>
                <ShellButton onClick={() => setView("controls")}>Controls</ShellButton>
                <ShellButton onClick={close}>Back to Portfolio</ShellButton>
              </div>
              <p className="mt-7 text-[0.65rem] uppercase tracking-[0.3em] text-white/25">
                Esc to exit
              </p>
            </motion.div>
          )}

          {view === "controls" && (
            <motion.div
              key="controls"
              {...panelMotion}
              className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/30 px-7 py-9 text-center backdrop-blur-sm"
            >
              <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[#FED34C]">Controls</p>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">How to play</h3>
              <div className="mt-7 w-full max-w-xs text-left">
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Desktop</p>
                <div className="border-t border-white/10">
                  <ControlRow label="Move" keys="WASD / Arrows" />
                  <ControlRow label="Interact" keys="E" />
                  <ControlRow label="Back to menu" keys="Esc" />
                </div>
                <p className="mt-5 mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Touch</p>
                <div className="border-t border-white/10">
                  <ControlRow label="Move" keys="On-screen D-pad" />
                  <ControlRow label="Interact" keys="Action button" />
                  <ControlRow label="Exit" keys="Close button" />
                </div>
              </div>
              <div className="mt-8 w-full max-w-[15rem]">
                <ShellButton onClick={() => setView("menu")}>Back</ShellButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Close Overworld and return to portfolio"
        className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// Holds the shell-vs-scene mode. Mounted within the open overlay so it resets to
// "shell" on each open.
function OverlayBody({
  close,
  reduceMotion,
  dialogRef,
}: {
  close: () => void;
  reduceMotion: boolean;
  dialogRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [mode, setMode] = useState<Mode>("shell");

  return mode === "shell" ? (
    <ShellContent
      onStart={() => setMode("scene")}
      close={close}
      reduceMotion={reduceMotion}
      dialogRef={dialogRef}
    />
  ) : (
    <GameScene onMenu={() => setMode("shell")} onClose={close} reduceMotion={reduceMotion} />
  );
}

export default function GameOverlay() {
  const { isOpen, close } = useGame();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Scroll lock + Tab focus trap (mode-agnostic). Esc is handled per mode.
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
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
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Overworld"
          tabIndex={-1}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 overflow-hidden bg-gray-950 text-white select-none focus:outline-none"
          style={{ fontFamily: "var(--font-sf)" }}
        >
          <OverlayBody close={close} reduceMotion={!!reduceMotion} dialogRef={dialogRef} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
