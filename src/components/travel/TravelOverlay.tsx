"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import NextImage from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { House } from "lucide-react";
import { useTravelPlayer } from "@/context/TravelContext";
import { DraggableContainer } from "./DraggableGallery";
import { PLANE_DURATION, PLANE_START, PLANE_END, easeInOutCubic, ThreeAirplaneTransition } from "./ThreeAirplaneTransition";
import { TRAVEL_PHOTOS, STACKED_BELOW, type TravelPhoto } from "@/data/travel";

// Tunables
const WIPE_SKEW_PX     = 120;  // diagonal softness of the reveal edge (px)
const PLANE_LEAD_PX    = 60;   // how far the plane center leads the reveal edge (px)
const CLOSE_DURATION_S = 0.5;

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
        my travels
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
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Shared progress 0→1 drives both the Three.js plane and the clip-path reveal.
  const progressRef = useRef<number>(0);
  const rawProgress = useMotionValue(0);
  const overlayOp   = useMotionValue(0);

  // Keep progressRef in sync so Three.js useFrame can read it each tick.
  useEffect(() => rawProgress.on("change", (v) => { progressRef.current = v; }), [rawProgress]);

  // Fades in once the clip-path covers the viewport (~progress 0.52), before the animation timer fires.
  const chromeOp = useTransform(rawProgress, [0.5, 0.57], [0, 1]);

  // Clip-path mirrors Three.js x-lerp exactly: (lerp(startX, endX, eased) + 0.5) * vw
  // so the reveal boundary is always behind the actual plane position by PLANE_LEAD_PX.
  const clipPath = useTransform(rawProgress, (t) => {
    const eased = easeInOutCubic(t);
    const vw = typeof window !== "undefined" ? window.innerWidth  : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    const planeScreenX = (lerp(PLANE_START[0], PLANE_END[0], eased) + 0.5) * vw;
    const revealEdge   = planeScreenX - PLANE_LEAD_PX;
    const right        = revealEdge + WIPE_SKEW_PX;
    return `polygon(0px 0px, ${right}px 0px, ${right - WIPE_SKEW_PX}px ${vh}px, 0px ${vh}px)`;
  });

  // body scroll lock
  useEffect(() => {
    if (state !== "idle") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [state]);

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

  const runEnter = useCallback(() => {
    clearEnterAnimation();
    clearExitAnimation();
    enterCompletedRef.current = false;

    if (prefersReducedMotion) {
      overlayOp.set(1);
      rawProgress.set(1);
      progressRef.current = 1;
      _advanceToGallery();
      return;
    }

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

  const runExit = useCallback(() => {
    clearEnterAnimation();
    clearExitAnimation();
    exitCompletedRef.current = false;

    const completeExit = () => {
      if (exitCompletedRef.current) return;
      exitCompletedRef.current = true;
      overlayOp.set(0);
      clearExitAnimation();
      _advanceToIdle();
    };

    exitTimerRef.current = window.setTimeout(
      completeExit,
      CLOSE_DURATION_S * 1000 + 150,
    );

    exitAnimationRef.current = animate(overlayOp, 0, {
      duration: CLOSE_DURATION_S,
      ease: "easeOut",
      onComplete: completeExit,
    });
  }, [clearEnterAnimation, clearExitAnimation, overlayOp, _advanceToIdle]);

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

  const isTransIn = state === "transitioning-in";

  return (
    <motion.div
      style={{ opacity: overlayOp }}
      className="fixed inset-0 z-[70]"
    >
      {/* Gallery stays mounted; clip-path covers the viewport once the plane exits. */}
      <motion.div style={{ clipPath, position: "absolute", inset: 0, backgroundColor: "#141414" }}>
        <GalleryScene />
      </motion.div>

      {/* Airplane appears only during the enter transition and unmounts in gallery state. */}
      {isTransIn && !prefersReducedMotion && (
        <ThreeAirplaneTransition progressRef={progressRef} />
      )}

      {/* Chrome fades in once the reveal covers the viewport, not after the full animation timer. */}
      <motion.div style={{ opacity: chromeOp }}>
        <GalleryChrome onClose={exit} />
      </motion.div>
    </motion.div>
  );
}
