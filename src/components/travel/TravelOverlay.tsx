"use client";

import { useEffect, useState, useCallback } from "react";
import NextImage from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { X } from "lucide-react";
import { useTravelPlayer } from "@/context/TravelContext";
import { DraggableContainer } from "./DraggableGallery";
import { TRAVEL_PHOTOS, STACKED_BELOW, type TravelPhoto } from "@/data/travel";

// Tunables
const PLANE_DURATION_S = 1.8;
const WIPE_SKEW_PX     = 120;
const CLOSE_DURATION_S = 0.5;
const OVERSHOOT_PX     = 180;

function AirplaneSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M44 22.5L6 4l3.5 18.5L6 41l38-18.5z" fill="white" opacity="0.92" />
      <path d="M9.5 22.5l-5.5 7 5.5-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function MasonryPhoto({ src, caption }: { src: string; caption: string }) {
  return (
    <div style={{ position: "relative", width: COL_W, height: IMG_H, flexShrink: 0, overflow: "hidden", borderRadius: 4 }}>
      <NextImage
        src={src}
        alt={caption}
        fill
        draggable={false}
        loading="eager"
        quality={70}
        sizes={`${COL_W}px`}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}

// colW=320px, gap=24px; tileW = 4 * 320 + 3 * 24 + 24 trailing = 1376px.
// Every image is cropped into the same fixed display cell; source files are untouched.
const COL_W = 320;
const COL_GAP = 24;
const COL_COUNT = 4;
const TILE_W = COL_COUNT * COL_W + (COL_COUNT - 1) * COL_GAP + COL_GAP; // 1376
const IMG_H = Math.round(COL_W * 1308 / 736); // 569

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
        className="text-white/40 text-sm tracking-wide select-none"
        style={{ fontFamily: "var(--font-sf)", fontWeight: 500 }}
      >
        places i&apos;ve been
      </span>
      <button
        onClick={onClose}
        aria-label="close travel gallery"
        className="text-white/40 hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded p-1"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function TravelOverlay() {
  const { state, exit, _advanceToGallery, _advanceToIdle } = useTravelPlayer();
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // motion values
  const planeX        = useMotionValue(-OVERSHOOT_PX);
  const planeY        = useMotionValue(0);
  const overlayOp     = useMotionValue(0);
  const contrailW     = useTransform(planeX, (px: number) => Math.max(0, px + OVERSHOOT_PX));
  const contrailY     = useTransform(planeY, (py: number) => py + 22);

  // wipe clip-path: diagonal polygon that grows with plane x
  const clipPath = useTransform(planeX, (px: number) => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const right = px + WIPE_SKEW_PX;
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

  const runEnter = useCallback(() => {
    if (prefersReducedMotion) {
      overlayOp.set(1);
      _advanceToGallery();
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    overlayOp.set(1);
    planeX.set(-OVERSHOOT_PX);
    planeY.set(vh * 0.4);

    // Fly plane across, then advance state.
    animate(planeX, vw + OVERSHOOT_PX, {
      duration: PLANE_DURATION_S,
      ease: [0.18, 0, 0.55, 1],
      onComplete: _advanceToGallery,
    });
    animate(planeY, vh * 0.34, {
      duration: PLANE_DURATION_S,
      ease: [0.4, 0, 0.6, 1],
    });
  }, [planeX, planeY, overlayOp, _advanceToGallery, prefersReducedMotion]);

  const runExit = useCallback(() => {
    animate(overlayOp, 0, {
      duration: CLOSE_DURATION_S,
      ease: "easeOut",
      onComplete: _advanceToIdle,
    });
  }, [overlayOp, _advanceToIdle]);

  // react to state changes
  useEffect(() => {
    if (state === "transitioning-in") runEnter();
    if (state === "transitioning-out") runExit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state === "idle") return null;

  const isTransIn = state === "transitioning-in";
  const showChrome = state === "gallery" || state === "transitioning-out";

  return (
    <motion.div
      style={{ opacity: overlayOp }}
      className="fixed inset-0 z-[70] bg-[#141414]"
    >
      {/* Gallery stays mounted; clip-path covers the viewport once the plane exits. */}
      <motion.div style={{ clipPath, position: "absolute", inset: 0 }}>
        <GalleryScene />
      </motion.div>

      {/* Airplane and contrail appear only during the enter transition. */}
      {isTransIn && !prefersReducedMotion && (
        <>
          {/* contrail */}
          <motion.div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 2,
              width: contrailW,
              y: contrailY,
              background:
                "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.45) 100%)",
              pointerEvents: "none",
            }}
          />
          {/* plane */}
          <motion.div
            style={{
              position: "absolute",
              x: planeX,
              y: planeY,
              translateY: "-50%",
              pointerEvents: "none",
              filter: "drop-shadow(0 0 10px rgba(255,255,255,0.25))",
            }}
          >
            <AirplaneSVG />
          </motion.div>
        </>
      )}

      {/* Close button and title are visible once fully revealed. */}
      {showChrome && <GalleryChrome onClose={exit} />}
    </motion.div>
  );
}
