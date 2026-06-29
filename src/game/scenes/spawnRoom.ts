import type { Scene } from "@/game/types";

// matthew's room — the first playable scene inside matthew.exe. A cozy, bright
// DS-era top-down bedroom you spawn into and explore. Personal, not a project
// hub. Dialogue is data-driven; the renderer draws each `kind`, so real sprites
// can replace the shapes later without changing the layout.
//
// (Export name kept as SPAWN_ROOM to avoid import churn.)
export const SPAWN_ROOM: Scene = {
  id: "matthews-room",
  name: "matthew's room",
  width: 256,
  height: 192,
  spawn: { x: 120, y: 106 },

  // Room walls (collision).
  walls: [
    { x: 0, y: 0, w: 256, h: 16 },
    { x: 0, y: 176, w: 256, h: 16 },
    { x: 0, y: 0, w: 16, h: 192 },
    { x: 240, y: 0, w: 16, h: 192 },
  ],

  terrain: [{ kind: "rug", rect: { x: 88, y: 78, w: 80, h: 62 } }],

  objects: [
    // --- wall dressing ---
    { id: "window", kind: "window", rect: { x: 100, y: 2, w: 56, h: 14 } },
    { id: "stringlights", kind: "stringlights", rect: { x: 18, y: 13, w: 220, h: 4 } },
    { id: "poster", kind: "poster", rect: { x: 166, y: 18, w: 18, h: 22 } },

    // --- bed (top-left) ---
    { id: "bed", kind: "bed", rect: { x: 22, y: 22, w: 46, h: 36 }, solid: true },

    // --- lamp + beanbag (life) ---
    { id: "lamp", kind: "lamp", rect: { x: 72, y: 56, w: 8, h: 22 } },
    { id: "beanbag", kind: "beanbag", rect: { x: 150, y: 118, w: 24, h: 18 } },

    // --- travel corkboard (interactable, left wall) ---
    {
      id: "corkboard",
      kind: "corkboard",
      rect: { x: 16, y: 70, w: 14, h: 38 },
      interact: {
        zone: { x: 30, y: 74, w: 24, h: 30 },
        dialogue: {
          title: "travel board",
          lines: [
            "pins, ticket stubs, a couple of polaroids.",
            "seoul, toronto, a few places in between.",
          ],
        },
      },
    },

    // --- bookshelf (left wall) ---
    { id: "bookshelf", kind: "bookshelf", rect: { x: 18, y: 120, w: 16, h: 42 }, solid: true },

    // --- desk + laptop (interactable, top-right) ---
    { id: "desk", kind: "desk", rect: { x: 166, y: 22, w: 62, h: 24 }, solid: true },
    { id: "chair", kind: "chair", rect: { x: 190, y: 50, w: 14, h: 12 }, solid: true },
    {
      id: "laptop",
      kind: "laptop",
      rect: { x: 184, y: 16, w: 22, h: 12 },
      interact: {
        zone: { x: 176, y: 46, w: 44, h: 18 },
        dialogue: {
          title: "desk",
          lines: [
            "the laptop, half-closed, fan still warm.",
            "this is where the late nights live. half of them are just debugging.",
          ],
        },
      },
    },

    // --- korean snack shelf (interactable, right wall) ---
    {
      id: "snackshelf",
      kind: "snackshelf",
      rect: { x: 226, y: 58, w: 14, h: 20 },
      interact: {
        zone: { x: 208, y: 60, w: 18, h: 18 },
        dialogue: {
          title: "snacks",
          lines: ["a shelf of korean snacks i don't share."],
        },
      },
    },

    // --- mini hoop (interactable, right wall) ---
    {
      id: "hoop",
      kind: "hoop",
      rect: { x: 224, y: 104, w: 16, h: 14 },
      interact: {
        zone: { x: 214, y: 120, w: 28, h: 20 },
        dialogue: {
          title: "hoop",
          lines: [
            "my ball — the grip's worn smooth on one side.",
            "i shoot to clear my head. mostly i just like the sound.",
          ],
        },
      },
    },

    // --- record player corner (interactable, bottom-left) ---
    {
      id: "recordplayer",
      kind: "recordplayer",
      rect: { x: 26, y: 148, w: 32, h: 22 },
      solid: true,
      interact: {
        zone: { x: 26, y: 132, w: 36, h: 16 },
        dialogue: {
          title: "records",
          lines: [
            "something's still spinning.",
            "i pick records by mood, not genre. usually the wrong one.",
          ],
        },
      },
    },
    { id: "vinylcrate", kind: "vinylcrate", rect: { x: 60, y: 152, w: 14, h: 18 }, solid: true },

    // --- bubby's bed (interactable, bottom-right) ---
    {
      id: "bubbybed",
      kind: "bubbybed",
      rect: { x: 198, y: 150, w: 32, h: 20 },
      interact: {
        zone: { x: 196, y: 134, w: 36, h: 16 },
        dialogue: {
          title: "bubby's bed",
          lines: ["bubby's bed, still warm. he was just here."],
        },
      },
    },
    { id: "plant", kind: "plant", rect: { x: 222, y: 160, w: 12, h: 14 }, solid: true },

    // --- the door out (interactable, bottom wall) ---
    {
      id: "door",
      kind: "door",
      rect: { x: 110, y: 178, w: 36, h: 14 },
      solid: true,
      interact: {
        zone: { x: 104, y: 160, w: 48, h: 18 },
        dialogue: {
          title: "door",
          lines: [
            "the door's stuck. or maybe i'm not ready to head out yet.",
            "grab my stuff first.",
          ],
        },
      },
      poweredDialogue: {
        title: "door",
        lines: ["okay — got what matters.", "the rest of the world's still loading. soon."],
      },
    },
  ],

  // Three personal "things" to gather before the door opens.
  fragments: [
    { id: "ball", x: 230, y: 140, icon: "ball", label: "grabbed your ball" },
    { id: "record", x: 62, y: 136, icon: "record", label: "record packed" },
    { id: "polaroid", x: 46, y: 108, icon: "polaroid", label: "polaroid found" },
  ],
};
