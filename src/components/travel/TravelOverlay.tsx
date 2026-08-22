"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import NextImage from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { House } from "lucide-react";
import { useTravelPlayer } from "@/context/TravelContext";
import { DraggableContainer } from "./DraggableGallery";
import { PLANE_DURATION, PLANE_START, PLANE_END, EXIT_PLANE_DURATION, EXIT_PLANE_START, EXIT_PLANE_END, easeInOutCubic, exitPlaneRightEdgePx, preloadEnterPlane, preloadExitPlane, whenEnterPlaneReady, whenExitPlaneReady, ThreeAirplaneTransition, ThreeAirplaneExitTransition } from "./ThreeAirplaneTransition";
import { TRAVEL_PHOTOS, STACKED_BELOW, type TravelPhoto } from "@/data/travel";

// Tunables
const WIPE_SKEW_PX     = 120;  // diagonal softness of the reveal edge (px)
const PLANE_LEAD_PX    = 60;
// How long a transition will wait on its model before starting regardless. The
// enter cap is short because the click should still feel responsive; the exit
// can afford longer, since its model has been downloading since travel opened.
const ENTER_MODEL_WAIT_MS = 1200;
const EXIT_MODEL_WAIT_MS  = 2000;   // how far the plane center leads the reveal edge (px)

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function MasonryPhoto({ src, caption }: { src: string; caption: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: COL_W,
        height: IMG_H,
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 4,
        backgroundColor: "#141414",
      }}
    >
      <NextImage
        src={src}
        alt={caption}
        fill
        draggable={false}
        loading="eager"
        quality={75}
        sizes={`${COL_W}px`}
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
    </div>
  );
}

// colW=320px, gap=24px; tileW = 4 * 320 + 3 * 24 + 24 trailing = 1376px.
// Every image uses the same fixed display cell; source files are untouched.
const COL_W = 320;
const COL_GAP = 24;
const COL_COUNT = 4;
const TILE_W = COL_COUNT * COL_W + (COL_COUNT - 1) * COL_GAP + COL_GAP; // 1376
const IMG_H = Math.round(COL_W * 4 / 3); // 427, matching the majority iPhone portrait photos

type PhotoItem =
  | { kind: "single"; photo: TravelPhoto }
  | { kind: "stacked"; top: TravelPhoto; bottom: TravelPhoto };

function buildItems(): PhotoItem[] {
  const items: PhotoItem[] = [];
  let i = 0;
  while (i < TRAVEL_PHOTOS.length) {
    const photo = TRAVEL_PHOTOS[i];
    const next = TRAVEL_PHOTOS[i + 1];
    if (next && STACKED_BELOW.has(next.src)) {
      items.push({ kind: "stacked", top: photo, bottom: next });
      i += 2;
    } else if (STACKED_BELOW.has(photo.src)) {
      i++;
    } else {
      items.push({ kind: "single", photo });
      i++;
    }
  }
  return items;
}

const ITEMS = buildItems();

// Pad items to the nearest multiple of COL_COUNT by repeating from the start.
// This keeps flex columns equal height for a seamless vertical tile seam.
const remainder = ITEMS.length % COL_COUNT;
const PADDED: PhotoItem[] = remainder === 0
  ? ITEMS
  : [...ITEMS, ...ITEMS.slice(0, COL_COUNT - remainder)];

