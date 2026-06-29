import type { GameState, PlayerState } from "@/game/engine";
import type { Fragment, SceneObject, TerrainPatch, Vec2 } from "@/game/types";

// Canvas renderer — matthew's room: a bright, cozy DS-era top-down bedroom.
// Single context, image smoothing off, integer-scaled + letterboxed for crisp
// pixels. Procedural pixel art (no external assets): warm wood floor, a bright
// rug, dimensional walls with a window and door, and outlined furniture/props.
// Colorful and warm, with #FED34C as the signature accent.

const C = {
  letterbox: "#1b140c",
  floor1: "#d3a96c",
  floor2: "#c99f61",
  plank: "#b68a50",
  wall: "#ecdcbb",
  wallShade: "#dcc99e",
  wallTop: "#f3e8cd",
  base: "#a9733f",
  baseDark: "#8a5d31",
  outline: "#3a2a1a",
  // rug
  rug: "#3f9b95",
  rugDark: "#2f7d78",
  rugBorder: "#f3efe4",
  rugAccent: "#FED34C",
  // wood furniture
  wood: "#a9733f",
  woodHi: "#c08a4f",
  woodDark: "#7c5430",
  // accents + materials
  accent: "#FED34C",
  accentDk: "#caa42f",
  cream: "#f3efe4",
  sky: "#bfe6f5",
  skyDk: "#9bd3ee",
  screen: "#FED34C",
  leaf: "#56a64a",
  leafHi: "#74c75f",
  leafDark: "#3f8038",
  // bedding / fabrics
  blanket: "#4fa8e6",
  blanketDk: "#3a86c6",
  blanketHi: "#7ec4f2",
  pillow: "#f3efe4",
  bean: "#e08a4f",
  beanDk: "#c06f37",
  cork: "#c79a5e",
  corkDk: "#a87c44",
  red: "#e3614f",
  green: "#5fae6b",
  pink: "#e58bb0",
  navy: "#2f3b59",
  // books
  book1: "#3a4f74",
  book2: "#b5563f",
  book3: "#4a7d57",
  book4: "#caa42f",
  // player
  pOut: "#23190f",
  skin: "#ecbd92",
  hair: "#6f4c2c",
  jacket: "#2f9b95",
  jacketDk: "#247a76",
  pants: "#3b4a6a",
  pack: "#e08148",
  packDk: "#bd6634",
  boots: "#4a3826",
  shadow: "rgba(40,28,12,0.22)",
};

// Transient pickup / completion bursts, owned by the host and drawn on top.
export interface PickupEffect {
  x: number;
  y: number;
  start: number; // performance.now() when spawned
  kind: "fragment" | "gate";
}

// Basketball mini-game render state (host-driven).
export interface ShotRender {
  phase: "aim" | "shoot";
  marker: number; // 0..1 during aim
  result?: "make" | "miss";
  progress?: number; // 0..1 during shoot
}

export interface RenderOptions {
  reduceMotion: boolean;
  dpr: number;
  showPrompt: boolean;
  effects?: PickupEffect[];
  shot?: ShotRender | null;
  camera?: Vec2;
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
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
  ctx.fillStyle = C.letterbox;
  ctx.fillRect(0, 0, cw, ch);

  const scale = Math.max(1, Math.floor(Math.min(cw / scene.width, ch / scene.height)));
  const offX = Math.floor((cw - scene.width * scale) / 2);
  const offY = Math.floor((ch - scene.height * scale) / 2);
  const cam = opts.camera ?? { x: 0, y: 0 };

  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(scale, scale);
  ctx.translate(-cam.x, -cam.y);

  drawFloor(ctx, scene.width, scene.height);
  for (const p of scene.terrain) drawTerrain(ctx, p);
  drawWalls(ctx, scene.width, scene.height);
  if (state.gatePowered) drawDoorSpill(ctx, scene, time);

