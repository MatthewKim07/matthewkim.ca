"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const C = {
  grass1: "#6fb152",
  grass2: "#67a749",
  grass3: "#5e9e44",
  path: "#dcc188",
  pathDark: "#b9995f",
  outline: "#283318",
  roof: "#3f6ea8",
  roofHi: "#5286c0",
  wall: "#e9b46e",
  door: "#7c5430",
  water: "#3b96cd",
  waterHi: "#a9def4",
  plaza: "#d2d7df",
  plazaLine: "#aab2be",
  trunk: "#6f4c2c",
  leaf: "#3f8038",
  leafHi: "#74c75f",
  accent: "#FED34C",
  red: "#e3614f",
  pink: "#e58bb0",
  cream: "#f3efe4",
  player: "#2f9b95",
  playerDark: "#247a76",
  hair: "#6f4c2c",
};

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  rect(ctx, x, y, w, h, C.outline);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  rect(ctx, x + 5 * s, y + 13 * s, 4 * s, 8 * s, C.trunk);
  rect(ctx, x, y, 15 * s, 15 * s, C.outline);
  rect(ctx, x + 1 * s, y + 1 * s, 13 * s, 13 * s, C.leaf);
  rect(ctx, x + 3 * s, y + 2 * s, 8 * s, 5 * s, C.leafHi);
}

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  block(ctx, x + 2, y + 12, w - 4, h - 12, C.wall);
  rect(ctx, x, y + 4, w, 12, C.roof);
  rect(ctx, x, y + 4, w, 3, C.roofHi);
  rect(ctx, x + w * 0.44, y + h - 14, 10, 14, C.door);
  rect(ctx, x + 8, y + 21, 8, 8, "#bfe6f5");
  rect(ctx, x + w - 18, y + 21, 8, 8, "#bfe6f5");
}

function drawPond(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  rect(ctx, x - 2, y - 2, w + 4, h + 4, "#e7d6a4");
  rect(ctx, x, y, w, h, C.water);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, "#46a6da");

  const off = Math.floor(t / 220) % 7;
  for (let yy = y + 5; yy < y + h - 2; yy += 7) {
    rect(ctx, x + 4 + ((off + yy) % 8), yy, 7, 1, C.waterHi);
    rect(ctx, x + w - 15 - ((off + yy) % 5), yy + 2, 6, 1, C.waterHi);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, step: number) {
  rect(ctx, x, y + 9, 7, 2, "rgba(20,40,15,0.24)");
  rect(ctx, x + 1, y, 5, 4, C.hair);
  rect(ctx, x, y + 3, 7, 8, C.outline);
  rect(ctx, x + 1, y + 4, 5, 5, C.player);
  rect(ctx, x + 2, y + 9, 1, 2 + step, C.playerDark);
  rect(ctx, x + 5, y + 9, 1, 3 - step, C.playerDark);
  rect(ctx, x - 1, y + 5, 1, 2, C.accent);
}

function drawBubby(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x, y + 5, 9, 2, "rgba(20,20,20,0.22)");
  rect(ctx, x, y, 8, 6, "#15131a");
  rect(ctx, x + 1, y + 1, 6, 4, "#2d2a33");
  rect(ctx, x + 5, y - 1, 4, 4, "#3b3743");
  rect(ctx, x + 7, y, 1, 1, C.cream);
  rect(ctx, x + 8, y + 2, 1, 1, C.accent);
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, reduceMotion: boolean) {
  const t = reduceMotion ? 0 : time;
  rect(ctx, 0, 0, w, h, C.grass3);

  for (let y = 0; y < h; y += 8) {
    for (let x = 0; x < w; x += 8) {
      const shade = ((x / 8 + y / 8) & 1) === 0 ? C.grass1 : C.grass2;
      rect(ctx, x, y, 8, 8, shade);
      if (((x * 13 + y * 7) % 41) === 0) rect(ctx, x + 5, y + 2, 1, 2, "#7fc867");
    }
  }

  const pathY = Math.floor(h * 0.58);
  rect(ctx, 0, pathY - 4, w, 18, C.pathDark);
  rect(ctx, 0, pathY - 2, w, 14, C.path);
  rect(ctx, w * 0.48, Math.floor(h * 0.25), 15, pathY - Math.floor(h * 0.25), C.path);

  drawBuilding(ctx, w * 0.07, h * 0.24, Math.max(34, w * 0.22), Math.max(36, h * 0.38));
  drawPond(ctx, w * 0.73, h * 0.16, Math.max(34, w * 0.18), Math.max(19, h * 0.22), t);

  const px = Math.floor(w * 0.44);
  const py = Math.floor(h * 0.41);
  rect(ctx, px, py, Math.max(36, w * 0.17), Math.max(24, h * 0.22), C.plaza);
  for (let x = px; x < px + w * 0.18; x += 8) rect(ctx, x, py, 1, h * 0.22, C.plazaLine);
  for (let y = py; y < py + h * 0.23; y += 8) rect(ctx, px, y, w * 0.18, 1, C.plazaLine);
  rect(ctx, px + 14, py + 9, 7, 7, C.accent);
  rect(ctx, px + 16, py + 11, 3, 3, "#fff4b5");

  const treeScale = w > 260 ? 1.2 : 1;
  drawTree(ctx, w * 0.29, h * 0.12, treeScale);
  drawTree(ctx, w * 0.62, h * 0.12, treeScale);
  drawTree(ctx, w * 0.66, h * 0.72, treeScale);
  drawTree(ctx, w * 0.9, h * 0.64, treeScale);

  const flowerColors = [C.red, C.accent, C.pink, C.cream];
  for (let x = 10; x < w; x += 15) {
    const c = flowerColors[(x / 15) % flowerColors.length | 0];
    rect(ctx, x, pathY - 9, 2, 2, c);
    rect(ctx, x + 6, pathY + 16, 2, 2, c);
  }

  const route = w - 36;
  const walkerX = reduceMotion ? w * 0.54 : 18 + ((t / 52) % route);
  const bob = reduceMotion ? 0 : Math.floor(t / 180) % 2;
  drawPlayer(ctx, walkerX, pathY + 1, bob);
  drawBubby(ctx, Math.min(w - 16, walkerX + 13), pathY + 6);

  // Warm terminal-like accents tucked into the world.
  const pulse = reduceMotion ? 0.45 : 0.32 + 0.18 * Math.sin(t / 420);
  ctx.fillStyle = `rgba(254,211,76,${pulse})`;
  ctx.fillRect(w * 0.47, h * 0.2, 18, 2);
  ctx.fillRect(w * 0.79, h * 0.48, 24, 2);

  // Fine scanline texture, matching the boot shell without overpowering detail.
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  for (let y = 1; y < h; y += 4) rect(ctx, 0, y, w, 1, "rgba(255,255,255,0.07)");
}

export function useMatthewPixelWorldTexture() {
  const [texture, setTexture] = useState<string>("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 360;
    canvas.height = 112;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let cancelled = false;
    let lastFrame = -Infinity;

    const draw = (time: number) => {
      drawScene(ctx, canvas.width, canvas.height, time, !!reduceMotion);
      setTexture(canvas.toDataURL("image/png"));
    };

    const loop = (time: number) => {
      if (cancelled) return;
      if (time - lastFrame > 90) {
        lastFrame = time;
        draw(time);
      }
      if (!reduceMotion) raf = requestAnimationFrame(loop);
    };

    draw(0);
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  return texture;
}
