import type { InputIntent } from "@/game/types";

// Unifies keyboard and touch into a single movement intent. Interaction (E /
// action) is intentionally NOT handled here — the React host owns it so it can
// arbitrate between "open dialogue" and "advance dialogue".

type Dir = "up" | "down" | "left" | "right";

const KEY_MAP: Record<string, Dir> = {
  w: "up",
  arrowup: "up",
  s: "down",
  arrowdown: "down",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
};

export interface InputController {
  intent(): InputIntent;
  setTouch(dir: Dir, on: boolean): void;
  clearTouch(): void;
  attach(): void;
  detach(): void;
}

export function createInput(): InputController {
  const keys = new Set<Dir>();
  const touch = { up: false, down: false, left: false, right: false };

  const onDown = (e: KeyboardEvent) => {
    const dir = KEY_MAP[e.key.toLowerCase()];
    if (!dir) return;
    e.preventDefault(); // stop arrow-key page scroll
    keys.add(dir);
  };
  const onUp = (e: KeyboardEvent) => {
    const dir = KEY_MAP[e.key.toLowerCase()];
    if (dir) keys.delete(dir);
  };

  return {
    intent() {
      const right = keys.has("right") || touch.right ? 1 : 0;
      const left = keys.has("left") || touch.left ? 1 : 0;
      const down = keys.has("down") || touch.down ? 1 : 0;
      const up = keys.has("up") || touch.up ? 1 : 0;
      return { dx: right - left, dy: down - up };
    },
    setTouch(dir, on) {
      touch[dir] = on;
    },
    clearTouch() {
      touch.up = touch.down = touch.left = touch.right = false;
    },
    attach() {
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);
    },
    detach() {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      keys.clear();
      this.clearTouch();
    },
  };
}
