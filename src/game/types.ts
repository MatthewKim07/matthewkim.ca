// Shared types for the hidden game ("Overworld"). See GAME_DESIGN.md.
//
// Phase 1 only uses "idle" and "playing" (plain open/close). "opening" and
// "closing" are reserved for the pixel construction / exit transition added in
// a later phase, so the state machine can grow without changing this contract.
export type GameState = "idle" | "opening" | "playing" | "closing";

export interface GameContextValue {
  state: GameState;
  /** Convenience: true whenever the overlay should be mounted/visible. */
  isOpen: boolean;
  /** Enter the game (idle -> playing for now). No-op if already open. */
  open: () => void;
  /** Return to the portfolio (-> idle). */
  close: () => void;
}

// ---------------------------------------------------------------------------
// Playable scene types ("The Workshop", first Overworld room).
// World units are pixels in the scene's fixed base resolution; the renderer
// integer-scales and letterboxes them to fit the overlay.
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Facing = "up" | "down" | "left" | "right";

/** Raw directional input, each axis in [-1, 1]. Diagonals normalized later. */
export interface InputIntent {
  dx: number;
  dy: number;
}

export interface Dialogue {
  title?: string;
  lines: string[];
}

export type SceneObjectKind =
  | "bed"
  | "bookshelf"
  | "desk"
  | "laptop"
  | "chair"
  | "snackshelf"
  | "hoop"
  | "recordplayer"
  | "vinylcrate"
  | "corkboard"
  | "bubbybed"
  | "window"
  | "door"
  | "plant"
  | "lamp"
  | "beanbag"
  | "poster"
  | "stringlights";

/** Floor patches painted over the wood base to build a readable room. */
export type TerrainKind = "rug" | "matt";

export interface TerrainPatch {
  kind: TerrainKind;
  rect: Rect;
}

export interface SceneObject {
  id: string;
  kind: SceneObjectKind;
  /** Draw footprint in world pixels. */
  rect: Rect;
  /** Contributes to collision when true. */
  solid?: boolean;
  /** Optional tighter collision box (defaults to `rect`); e.g. a tree trunk. */
  collision?: Rect;
  /** Makes the object interactable. */
  interact?: {
    /** Proximity zone the player must overlap to interact. */
    zone: Rect;
    dialogue: Dialogue;
  };
  /** Alternate dialogue shown once all things are collected (e.g. the door). */
  poweredDialogue?: Dialogue;
}

/** A collectible personal "thing". Position is the centre in world pixels. */
export interface Fragment {
  id: string;
  x: number;
  y: number;
  /** Which item to draw. */
  icon?: "ball" | "record" | "polaroid";
  /** Toast shown when picked up. */
  label?: string;
}

export interface Scene {
  id: string;
  name: string;
  /** Base resolution in world pixels. */
  width: number;
  height: number;
  spawn: Vec2;
  /** Solid structural rects (map border / hedges). */
  walls: Rect[];
  /** Ground patches drawn over the grass base (paths, plaza, water...). */
  terrain: TerrainPatch[];
  /** Drawn + interactable objects (depth-sorted by foot Y). */
  objects: SceneObject[];
  /** Collectible build fragments (the first-objective loop). */
  fragments: Fragment[];
}
