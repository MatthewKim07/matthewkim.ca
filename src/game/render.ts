import type { GameState, PlayerState } from "@/game/engine";
import type { SceneObject, TerrainPatch, Vec2 } from "@/game/types";

// Canvas renderer — bright, DS-era top-down overworld. Single context, image
// smoothing off, integer-scaled and letterboxed for crisp pixels. Procedural
// pixel art (no external assets): grass, stone plaza, dirt paths, a pond, a
// workshop building, trees and props with dark outlines, and a charming
// explorer. Colorful but controlled, with #FED34C as the signature accent.

const C = {
  // ground
  grass1: "#6fb152",
  grass2: "#67a749",
  grassDark: "#508a3c",
  tuftHi: "#82c062",
  tuftLo: "#579440",
  plaza: "#d2d7df",
  plaza2: "#c4cad3",
  plazaLine: "#aab2be",
  path: "#dcc188",
  path2: "#d0b277",
  pathEdge: "#b9995f",
  pebble: "#b9995f",
  sand: "#e7d6a4",
  water: "#46a6da",
  water2: "#3b96cd",
  waterHi: "#a9def4",
  hedge: "#5a9b43",
  hedgeTop: "#74b956",
  hedgeDark: "#3f6f2e",
  // structures
  outline: "#283318",
  wood: "#a9733f",
  woodHi: "#c08a4f",
  woodDark: "#7c5430",
  wallWarm: "#e9b46e",
  wallShade: "#d49d55",
  roof: "#3f6ea8",
  roofDark: "#33588a",
  roofHi: "#5286c0",
  window: "#bfe6f5",
  screen: "#FED34C",
  board: "#e0cf9f",
  note: "#f3efe4",
  accent: "#FED34C",
  accentDk: "#caa42f",
  hazard: "#FED34C",
  leaf: "#56a64a",
  leafHi: "#74c75f",
  leafDark: "#3f8038",
  trunk: "#6f4c2c",
  stone: "#c4cad3",
  stoneDark: "#9aa3b0",
  lampPole: "#566375",
  // flowers
  fRed: "#e3614f",
  fPink: "#e58bb0",
  fWhite: "#f3efe4",
  // player
  pOut: "#23301a",
  skin: "#ecbd92",
  hair: "#6f4c2c",
  jacket: "#2f9b95",
  jacketDk: "#247a76",
  pants: "#3b4a6a",
  pack: "#e08148",
  packDk: "#bd6634",
  boots: "#4a3826",
  shadow: "rgba(20,40,15,0.22)",
};

export interface RenderOptions {
  reduceMotion: boolean;
  dpr: number;
  showPrompt: boolean;
  camera?: Vec2;
}

function noise(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string
) {
  ctx.fillStyle = C.outline;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}

function shadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState,
  opts: RenderOptions
): void {
  const { scene } = state;
  const dpr = opts.dpr;
  const cw = canvas.width / dpr;
  const ch = canvas.height / dpr;
  const time = opts.reduceMotion ? 0 : performance.now();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#3f8038"; // grass-toned letterbox so bars read as "more world"
  ctx.fillRect(0, 0, cw, ch);

  const scale = Math.max(1, Math.floor(Math.min(cw / scene.width, ch / scene.height)));
  const offX = Math.floor((cw - scene.width * scale) / 2);
  const offY = Math.floor((ch - scene.height * scale) / 2);
  const cam = opts.camera ?? { x: 0, y: 0 };

  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(scale, scale);
  ctx.translate(-cam.x, -cam.y);

  drawGrass(ctx, scene.width, scene.height);
  for (const p of scene.terrain) drawTerrain(ctx, p, time);
  drawHedges(ctx, scene.width, scene.height);

  // Depth sort objects + player by foot Y so overlaps look right.
  type Drawable = { y: number; draw: () => void };
  const drawables: Drawable[] = scene.objects.map((o) => ({
    y: o.rect.y + o.rect.h,
    draw: () => drawObject(ctx, o, time),
  }));
  drawables.push({
    y: state.player.y + state.player.h,
    draw: () => drawPlayer(ctx, state.player, opts.reduceMotion),
  });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  if (opts.showPrompt && state.nearestId) {
    const obj = scene.objects.find((o) => o.id === state.nearestId);
    if (obj) drawPromptMarker(ctx, obj, state.player.anim);
  }

  drawAmbientLight(ctx, scene.width, scene.height);
  ctx.restore();
}

