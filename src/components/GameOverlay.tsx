"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { GameScene } from "@/components/game/GameScene";
import { OverworldTitleBackdrop } from "@/components/game/OverworldTitleBackdrop";

// Full-screen hidden-game overlay. Opens into the polished boot shell; Start
// switches into the playable scene. Accent color (#FED34C) matches the trigger.

type View = "menu" | "controls";
type Mode = "shell" | "scene";

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// A text-first action that mirrors the portfolio's link interactions: a clean
// hover color shift with a thin accent underline that wipes in from the center.
function MenuLink({
  children,
  onClick,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/link relative inline-flex w-fit items-center rounded-sm transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FED34C] ${
        primary
          ? "text-lg font-medium text-white hover:text-[#FED34C]"
          : "text-sm text-white/55 hover:text-white"
      }`}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-center scale-x-0 bg-[#FED34C] transition-transform duration-300 ease-out group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100 motion-reduce:transition-none"
      />
    </button>
  );
}

function ControlRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-2">
      <span className="text-white/45">{label}</span>
      <span className="text-xs text-white/75">{keys}</span>
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

      <div className="relative z-[1] w-full max-w-sm px-4">
        <AnimatePresence mode="wait" initial={false}>
          {view === "menu" && (
            <motion.div key="menu" {...panelMotion} className="flex flex-col items-center text-center">
              <h2
                className="text-5xl font-semibold tracking-tight md:text-6xl"
                style={{ textShadow: "0 1px 24px rgba(0,0,0,0.5)" }}
              >
                matthew.exe
              </h2>
              <div className="mt-10 flex flex-col items-center gap-4">
                <MenuLink primary onClick={onStart}>
                  start
                </MenuLink>
                <MenuLink onClick={() => setView("controls")}>controls</MenuLink>
              </div>
              <button
                type="button"
                onClick={close}
                className="group/exit mt-10 inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
              >
                <ArrowLeft
                  size={13}
                  strokeWidth={1.75}
                  className="transition-transform group-hover/exit:-translate-x-0.5"
                />
                back to portfolio
              </button>
            </motion.div>
          )}

          {view === "controls" && (
            <motion.div key="controls" {...panelMotion} className="flex flex-col items-center text-center">
              <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">how to play</h3>
              <div className="mt-7 w-full max-w-xs text-left">
                <p className="mb-1 text-[0.7rem] tracking-wide text-white/35">desktop</p>
                <div className="divide-y divide-white/5">
                  <ControlRow label="move" keys="WASD / arrows" />
                  <ControlRow label="interact" keys="E" />
                  <ControlRow label="back to menu" keys="esc" />
                </div>
                <p className="mt-6 mb-1 text-[0.7rem] tracking-wide text-white/35">touch</p>
                <div className="divide-y divide-white/5">
                  <ControlRow label="move" keys="on-screen d-pad" />
                  <ControlRow label="interact" keys="action button" />
                  <ControlRow label="exit" keys="close button" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setView("menu")}
                className="group/back mt-9 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50"
              >
                <ArrowLeft
                  size={14}
                  strokeWidth={1.75}
                  className="transition-transform group-hover/back:-translate-x-0.5"
                />
                back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Close Matthew.exe and return to portfolio"
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
          aria-label="Matthew.exe"
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
