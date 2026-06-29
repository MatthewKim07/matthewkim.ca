"use client";

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

// Six-frame glitter cursor (matches the cursors-4u "Cool Yellow Pointer
// Glitter" animation: 600ms loop, step-end). Frames are local PNGs so they
// render in every browser, unlike the original webp data URIs.
const FRAME_COUNT = 6;
const FRAME_MS = 100;

function frameValue(i: number) {
  return `url(/cursors/dark-cursor-${i}.png) 0 0, auto`;
}

export function DarkModeCursor() {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    if (theme !== "dark") {
      root.style.removeProperty("--dark-cursor");
      return;
    }

    // Reduced motion: hold a single frame instead of cycling.
    if (reduceMotion) {
      root.style.setProperty("--dark-cursor", frameValue(0));
      return () => root.style.removeProperty("--dark-cursor");
    }

    let frame = 0;
    root.style.setProperty("--dark-cursor", frameValue(frame));
    const id = window.setInterval(() => {
      frame = (frame + 1) % FRAME_COUNT;
      root.style.setProperty("--dark-cursor", frameValue(frame));
    }, FRAME_MS);

    return () => {
      window.clearInterval(id);
      root.style.removeProperty("--dark-cursor");
    };
  }, [theme, reduceMotion]);

  return null;
}
