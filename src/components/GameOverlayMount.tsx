"use client";

import dynamic from "next/dynamic";

// Code-split the overlay so its (eventually heavy) code stays out of the
// portfolio's initial bundle. ssr:false because it is client-only.
const GameOverlay = dynamic(() => import("@/components/GameOverlay"), {
  ssr: false,
});

export function GameOverlayMount() {
  return <GameOverlay />;
}
