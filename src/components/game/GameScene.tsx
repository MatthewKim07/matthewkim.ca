"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X } from "lucide-react";
import { createGameState, step, type GameState } from "@/game/engine";
import { renderScene } from "@/game/render";
import { createInput } from "@/game/input";
import { SPAWN_ROOM } from "@/game/scenes/spawnRoom";
import type { Dialogue, SceneObject } from "@/game/types";

// React host for the playable scene. Runs the engine + renderer in one RAF loop
// and owns the DOM UI (top bar, touch controls, dialogue) so all readable
// content and controls stay accessible. The canvas itself is decorative.

function findObject(id: string | null): SceneObject | undefined {
  if (!id) return undefined;
  return SPAWN_ROOM.objects.find((o) => o.id === id);
}

export function GameScene({
  onMenu,
  onClose,
  reduceMotion,
}: {
  onMenu: () => void;
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef<ReturnType<typeof createInput> | null>(null);

  // Dialogue state mirrored into a ref so the keydown handler stays stable.
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [line, setLine] = useState(0);
  const dialogueRef = useRef<Dialogue | null>(null);
  const lineRef = useRef(0);
  useEffect(() => {
    dialogueRef.current = dialogue;
  }, [dialogue]);
  useEffect(() => {
    lineRef.current = line;
  }, [line]);

  const [hasPrompt, setHasPrompt] = useState(false);

  const [isTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
  );

  const openDialogue = useCallback((d: Dialogue) => {
    setLine(0);
    setDialogue(d);
  }, []);

  const tryInteract = useCallback(() => {
    if (dialogueRef.current) return;
    const obj = findObject(stateRef.current?.nearestId ?? null);
    if (obj?.interact) openDialogue(obj.interact.dialogue);
  }, [openDialogue]);

  const advance = useCallback(() => {
    const d = dialogueRef.current;
    if (!d) return;
    if (lineRef.current < d.lines.length - 1) setLine((l) => l + 1);
    else setDialogue(null);
  }, []);

  const closeDialogue = useCallback(() => setDialogue(null), []);

  // Engine + render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = createGameState(SPAWN_ROOM);
    stateRef.current = state;
    const input = createInput();
    inputRef.current = input;
    input.attach();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let prompt = false;
    const tick = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp after tab switch / hitches
      if (!dialogueRef.current) step(state, input.intent(), dt);
      const showPrompt = !dialogueRef.current && state.nearestId !== null;
      if (showPrompt !== prompt) {
        prompt = showPrompt;
        setHasPrompt(showPrompt);
      }
      renderScene(ctx, canvas, state, { reduceMotion, dpr, showPrompt });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      input.detach();
    };
  }, [reduceMotion]);

  // Keyboard: Esc back-stack + interact/advance. Movement keys handled in input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (dialogueRef.current) closeDialogue();
        else onMenu();
        return;
      }
      // Let buttons handle their own Enter/Space activation.
      if ((e.target as HTMLElement)?.tagName === "BUTTON") return;
      if (e.key === "e" || e.key === "E" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (dialogueRef.current) advance();
        else tryInteract();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, closeDialogue, onMenu, tryInteract]);

  // Focus the scene container on mount so keyboard play works immediately.
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const isLast = dialogue ? line >= dialogue.lines.length - 1 : false;

  return (
    <div ref={rootRef} tabIndex={-1} className="absolute inset-0 bg-gray-950 focus:outline-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="The Workshop Courtyard, a bright top-down outdoor area. Use arrow keys or WASD to move and E to interact."
        className="absolute inset-0 h-full w-full"
      />

      {/* Offscreen description for assistive tech (canvas is decorative). */}
      <p className="sr-only">
        The Workshop Courtyard: a small sunny plaza you can walk around, with a workshop building, a
        pond, trees and stone paths. It contains a workbench with a terminal, a notice board, and a
        half-built gate. Move with the arrow keys or WASD, press E near an object to read it, Escape
        to return to the menu.
      </p>

      {/* Top bar: Menu + hard close. */}
      <div
        className="absolute inset-x-0 top-0 z-20 flex items-center justify-between"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <button
          type="button"
          onClick={onMenu}
          className="rounded-md border border-white/15 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/40 hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          Menu
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Overworld and return to portfolio"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Proximity prompt. */}
      {hasPrompt && !dialogue && (
        <p className="pointer-events-none absolute inset-x-0 bottom-24 z-10 text-center text-[0.7rem] uppercase tracking-[0.25em] text-[#FED34C]">
          {isTouch ? "Tap the button" : "Press E"}
        </p>
      )}

      {/* Touch controls. */}
      {isTouch && !dialogue && (
        <TouchControls
          onDir={(dir, on) => inputRef.current?.setTouch(dir, on)}
          onAction={tryInteract}
        />
      )}

      {/* Dialogue (DOM, accessible). */}
      {dialogue && (
        <DialogueBox dialogue={dialogue} line={line} isLast={isLast} onAdvance={advance} onClose={closeDialogue} />
      )}
    </div>
  );
}

function TouchControls({
  onDir,
  onAction,
}: {
  onDir: (dir: "up" | "down" | "left" | "right", on: boolean) => void;
  onAction: () => void;
}) {
  const pad = (dir: "up" | "down" | "left" | "right", Icon: typeof ArrowUp, area: string) => (
    <button
      type="button"
      aria-label={`Move ${dir}`}
      style={{ gridArea: area, touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        onDir(dir, true);
      }}
      onPointerUp={() => onDir(dir, false)}
      onPointerLeave={() => onDir(dir, false)}
      onPointerCancel={() => onDir(dir, false)}
      className="flex items-center justify-center rounded-md bg-white/10 text-white/80 active:bg-white/25"
    >
      <Icon size={20} strokeWidth={2} />
    </button>
  );

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div
        className="grid gap-1"
        style={{
          gridTemplateAreas: '". up ." "left . right" ". down ."',
          gridAutoColumns: "44px",
          gridAutoRows: "44px",
        }}
      >
        {pad("up", ArrowUp, "up")}
        {pad("left", ArrowLeft, "left")}
        {pad("right", ArrowRight, "right")}
        {pad("down", ArrowDown, "down")}
      </div>

      <button
        type="button"
        aria-label="Interact"
        onPointerDown={(e) => {
          e.preventDefault();
          onAction();
        }}
        style={{ touchAction: "none" }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FED34C] text-sm font-semibold text-gray-950 active:bg-[#ffdf73]"
      >
        E
      </button>
    </div>
  );
}

function DialogueBox({
  dialogue,
  line,
  isLast,
  onAdvance,
  onClose,
}: {
  dialogue: Dialogue;
  line: number;
  isLast: boolean;
  onAdvance: () => void;
  onClose: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-label={dialogue.title ?? "Dialogue"}
      className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-gray-900/95 backdrop-blur-sm"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        paddingTop: "1rem",
        fontFamily: "var(--font-sf)",
      }}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        {dialogue.title && (
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[#FED34C]">
            {dialogue.title}
          </p>
        )}
        <p aria-live="polite" className="min-h-[3rem] text-sm leading-relaxed text-white/85">
          {dialogue.lines[line]}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[0.6rem] uppercase tracking-[0.25em] text-white/30">
            {line + 1} / {dialogue.lines.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              Close
            </button>
            <button
              ref={btnRef}
              type="button"
              onClick={onAdvance}
              className="rounded-md bg-[#FED34C] px-4 py-1.5 text-xs font-medium text-gray-950 transition-colors hover:bg-[#ffdf73] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FED34C]"
            >
              {isLast ? "Close" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
