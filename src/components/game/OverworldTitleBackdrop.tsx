"use client";

import { useEffect, useRef } from "react";

// Bright pixel-art overworld behind the matthew.exe title screen. It is a small
// living diorama rather than a gameplay map: textured grass, layered props,
// water/lighting details, and a playful Matthew + Bubby chase loop. Reduced
// motion renders a single composed frame.

const BW = 200;
const BH = 130;
const ACCENT = "254,211,76";

const TAU = Math.PI * 2;

type Facing = 1 | -1;
type ChaseActor = { x: number; y: number; facing: Facing; phase: number };
type Drawable = { y: number; draw: () => void };
type DogMood = "run" | "search";
type MatthewMood = "run" | "hop";
type StoryActors = {
  dog: ChaseActor;
  matthew: ChaseActor | null;
  dogEmote: boolean;
  foundSpark: ChaseActor | null;
  dogMood: DogMood;
  matthewMood: MatthewMood;
};

const STORY_MS = 19000;
const RUN_SPEED = 0.02; // world pixels per ms; lively, but stable.
const OFFSCREEN_RIGHT = { x: 216, y: 83, facing: 1, phase: 0 } satisfies ChaseActor;
const OFFSCREEN_LEFT = { x: -18, y: 83, facing: 1, phase: 0 } satisfies ChaseActor;
const CHASE_PATH = [
  { x: 43, y: 83 },
  { x: 72, y: 83 },
  { x: 90, y: 77 },
  { x: 98, y: 64 },
  { x: 111, y: 74 },
  { x: 139, y: 82 },
  { x: 123, y: 84 },
  { x: 101, y: 82 },
  { x: 82, y: 82 },
];

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  px(ctx, x, y, w, h, "#283318");
  px(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}

function limb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  fill: string
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(-w / 2), 0, w, h);
  ctx.restore();
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  px(ctx, x, y + 1, 3, 1, color);
  px(ctx, x + 1, y, 1, 3, color);
}

function drawQuestion(ctx: CanvasRenderingContext2D, x: number, y: number, a: number) {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.fillRect(Math.round(x), Math.round(y), 4, 1);
  ctx.fillRect(Math.round(x + 3), Math.round(y + 1), 1, 2);
  ctx.fillRect(Math.round(x + 1), Math.round(y + 3), 2, 1);
  ctx.fillRect(Math.round(x + 1), Math.round(y + 6), 2, 2);
}

function drawTree(ctx: CanvasRenderingContext2D, tx: number, ty: number, sway: number) {
  px(ctx, tx + 5, ty + 13, 4, 9, "#6f4c2c");
  px(ctx, tx + 4, ty + 19, 6, 3, "#5a3b20");
  px(ctx, tx + sway, ty, 15, 15, "#283318");
  px(ctx, tx + 1 + sway, ty + 1, 13, 13, "#3f8038");
  px(ctx, tx + 2 + sway, ty + 2, 10, 8, "#56a64a");
  px(ctx, tx + 4 + sway, ty + 3, 6, 2, "#74c75f");
  px(ctx, tx + 1 + sway, ty + 10, 4, 2, "#2f6f32");
}

function drawNoticeBoard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x + 7, y + 13, 4, 13, "#6f4c2c");
  px(ctx, x + 5, y + 25, 8, 4, "#5a3b20");
  block(ctx, x, y, 18, 14, "#3f8038");
  px(ctx, x + 3, y + 3, 12, 7, "#56a64a");
  px(ctx, x + 5, y + 4, 8, 2, "#82cf6f");
  px(ctx, x + 1, y + 11, 7, 2, "#2f6f32");
}