function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const t = 16;
  for (let y = 0; y < h; y += t) {
    for (let x = 0; x < w; x += t) {
      ctx.fillStyle = ((x / t + y / t) & 1) === 0 ? C.grass1 : C.grass2;
      ctx.fillRect(x, y, t, t);
    }
  }
  // scattered tufts for texture
  for (let y = 4; y < h; y += 8) {
    for (let x = 4; x < w; x += 8) {
      const n = noise(x, y);
      if (n > 0.82) {
        ctx.fillStyle = C.tuftHi;
        ctx.fillRect(x, y, 2, 1);
        ctx.fillStyle = C.tuftLo;
        ctx.fillRect(x, y + 1, 1, 1);
      }
    }
  }
}

function drawTerrain(ctx: CanvasRenderingContext2D, p: TerrainPatch, time: number) {
  const r = p.rect;
  switch (p.kind) {
    case "grassDark": {
      ctx.fillStyle = C.grassDark;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      break;
    }
    case "sand": {
      ctx.fillStyle = C.sand;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      break;
    }
    case "plaza": {
      ctx.fillStyle = C.plaza;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // cobble grid
      ctx.fillStyle = C.plazaLine;
      for (let x = r.x; x <= r.x + r.w; x += 12) ctx.fillRect(x, r.y, 1, r.h);
      for (let y = r.y; y <= r.y + r.h; y += 12) ctx.fillRect(r.x, y, r.w, 1);
      ctx.fillStyle = C.plaza2;
      for (let y = r.y + 6; y < r.y + r.h; y += 24)
        for (let x = r.x + 6; x < r.x + r.w; x += 24) ctx.fillRect(x, y, 6, 6);
      break;
    }
    case "path": {
      ctx.fillStyle = C.pathEdge;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = C.path;
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.fillStyle = C.path2;
      for (let i = 0; i < r.w; i += 10) {
        const yy = r.y + 4 + Math.floor(noise(r.x + i, r.y) * (r.h - 8));
        ctx.fillRect(r.x + i, yy, 2, 1);
      }
      break;
    }
    case "flowerbed": {
      ctx.fillStyle = C.grassDark;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      const cols = [C.fRed, C.accent, C.fPink, C.fWhite];
      for (let i = 0; i < r.w; i += 6) {
        for (let j = 0; j < r.h; j += 6) {
          const n = noise(r.x + i, r.y + j);
          if (n > 0.5) {
            ctx.fillStyle = cols[Math.floor(n * 10) % cols.length];
            ctx.fillRect(r.x + i + 1, r.y + j + 1, 2, 2);
          }
        }
      }
      break;
    }
    case "water": {
      ctx.fillStyle = C.water2;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = C.water;
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      // animated highlight ripples
      const off = Math.floor(time / 240) % 8;
      ctx.fillStyle = C.waterHi;
      for (let y = r.y + 4; y < r.y + r.h - 2; y += 8) {
        ctx.fillRect(r.x + 4 + ((off + y) % 6), y, 5, 1);
        ctx.fillRect(r.x + 14 + ((off * 2 + y) % 8), y + 3, 4, 1);
      }
      break;
    }
  }
}

function drawHedges(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const segs = [
    { x: 0, y: 0, w, h: 14 },
    { x: 0, y: h - 14, w, h: 14 },
    { x: 0, y: 0, w: 14, h },
    { x: w - 14, y: 0, w: 14, h },
  ];
  for (const s of segs) {
    ctx.fillStyle = C.hedgeDark;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = C.hedge;
    ctx.fillRect(s.x, s.y, s.w, Math.max(2, s.h - 3));
    ctx.fillStyle = C.hedgeTop;
    // leafy speckle on top edge
    for (let x = s.x; x < s.x + s.w; x += 4) {
      if (noise(x, s.y) > 0.4) ctx.fillRect(x, s.y, 2, 2);
    }
    for (let y = s.y; y < s.y + s.h; y += 4) {
      if (noise(s.x, y) > 0.6) ctx.fillRect(s.x, y, 2, 2);
    }
  }
}