function MasonryGrid() {
  const cols: PhotoItem[][] = Array.from({ length: COL_COUNT }, () => []);
  PADDED.forEach((item, i) => cols[i % COL_COUNT].push(item));

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: COL_GAP, width: TILE_W, paddingRight: COL_GAP, paddingTop: COL_GAP / 2, paddingBottom: COL_GAP / 2, boxSizing: "border-box" }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ width: COL_W, flexShrink: 0, display: "flex", flexDirection: "column", gap: COL_GAP }}>
          {col.map((item, idx) =>
            item.kind === "single" ? (
              <MasonryPhoto key={`${ci}-${idx}`} src={item.photo.src} caption={item.photo.caption} />
            ) : (
              <div key={`${ci}-${idx}`} className="flex flex-col overflow-hidden rounded-sm">
                <MasonryPhoto src={item.top.src} caption={item.top.caption} />
                <MasonryPhoto src={item.bottom.src} caption={item.bottom.caption} />
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function GalleryScene() {
  return (
    <DraggableContainer>
      <MasonryGrid /><MasonryGrid /><MasonryGrid /><MasonryGrid />
      <MasonryGrid /><MasonryGrid /><MasonryGrid /><MasonryGrid />
    </DraggableContainer>
  );
}

function GalleryChrome({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4">
      <span
        className="text-white text-sm tracking-wide select-none"
        style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}
      >
        my adventures
      </span>
      <button
        onClick={onClose}
        aria-label="close travel gallery"
        className="flex items-center gap-1.5 text-white text-sm tracking-wide bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded-full px-4 py-1.5"
        style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}
      >
        <House size={14} />return home
      </button>
    </div>
  );
}

export function TravelOverlay() {
  const { state, exit, _advanceToGallery, _advanceToIdle } = useTravelPlayer();
  const enterAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const enterCompletedRef = useRef(false);
  const exitAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const exitCompletedRef = useRef(false);
  const completeExitRef = useRef<(() => void) | null>(null);
  // Bumped whenever a run is superseded, so an await that resolves late knows
  // to bail instead of starting an animation the user has moved on from.
  const runTokenRef = useRef(0);
  // The enter plane is small and needed almost immediately after a click, so it
  // is fetched once the browser has finished the work that actually matters.
  // requestIdleCallback is still missing in Safari, hence the timeout fallback.
  useEffect(() => {
    let idleId: number | null = null;
    let timerId: number | null = null;
    if (typeof window === "undefined") return;
    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      idleId = ric(() => preloadEnterPlane(), { timeout: 3000 });
    } else {
      timerId = window.setTimeout(() => preloadEnterPlane(), 1500);
    }
    return () => {
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, []);

  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Shared progress 0→1 drives both the Three.js plane and the clip-path reveal.
  const progressRef = useRef<number>(0);
  const rawProgress = useMotionValue(0);
  const overlayOp   = useMotionValue(0);

  // Exit progress 0→1 drives the A380 landing transition.
  const exitProgressRef = useRef<number>(0);
  const exitRawProgress = useMotionValue(0);
  // True once the exit wipe has cleared the viewport. The plane keeps flying for
  // the rest of the animation, but by then the page underneath is what the user
  // sees, so the overlay must stop intercepting input.
  const [exitRevealed, setExitRevealed] = useState(false);

  // Keep progressRefs in sync so Three.js useFrame can read them each tick.
  useEffect(() => rawProgress.on("change",     (v) => { progressRef.current     = v; }), [rawProgress]);
  useEffect(() => exitRawProgress.on("change", (v) => { exitProgressRef.current = v; }), [exitRawProgress]);

  // Mirrors the edge exitClipPath draws, so the two can never disagree about
  // when the gallery has finished wiping away.
  useEffect(() => exitRawProgress.on("change", (v) => {
    const eased = easeInOutCubic(v);
    const vw = typeof window !== "undefined" ? window.innerWidth  : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    const planeScreenX = (lerp(EXIT_PLANE_START[0], EXIT_PLANE_END[0], eased) + 0.5) * vw;
    setExitRevealed(planeScreenX + PLANE_LEAD_PX <= 0);

    // Once the whole aircraft is past the left edge there is nothing left to
    // watch, so the exit ends here rather than at the animation's full
    // duration. That returns the player to idle, which re-arms the travel
    // trigger and lets the canvas unmount instead of rendering out of sight.
    if (exitPlaneRightEdgePx(v, vw, vh) < 0) completeExitRef.current?.();
  }), [exitRawProgress]);

  // Fades in once the clip-path covers the viewport (~progress 0.52), before the animation timer fires.
  const chromeOp = useTransform(rawProgress, [0.5, 0.57], [0, 1]);
  // Fades out immediately when exit starts.
  const chromeExitOp = useTransform(exitRawProgress, [0, 0.12], [1, 0]);

  // Enter: clip-path grows left→right, revealing the gallery behind the plane.
  const clipPath = useTransform(rawProgress, (t) => {
    const eased = easeInOutCubic(t);
    const vw = typeof window !== "undefined" ? window.innerWidth  : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    const planeScreenX = (lerp(PLANE_START[0], PLANE_END[0], eased) + 0.5) * vw;
    const revealEdge   = planeScreenX - PLANE_LEAD_PX;
    const right        = revealEdge + WIPE_SKEW_PX;
    return `polygon(0px 0px, ${right}px 0px, ${right - WIPE_SKEW_PX}px ${vh}px, 0px ${vh}px)`;
  });

  // Exit: clip-path shrinks right→left, hiding the gallery behind the A380.
  const exitClipPath = useTransform(exitRawProgress, (t) => {
    const eased = easeInOutCubic(t);
    const vw = typeof window !== "undefined" ? window.innerWidth  : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    const planeScreenX = (lerp(EXIT_PLANE_START[0], EXIT_PLANE_END[0], eased) + 0.5) * vw;
    const right = planeScreenX + PLANE_LEAD_PX;
    return `polygon(0px 0px, ${right}px 0px, ${right - WIPE_SKEW_PX}px ${vh}px, 0px ${vh}px)`;
  });

  // body scroll lock
  useEffect(() => {
    if (state !== "idle" && !(state === "transitioning-out" && exitRevealed)) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [state, exitRevealed]);

  // escape closes
  useEffect(() => {
    if (state !== "gallery") return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") exit(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, exit]);

  const clearEnterAnimation = useCallback(() => {
    enterAnimationRef.current?.stop();
    enterAnimationRef.current = null;

    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  }, []);

  const clearExitAnimation = useCallback(() => {
    exitAnimationRef.current?.stop();
    exitAnimationRef.current = null;

    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const runEnter = useCallback(async () => {
    clearEnterAnimation();
    clearExitAnimation();
    enterCompletedRef.current = false;
    const token = ++runTokenRef.current;

    // The A380 is only needed once the gallery closes, so it starts arriving
    // now and has this animation plus the browsing session to finish.
    preloadExitPlane();

    if (prefersReducedMotion) {
      overlayOp.set(1);
      rawProgress.set(1);
      progressRef.current = 1;
      _advanceToGallery();
      return;
    }

    // Idle preloading means the model is almost always here already. When it
    // is not, waiting briefly beats opening with an empty sky, since the plane
    // is what draws the reveal. The cap keeps a stalled fetch from hanging the
    // interaction entirely.
    await whenEnterPlaneReady(ENTER_MODEL_WAIT_MS);
    if (token !== runTokenRef.current) return;

    overlayOp.set(1);
    rawProgress.set(0);
    progressRef.current = 0;

    const completeEnter = () => {
      if (enterCompletedRef.current) return;
      enterCompletedRef.current = true;
      rawProgress.set(1);
      progressRef.current = 1;
      clearEnterAnimation();
      _advanceToGallery();
    };

    enterTimerRef.current = window.setTimeout(completeEnter, PLANE_DURATION * 1000 + 150);

    // Linear 0→1; easeInOutCubic is applied inside the clipPath transform and Three.js useFrame
    // so both systems apply identical easing from the same raw value.
    enterAnimationRef.current = animate(rawProgress, 1, {
      duration: PLANE_DURATION,
      ease: "linear",
      onComplete: completeEnter,
    });
  }, [clearEnterAnimation, clearExitAnimation, rawProgress, overlayOp, _advanceToGallery, prefersReducedMotion]);

  const runExit = useCallback(async () => {
    clearEnterAnimation();
    clearExitAnimation();
    exitCompletedRef.current = false;
    exitRawProgress.set(0);
    const token = ++runTokenRef.current;

    if (prefersReducedMotion) {
      overlayOp.set(0);
      _advanceToIdle();
      return;
    }

    await whenExitPlaneReady(EXIT_MODEL_WAIT_MS);
    if (token !== runTokenRef.current) return;

    const completeExit = () => {
      if (exitCompletedRef.current) return;
      exitCompletedRef.current = true;
      completeExitRef.current = null;
      overlayOp.set(0);
      clearExitAnimation();
      _advanceToIdle();
    };

    // Kept as a backstop in case the geometry check never fires.
    completeExitRef.current = completeExit;
    exitTimerRef.current = window.setTimeout(completeExit, EXIT_PLANE_DURATION * 1000 + 150);

    exitAnimationRef.current = animate(exitRawProgress, 1, {
      duration: EXIT_PLANE_DURATION,
      ease: "linear",
      onComplete: completeExit,
    });
  }, [clearEnterAnimation, clearExitAnimation, exitRawProgress, overlayOp, _advanceToIdle, prefersReducedMotion]);

  // react to state changes
  useEffect(() => {
    if (state === "transitioning-in") runEnter();
    if (state === "transitioning-out") runExit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    return () => {
      clearEnterAnimation();
      clearExitAnimation();
    };
  }, [clearEnterAnimation, clearExitAnimation]);

  if (state === "idle") return null;

  const isTransIn  = state === "transitioning-in";
  const isTransOut = state === "transitioning-out";

  return (
    <motion.div
      style={{ opacity: overlayOp }}
      className={`fixed inset-0 z-[70] ${isTransOut && exitRevealed ? "pointer-events-none" : ""}`}
    >
      {/* Gallery stays mounted; clip-path covers the viewport once the plane exits. */}
      <motion.div style={{ clipPath: isTransOut ? exitClipPath : clipPath, position: "absolute", inset: 0, backgroundColor: "#141414" }}>
        <GalleryScene />
      </motion.div>

      {/* Enter: 787 flies left → right. Exit: A380 descends right → left. */}
      {isTransIn  && !prefersReducedMotion && (
        <ThreeAirplaneTransition progressRef={progressRef} />
      )}
      {isTransOut && !prefersReducedMotion && (
        <ThreeAirplaneExitTransition progressRef={exitProgressRef} />
      )}

      {/* Chrome fades in once the reveal covers the viewport, not after the full animation timer. */}
      <motion.div style={{ opacity: isTransOut ? chromeExitOp : chromeOp }}>
        <GalleryChrome onClose={exit} />
      </motion.div>
    </motion.div>
  );
}
