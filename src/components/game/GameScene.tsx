"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { createGameState, step, type GameState } from "@/game/engine";
import { renderScene, BUBBY_POINT_MS, type BubbyRender, type PickupEffect, type ShotRender } from "@/game/render";
import { createInput } from "@/game/input";
import { MOODS, SPAWN_ROOM } from "@/game/scenes/spawnRoom";
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

// Bubby helper tuning.
const BUBBY_SPEED = 60; // world px/sec
interface BubbyState extends BubbyRender {
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
}
const BUBBY_BED = SPAWN_ROOM.objects.find((o) => o.kind === "bubbybed")!;
const BUBBY_HOME = {
  x: BUBBY_BED.rect.x + BUBBY_BED.rect.w / 2,
  y: BUBBY_BED.rect.y + BUBBY_BED.rect.h / 2 + 1,
};
function restingBubby(): BubbyState {
  return {
    phase: "resting",
    x: BUBBY_HOME.x,
    y: BUBBY_HOME.y,
    homeX: BUBBY_HOME.x,
    homeY: BUBBY_HOME.y,
    targetX: BUBBY_HOME.x,
    targetY: BUBBY_HOME.y,
    facing: "down",
    start: 0,
  };
}

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
  reduceMotion,
}: {
  onMenu: () => void;
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

  // Record-player mood selector.
  const [choosing, setChoosing] = useState(false);
  const [moodIndex, setMoodIndex] = useState(0);
  const [mood, setMood] = useState<string | null>(null); // currently playing
  const choosingRef = useRef(false);
  const moodIndexRef = useRef(0);
  const moodRef = useRef<string | null>(null);
  useEffect(() => {
    choosingRef.current = choosing;
  }, [choosing]);
  useEffect(() => {
    moodIndexRef.current = moodIndex;
  }, [moodIndex]);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const [promptPlay, setPromptPlay] = useState(false);
  const [promptPet, setPromptPet] = useState(false);

  // Bubby state (host-driven; no React re-render per frame).
  const bubbyRef = useRef<BubbyState>(restingBubby());

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

  // Pet Bubby: he wakes and trots out to point at the nearest uncollected thing
  // (or the door once everything's gathered), then returns to his bed. No
  // pathfinding — a short scripted lerp toward the target.
  const petBubby = useCallback(() => {
    const st = stateRef.current;
    if (!st) return;
    // ignore if he's already mid-sequence
    if (bubbyRef.current.phase !== "resting") return;

    const hx = BUBBY_HOME.x;
    const hy = BUBBY_HOME.y;
    const uncollected = st.fragments.filter((f) => !f.collected);
    let tx = hx;
    let ty = hy;
    let cue = "[tail wag]";
    if (uncollected.length) {
      let best = Infinity;
      for (const f of uncollected) {
        const d = (f.x - hx) ** 2 + (f.y - hy) ** 2;
        if (d < best) {
          best = d;
          tx = f.x;
          ty = f.y + 8; // stop just in front of it
        }
      }
      cue = "[here]";
    } else {
      const door = SPAWN_ROOM.objects.find((o) => o.kind === "door");
      if (door) {
        tx = door.rect.x + door.rect.w / 2;
        ty = door.rect.y - 8;
        cue = "[let's go]";
      }
    }

    if (reduceMotion) {
      // no trotting: point from the bed, then settle.
      let facing: BubbyRender["facing"] = "down";
      const dx = tx - hx;
      const dy = ty - hy;
      if (Math.abs(dx) > Math.abs(dy)) facing = dx > 0 ? "right" : "left";
      else facing = dy > 0 ? "down" : "up";
      bubbyRef.current = {
        phase: "pointing",
        x: hx,
        y: hy,
        homeX: hx,
        homeY: hy,
        targetX: tx,
        targetY: ty,
        facing,
        cue,
        start: performance.now(),
      };
      return;
    }

    bubbyRef.current = {
      phase: "waking",
      x: hx,
      y: hy,
      homeX: hx,
      homeY: hy,
      targetX: tx,
      targetY: ty,
      facing: "down",
      cue,
      start: performance.now(),
    };
  }, [reduceMotion]);

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
    if (obj.kind === "bubbybed") {
      petBubby();
      return;
    }
    if (obj.kind === "recordplayer") {
      const hasRecord = stateRef.current?.fragments.find((f) => f.id === "record")?.collected;
      if (hasRecord) {
        // Open the carousel on the currently playing mood, if any.
        const idx = moodRef.current ? MOODS.findIndex((m) => m.id === moodRef.current) : 0;
        setMoodIndex(idx < 0 ? 0 : idx);
        setChoosing(true);
        choosingRef.current = true;
        return;
      }
    }
    if (!obj.interact) return;
    const d =
      stateRef.current?.gatePowered && obj.poweredDialogue ? obj.poweredDialogue : obj.interact.dialogue;
    openDialogue(d);
  }, [openDialogue, petBubby]);

  const flipMood = useCallback((delta: number) => {
    setMoodIndex((i) => (i + delta + MOODS.length) % MOODS.length);
  }, []);

  const selectMood = useCallback(() => {
    const m = MOODS[moodIndexRef.current];
    setMood(m.id);
    moodRef.current = m.id;
    setChoosing(false);
    choosingRef.current = false;
    showToast(m.line);
  }, [showToast]);

  const closeSelector = useCallback(() => {
    setChoosing(false);
    choosingRef.current = false;
  }, []);

  // The single action button: advance dialogue, pick a mood, release a shot, or interact.
  const action = useCallback(() => {
    if (dialogueRef.current) {
      const d = dialogueRef.current;
      if (lineRef.current < d.lines.length - 1) setLine((l) => l + 1);
      else setDialogue(null);
      return;
    }
    if (choosingRef.current) {
      selectMood();
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
  }, [finishShot, reduceMotion, selectMood, tryInteract]);

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
      if (!dialogueRef.current && !shotRef.current && !choosingRef.current)
        step(state, input.intent(), dt);

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

      // Bubby scripted helper: waking -> trotting -> pointing -> returning.
      const b = bubbyRef.current;
      if (b.phase === "waking") {
        if (now - b.start > 280) {
          b.phase = "trotting";
          b.start = now;
        }
      } else if (b.phase === "trotting" || b.phase === "returning") {
        const tx = b.phase === "trotting" ? b.targetX : b.homeX;
        const ty = b.phase === "trotting" ? b.targetY : b.homeY;
        const ddx = tx - b.x;
        const ddy = ty - b.y;
        const dd = Math.hypot(ddx, ddy);
        if (dd <= 1.5) {
          if (b.phase === "trotting") {
            b.phase = "pointing";
            b.start = now;
            // look back at the player
            const px = state.player.x + state.player.w / 2;
            const py = state.player.y + state.player.h / 2;
            const fdx = px - b.x;
            const fdy = py - b.y;
            b.facing = Math.abs(fdx) > Math.abs(fdy) ? (fdx > 0 ? "right" : "left") : fdy > 0 ? "down" : "up";
          } else {
            bubbyRef.current = restingBubby();
          }
        } else {
          const stp = Math.min(dd, BUBBY_SPEED * dt);
          b.x += (ddx / dd) * stp;
          b.y += (ddy / dd) * stp;
          b.facing = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? "right" : "left") : ddy > 0 ? "down" : "up";
        }
      } else if (b.phase === "pointing") {
        if (now - b.start > BUBBY_POINT_MS) {
          if (reduceMotion) {
            bubbyRef.current = restingBubby();
          } else {
            b.phase = "returning";
            b.start = now;
            b.cue = undefined;
          }
        }
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

      const showPrompt =
        !dialogueRef.current && !shotRef.current && !choosingRef.current && state.nearestId !== null;
      const isShootHoop =
        state.nearestId === "hoop" && !!state.fragments.find((f) => f.id === "ball")?.collected;
      const isPlayRecord =
        state.nearestId === "recordplayer" &&
        !!state.fragments.find((f) => f.id === "record")?.collected;
      const isPetBubby = state.nearestId === "bubbybed";
      if (showPrompt !== prompt) {
        prompt = showPrompt;
        setHasPrompt(showPrompt);
        setPromptShoot(showPrompt && isShootHoop);
        setPromptPlay(showPrompt && isPlayRecord);
        setPromptPet(showPrompt && isPetBubby);
      } else if (showPrompt) {
        setPromptShoot(isShootHoop);
        setPromptPlay(isPlayRecord);
        setPromptPet(isPetBubby);
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
        mood: moodRef.current,
        bubby: bubbyRef.current,
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
        if (document.fullscreenElement) return;
        e.preventDefault();
        if (dialogueRef.current) closeDialogue();
        else if (choosingRef.current) closeSelector();
        else if (shotRef.current) cancelShot();
        else onMenu();
        return;
      }
      // Mood carousel owns all keys while it's open.
      if (choosingRef.current) {
        const k = e.key.toLowerCase();
        if (k === "arrowleft" || k === "a") {
          e.preventDefault();
          flipMood(-1);
        } else if (k === "arrowright" || k === "d") {
          e.preventDefault();
          flipMood(1);
        } else if (k === "e" || k === "enter" || k === " ") {
          e.preventDefault();
          selectMood();
        }
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
  }, [action, cancelShot, closeDialogue, closeSelector, flipMood, selectMood, onMenu]);

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

      {/* Top bar: menu only. The macOS chrome owns hard close. */}
      <div
        className="absolute inset-x-0 top-0 z-20 flex items-center"
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
        {mood && !choosing && (
          <div className="mt-2 rounded-full bg-black/30 px-2.5 py-0.5 text-[0.65rem] text-white/70 backdrop-blur-sm">
            now playing — {MOODS.find((m) => m.id === mood)?.label}
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
                ) : promptPlay ? (
                  "tap to play"
                ) : promptPet ? (
                  "tap to pet"
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
                  {promptShoot ? "shoot" : promptPlay ? "play" : promptPet ? "pet" : "interact"}
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
      {isTouch && !dialogue && !choosing && (
        <TouchControls
          onDir={(dir, on) => inputRef.current?.setTouch(dir, on)}
          onAction={action}
        />
      )}

      {/* Mood-record carousel. */}
      {choosing && (
        <MoodSelector
          index={moodIndex}
          isTouch={isTouch}
          onFlip={flipMood}
          onSelect={selectMood}
          onClose={closeSelector}
        />
      )}

      {/* Dialogue (DOM, accessible). */}
      {dialogue && (
        <DialogueBox dialogue={dialogue} line={line} isLast={isLast} onAdvance={advance} onClose={closeDialogue} />
      )}
    </div>
  );
}