function drawBubby(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number, facing: Facing, mood: DogMood) {
  const cycle = phase % 1;
  const hop = mood === "run" ? Math.round(Math.max(0, Math.sin(cycle * TAU)) * 1) : 0;
  const wag = Math.sin(cycle * TAU * (mood === "search" ? 1.4 : 2.4)) > 0 ? 1 : 0;
  const ear = mood === "run" && Math.sin(cycle * TAU) > 0 ? 1 : 0;
  const bx = Math.round(x);
  const by = Math.round(y - hop);

  px(ctx, bx - 1, y + 8, 11, 2, "rgba(20,20,20,0.22)");
  px(ctx, bx + 1, by + 3, 8, 6, "#15131a");
  px(ctx, bx + 2, by + 4, 6, 4, "#2d2a33");
  px(ctx, bx + (facing > 0 ? 6 : -1), by + 1, 5, 5, "#15131a");
  px(ctx, bx + (facing > 0 ? 7 : 0), by + 2, 3, 3, "#3b3743");
  px(ctx, bx + (facing > 0 ? 5 : 2), by + 2 + ear, 2, 4, "#1f1d25");
  px(ctx, bx + (facing > 0 ? 9 : -1), by + 2 + (ear ? 0 : 1), 2, 4, "#24212a");
  px(ctx, bx + (facing > 0 ? 10 : -1), by + 3, 1, 1, "#d8d2e0");
  px(ctx, bx + (facing > 0 ? 9 : 0), by + 5, 2, 1, "#46424e");
  px(ctx, bx + (facing > 0 ? 0 : 8), by + 3 + wag, 2, 1, "#15131a");
  px(ctx, bx + 2, by + 8, 2, 2, "#15131a");
  px(ctx, bx + 7, by + 8, 2, 2, "#15131a");
}

function drawMatthew(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: number,
  facing: Facing,
  mood: MatthewMood
) {
  const cycle = phase % 1;
  const hop = mood === "hop" ? Math.round(Math.max(0, Math.sin(cycle * TAU)) * 2) : 0;
  const swing = Math.sin(cycle * TAU);
  const stride = swing >= 0 ? 1 : -1;
  const mx = Math.round(x - 1);
  const my = Math.round(y - hop);
  const legAngle = swing * 0.46;

  px(ctx, mx - 1, y + 13, 14, 3, "rgba(20,40,15,0.24)");

  // Compact body: closer to Bubby's scale, less lanky.
  px(ctx, mx + 3, my + 8, 7, 6, "#2f9b95");
  px(ctx, mx + 3, my + 8, 1, 6, "#247a76");
  px(ctx, mx + 3, my + 13, 7, 2, "#247a76");

  // Minecraft-like legs: fixed-size rectangular limbs swinging from the hips.
  limb(ctx, mx + 5.5, my + 14, 3, 7, facing * legAngle, "#3b4a6a");
  limb(ctx, mx + 7.5, my + 14, 3, 7, -facing * legAngle, "#33425f");

  // Face and black, slightly messy hair based on the reference photo.
  px(ctx, mx + 4, my + 3, 6, 5, "#e8b889");
  px(ctx, mx + 3, my + 1, 8, 4, "#15131a");
  px(ctx, mx + 2, my + 3, 2, 3, "#15131a");
  px(ctx, mx + 9, my + 2, 2, 3, "#15131a");
  px(ctx, mx + 4, my, 5, 2, "#1f1b16");
  px(ctx, mx + 6, my - 1, 2, 1, "#1f1b16");
  px(ctx, mx + 4, my + 4, 2, 1, "#2a241d");
  px(ctx, mx + (facing > 0 ? 8 : 5), my + 5, 1, 1, "#1b1713");
  px(ctx, mx + (facing > 0 ? 10 : 3), my + 4, 1, 1, "#d6b08a");
  px(ctx, mx + (facing > 0 ? 7 : 5), my + 7, 2, 1, "#b97863");

  // Natural running arms: low swing, opposite the leading foot.
  const forwardArmX = facing > 0 ? 9 : 1;
  const backArmX = facing > 0 ? 2 : 9;
  const forwardArmY = my + 10 + (stride > 0 ? 1 : 0);
  const backArmY = my + 10 + (stride > 0 ? 0 : 1);
  px(ctx, mx + backArmX, backArmY, 2, 2, "#d79f78");
  px(ctx, mx + forwardArmX, forwardArmY, 2, 2, "#e8b889");
  px(ctx, mx + forwardArmX + facing, forwardArmY + 1, 1, 1, "#e8b889");
}