function drawObject(ctx: CanvasRenderingContext2D, o: SceneObject, time: number) {
  const r = o.rect;
  switch (o.kind) {
    case "building": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2.2, 4);
      // walls
      block(ctx, r.x, r.y + 18, r.w, r.h - 18, C.wallWarm);
      ctx.fillStyle = C.wallShade;
      ctx.fillRect(r.x + 1, r.y + r.h - 10, r.w - 2, 9);
      // roof
      ctx.fillStyle = C.outline;
      ctx.fillRect(r.x - 2, r.y, r.w + 4, 20);
      ctx.fillStyle = C.roof;
      ctx.fillRect(r.x - 1, r.y + 1, r.w + 2, 18);
      ctx.fillStyle = C.roofHi;
      ctx.fillRect(r.x - 1, r.y + 1, r.w + 2, 4);
      ctx.fillStyle = C.roofDark;
      ctx.fillRect(r.x - 1, r.y + 14, r.w + 2, 5);
      // door
      block(ctx, r.x + r.w / 2 - 8, r.y + r.h - 20, 16, 20, C.woodDark);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + r.w / 2 + 3, r.y + r.h - 11, 2, 2); // knob
      // windows with warm glow
      for (const wx of [r.x + 12, r.x + r.w - 24]) {
        block(ctx, wx, r.y + 26, 12, 12, C.window);
        ctx.fillStyle = C.outline;
        ctx.fillRect(wx + 5, r.y + 26, 2, 12);
        ctx.fillRect(wx, r.y + 31, 12, 2);
      }
      break;
    }
    case "workbench": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      block(ctx, r.x, r.y + 4, r.w, r.h - 4, C.wood);
      ctx.fillStyle = C.woodHi;
      ctx.fillRect(r.x + 1, r.y + 4, r.w - 2, 3);
      // little terminal
      block(ctx, r.x + r.w / 2 - 8, r.y - 8, 16, 12, C.woodDark);
      ctx.fillStyle = C.screen;
      ctx.fillRect(r.x + r.w / 2 - 6, r.y - 6, 12, 7);
      ctx.fillStyle = C.accentDk;
      ctx.fillRect(r.x + r.w / 2 - 5, r.y - 5, 4, 1);
      // tools
      ctx.fillStyle = C.stone;
      ctx.fillRect(r.x + 4, r.y + 6, 6, 2);
      break;
    }
    case "noticeboard": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      // posts
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x + 3, r.y + r.h - 8, 3, 10);
      ctx.fillRect(r.x + r.w - 6, r.y + r.h - 8, 3, 10);
      block(ctx, r.x, r.y, r.w, r.h - 4, C.board);
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x, r.y, r.w, 3); // frame top
      // pinned notes
      ctx.fillStyle = C.note;
      ctx.fillRect(r.x + 5, r.y + 6, 12, 10);
      ctx.fillRect(r.x + 22, r.y + 5, 10, 8);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 34, r.y + 8, 8, 8);
      ctx.fillStyle = C.outline;
      ctx.fillRect(r.x + 7, r.y + 9, 8, 1);
      ctx.fillRect(r.x + 7, r.y + 12, 6, 1);
      break;
    }
    case "gate": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      // posts
      block(ctx, r.x, r.y, 6, r.h, C.woodDark);
      block(ctx, r.x + r.w - 6, r.y, 6, r.h, C.woodDark);
      // crossbeam
      block(ctx, r.x, r.y, r.w, 7, C.wood);
      // half-built planks + open gap to "outside"
      ctx.fillStyle = C.grass1;
      ctx.fillRect(r.x + 6, r.y + 10, r.w - 12, r.h - 12);
      ctx.fillStyle = C.wood;
      ctx.fillRect(r.x + 6, r.y + 12, r.w - 12, 5);
      ctx.fillRect(r.x + 6, r.y + 24, r.w - 12, 5);
      // hazard tape
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? C.outline : C.hazard;
        ctx.fillRect(r.x + 6 + i * 5, r.y + r.h - 6, 5, 3);
      }
      break;
    }
    case "tree": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2.4, 3);
      // trunk
      block(ctx, r.x + r.w / 2 - 3, r.y + r.h - 12, 6, 12, C.trunk);
      // canopy (layered blobs)
      ctx.fillStyle = C.outline;
      ctx.fillRect(r.x, r.y + 2, r.w, r.h - 14);
      ctx.fillStyle = C.leafDark;
      ctx.fillRect(r.x + 1, r.y + 3, r.w - 2, r.h - 15);
      ctx.fillStyle = C.leaf;
      ctx.fillRect(r.x + 2, r.y + 4, r.w - 5, r.h - 18);
      ctx.fillStyle = C.leafHi;
      ctx.fillRect(r.x + 3, r.y + 5, r.w - 10, 4);
      break;
    }
    case "bush": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x, r.y, r.w, r.h, C.leafDark);
      ctx.fillStyle = C.leaf;
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 3);
      ctx.fillStyle = C.leafHi;
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 6, 2);
      ctx.fillStyle = C.fRed;
      ctx.fillRect(r.x + 4, r.y + 5, 2, 2); // berries
      ctx.fillRect(r.x + r.w - 7, r.y + 7, 2, 2);
      break;
    }
    case "barrel": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x, r.y, r.w, r.h, C.wood);
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x + 1, r.y + 3, r.w - 2, 2);
      ctx.fillRect(r.x + 1, r.y + r.h - 5, r.w - 2, 2);
      ctx.fillStyle = C.woodHi;
      ctx.fillRect(r.x + 2, r.y + 1, 2, r.h - 2);
      break;
    }
    case "crate": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x, r.y, r.w, r.h, C.woodHi);
      ctx.strokeStyle = C.woodDark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 1, r.y + 1);
      ctx.lineTo(r.x + r.w - 1, r.y + r.h - 1);
      ctx.moveTo(r.x + r.w - 1, r.y + 1);
      ctx.lineTo(r.x + 1, r.y + r.h - 1);
      ctx.stroke();
      break;
    }
    case "rock": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x, r.y, r.w, r.h, C.stone);
      ctx.fillStyle = C.stoneDark;
      ctx.fillRect(r.x + 1, r.y + r.h - 3, r.w - 2, 2);
      ctx.fillStyle = "#dfe4ea";
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 6, 2);
      break;
    }
    case "well": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      block(ctx, r.x, r.y + 8, r.w, r.h - 8, C.stone);
      ctx.fillStyle = C.water;
      ctx.fillRect(r.x + 4, r.y + 12, r.w - 8, r.h - 16);
      ctx.fillStyle = C.waterHi;
      ctx.fillRect(r.x + 6, r.y + 14, 4, 1);
      // posts + roof
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x + 2, r.y, 3, 12);
      ctx.fillRect(r.x + r.w - 5, r.y, 3, 12);
      ctx.fillStyle = C.outline;
      ctx.fillRect(r.x - 2, r.y - 2, r.w + 4, 6);
      ctx.fillStyle = C.wood;
      ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, 4);
      break;
    }
    case "signpost": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x + r.w / 2 - 1, r.y + 4, 3, r.h - 4);
      block(ctx, r.x, r.y, r.w, 8, C.board);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 2, r.y + 3, r.w - 6, 2); // arrow line
      ctx.beginPath();
      ctx.moveTo(r.x + r.w - 4, r.y + 1);
      ctx.lineTo(r.x + r.w - 1, r.y + 4);
      ctx.lineTo(r.x + r.w - 4, r.y + 7);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "lamp": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, 4, 2);
      ctx.fillStyle = C.lampPole;
      ctx.fillRect(r.x + r.w / 2 - 1, r.y + 6, 2, r.h - 6);
      block(ctx, r.x, r.y, r.w, 7, C.woodDark);
      // glow
      const a = 0.18 + 0.08 * Math.sin(time / 500);
      const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + 4, 1, r.x + r.w / 2, r.y + 4, 28);
      g.addColorStop(0, `rgba(254,211,76,${a})`);
      g.addColorStop(1, "rgba(254,211,76,0)");
      ctx.fillStyle = g;
      ctx.fillRect(r.x + r.w / 2 - 28, r.y + 4 - 28, 56, 56);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 1, r.y + 2, r.w - 2, 3);
      break;
    }
    case "flowers": {
      const cols = [C.fRed, C.accent, C.fPink, C.fWhite];
      for (let i = 0; i < r.w; i += 5) {
        for (let j = 0; j < r.h; j += 5) {
          const n = noise(r.x + i + 1, r.y + j + 2);
          if (n > 0.55) {
            ctx.fillStyle = C.leafDark;
            ctx.fillRect(r.x + i + 1, r.y + j + 2, 1, 2);
            ctx.fillStyle = cols[Math.floor(n * 13) % cols.length];
            ctx.fillRect(r.x + i, r.y + j, 2, 2);
          }
        }
      }
      break;
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerState, reduceMotion: boolean) {
  const SW = 14;
  const SH = 22;
  const bob = !reduceMotion && p.moving ? Math.round(Math.sin(p.anim * 11)) : 0;
  const stepPhase = Math.floor(p.anim * 8) % 2;
  const x = Math.round(p.x + p.w / 2 - SW / 2);
  const feetY = Math.round(p.y + p.h);
  const y = feetY - SH + bob;
  const f = p.facing;

  shadow(ctx, p.x + p.w / 2, feetY - 1, 7, 2.5);

  // dark base silhouette for crispness
  ctx.fillStyle = C.pOut;
  ctx.fillRect(x + 1, y + 1, SW - 2, SH - 3);

  // legs / boots
  ctx.fillStyle = C.boots;
  const legY = y + SH - 5;
  if (p.moving && !reduceMotion) {
    ctx.fillRect(x + 3, legY - stepPhase, 3, 5);
    ctx.fillRect(x + SW - 6, legY - (1 - stepPhase), 3, 5);
  } else {
    ctx.fillRect(x + 3, legY, 3, 5);
    ctx.fillRect(x + SW - 6, legY, 3, 5);
  }
  // pants
  ctx.fillStyle = C.pants;
  ctx.fillRect(x + 3, y + 15, SW - 6, 4);

  // backpack when facing away
  if (f === "up") {
    ctx.fillStyle = C.packDk;
    ctx.fillRect(x + 2, y + 8, SW - 4, 8);
    ctx.fillStyle = C.pack;
    ctx.fillRect(x + 3, y + 9, SW - 6, 5);
  }

  // jacket
  ctx.fillStyle = C.jacket;
  ctx.fillRect(x + 2, y + 8, SW - 4, 8);
  ctx.fillStyle = C.jacketDk;
  ctx.fillRect(x + 2, y + 8, 3, 8);
  if (f === "down") {
    ctx.fillStyle = C.pack; // shoulder straps
    ctx.fillRect(x + 4, y + 9, 1, 6);
    ctx.fillRect(x + SW - 5, y + 9, 1, 6);
  }

  // head
  ctx.fillStyle = C.hair;
  ctx.fillRect(x + 2, y + 1, SW - 4, 7);
  if (f === "down") {
    ctx.fillStyle = C.skin;
    ctx.fillRect(x + 3, y + 4, SW - 6, 4);
    ctx.fillStyle = C.pOut;
    ctx.fillRect(x + 4, y + 5, 2, 2);
    ctx.fillRect(x + SW - 6, y + 5, 2, 2);
  } else if (f === "left") {
    ctx.fillStyle = C.skin;
    ctx.fillRect(x + 2, y + 4, 5, 4);
    ctx.fillStyle = C.pOut;
    ctx.fillRect(x + 3, y + 5, 2, 2);
  } else if (f === "right") {
    ctx.fillStyle = C.skin;
    ctx.fillRect(x + SW - 7, y + 4, 5, 4);
    ctx.fillStyle = C.pOut;
    ctx.fillRect(x + SW - 5, y + 5, 2, 2);
  }

  // headphone cups (accent), hidden facing up
  if (f !== "up") {
    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 1, y + 4, 2, 3);
    ctx.fillRect(x + SW - 3, y + 4, 2, 3);
  }
}

function drawPromptMarker(ctx: CanvasRenderingContext2D, o: SceneObject, anim: number) {
  const cx = o.rect.x + o.rect.w / 2;
  const top = o.rect.y - 12 + Math.round(Math.sin(anim * 6));
  block(ctx, cx - 5, top - 7, 10, 9, C.accent);
  ctx.fillStyle = C.outline;
  ctx.fillRect(cx - 1, top - 5, 2, 4);
  ctx.fillRect(cx - 1, top, 2, 1);
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.moveTo(cx - 3, top + 2);
  ctx.lineTo(cx + 3, top + 2);
  ctx.lineTo(cx, top + 5);
  ctx.closePath();
  ctx.fill();
}

// Gentle warm light: brighten the center, soften the corners. Subtle, not dark.
function drawAmbientLight(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, "rgba(255,245,210,0.10)");
  g.addColorStop(0.7, "rgba(255,245,210,0)");
  g.addColorStop(1, "rgba(40,60,30,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