function MoodSelector({
  index,
  isTouch,
  onFlip,
  onSelect,
  onClose,
}: {
  index: number;
  isTouch: boolean;
  onFlip: (delta: number) => void;
  onSelect: () => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rootRef.current?.focus();
  }, []);
  const m = MOODS[index];

  const arrow = (delta: number, label: string, glyph: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => onFlip(delta)}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white/80 transition-colors hover:bg-white/20 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
    >
      {glyph}
    </button>
  );

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-label="pick a record"
      className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-gray-900/95 backdrop-blur-sm focus:outline-none"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        paddingTop: "1rem",
        fontFamily: "var(--font-sf)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="close record selector"
        className="absolute right-3 top-2 rounded px-2 py-1 text-xs text-white/50 transition-colors hover:text-white/80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
      >
        close
      </button>
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        <p className="text-[0.7rem] tracking-[0.15em] text-[#FED34C]">pick a record</p>
        <div className="flex items-center gap-5">
          {arrow(-1, "previous record", "‹")}
          <button
            type="button"
            onClick={onSelect}
            aria-label={`play ${m.label}`}
            className="flex flex-col items-center gap-2 rounded-md p-1 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FED34C]"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-sm"
              style={{ backgroundColor: m.tint, boxShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-950">
                <span className="h-2 w-2 rounded-full bg-[#FED34C]" />
              </span>
            </span>
            <span className="text-sm text-white/90">{m.label}</span>
          </button>
          {arrow(1, "next record", "›")}
        </div>
        <p className="text-[0.6rem] text-white/40">
          {isTouch ? "tap arrows · action select" : "← → flip · E select"}
        </p>
      </div>
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

  // Retro handheld-RPG dialogue panel: cream box with a strong inner border,
  // dark readable text, sitting inside the bottom of the single game screen.
  return (
    <div
      role="dialog"
      aria-label={dialogue.title ?? "Dialogue"}
      className="absolute inset-x-1.5 bottom-1.5 z-30 rounded-[5px] border-2 border-[#2c2418] bg-[#f4ecd6]"
      style={{ fontFamily: "var(--font-sf)", boxShadow: "0 3px 0 rgba(0,0,0,0.35)" }}
    >
      <div className="rounded-[2px] border border-[#b9ad8c] m-1 px-3 py-2.5">
        {dialogue.title && (
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[#9a6a2f]">{dialogue.title}</p>
        )}
        <p
          aria-live="polite"
          className="mt-1 min-h-[2.6rem] text-[0.82rem] leading-snug text-[#2c2418]"
        >
          {dialogue.lines[line]}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[0.55rem] tracking-[0.15em] text-[#9a8f6f]">
            {line + 1} / {dialogue.lines.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-2.5 py-1 text-[0.7rem] text-[#7a6f54] transition-colors hover:text-[#2c2418] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9a6a2f]"
            >
              close
            </button>
            <button
              ref={btnRef}
              type="button"
              onClick={onAdvance}
              className="rounded-sm border-2 border-[#2c2418] bg-[#2c2418] px-3 py-1 text-[0.7rem] font-medium text-[#f4ecd6] transition-colors hover:bg-[#42361f] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2c2418]"
            >
              {isLast ? "close ▸" : "next ▸"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