function pathLength(path: Array<{ x: number; y: number }>) {
  let total = 0;
  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

function pathPoint(path: Array<{ x: number; y: number }>, distance: number): ChaseActor {
  const total = pathLength(path);
  let d = ((distance % total) + total) % total;

  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= len) {
      const k = len === 0 ? 0 : d / len;
      const x = a.x + (b.x - a.x) * k;
      const y = a.y + (b.y - a.y) * k;
      return { x, y, facing: b.x >= a.x ? 1 : -1, phase: distance / 26 };
    }
    d -= len;
  }

  const p = path[0];
  return { x: p.x, y: p.y, facing: 1, phase: distance / 26 };
}

function chasePoint(t: number, offset = 0): ChaseActor {
  const total = pathLength(CHASE_PATH);
  return pathPoint(CHASE_PATH, t * RUN_SPEED + offset * total);
}

function smoothMixActor(a: ChaseActor, b: ChaseActor, k: number, phase: number): ChaseActor {
  const e = k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  const x = a.x + (b.x - a.x) * e;
  const y = a.y + (b.y - a.y) * e;
  return { x, y, facing: b.x >= a.x ? 1 : -1, phase };
}

function linearMixActor(a: ChaseActor, b: ChaseActor, k: number, phase: number): ChaseActor {
  const e = Math.min(1, Math.max(0, k));
  const x = a.x + (b.x - a.x) * e;
  const y = a.y + (b.y - a.y) * e;
  return { x, y, facing: b.x >= a.x ? 1 : -1, phase };
}

