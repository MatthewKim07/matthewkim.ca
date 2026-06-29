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
  blanket: "#5b8dd6",
  blanketDk: "#456fae",
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

export interface RenderOptions {
  reduceMotion: boolean;
  dpr: number;
  showPrompt: boolean;
  effects?: PickupEffect[];
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
  if (state.gatePowered) drawDoorSpill(ctx, scene);

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

  if (opts.showPrompt && state.nearestId) {
    const obj = scene.objects.find((o) => o.id === state.nearestId);
    if (obj) drawPromptMarker(ctx, obj, state.player.anim);
  }
  if (opts.effects) for (const e of opts.effects) drawPickupEffect(ctx, e, time);

  drawAmbientLight(ctx, scene.width, scene.height);
  ctx.restore();
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
    ctx.fillStyle = C.wallShade;
    ctx.fillRect(r.x, r.y, r.w, r.h);
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

// Warm light spilling under the door once it's unlocked.
function drawDoorSpill(ctx: CanvasRenderingContext2D, scene: GameState["scene"]) {
  const door = scene.objects.find((o) => o.kind === "door");
  if (!door) return;
  const cx = door.rect.x + door.rect.w / 2;
  const cy = door.rect.y - 2;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30);
  g.addColorStop(0, "rgba(254,211,76,0.28)");
  g.addColorStop(1, "rgba(254,211,76,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - 30, cy - 24, 60, 40);
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
    case "bed": {
      shadow(ctx, r.x + r.w / 2, r.y + r.h, r.w / 2, 3);
      block(ctx, r.x, r.y, r.w, r.h, C.wood); // frame
      // mattress + blanket
      ctx.fillStyle = C.cream;
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, 12); // pillow zone
      ctx.fillStyle = C.pillow;
      ctx.fillRect(r.x + 4, r.y + 4, 14, 8); // pillow
      block(ctx, r.x + 2, r.y + 14, r.w - 4, r.h - 16, C.blanket);
      ctx.fillStyle = C.blanketDk;
      ctx.fillRect(r.x + 3, r.y + 15, r.w - 6, 2);
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 3, r.y + r.h - 6, r.w - 6, 2); // accent stripe
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
      const snacks = [C.red, C.green, C.accent, C.pink];
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = snacks[(row * 3 + i) % snacks.length];
          ctx.fillRect(r.x + 2 + i * 4, r.y + 2 + row * (r.h / 2), 3, r.h / 2 - 3);
        }
      }
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
      // crate
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(r.x, r.y + 12, r.w, r.h - 12);
      block(ctx, r.x, r.y, r.w, 13, "#2b3340"); // turntable box
      // platter + record
      ctx.fillStyle = "#11151c";
      ctx.beginPath();
      ctx.arc(r.x + 11, r.y + 7, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(r.x + 11, r.y + 7, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c9d2dd";
      ctx.fillRect(r.x + 14, r.y + 2, 7, 1); // tonearm
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
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, 1);
      // little map
      ctx.fillStyle = C.sky;
      ctx.fillRect(r.x + 2, r.y + 3, r.w - 4, 14);
      ctx.fillStyle = C.leaf;
      ctx.fillRect(r.x + 3, r.y + 6, 5, 4);
      // pins (seoul = accent, toronto = red)
      ctx.fillStyle = C.accent;
      ctx.fillRect(r.x + 9, r.y + 5, 2, 2);
      ctx.fillStyle = C.red;
      ctx.fillRect(r.x + 5, r.y + 12, 2, 2);
      // polaroids + ticket
      ctx.fillStyle = C.cream;
      ctx.fillRect(r.x + 2, r.y + 20, 5, 6);
      ctx.fillRect(r.x + 8, r.y + 22, 5, 6);
      ctx.fillStyle = C.accentDk;
      ctx.fillRect(r.x + 3, r.y + 30, 8, 3); // ticket stub
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
        // ajar: warm gap of "outside" + lit panel
        ctx.fillStyle = "#fff0bf";
        ctx.fillRect(r.x + 2, r.y + 1, 7, r.h - 2);
        block(ctx, r.x + 9, r.y + 1, r.w - 11, r.h - 2, C.wood);
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