  // Depth sort objects, fragments, player by foot Y.
  type Drawable = { y: number; draw: () => void };
  const drawables: Drawable[] = scene.objects.map((o) => ({
    y: o.rect.y + o.rect.h,
    draw: () => drawObject(ctx, o, time, o.kind === "door" && state.gatePowered),
  }));
  for (const frag of state.fragments) {
    if (frag.collected) continue;
    drawables.push({ y: frag.y, draw: () => drawFragment(ctx, frag, time, opts.reduceMotion) });
  }
  drawables.push({
    y: state.player.y + state.player.h,
    draw: () => drawPlayer(ctx, state.player, opts.reduceMotion),
  });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  // Restrained idle hint: a faint dot above interactables the player is near
  // (the closest one shows the full prompt instead).
  const pcx = state.player.x + state.player.w / 2;
  const pcy = state.player.y + state.player.h / 2;
  for (const o of scene.objects) {
    if (!o.interact || o.id === state.nearestId) continue;
    const ocx = o.rect.x + o.rect.w / 2;
    const ocy = o.rect.y + o.rect.h / 2;
    if ((pcx - ocx) ** 2 + (pcy - ocy) ** 2 > 60 * 60) continue;
    const a = opts.reduceMotion ? 0.22 : 0.14 + 0.12 * Math.sin(time / 600 + o.rect.x);
    const dy = opts.reduceMotion ? 0 : Math.round(Math.sin(time / 500 + o.rect.x) * 1);
    ctx.fillStyle = `rgba(254,211,76,${a})`;
    ctx.fillRect(ocx - 1, o.rect.y - 6 + dy, 2, 2);
  }

  if (opts.showPrompt && state.nearestId) {
    const obj = scene.objects.find((o) => o.id === state.nearestId);
    if (obj) drawPromptMarker(ctx, obj, state.player.anim);
  }
  if (opts.effects) for (const e of opts.effects) drawPickupEffect(ctx, e, time);
  if (opts.shot) drawShot(ctx, scene, opts.shot);

  drawAmbientLight(ctx, scene.width, scene.height);
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = C.outline;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e07a2f";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy);
  ctx.lineTo(cx + 3, cy);
  ctx.moveTo(cx, cy - 3);
  ctx.lineTo(cx, cy + 3);
  ctx.stroke();
}

// Timing bar (aim) + scripted ball arc (shoot), drawn around the hoop.
function drawShot(ctx: CanvasRenderingContext2D, scene: GameState["scene"], shot: ShotRender) {
  const hoop = scene.objects.find((o) => o.kind === "hoop");
  if (!hoop) return;
  const hx = hoop.rect.x + hoop.rect.w / 2;
  const rimY = hoop.rect.y + 10;

  if (shot.phase === "aim") {
    const bw = 44;
    const bh = 5;
    const bx = Math.min(hx - bw / 2, scene.width - 16 - bw);
    const by = hoop.rect.y - 16;
    block(ctx, bx - 1, by - 1, bw + 2, bh + 2, "#2b3340");
    ctx.fillStyle = "#3a4654";
    ctx.fillRect(bx, by, bw, bh);
    // sweet zones (make = inner 26%, perfect = inner 12%)
    ctx.fillStyle = "#5fae6b";
    ctx.fillRect(bx + bw * 0.37, by, bw * 0.26, bh);
    ctx.fillStyle = "#86d98f";
    ctx.fillRect(bx + bw * 0.44, by, bw * 0.12, bh);
    // marker
    const mx = Math.round(bx + shot.marker * bw);
    ctx.fillStyle = C.accent;
    ctx.fillRect(mx - 1, by - 2, 2, bh + 4);
  } else {
    const sx = hx;
    const sy = hoop.rect.y + 46; // free-throw spot below the hoop
    const p = shot.progress ?? 0;
    let bxp: number;
    let byp: number;
    if (p < 0.7) {
      const t = p / 0.7;
      bxp = sx;
      byp = sy + (rimY - sy) * t - Math.sin(t * Math.PI) * 20; // arc up to rim
    } else {
      const t = (p - 0.7) / 0.3;
      if (shot.result === "make") {
        bxp = hx;
        byp = rimY + t * 16; // drop through the net
        // net wiggle
        ctx.strokeStyle = `rgba(243,239,228,${0.8 - t * 0.6})`;
        ctx.lineWidth = 1;
        const sway = Math.sin(t * Math.PI * 3) * 2;
        ctx.beginPath();
        ctx.moveTo(hx - 4, rimY + 1);
        ctx.lineTo(hx - 2 + sway, rimY + 7);
        ctx.moveTo(hx + 4, rimY + 1);
        ctx.lineTo(hx + 2 + sway, rimY + 7);
        ctx.stroke();
      } else {
        const dir = hx > scene.width / 2 ? -1 : 1; // bounce toward the room
        bxp = hx + dir * t * 16;
        byp = rimY - Math.sin(t * Math.PI) * 7 + t * 12; // clank + fall away
      }
    }
    drawBall(ctx, bxp, byp);
  }
}