function storyActors(time: number, reduceMotion: boolean): StoryActors {
  if (reduceMotion) {
    return {
      dog: { x: 116, y: 82, facing: 1, phase: 0.15 } satisfies ChaseActor,
      matthew: { x: 95, y: 84, facing: 1, phase: 0.55 } satisfies ChaseActor,
      dogEmote: false,
      foundSpark: null as ChaseActor | null,
      dogMood: "run",
      matthewMood: "run",
    };
  }

  const cycleStart = Math.floor(time / STORY_MS) * STORY_MS;
  const local = time - cycleStart;
  const startDog = chasePoint(0, 0);
  const startMatthew = chasePoint(0, 0.09);
  const exitStart = 6500;
  const exitDog = chasePoint(exitStart, 0);
  const exitMatthew = chasePoint(exitStart, 0.09);
  const dogWait = { x: exitDog.x + 7, y: exitDog.y + 1, facing: exitMatthew.x >= exitDog.x ? 1 : -1, phase: 0.4 } satisfies ChaseActor;
  const searchPath = [
    dogWait,
    { x: dogWait.x - 8, y: dogWait.y + 1, facing: -1, phase: 0.1 },
    { x: dogWait.x + 5, y: dogWait.y - 3, facing: 1, phase: 0.2 },
    { x: dogWait.x - 2, y: dogWait.y + 3, facing: -1, phase: 0.3 },
  ] satisfies ChaseActor[];
  const searchEnd = searchPath[searchPath.length - 1];
  const reentry = { x: 42, y: 83, facing: 1, phase: 0.5 } satisfies ChaseActor;
  const dogTarget = { x: 55, y: 84, facing: -1, phase: 0.5 } satisfies ChaseActor;

  if (local < 6500) {
    return {
      dog: chasePoint(local, 0),
      matthew: chasePoint(local, 0.09),
      dogEmote: false,
      foundSpark: null as ChaseActor | null,
      dogMood: "run",
      matthewMood: "run",
    };
  }

  if (local < 9000) {
    const k = (local - 6500) / 2500;
    return {
      dog: smoothMixActor(exitDog, dogWait, k, local / 900),
      matthew: linearMixActor(exitMatthew, OFFSCREEN_RIGHT, k, local / 720 + 0.45),
      dogEmote: false,
      foundSpark: null as ChaseActor | null,
      dogMood: "run",
      matthewMood: "hop",
    };
  }

  if (local < 12000) {
    const p = ((local - 9000) / 3000) * (searchPath.length - 1);
    const i = Math.min(searchPath.length - 2, Math.floor(p));
    const dog = smoothMixActor(searchPath[i], searchPath[i + 1], p - i, local / 950);
    dog.facing = Math.sin(local / 220) > 0 ? 1 : -1;
    return {
      dog,
      matthew: null as ChaseActor | null,
      dogEmote: true,
      foundSpark: null as ChaseActor | null,
      dogMood: "search",
      matthewMood: "run",
    };
  }

  if (local < 14500) {
    const k = (local - 12000) / 2500;
    return {
      dog: smoothMixActor(searchEnd, dogTarget, k, local / 850),
      matthew: linearMixActor(OFFSCREEN_LEFT, reentry, k, local / 760 + 0.45),
      dogEmote: false,
      foundSpark: reentry,
      dogMood: "run",
      matthewMood: "hop",
    };
  }

  if (local < 19000) {
    const k = (local - 14500) / 4500;
    return {
      dog: smoothMixActor(dogTarget, startDog, k, local / 850),
      matthew: smoothMixActor(reentry, startMatthew, k, local / 760 + 0.45),
      dogEmote: false,
      foundSpark: null as ChaseActor | null,
      dogMood: "run",
      matthewMood: "run",
    };
  }

  return {
    dog: chasePoint(local, 0),
    matthew: chasePoint(local, 0.09),
    dogEmote: false,
    foundSpark: null as ChaseActor | null,
    dogMood: "run",
    matthewMood: "run",
  };
}

