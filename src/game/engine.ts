import type { Facing, InputIntent, Rect, Scene } from "@/game/types";

// Lightweight, pure-ish game logic. No DOM, no canvas — just state mutation so
// the React host can drive it from a RAF loop and the renderer can read it.

const SPEED = 82; // player movement, world px/sec
const PLAYER_W = 12;
const PLAYER_H = 14;

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  facing: Facing;
  moving: boolean;
  anim: number; // seconds spent moving, for walk bob
}

export interface FragmentState {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

/** Discrete events the host (React) drains each frame for toasts / tracker. */
export type GameEvent = { type: "fragment"; id: string } | { type: "gate" };

export interface GameState {
  scene: Scene;
  player: PlayerState;
  solids: Rect[];
  nearestId: string | null;
  fragments: FragmentState[];
  collected: number;
  gatePowered: boolean;
  events: GameEvent[];
}

const FRAG_PICKUP = 11; // collection radius box (world px), a touch forgiving

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createGameState(scene: Scene): GameState {
  const solids = [
    ...scene.walls,
    ...scene.objects.filter((o) => o.solid).map((o) => o.collision ?? o.rect),
  ];
  return {
    scene,
    player: {
      x: scene.spawn.x,
      y: scene.spawn.y,
      w: PLAYER_W,
      h: PLAYER_H,
      facing: "down",
      moving: false,
      anim: 0,
    },
    solids,
    nearestId: null,
    fragments: scene.fragments.map((f) => ({ id: f.id, x: f.x, y: f.y, collected: false })),
    collected: 0,
    gatePowered: false,
    events: [],
  };
}

// Advance one frame. Movement is continuous (not tile-locked) with per-axis AABB
// collision resolution so the player slides along walls instead of sticking.
export function step(state: GameState, intent: InputIntent, dt: number): void {
  let dx = intent.dx;
  let dy = intent.dy;
  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.SQRT2;
    dx *= inv;
    dy *= inv;
  }

  const p = state.player;
  const moveX = dx * SPEED * dt;
  const moveY = dy * SPEED * dt;

  // X axis.
  p.x += moveX;
  for (const s of state.solids) {
    if (intersects(p, s)) {
      if (moveX > 0) p.x = s.x - p.w;
      else if (moveX < 0) p.x = s.x + s.w;
    }
  }
  // Y axis.
  p.y += moveY;
  for (const s of state.solids) {
    if (intersects(p, s)) {
      if (moveY > 0) p.y = s.y - p.h;
      else if (moveY < 0) p.y = s.y + s.h;
    }
  }

  // Facing follows the dominant input axis.
  if (Math.abs(intent.dx) > Math.abs(intent.dy)) {
    p.facing = intent.dx > 0 ? "right" : "left";
  } else if (intent.dy !== 0) {
    p.facing = intent.dy > 0 ? "down" : "up";
  }

  p.moving = intent.dx !== 0 || intent.dy !== 0;
  p.anim = p.moving ? p.anim + dt : 0;

  // Nearest interactable whose zone the player overlaps.
  let nearest: string | null = null;
  let best = Infinity;
  const pcx = p.x + p.w / 2;
  const pcy = p.y + p.h / 2;
  for (const o of state.scene.objects) {
    if (!o.interact) continue;
    if (!intersects(p, o.interact.zone)) continue;
    const zx = o.interact.zone.x + o.interact.zone.w / 2;
    const zy = o.interact.zone.y + o.interact.zone.h / 2;
    const d = (pcx - zx) ** 2 + (pcy - zy) ** 2;
    if (d < best) {
      best = d;
      nearest = o.id;
    }
  }
  state.nearestId = nearest;

  // Auto-collect fragments the player gets close to.
  for (const frag of state.fragments) {
    if (frag.collected) continue;
    const box: Rect = {
      x: frag.x - FRAG_PICKUP / 2,
      y: frag.y - FRAG_PICKUP / 2,
      w: FRAG_PICKUP,
      h: FRAG_PICKUP,
    };
    if (intersects(p, box)) {
      frag.collected = true;
      state.collected += 1;
      state.events.push({ type: "fragment", id: frag.id });
      if (state.collected >= state.fragments.length && !state.gatePowered) {
        state.gatePowered = true;
        state.events.push({ type: "gate" });
      }
    }
  }
}
