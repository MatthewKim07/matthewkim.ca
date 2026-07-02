"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { AvatarTestScene } from "@/components/game/AvatarTestScene";
import { GameScene } from "@/components/game/GameScene";
import { RoomPrototypeScene } from "@/components/game/RoomPrototypeScene";
import { OverworldTitleBackdrop } from "@/components/game/OverworldTitleBackdrop";

// Full-screen hidden-game overlay. Opens into the polished boot shell; Start
// switches into the playable scene. Accent color (#FED34C) matches the trigger.

type View = "menu" | "controls";
type Mode = "shell" | "scene" | "avatar-test" | "room-proto";

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
  onAvatarTest,
  onRoomProto,
  close,
  reduceMotion,
  dialogRef,
}: {
  onStart: () => void;
  onAvatarTest: () => void;
  onRoomProto: () => void;
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
        if (document.fullscreenElement) return;
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
                className="text-4xl font-semibold tracking-tight md:text-5xl"
                style={{ textShadow: "0 1px 24px rgba(0,0,0,0.5)" }}
              >
                matthew.exe
              </h2>
              <div className="mt-10 flex flex-col items-center gap-4">
                <MenuLink primary onClick={onStart}>
                  start
                </MenuLink>
                <MenuLink onClick={() => setView("controls")}>controls</MenuLink>
                <button
                  type="button"
                  onClick={onAvatarTest}
                  className="mt-2 text-[0.7rem] tracking-wide text-white/35 transition-colors hover:text-[#FED34C] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FED34C]"
                >
                  dev · 3d avatar test
                </button>
                <button
                  type="button"
                  onClick={onRoomProto}
                  className="text-[0.7rem] tracking-wide text-white/35 transition-colors hover:text-[#FED34C] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FED34C]"
                >
                  dev · 3d room prototype
                </button>
              </div>
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
                  <ControlRow label="exit" keys="red window button" />
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

  if (mode === "shell") {
    return (
      <ShellContent
        onStart={() => setMode("scene")}
        onAvatarTest={() => setMode("avatar-test")}
        onRoomProto={() => setMode("room-proto")}
        close={close}
        reduceMotion={reduceMotion}
        dialogRef={dialogRef}
      />
    );
  }

  if (mode === "avatar-test") {
    return <AvatarTestScene onMenu={() => setMode("shell")} />;
  }

  if (mode === "room-proto") {
    return <RoomPrototypeScene onMenu={() => setMode("shell")} />;
  }

  return <GameScene onMenu={() => setMode("shell")} reduceMotion={reduceMotion} />;
}