function drawFloor(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // horizontal wood planks
  for (let y = 0; y < h; y += 12) {
    ctx.fillStyle = ((y / 12) & 1) === 0 ? C.floor1 : C.floor2;
    ctx.fillRect(0, y, w, 12);
    ctx.fillStyle = C.plank;
    ctx.fillRect(0, y + 11, w, 1); // plank seam
    // staggered short seams
    const off = (y / 12) % 2 === 0 ? 0 : 48;
    for (let x = off; x < w; x += 96) ctx.fillRect(x, y, 1, 12);
  }
}

function drawTerrain(ctx: CanvasRenderingContext2D, p: TerrainPatch) {
  const r = p.rect;
  if (p.kind === "rug") {
    ctx.fillStyle = C.rugBorder;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.rug;
    ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    ctx.fillStyle = C.rugDark;
    ctx.strokeStyle = C.rugDark;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 6.5, r.y + 6.5, r.w - 13, r.h - 13);
    // accent diamonds
    ctx.fillStyle = C.rugAccent;
    for (let x = r.x + 14; x < r.x + r.w - 10; x += 18) {
      const cy = r.y + r.h / 2;
      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }
  } else {
    // doormat
    ctx.fillStyle = "#b5563f";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "#cd6a4f";
    ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.fillStyle = "#e08a4f";
    for (let x = r.x + 4; x < r.x + r.w - 2; x += 6) ctx.fillRect(x, r.y + 3, 2, r.h - 6);
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const t = 16;
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, w, t);
  ctx.fillRect(0, h - t, w, t);
  ctx.fillRect(0, 0, t, h);
  ctx.fillRect(w - t, 0, t, h);

  // subtle wallpaper stripes on the top wall
  ctx.fillStyle = C.wallShade;
  for (let x = 0; x < w; x += 10) ctx.fillRect(x, 0, 1, t - 3);

  // wooden baseboard along the inner edges (sense of a room)
  ctx.fillStyle = C.base;
  ctx.fillRect(t, t - 3, w - 2 * t, 3); // under top wall
  ctx.fillStyle = C.baseDark;
  ctx.fillRect(t, t - 1, w - 2 * t, 1);
  ctx.fillStyle = C.base;
  ctx.fillRect(t - 3, t, 3, h - 2 * t); // left
  ctx.fillRect(w - t, t, 3, h - 2 * t); // right
  ctx.fillRect(t, h - t, w - 2 * t, 3); // bottom

  // soft inner shadow for depth
  const g = ctx.createLinearGradient(0, t, 0, t + 8);
  g.addColorStop(0, "rgba(0,0,0,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(t, t, w - 2 * t, 8);
}