export function OverworldTitleBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssW = 0;
    let cssH = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const glow = (x: number, y: number, r: number, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${ACCENT},${a})`);
      g.addColorStop(1, `rgba(${ACCENT},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    const clouds = [
      { x: 8, y: 22, w: 22, speed: 250 },
      { x: 48, y: 35, w: 28, speed: 280 },
      { x: 94, y: 13, w: 34, speed: 315 },
      { x: 142, y: 30, w: 26, speed: 260 },
      { x: 184, y: 48, w: 20, speed: 300 },
    ];

    const draw = (time: number) => {
      const t = reduceMotion ? 0 : time;
      const scale = Math.ceil(Math.max((cssW * dpr) / BW, (cssH * dpr) / BH));
      const ox = Math.floor((cssW * dpr - BW * scale) / 2);
      const oy = Math.floor((cssH * dpr - BH * scale) / 2);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#5e9e44";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, ox, oy);

      // grass tiles with small texture flecks
      for (let y = 0; y < BH; y += 8) {
        for (let x = 0; x < BW; x += 8) {
          ctx.fillStyle = ((x / 8 + y / 8) & 1) === 0 ? "#6fb152" : "#67a749";
          ctx.fillRect(x, y, 8, 8);
          if (((x * 11 + y * 7) % 31) === 0) px(ctx, x + 5, y + 2, 1, 2, "#7fc867");
          if (((x * 5 + y * 13) % 43) === 0) px(ctx, x + 2, y + 6, 2, 1, "#5a9941");
        }
      }

      // winding path
      ctx.fillStyle = "#b9995f";
      ctx.fillRect(0, 74, BW, 16);
      ctx.fillRect(92, 0, 16, 80);
      ctx.fillStyle = "#dcc188";
      ctx.fillRect(0, 76, BW, 12);
      ctx.fillRect(94, 0, 12, 80);
      ctx.fillStyle = "rgba(80,60,30,0.12)";
      for (let x = 6; x < BW; x += 17) ctx.fillRect(x, 86, 8, 1);
      for (let y = 7; y < 74; y += 14) ctx.fillRect(96, y, 8, 1);

      // pond (top-right)
      ctx.fillStyle = "#e7d6a4";
      ctx.fillRect(150, 18, 44, 30);
      ctx.fillStyle = "#3b96cd";
      ctx.fillRect(154, 20, 38, 26);
      ctx.fillStyle = "#46a6da";
      ctx.fillRect(155, 21, 36, 24);
      if (!reduceMotion) {
        ctx.fillStyle = "#a9def4";
        const off = Math.floor(t / 240) % 6;
        for (let y = 24; y < 44; y += 6) ctx.fillRect(158 + ((off + y) % 6), y, 5, 1);
      }
      px(ctx, 151, 18, 42, 1, "#f3e8cd");
      px(ctx, 154, 47, 36, 2, "#c8b071");

      // workshop building (left)
      ctx.fillStyle = "#283318";
      ctx.fillRect(20, 30, 46, 38);
      ctx.fillStyle = "#e9b46e";
      ctx.fillRect(21, 44, 44, 23);
      ctx.fillStyle = "rgba(122,78,35,0.12)";
      for (let y = 47; y < 65; y += 4) ctx.fillRect(22, y, 42, 1);
      ctx.fillStyle = "rgba(255,235,186,0.16)";
      for (let x = 26; x < 63; x += 12) ctx.fillRect(x, 45, 1, 20);
      ctx.fillStyle = "#3f6ea8";
      ctx.fillRect(18, 30, 50, 15);
      ctx.fillStyle = "#5286c0";
      ctx.fillRect(18, 30, 50, 4);
      ctx.fillStyle = "#365f92";
      for (let x = 20; x < 66; x += 6) ctx.fillRect(x, 42, 4, 1);
      ctx.fillStyle = "#7c5430";
      ctx.fillRect(38, 54, 10, 13); // door
      ctx.fillStyle = "#6a4528";
      for (let y = 56; y < 66; y += 3) ctx.fillRect(39, y, 8, 1);
      ctx.fillStyle = `rgb(${ACCENT})`;
      ctx.fillRect(46, 60, 1, 1);
      ctx.fillStyle = "#bfe6f5";
      ctx.fillRect(26, 48, 8, 8);
      ctx.fillRect(52, 48, 8, 8);
      ctx.fillStyle = "#8ecde6";
      ctx.fillRect(30, 48, 1, 8);
      ctx.fillRect(56, 48, 1, 8);
      ctx.fillRect(26, 52, 8, 1);
      ctx.fillRect(52, 52, 8, 1);
      px(ctx, 27, 49, 3, 1, "#edfaff");
      px(ctx, 53, 49, 3, 1, "#edfaff");
      px(ctx, 22, 43, 4, 1, "#f5c987");
      px(ctx, 59, 43, 4, 1, "#c48746");
      px(ctx, 22, 66, 42, 2, "#8b5b31");
      glow(57, 50, 12, 0.12);

      // Ground flowers belong under props/trees, never on top of them.
      const fcols = ["#e3614f", `rgb(${ACCENT})`, "#e58bb0", "#f3efe4"];
      const flowerStep = 16;
      const drawFlower = (x: number, y: number, index: number) => {
        ctx.fillStyle = fcols[Math.abs(index) % fcols.length];
        ctx.fillRect(x, y, 2, 2);
      };
      for (let i = 0; ; i++) {
        const leftX = 88 - i * flowerStep;
        const rightX = 110 + i * flowerStep;
        if (leftX >= 0) {
          drawFlower(leftX, 70, i);
          drawFlower(leftX, 92, i);
        }
        if (rightX < BW) {
          drawFlower(rightX, 70, i);
          drawFlower(rightX, 92, i);
        }
        if (leftX < 0 && rightX >= BW) break;
      }
      for (let i = 1; ; i++) {
        const y = 70 - i * flowerStep;
        if (y < 0) break;
        drawFlower(88, y, i);
        drawFlower(110, y, i);
      }

      // Depth-sorted foreground: trees and actors obey foot position, so nobody
      // phases through trunks/canopies if their paths come close.
      const drawables: Drawable[] = [];
      drawables.push({
        y: 94,
        draw: () => {
          px(ctx, 36, 87, 21, 3, "#8a5d31");
          px(ctx, 39, 90, 3, 4, "#6f4c2c");
          px(ctx, 51, 90, 3, 4, "#6f4c2c");
        },
      });
      const trees: Array<[number, number]> = [
        [14, 96],
        [60, 100],
        [140, 92],
        [184, 104],
        [128, 23],
      ];
      for (const [tx, ty] of trees) {
        drawables.push({
          y: ty + 22,
          draw: () => drawTree(ctx, tx, ty, reduceMotion ? 0 : Math.round(Math.sin(t / 900 + tx) * 0.5)),
        });
      }
      drawables.push({
        y: 61,
        draw: () => drawNoticeBoard(ctx, 70, 43),
      });

      // Matthew and Bubby play hide-and-seek: chase, vanish, search, reunite.
      const { dog, matthew, dogEmote, foundSpark, dogMood, matthewMood } = storyActors(t, reduceMotion);
      drawables.push({
        y: dog.y + 10,
        draw: () => {
          drawBubby(ctx, dog.x, dog.y, dog.phase * 1.25, dog.facing, dogMood);
          if (dogEmote) {
            const a = reduceMotion ? 0.85 : 0.55 + 0.3 * Math.sin(t / 260);
            drawQuestion(ctx, dog.x + 4, dog.y - 8, a);
          }
        },
      });
      if (matthew) {
        drawables.push({
          y: matthew.y + 18,
          draw: () => drawMatthew(ctx, matthew.x, matthew.y, matthew.phase * 0.8 + 0.45, matthew.facing, matthewMood),
        });
      }
      drawables.sort((a, b) => a.y - b.y);
      for (const d of drawables) d.draw();
      if (foundSpark && !reduceMotion) {
        const pulse = 0.45 + 0.35 * Math.sin(t / 180);
        sparkle(ctx, foundSpark.x + 4, foundSpark.y - 7, `rgba(${ACCENT},${pulse})`);
      }

      // soft drifting clouds (light, for brightness)
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (const c of clouds) {
        const cx = reduceMotion ? c.x : (c.x + t / c.speed) % (BW + 56) - 28;
        ctx.fillRect(cx, c.y, c.w, 6);
        ctx.fillRect(cx + 6, c.y - 3, c.w - 12, 4);
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fillRect(cx + 3, c.y + 6, c.w - 6, 2);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
      }

      // gentle warm light + soft edge darkening (kept subtle / bright)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const w = canvas.width;
      const h = canvas.height;
      const lg = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.6);
      lg.addColorStop(0, "rgba(255,248,214,0.12)");
      lg.addColorStop(1, "rgba(255,248,214,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, w, h);
      const vg = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.68);
      vg.addColorStop(0, "rgba(20,40,20,0)");
      vg.addColorStop(1, "rgba(20,40,20,0.4)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      // readability scrim right under the menu
      const sc = ctx.createRadialGradient(w / 2, h * 0.46, 0, w / 2, h * 0.46, Math.min(w, h) * 0.5);
      sc.addColorStop(0, "rgba(8,18,30,0.5)");
      sc.addColorStop(1, "rgba(8,18,30,0)");
      ctx.fillStyle = sc;
      ctx.fillRect(0, 0, w, h);
    };

    let raf = 0;
    if (reduceMotion) {
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduceMotion]);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