const WIN_MIN_W = 380;
const WIN_MIN_H = 320;
const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function GameOverlay() {
  const { isOpen, close } = useGame();
  const reduceMotion = useReducedMotion();
  const windowRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Draggable / resizable macOS-style window geometry (remembers its place).
  const [win, setWin] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0, w: 860, h: 640 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(860, vw * 0.92);
    const h = Math.min(640, vh * 0.9);
    return { w, h, x: Math.round((vw - w) / 2), y: Math.round((vh - h) / 2) };
  });
  const dragRef = useRef<
    | null
    | { mode: "move" | "resize"; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number }
  >(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === windowRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // One pair of global listeners; they act only while a drag is in progress.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (d.mode === "move") {
        const x = clampN(d.ox + (e.clientX - d.sx), -d.ow + 120, vw - 120);
        const y = clampN(d.oy + (e.clientY - d.sy), 0, vh - 44);
        setWin((p) => ({ ...p, x, y }));
      } else {
        const w = clampN(d.ow + (e.clientX - d.sx), WIN_MIN_W, vw * 0.97);
        const h = clampN(d.oh + (e.clientY - d.sy), WIN_MIN_H, vh * 0.95);
        setWin((p) => ({ ...p, w, h }));
      }
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const beginDrag = (mode: "move" | "resize", e: React.PointerEvent) => {
    if (isFullscreen) return;
    dragRef.current = { mode, sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y, ow: win.w, oh: win.h };
  };

  const toggleFullscreen = async () => {
    const gameWindow = windowRef.current;
    if (!gameWindow) return;

    try {
      if (document.fullscreenElement === gameWindow) {
        await document.exitFullscreen();
      } else {
        await gameWindow.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by browser or iframe policy.
    }
  };

  const closeOverlay = () => {
    if (document.fullscreenElement === windowRef.current) {
      document.exitFullscreen().catch(() => {});
    }
    close();
  };

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
          role="dialog"
          aria-modal="true"
          aria-label="matthew.exe"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center select-none"
          style={{
            padding:
              "max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))",
          }}
        >
          {/* The portfolio stays visible behind: dimmed + lightly blurred. */}
          <div aria-hidden className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />

          {/* A draggable, resizable macOS-style window. */}
          <motion.div
            ref={windowRef}
            initial={reduceMotion ? false : { scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.98, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
            className={`absolute flex flex-col overflow-hidden bg-[#1b1d24] shadow-[0_30px_90px_rgba(0,0,0,0.6)] ring-1 ring-black/50 ${
              isFullscreen ? "rounded-none" : "rounded-xl"
            }`}
            style={
              isFullscreen
                ? { left: 0, top: 0, width: "100vw", height: "100vh", fontFamily: "var(--font-sf)" }
                : { left: win.x, top: win.y, width: win.w, height: win.h, fontFamily: "var(--font-sf)" }
            }
          >
            {/* title bar (drag to move) */}
            <div
              onPointerDown={(e) => beginDrag("move", e)}
              className="relative flex h-8 shrink-0 select-none items-center border-b border-black/40 bg-gradient-to-b from-[#30343d] to-[#272a32] px-3"
              style={{ touchAction: "none" }}
            >
              <div className="group/lights flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Close matthew.exe"
                  onClick={closeOverlay}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="relative h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/20 transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <svg
                    viewBox="0 0 12 12"
                    aria-hidden
                    className="absolute inset-0 opacity-0 transition-opacity group-hover/lights:opacity-100"
                  >
                    <path d="M3.5 3.5 L8.5 8.5 M8.5 3.5 L3.5 8.5" stroke="#5c0000" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Minimize unavailable"
                  disabled
                  className="relative h-3 w-3 cursor-default rounded-full bg-[#febc2e] ring-1 ring-black/20"
                >
                  <svg
                    viewBox="0 0 12 12"
                    aria-hidden
                    className="absolute inset-0 opacity-0 transition-opacity group-hover/lights:opacity-100"
                  >
                    <path d="M3 6 H9" stroke="#6b4a00" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={isFullscreen ? "Exit fullscreen matthew.exe" : "Enter fullscreen matthew.exe"}
                  onClick={toggleFullscreen}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="relative h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/20 transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <svg
                    viewBox="0 0 12 12"
                    aria-hidden
                    className="absolute inset-0 opacity-0 transition-opacity group-hover/lights:opacity-100"
                    fill="#004d00"
                  >
                    <path d="M2.6 2.6 L7.9 2.6 L2.6 7.9 Z" />
                    <path d="M9.4 9.4 L4.1 9.4 L9.4 4.1 Z" />
                  </svg>
                </button>
              </div>
              <span className="pointer-events-none absolute inset-x-0 text-center text-xs font-medium text-white/55">
                matthew.exe
              </span>
            </div>

            {/* the one and only screen */}
            <div className="relative flex-1 overflow-hidden bg-[#0b0d12] text-white">
              <div ref={dialogRef} tabIndex={-1} className="absolute inset-0 focus:outline-none">
                <OverlayBody close={closeOverlay} reduceMotion={!!reduceMotion} dialogRef={dialogRef} />
              </div>
            </div>

            {/* resize grip (bottom-right) */}
            {!isFullscreen && (
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  beginDrag("resize", e);
                }}
                className="absolute bottom-0 right-0 z-40 flex h-5 w-5 cursor-se-resize items-end justify-end p-1"
                style={{ touchAction: "none" }}
                aria-hidden
              >
                <span className="block h-2.5 w-2.5 border-b-2 border-r-2 border-white/30" />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