// Warm daylight spilling into the room once the door is unlocked — a gentle
// beckoning pulse (static when time === 0, i.e. reduced motion).
function drawDoorSpill(ctx: CanvasRenderingContext2D, scene: GameState["scene"], time: number) {
  const door = scene.objects.find((o) => o.kind === "door");
  if (!door) return;
  const cx = door.rect.x + door.rect.w / 2;
  const cy = door.rect.y - 4;
  const pulse = 0.5 + 0.5 * Math.sin(time / 480);
  const r = 38 + pulse * 6;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  g.addColorStop(0, `rgba(255,238,176,${0.34 + 0.12 * pulse})`);
  g.addColorStop(0.5, "rgba(254,211,76,0.12)");
  g.addColorStop(1, "rgba(254,211,76,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // a soft beam fanning up into the room
  ctx.fillStyle = `rgba(255,244,200,${0.1 + 0.05 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy);
  ctx.lineTo(cx - 18, cy - 28);
  ctx.lineTo(cx + 18, cy - 28);
  ctx.lineTo(cx + 6, cy);
  ctx.closePath();
  ctx.fill();
}

function drawObject(ctx: CanvasRenderingContext2D, o: SceneObject, time: number, powered = false) {
  const r = o.rect;
  switch (o.kind) {
    case "window": {
      block(ctx, r.x, r.y, r.w, r.h, "#cbb07a"); // frame
      ctx.fillStyle = C.sky;
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      ctx.fillStyle = C.skyDk;
      ctx.fillRect(r.x + 2, r.y + r.h - 5, r.w - 4, 3); // horizon
      ctx.fillStyle = "#f3efe4";
      ctx.fillRect(r.x + 6, r.y + 4, 6, 3); // cloud
      ctx.fillRect(r.x + r.w - 16, r.y + 6, 7, 3);
      ctx.fillStyle = "#cbb07a";
      ctx.fillRect(r.x + r.w / 2 - 1, r.y + 1, 2, r.h - 2); // mullion
      ctx.fillRect(r.x + 1, r.y + r.h / 2 - 1, r.w - 2, 2);
      // soft daylight pooling onto the floor
      const g = ctx.createLinearGradient(0, r.y + r.h, 0, r.y + r.h + 16);
      g.addColorStop(0, "rgba(255,247,214,0.22)");
      g.addColorStop(1, "rgba(255,247,214,0)");
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y + r.h, r.w, 16);
      break;
    }
    case "stringlights": {
      ctx.strokeStyle = "#5a4632";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = r.x; x <= r.x + r.w; x += 4) {
        const yy = r.y + 1 + Math.sin(x * 0.5) * 1.2;
        if (x === r.x) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      for (let x = r.x + 6; x < r.x + r.w; x += 16) {
        const yy = r.y + 2 + Math.sin(x * 0.5) * 1.2;
        ctx.fillStyle = C.accent;
        ctx.fillRect(x, yy + 1, 2, 2);
      }
      break;
    }
    case "poster": {
      block(ctx, r.x, r.y, r.w, r.h, "#2f3b59");
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 3, r.y + 4, r.w - 6, 2);
      ctx.fillStyle = C.red;
      ctx.fillRect(r.x + 4, r.y + 9, 4, 6);
      ctx.fillStyle = C.sky;
      ctx.fillRect(r.x + 10, r.y + 9, 4, 6);
      break;
    }
    case "clock": {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      ctx.fillStyle = C.outline;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.navy;
      ctx.fillRect(cx - 1, cy - 4, 2, 5); // hour hand
      ctx.fillRect(cx, cy - 1, 4, 2); // minute hand
      ctx.fillStyle = C.accent;
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
      break;
    }
    case "slippers": {
      const sw = (r.w - 2) / 2;
      for (let i = 0; i < 2; i++) {
        const sx = r.x + i * (sw + 2);
        ctx.fillStyle = C.outline;
        ctx.fillRect(sx, r.y, sw, r.h);
        ctx.fillStyle = "#e3614f";
        ctx.fillRect(sx + 1, r.y + 1, sw - 2, r.h - 2);
        ctx.fillStyle = C.cream;
        ctx.fillRect(sx + 1, r.y + 1, sw - 2, 2); // toe strap
      }
      break;
    }
    case "bed": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      block(ctx, r.x, r.y, r.w, r.h, C.wood); // frame
      // sheets
      ctx.fillStyle = C.cream;
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      // pillows across the top
      ctx.fillStyle = C.pillow;
      ctx.fillRect(r.x + 4, r.y + 4, (r.w - 8) / 2 - 1, 12);
      ctx.fillRect(r.x + 4 + (r.w - 8) / 2 + 1, r.y + 4, (r.w - 8) / 2 - 1, 12);
      ctx.fillStyle = "#e6ddc8";
      ctx.fillRect(r.x + 6, r.y + 9, r.w - 12, 1);
      // blanket over the lower two-thirds
      block(ctx, r.x + 2, r.y + 19, r.w - 4, r.h - 21, C.blanket);
      ctx.fillStyle = C.blanketHi;
      ctx.fillRect(r.x + 3, r.y + 20, r.w - 6, 2); // fold highlight
      ctx.fillStyle = C.blanketDk;
      ctx.fillRect(r.x + 3, r.y + 23, r.w - 6, 1);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 3, r.y + 27, r.w - 6, 2); // accent stripe
      ctx.fillStyle = C.woodHi;
      ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3); // footboard
      break;
    }
    case "bookshelf": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x, r.y, r.w, r.h, C.woodDark);
      const books = [C.book1, C.book2, C.book3, C.book4, C.book2, C.book1];
      const shelves = 3;
      for (let s = 0; s < shelves; s++) {
        const sy = r.y + 3 + s * ((r.h - 4) / shelves);
        ctx.fillStyle = C.woodHi;
        ctx.fillRect(r.x + 1, sy + (r.h - 4) / shelves - 2, r.w - 2, 1);
        for (let b = 0; b < 4; b++) {
          ctx.fillStyle = books[(s * 4 + b) % books.length];
          ctx.fillRect(r.x + 2 + b * 3, sy, 2, (r.h - 4) / shelves - 3);
        }
      }
      break;
    }
    case "desk": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x + 3, r.y + r.h - 7, 4, 7);
      ctx.fillRect(r.x + r.w - 7, r.y + r.h - 7, 4, 7);
      block(ctx, r.x, r.y + 4, r.w, r.h - 8, C.wood);
      ctx.fillStyle = C.woodHi;
      ctx.fillRect(r.x, r.y, r.w, 5); // lit surface
      // a desk lamp + mug
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 6, r.y + 1, 5, 2);
      ctx.fillStyle = C.red;
      ctx.fillRect(r.x + r.w - 12, r.y + 1, 4, 3);
      break;
    }
    case "chair": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x, r.y, r.w, r.h, C.wood);
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x + 1, r.y, r.w - 2, 3); // backrest top
      break;
    }
    case "laptop": {
      ctx.fillStyle = "#2b3340";
      ctx.fillRect(r.x + 3, r.y, r.w - 6, r.h - 4); // lid
      ctx.fillStyle = C.screen;
      ctx.fillRect(r.x + 5, r.y + 2, r.w - 10, r.h - 9);
      ctx.fillStyle = "#caa42f";
      ctx.fillRect(r.x + 6, r.y + 3, 3, 1);
      ctx.fillStyle = "#c9d2dd";
      ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4); // keyboard base
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + r.w - 7, r.y + 2, 2, 2); // sticker
      break;
    }
    case "snackshelf": {
      block(ctx, r.x, r.y, r.w, r.h, C.wood);
      ctx.fillStyle = C.woodHi;
      ctx.fillRect(r.x, r.y + r.h / 2 - 1, r.w, 1);
      ctx.fillRect(r.x, r.y, r.w, 1);
      const snacks = [C.red, C.green, C.accent, C.sky];
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = snacks[(row * 3 + i) % snacks.length];
          ctx.fillRect(r.x + 2 + i * 4, r.y + 2 + row * (r.h / 2), 3, r.h / 2 - 3);
        }
      }
      // a recognizable red packet with a white roundel + a tiny hangul mark
      ctx.fillStyle = C.red;
      ctx.fillRect(r.x + 2, r.y + 2, 3, r.h / 2 - 3);
      ctx.fillStyle = C.cream;
      ctx.fillRect(r.x + 3, r.y + 4, 1, 1); // roundel
      ctx.fillStyle = "#7c1f15";
      ctx.fillRect(r.x + 2, r.y + 6, 2, 1); // hangul-ish stroke
      ctx.fillRect(r.x + 3, r.y + 7, 1, 1);
      break;
    }
    case "hoop": {
      ctx.fillStyle = C.cream;
      ctx.fillRect(r.x, r.y, r.w, 9); // backboard
      ctx.fillStyle = C.red;
      ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, 3); // square
      ctx.fillStyle = "#e07a2f";
      ctx.fillRect(r.x + 3, r.y + 9, r.w - 6, 2); // rim
      ctx.strokeStyle = C.cream; // net
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 4, r.y + 11);
      ctx.lineTo(r.x + r.w / 2, r.y + r.h);
      ctx.lineTo(r.x + r.w - 4, r.y + 11);
      ctx.moveTo(r.x + r.w / 2, r.y + 11);
      ctx.lineTo(r.x + r.w / 2, r.y + r.h);
      ctx.stroke();
      break;
    }
    case "recordplayer": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      // wooden cabinet base
      block(ctx, r.x, r.y + 7, r.w, r.h - 7, C.woodDark);
      ctx.fillStyle = C.woodHi;
      ctx.fillRect(r.x + 1, r.y + 8, r.w - 2, 1);
      // turntable deck
      block(ctx, r.x, r.y, r.w, 14, "#2b3340");
      const cx = r.x + 11;
      const cy = r.y + 7;
      // platter
      ctx.fillStyle = "#525c6b";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      // vinyl record
      ctx.fillStyle = "#11151c";
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      // groove + accent label
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // spinning speck (static under reduced motion since time === 0)
      const ang = time / 600;
      ctx.fillStyle = "#fff0bf";
      ctx.fillRect(Math.round(cx + Math.cos(ang) * 3) - 0.5, Math.round(cy + Math.sin(ang) * 3) - 0.5, 1, 1);
      // tonearm: pivot at corner reaching to the record edge
      ctx.fillStyle = "#7c8696";
      ctx.fillRect(r.x + r.w - 5, r.y + 2, 3, 3); // pivot
      ctx.strokeStyle = "#c9d2dd";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w - 4, r.y + 3);
      ctx.lineTo(cx + 3, cy - 2);
      ctx.stroke();
      break;
    }
    case "vinylcrate": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x, r.y, r.w, r.h, C.woodDark);
      const sleeves = [C.red, C.sky, C.accent, C.green];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = sleeves[i];
        ctx.fillRect(r.x + 2 + i * 3, r.y + 2, 2, r.h - 4);
      }
      break;
    }
    case "corkboard": {
      block(ctx, r.x, r.y, r.w, r.h, C.cork);
      ctx.fillStyle = C.corkDk;
      ctx.strokeStyle = C.corkDk;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
      // map sheet
      ctx.fillStyle = "#dfe9ef";
      ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, 20);
      ctx.fillStyle = C.sky;
      ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, 18); // ocean
      ctx.fillStyle = C.leaf;
      ctx.fillRect(r.x + 5, r.y + 6, 6, 6); // landmass
      ctx.fillRect(r.x + 9, r.y + 13, 5, 5);
      // pins + a string between seoul (accent) and toronto (red)
      const seoul = { x: r.x + 6, y: r.y + 8 };
      const toronto = { x: r.x + 12, y: r.y + 16 };
      ctx.strokeStyle = "rgba(227,97,79,0.7)";
      ctx.beginPath();
      ctx.moveTo(seoul.x, seoul.y);
      ctx.lineTo(toronto.x, toronto.y);
      ctx.stroke();
      ctx.fillStyle = C.accent;
      ctx.fillRect(seoul.x - 1, seoul.y - 1, 2, 2);
      ctx.fillStyle = C.red;
      ctx.fillRect(toronto.x - 1, toronto.y - 1, 2, 2);
      // polaroids (white frame + photo) + a ticket stub
      ctx.fillStyle = C.cream;
      ctx.fillRect(r.x + 3, r.y + 26, 6, 7);
      ctx.fillRect(r.x + 10, r.y + 28, 6, 7);
      ctx.fillStyle = C.green;
      ctx.fillRect(r.x + 4, r.y + 27, 4, 4);
      ctx.fillStyle = C.pink;
      ctx.fillRect(r.x + 11, r.y + 29, 4, 4);
      ctx.fillStyle = C.accentDk;
      ctx.fillRect(r.x + 3, r.y + 37, 11, 3); // ticket stub
      ctx.fillStyle = C.cork;
      ctx.fillRect(r.x + 6, r.y + 38, 1, 1);
      break;
    }
    case "bubbybed": {
      // cushion
      ctx.fillStyle = C.outline;
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9c6bd6"; // soft purple bed
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 - 1, r.h / 2 - 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b88ce0";
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 - 5, r.h / 2 - 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // bone toy
      ctx.fillStyle = C.cream;
      ctx.fillRect(r.x + r.w / 2 - 4, r.y + r.h / 2 - 1, 8, 2);
      ctx.fillRect(r.x + r.w / 2 - 5, r.y + r.h / 2 - 2, 2, 4);
      ctx.fillRect(r.x + r.w / 2 + 3, r.y + r.h / 2 - 2, 2, 4);
      break;
    }
    case "plant": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      ctx.fillStyle = "#b5563f";
      ctx.fillRect(r.x + 2, r.y + r.h - 7, r.w - 4, 7);
      ctx.fillStyle = "#cd6a4f";
      ctx.fillRect(r.x + 3, r.y + r.h - 7, r.w - 6, 2);
      ctx.fillStyle = C.leafDark;
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 8);
      ctx.fillStyle = C.leaf;
      ctx.fillRect(r.x + 2, r.y, r.w - 6, r.h - 9);
      ctx.fillStyle = C.leafHi;
      ctx.fillRect(r.x + 3, r.y + 1, 3, 3);
      break;
    }
    case "lamp": {
      ctx.fillStyle = "#5a4632";
      ctx.fillRect(r.x + r.w / 2 - 1, r.y + 8, 2, r.h - 8); // pole
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(r.x + r.w / 2 - 4, r.y + r.h - 2, 8, 2); // base
      // shade + glow
      const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + 4, 1, r.x + r.w / 2, r.y + 4, 26);
      g.addColorStop(0, "rgba(255,239,180,0.22)");
      g.addColorStop(1, "rgba(255,239,180,0)");
      ctx.fillStyle = g;
      ctx.fillRect(r.x + r.w / 2 - 26, r.y + 4 - 26, 52, 52);
      block(ctx, r.x, r.y, r.w, 8, "#f0d98a");
      break;
    }
    case "beanbag": {
      ctx.fillStyle = C.outline;
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.bean;
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 - 1, r.h / 2 - 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.beanDk;
      ctx.beginPath();
      ctx.ellipse(r.x + r.w / 2, r.y + r.h - 4, r.w / 2 - 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "door": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 2);
      block(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 2, C.woodDark); // frame
      if (powered) {
        // bright daylight beyond + the door swung ajar
        const grad = ctx.createLinearGradient(r.x, 0, r.x + 13, 0);
        grad.addColorStop(0, "#fff7d6");
        grad.addColorStop(1, "#ffe9a0");
        ctx.fillStyle = grad;
        ctx.fillRect(r.x + 1, r.y, 13, r.h);
        // the door panel pushed open to the right, edge-on for depth
        block(ctx, r.x + 14, r.y, r.w - 16, r.h, C.wood);
        ctx.fillStyle = C.woodHi;
        ctx.fillRect(r.x + 15, r.y + 1, 2, r.h - 2); // lit inner edge
        ctx.fillStyle = C.woodDark;
        ctx.fillRect(r.x + 19, r.y + 3, r.w - 24, 3);
        ctx.fillStyle = C.accent;
        ctx.fillRect(r.x + r.w - 5, r.y + r.h / 2 - 1, 2, 2); // knob lit
      } else {
        block(ctx, r.x + 2, r.y, r.w - 4, r.h, C.wood);
        ctx.fillStyle = C.woodDark;
        ctx.fillRect(r.x + 5, r.y + 2, r.w - 10, 4); // panels
        ctx.fillRect(r.x + 5, r.y + 8, r.w - 10, 4);
        ctx.fillStyle = "#caa42f";
        ctx.fillRect(r.x + r.w - 6, r.y + r.h / 2 - 1, 2, 2); // knob
      }
      break;
    }
  }
}

// Small glowing personal item (basketball / record / polaroid).
function drawFragment(ctx: CanvasRenderingContext2D, f: Fragment, time: number, reduceMotion: boolean) {
  const bob = reduceMotion ? 0 : Math.round(Math.sin(time / 320) * 1.5);
  const cx = Math.round(f.x);
  const cy = Math.round(f.y) + bob;
  const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time / 260);

  // glow + ground ring + shadow
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
  g.addColorStop(0, `rgba(254,211,76,${0.2 + 0.16 * pulse})`);
  g.addColorStop(1, "rgba(254,211,76,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - 12, cy - 12, 24, 24);
  ctx.fillStyle = "rgba(40,28,12,0.2)";
  ctx.beginPath();
  ctx.ellipse(f.x, f.y + 5, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(254,211,76,${0.22 + 0.16 * pulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(f.x, f.y + 5, 5, 2, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (f.icon === "ball") {
    ctx.fillStyle = C.outline;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07a2f";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy);
    ctx.lineTo(cx + 4, cy);
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy + 4);
    ctx.stroke();
  } else if (f.icon === "record") {
    ctx.fillStyle = "#11151c";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // polaroid
    ctx.fillStyle = C.outline;
    ctx.fillRect(cx - 5, cy - 5, 10, 11);
    ctx.fillStyle = C.cream;
    ctx.fillRect(cx - 4, cy - 4, 8, 9);
    ctx.fillStyle = C.sky;
    ctx.fillRect(cx - 3, cy - 3, 6, 5);
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
  ctx.fillStyle = C.pOut;
  ctx.fillRect(x + 1, y + 1, SW - 2, SH - 3);

  ctx.fillStyle = C.boots;
  const legY = y + SH - 5;
  if (p.moving && !reduceMotion) {
    ctx.fillRect(x + 3, legY - stepPhase, 3, 5);
    ctx.fillRect(x + SW - 6, legY - (1 - stepPhase), 3, 5);
  } else {
    ctx.fillRect(x + 3, legY, 3, 5);
    ctx.fillRect(x + SW - 6, legY, 3, 5);
  }
  ctx.fillStyle = C.pants;
  ctx.fillRect(x + 3, y + 15, SW - 6, 4);

  if (f === "up") {
    ctx.fillStyle = C.packDk;
    ctx.fillRect(x + 2, y + 8, SW - 4, 8);
    ctx.fillStyle = C.pack;
    ctx.fillRect(x + 3, y + 9, SW - 6, 5);
  }
  ctx.fillStyle = C.jacket;
  ctx.fillRect(x + 2, y + 8, SW - 4, 8);
  ctx.fillStyle = C.jacketDk;
  ctx.fillRect(x + 2, y + 8, 3, 8);
  if (f === "down") {
    ctx.fillStyle = C.pack;
    ctx.fillRect(x + 4, y + 9, 1, 6);
    ctx.fillRect(x + SW - 5, y + 9, 1, 6);
  }
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
  if (f !== "up") {
    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 1, y + 4, 2, 3);
    ctx.fillRect(x + SW - 3, y + 4, 2, 3);
  }
}

function drawPromptMarker(ctx: CanvasRenderingContext2D, o: SceneObject, anim: number) {
  const cx = o.rect.x + o.rect.w / 2;
  const top = o.rect.y - 10 + Math.round(Math.sin(anim * 6));
  block(ctx, cx - 5, top - 7, 10, 9, C.accent);
  ctx.fillStyle = C.outline;
  ctx.fillRect(cx - 1, top - 5, 2, 4);
  ctx.fillRect(cx - 1, top, 2, 1);
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.moveTo(cx - 3, top + 1);
  ctx.lineTo(cx + 3, top + 1);
  ctx.lineTo(cx, top + 4);
  ctx.closePath();
  ctx.fill();
}

function drawPickupEffect(ctx: CanvasRenderingContext2D, e: PickupEffect, time: number) {
  const dur = e.kind === "gate" ? 700 : 460;
  const p = (time - e.start) / dur;
  if (p < 0 || p > 1) return;
  const ease = 1 - Math.pow(1 - p, 2);
  const maxR = e.kind === "gate" ? 28 : 13;
  const r = 3 + ease * maxR;
  const a = (1 - p) * 0.9;
  ctx.strokeStyle = `rgba(254,211,76,${a})`;
  ctx.lineWidth = e.kind === "gate" ? 2 : 1.5;
  ctx.beginPath();
  ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
  ctx.stroke();
  const sparks = e.kind === "gate" ? 8 : 5;
  ctx.fillStyle = `rgba(255,240,191,${a})`;
  for (let i = 0; i < sparks; i++) {
    const ang = (i / sparks) * Math.PI * 2;
    const d = ease * (maxR + 4);
    ctx.fillRect(Math.round(e.x + Math.cos(ang) * d), Math.round(e.y + Math.sin(ang) * d - ease * 6), 1, 1);
  }
}

// Cozy warm light: brighten the centre a touch, very soft edges. Never dark.
function drawAmbientLight(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, "rgba(255,244,210,0.10)");
  g.addColorStop(0.7, "rgba(255,244,210,0)");
  g.addColorStop(1, "rgba(30,20,10,0.2)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
