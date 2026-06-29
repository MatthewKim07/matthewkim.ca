"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X } from "lucide-react";
import { createGameState, step, type GameState } from "@/game/engine";
import { renderScene, type PickupEffect, type ShotRender } from "@/game/render";
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

// Basketball mini-game tuning.
const SHOOT_MS = 650;

type ShotState =
  | { phase: "aim"; marker: number; dir: number }
  | { phase: "shoot"; marker: number; result: "make" | "miss"; text: string; start: number };

function shotResult(p: number): { make: boolean; text: string } {
  const dist = Math.abs(p - 0.5);
  if (dist <= 0.06) return { make: true, text: "all net" };
  if (dist <= 0.13) return { make: true, text: "clean" };
  if (dist <= 0.22) return { make: false, text: "rimmed out" };
  return { make: false, text: "off the rim" };
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
  const effectsRef = useRef<PickupEffect[]>([]);

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
  const [promptShoot, setPromptShoot] = useState(false);

  // Quest state (discrete events only — never updated per frame).
  const TOTAL = SPAWN_ROOM.fragments.length;
  const [collected, setCollected] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Mini-game state. Ref drives the loop/render; `aiming`/`streak` drive DOM.
  const shotRef = useRef<ShotState | null>(null);
  const [aiming, setAiming] = useState(false);
  const [streak, setStreak] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const [isTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
  );

  const openDialogue = useCallback((d: Dialogue) => {
    setLine(0);
    setDialogue(d);
  }, []);

  const finishShot = useCallback(
    (make: boolean, text: string) => {
      shotRef.current = null;
      setAiming(false);
      setStreak((s) => (make ? s + 1 : 0));
      showToast(text);
    },
    [showToast]
  );

  // E/Action at the hoop (with the ball collected) starts the timing shot;
  // otherwise interact normally.
  const tryInteract = useCallback(() => {
    if (dialogueRef.current) return;
    const obj = findObject(stateRef.current?.nearestId ?? null);
    if (!obj) return;
    if (obj.kind === "hoop") {
      const hasBall = stateRef.current?.fragments.find((f) => f.id === "ball")?.collected;
      if (hasBall) {
        shotRef.current = { phase: "aim", marker: 0, dir: 1 };
        setAiming(true);
        return;
      }
    }
    if (!obj.interact) return;
    const d =
      stateRef.current?.gatePowered && obj.poweredDialogue ? obj.poweredDialogue : obj.interact.dialogue;
    openDialogue(d);
  }, [openDialogue]);

  // The single action button: advance dialogue, release a shot, or interact.
  const action = useCallback(() => {
    if (dialogueRef.current) {
      const d = dialogueRef.current;
      if (lineRef.current < d.lines.length - 1) setLine((l) => l + 1);
      else setDialogue(null);
      return;
    }
    const s = shotRef.current;
    if (s) {
      if (s.phase === "aim") {
        const { make, text } = shotResult(s.marker);
        if (reduceMotion) {
          finishShot(make, text);
        } else {
          shotRef.current = {
            phase: "shoot",
            marker: s.marker,
            result: make ? "make" : "miss",
            text,
            start: performance.now(),
          };
          setAiming(false);
        }
      }
      return; // ignore presses while the ball is in the air
    }
    tryInteract();
  }, [finishShot, reduceMotion, tryInteract]);

  const cancelShot = useCallback(() => {
    shotRef.current = null;
    setAiming(false);
  }, []);

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
      if (!dialogueRef.current && !shotRef.current) step(state, input.intent(), dt);

      // Mini-game: sweep the aim marker, or advance/finish the ball arc.
      const shot = shotRef.current;
      if (shot?.phase === "aim") {
        const speed = reduceMotion ? 1.05 : 1.5; // sweeps per second
        let m = shot.marker + shot.dir * speed * dt;
        let dir = shot.dir;
        if (m >= 1) {
          m = 1;
          dir = -1;
        } else if (m <= 0) {
          m = 0;
          dir = 1;
        }
        shot.marker = m;
        shot.dir = dir;
      } else if (shot?.phase === "shoot") {
        if (now - shot.start >= SHOOT_MS) finishShot(shot.result === "make", shot.text);
      }

      // Drain discrete events from this frame (collection / completion).
      if (state.events.length) {
        for (const e of state.events) {
          if (e.type === "fragment") {
            setCollected(state.collected);
            const f = state.fragments.find((fr) => fr.id === e.id);
            const meta = SPAWN_ROOM.fragments.find((fr) => fr.id === e.id);
            showToast(meta?.label ?? `things ${state.collected}/${TOTAL}`);
            if (!reduceMotion && f) {
              effectsRef.current.push({ x: f.x, y: f.y, start: now, kind: "fragment" });
            }
          } else if (e.type === "gate") {
            showToast("door unlocked");
            if (!reduceMotion) {
              const door = state.scene.objects.find((o) => o.kind === "door");
              if (door) {
                effectsRef.current.push({
                  x: door.rect.x + door.rect.w / 2,
                  y: door.rect.y + door.rect.h / 2,
                  start: now,
                  kind: "gate",
                });
              }
            }
          }
        }
        state.events.length = 0;
      }

      // Expire finished pickup effects.
      if (effectsRef.current.length) {
        effectsRef.current = effectsRef.current.filter((e) => now - e.start < 760);
      }

      const showPrompt = !dialogueRef.current && !shotRef.current && state.nearestId !== null;
      const isShootHoop =
        state.nearestId === "hoop" && !!state.fragments.find((f) => f.id === "ball")?.collected;
      if (showPrompt !== prompt) {
        prompt = showPrompt;
        setHasPrompt(showPrompt);
        setPromptShoot(showPrompt && isShootHoop);
      } else if (showPrompt) {
        setPromptShoot(isShootHoop);
      }

      let shotRender: ShotRender | null = null;
      const sc = shotRef.current;
      if (sc?.phase === "aim") {
        shotRender = { phase: "aim", marker: sc.marker };
      } else if (sc?.phase === "shoot") {
        shotRender = {
          phase: "shoot",
          marker: sc.marker,
          result: sc.result,
          progress: Math.min((now - sc.start) / SHOOT_MS, 1),
        };
      }

      renderScene(ctx, canvas, state, {
        reduceMotion,
        dpr,
        showPrompt,
        effects: effectsRef.current,
        shot: shotRender,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      input.detach();
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [reduceMotion, showToast, TOTAL, finishShot]);

  // Keyboard: Esc back-stack + interact/advance. Movement keys handled in input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (dialogueRef.current) closeDialogue();
        else if (shotRef.current) cancelShot();
        else onMenu();
        return;
      }
      // Let buttons handle their own Enter/Space activation.
      if ((e.target as HTMLElement)?.tagName === "BUTTON") return;
      if (e.key === "e" || e.key === "E" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [action, cancelShot, closeDialogue, onMenu]);

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
        aria-label="matthew's room, a bright top-down bedroom inside matthew.exe. Use arrow keys or WASD to move and E to interact."
        className="absolute inset-0 h-full w-full"
      />

      {/* Offscreen description for assistive tech (canvas is decorative). */}
      <p className="sr-only">
        {`matthew's room: a cozy, bright bedroom you can walk around, with a bed, a desk and laptop, a mini hoop, a record player, a travel corkboard, a shelf of korean snacks, bubby's bed, a window, and a door out. Objective: gather three personal things — your basketball, a record, and a polaroid — and the door unlocks. Move with the arrow keys or WASD, press E near an object to read it, Escape to return to the menu.`}
      </p>
      <p className="sr-only" aria-live="polite">
        {collected >= TOTAL ? "Got everything. The door is unlocked." : `Things gathered: ${collected} of ${TOTAL}.`}
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
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          className="group/menu inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-[#FED34C] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
        >
          <ArrowLeft size={14} strokeWidth={2} className="transition-transform group-hover/menu:-translate-x-0.5" />
          menu
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Matthew.exe and return to portfolio"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Objective tracker (minimal, top-centre). */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center"
        style={{ paddingTop: "max(0.85rem, env(safe-area-inset-top))" }}
      >
        <div
          className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-xs text-white/85 backdrop-blur-sm"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
        >
          {collected >= TOTAL ? (
            <span className="flex items-center gap-1.5 text-[#FED34C]">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-[#FED34C]" />
              ready
            </span>
          ) : (
            <>
              <span>things</span>
              <span aria-hidden className="flex items-center gap-1">
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block h-1.5 w-1.5 rotate-45 transition-colors ${
                      i < collected ? "bg-[#FED34C]" : "bg-white/25"
                    }`}
                  />
                ))}
              </span>
            </>
          )}
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-2 rounded-full bg-black/35 px-3 py-1 text-[0.7rem] text-white/90 backdrop-blur-sm"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        {streak >= 2 && (
          <div className="mt-2 rounded-full bg-black/30 px-2.5 py-0.5 text-[0.65rem] text-[#FED34C] backdrop-blur-sm">
            streak {streak}
          </div>
        )}
      </div>

      {/* Proximity prompt. */}
      <AnimatePresence>
        {hasPrompt && !dialogue && (
          <motion.div
            key="prompt"
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center"
          >
            <span className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
              {isTouch ? (
                promptShoot ? (
                  "tap to shoot"
                ) : (
                  "tap to interact"
                )
              ) : (
                <>
                  <kbd
                    style={{ fontFamily: "inherit" }}
                    className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded border border-white/40 px-1 text-[0.6rem] font-medium not-italic text-white"
                  >
                    E
                  </kbd>
                  {promptShoot ? "shoot" : "interact"}
                </>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aim hint while the timing bar is sweeping. */}
      <AnimatePresence>
        {aiming && (
          <motion.div
            key="aim"
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center"
          >
            <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs text-[#FED34C] backdrop-blur-sm">
              {isTouch ? "tap to shoot" : "press E to shoot"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch controls. */}
      {isTouch && !dialogue && (
        <TouchControls
          onDir={(dir, on) => inputRef.current?.setTouch(dir, on)}
          onAction={action}
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
          <p className="text-[0.7rem] tracking-[0.15em] text-[#FED34C]">
            {dialogue.title}
          </p>
        )}
        <p aria-live="polite" className="min-h-[3rem] text-sm leading-relaxed text-white/85">
          {dialogue.lines[line]}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[0.6rem] tracking-[0.2em] text-white/30">
            {line + 1} / {dialogue.lines.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              close
            </button>
            <button
              ref={btnRef}
              type="button"
              onClick={onAdvance}
              className="rounded-md bg-[#FED34C] px-4 py-1.5 text-xs font-medium text-gray-950 transition-colors hover:bg-[#ffdf73] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FED34C]"
            >
              {isLast ? "close" : "continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
