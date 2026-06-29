"use client";

import { useEffect, useRef } from "react";

// Bright pixel-art overworld behind the Overworld title screen. Draws an
// inviting top-down scene on a low-res buffer (scaled up, smoothing off for
// crisp blocks): grass, a winding path, a central plaza with a spawn marker, a
// workshop building, trees, a pond, flowers, and a tiny explorer wandering the
// path. Suggests the world without being the playable scene. Reduced motion
// renders a single static frame.

const BW = 200;
const BH = 130;
const ACCENT = "254,211,76";

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
      { x: 30, y: 22, w: 26 },
      { x: 120, y: 14, w: 34 },
      { x: 170, y: 40, w: 22 },
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

      // grass tiles
      for (let y = 0; y < BH; y += 8) {
        for (let x = 0; x < BW; x += 8) {
          ctx.fillStyle = ((x / 8 + y / 8) & 1) === 0 ? "#6fb152" : "#67a749";
          ctx.fillRect(x, y, 8, 8);
        }
      }

      // winding path
      ctx.fillStyle = "#b9995f";
      ctx.fillRect(0, 74, BW, 16);
      ctx.fillStyle = "#dcc188";
      ctx.fillRect(0, 76, BW, 12);
      ctx.fillRect(92, 40, 14, 40); // spur up to plaza

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

      // workshop building (left)
      ctx.fillStyle = "#283318";
      ctx.fillRect(20, 30, 46, 38);
      ctx.fillStyle = "#e9b46e";
      ctx.fillRect(21, 44, 44, 23);
      ctx.fillStyle = "#3f6ea8";
      ctx.fillRect(18, 30, 50, 15);
      ctx.fillStyle = "#5286c0";
      ctx.fillRect(18, 30, 50, 4);
      ctx.fillStyle = "#7c5430";
      ctx.fillRect(38, 54, 10, 13); // door
      ctx.fillStyle = "#bfe6f5";
      ctx.fillRect(26, 48, 8, 8);
      ctx.fillRect(52, 48, 8, 8);
      glow(57, 50, 12, 0.12);

      // central plaza + spawn marker (behind the title)
      ctx.fillStyle = "#d2d7df";
      ctx.fillRect(82, 52, 40, 30);
      ctx.fillStyle = "#aab2be";
      for (let x = 82; x <= 122; x += 8) ctx.fillRect(x, 52, 1, 30);
      for (let y = 52; y <= 82; y += 8) ctx.fillRect(82, y, 40, 1);
      glow(102, 66, 16, 0.14);
      ctx.strokeStyle = `rgba(${ACCENT},0.5)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(96, 60, 12, 12);

      // trees
      const trees: Array<[number, number]> = [
        [14, 96],
        [60, 100],
        [140, 92],
        [184, 104],
        [120, 24],
      ];
      for (const [tx, ty] of trees) {
        ctx.fillStyle = "#6f4c2c";
        ctx.fillRect(tx + 5, ty + 12, 4, 8);
        ctx.fillStyle = "#283318";
        ctx.fillRect(tx, ty, 14, 14);
        ctx.fillStyle = "#3f8038";
        ctx.fillRect(tx + 1, ty + 1, 12, 12);
        ctx.fillStyle = "#56a64a";
        ctx.fillRect(tx + 2, ty + 2, 9, 7);
        ctx.fillStyle = "#74c75f";
        ctx.fillRect(tx + 3, ty + 3, 5, 2);
      }

      // flowers along the path
      const fcols = ["#e3614f", `rgb(${ACCENT})`, "#e58bb0", "#f3efe4"];
      for (let i = 8; i < BW; i += 13) {
        ctx.fillStyle = fcols[(i / 13) % fcols.length | 0];
        ctx.fillRect(i, 70, 2, 2);
        ctx.fillRect(i + 5, 92, 2, 2);
      }

      // tiny explorer wandering the path
      const ex = reduceMotion ? 70 : 30 + ((t / 60) % (BW - 40));
      const ey = 80;
      ctx.fillStyle = "rgba(20,40,15,0.25)";
      ctx.fillRect(ex, ey + 8, 6, 2);
      ctx.fillStyle = "#23301a";
      ctx.fillRect(ex, ey, 6, 9);
      ctx.fillStyle = "#2f9b95";
      ctx.fillRect(ex + 1, ey + 4, 4, 4);
      ctx.fillStyle = "#6f4c2c";
      ctx.fillRect(ex + 1, ey, 4, 3);
      ctx.fillStyle = `rgb(${ACCENT})`;
      ctx.fillRect(ex, ey + 2, 1, 2);

      // soft drifting clouds (light, for brightness)
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      for (const c of clouds) {
        const cx = reduceMotion ? c.x : (c.x + t / 220) % (BW + 40) - 20;
        ctx.fillRect(cx, c.y, c.w, 6);
        ctx.fillRect(cx + 6, c.y - 3, c.w - 12, 4);
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
