import type { Scene } from "@/game/types";

// The Workshop Courtyard — Matthew's bright spawn hub. A small open-air plaza
// (320x224) with grass, stone paths, a workshop building, a pond, trees and
// props, and a half-built gate that hints at the larger world. Hand-composed
// for a readable top-down overworld. Dialogue is data-driven here; the renderer
// draws each `kind`, so real sprites can drop in later without changing layout.
export const SPAWN_ROOM: Scene = {
  id: "workshop-courtyard",
  name: "The Workshop Courtyard",
  width: 320,
  height: 224,
  spawn: { x: 155, y: 124 },

  // Hedged map border (collision).
  walls: [
    { x: 0, y: 0, w: 320, h: 14 },
    { x: 0, y: 210, w: 320, h: 14 },
    { x: 0, y: 0, w: 14, h: 224 },
    { x: 306, y: 0, w: 14, h: 224 },
  ],

  terrain: [
    // central stone plaza
    { kind: "plaza", rect: { x: 108, y: 90, w: 104, h: 72 } },
    // main road across the courtyard, leading to the gate
    { kind: "path", rect: { x: 14, y: 116, w: 292, h: 28 } },
    // path up to the notice board
    { kind: "path", rect: { x: 148, y: 42, w: 28, h: 80 } },
    // pond
    { kind: "water", rect: { x: 250, y: 26, w: 56, h: 44 } },
    { kind: "sand", rect: { x: 244, y: 22, w: 68, h: 52 } },
    // flower beds + shaded grass
    { kind: "flowerbed", rect: { x: 28, y: 172, w: 44, h: 24 } },
    { kind: "flowerbed", rect: { x: 250, y: 174, w: 44, h: 22 } },
    { kind: "grassDark", rect: { x: 200, y: 150, w: 60, h: 44 } },
  ],

  objects: [
    // --- landmark: the workshop building ---
    { id: "building", kind: "building", rect: { x: 26, y: 28, w: 86, h: 64 }, solid: true },

    // --- workbench terminal (interactable) in front of the workshop ---
    {
      id: "workbench",
      kind: "workbench",
      rect: { x: 46, y: 96, w: 44, h: 16 },
      solid: true,
      interact: {
        zone: { x: 42, y: 114, w: 54, h: 24 },
        dialogue: {
          title: "workbench",
          lines: [
            "the terminal blinks awake. it remembers every half-finished idea i've fed it.",
            "this is where things start — small tools, robots, builds that outgrow the bench.",
            "power's low, though. the whole place is running on one light.",
          ],
        },
      },
    },

    // --- notice board (interactable) up the north path ---
    {
      id: "noticeboard",
      kind: "noticeboard",
      rect: { x: 138, y: 42, w: 48, h: 24 },
      solid: true,
      interact: {
        zone: { x: 138, y: 66, w: 48, h: 24 },
        dialogue: {
          title: "notice board",
          lines: [
            "pinned notes, arrows, and one stubborn sketch of a robot arm.",
            "i think by building. sketch it, break it, learn why, try again.",
            "there's a list here — mostly things i haven't made yet.",
          ],
        },
      },
    },

    // --- the gate (interactable, under construction) at the road's end ---
    {
      id: "gate",
      kind: "gate",
      rect: { x: 278, y: 102, w: 26, h: 46 },
      solid: true,
      interact: {
        zone: { x: 248, y: 112, w: 30, h: 28 },
        dialogue: {
          title: "the gate",
          lines: [
            "a half-built gate. the road keeps going past it.",
            "more of this world is still going up. places i'm still figuring out.",
            "it runs on fragments. find a few and it'll open.",
          ],
        },
      },
      poweredDialogue: {
        title: "the gate",
        lines: [
          "the gate hums awake.",
          "whatever is past it is still being built.",
          "but now the workshop knows where to send you next.",
        ],
      },
    },

    // --- plaza lamps (glow) ---
    { id: "lamp-l", kind: "lamp", rect: { x: 116, y: 84, w: 8, h: 26 } },
    { id: "lamp-r", kind: "lamp", rect: { x: 196, y: 84, w: 8, h: 26 } },

    // --- signpost near spawn ---
    { id: "signpost", kind: "signpost", rect: { x: 172, y: 132, w: 14, h: 18 } },

    // --- well landmark ---
    { id: "well", kind: "well", rect: { x: 214, y: 150, w: 24, h: 24 }, solid: true },

    // --- trees (solid) framing the courtyard ---
    { id: "tree-1", kind: "tree", rect: { x: 18, y: 150, w: 28, h: 36 }, solid: true },
    { id: "tree-2", kind: "tree", rect: { x: 284, y: 158, w: 26, h: 34 }, solid: true },
    { id: "tree-3", kind: "tree", rect: { x: 206, y: 36, w: 24, h: 30 }, solid: true },

    // --- props ---
    { id: "barrel-1", kind: "barrel", rect: { x: 96, y: 150, w: 14, h: 16 }, solid: true },
    { id: "barrel-2", kind: "barrel", rect: { x: 110, y: 154, w: 12, h: 14 }, solid: true },
    { id: "crate-1", kind: "crate", rect: { x: 72, y: 170, w: 20, h: 18 }, solid: true },
    { id: "rock-1", kind: "rock", rect: { x: 232, y: 60, w: 16, h: 11 } },

    // --- bushes + flowers (decor) ---
    { id: "bush-1", kind: "bush", rect: { x: 124, y: 168, w: 18, h: 14 } },
    { id: "bush-2", kind: "bush", rect: { x: 178, y: 170, w: 18, h: 14 } },
    { id: "flowers-1", kind: "flowers", rect: { x: 30, y: 174, w: 40, h: 20 } },
    { id: "flowers-2", kind: "flowers", rect: { x: 252, y: 176, w: 40, h: 18 } },
  ],

  // Three build fragments — visible but slightly exploratory: by the corner
  // tree, beside the well, and up near the gate/building.
  fragments: [
    { id: "frag-1", x: 54, y: 158 },
    { id: "frag-2", x: 242, y: 140 },
    { id: "frag-3", x: 262, y: 92 },
  ],
};
