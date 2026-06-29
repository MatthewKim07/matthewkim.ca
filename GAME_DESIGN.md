# GAME_DESIGN.md

Source of truth for the hidden game embedded in matthewkim.ca. Read this before
writing any game code. Update it when a decision changes; do not let the code and
this doc drift.

Status: planning only. No game code exists yet. See "What not to build yet."

---

## 1. Project Vision

A hidden, fully playable top-down pixel world living inside the portfolio. The
portfolio stays a clean, minimal personal site on the surface. The game is the
reward for curiosity: discover the trigger, fall through a tile-by-tile
transition, and explore a small handcrafted world that is a walkable version of
how Matthew thinks, what he has built, and what he cares about.

It is not a resume reskin and not a portfolio mini-game. It is a small, serious
game system that happens to be reachable from a portfolio. It should feel
handcrafted, a little mysterious, and worth the few minutes it takes to play.

The bar: if someone screenshots the game with no context, it should read as "a
real little indie game," not "a developer put a canvas on their site."

---

## 2. Final Recommended Title

**Overworld**

Subtitle / tagline: *a small world inside Matthew.*

Why it works here:
- "Overworld" is the literal term for the explorable top-down map in classic
  DS-era RPGs, so it sets the genre expectation instantly without naming any
  existing franchise.
- Double meaning: the world *over* (and inside) Matthew. Personal without being
  corny or recruiter-flavored.
- Single clean word. Pairs well with the minimal portfolio typography and the
  existing one-word feel of the site.
- A little mysterious on its own; the meaning lands only after you play.

The trigger word in the title "Matthew Kim" is **Matthew**. Entering the game
is, narratively, stepping into Matthew's Overworld.

---

## 3. Alternate Title Options

Kept for reference; do not rename without updating every reference.

- **Headspace** — clean, mind-exploration read, retro-friendly. Slightly generic.
- **Inner Kingdom** — warmer, more story-forward; risks feeling grand/corny.
- **The Long Save** — melancholy, "save file as a life" framing; more literary,
  less obvious as a game name.
- **Continue?** — the classic RPG prompt as a title; clever, but punctuation in a
  title is friction.
- **Pixel Pilgrim** — emphasizes the explorer/journey angle; a touch twee.
- **Wanderlands** — exploration-forward; close to existing game names, weaker.

Recommendation stays **Overworld**. Headspace is the only strong fallback.

---

## 4. Creative Direction

The world is a curated map of Matthew's interests, history, and work, expressed
as *places you walk through*, not text you read.

Principles:
- **Show, don't list.** A project is a building you enter and a machine you
  switch on, not a card with bullet points.
- **Authentic over impressive.** Small, true, specific details (a half-finished
  robot, a worn basketball, a record left spinning) beat grand statements.
- **Earned reveals.** The most personal content sits deeper in the world or
  behind small interactions, so exploration is rewarded.
- **Quietly ambitious.** The polish should be visible in motion, lighting,
  sound, and pacing, never announced.
- **A little mysterious.** Not everything is explained. Some rooms are mood, not
  information. Leave room for "why is this here?"

Tone guardrails: warm, curious, dry-funny in small doses. Never quippy, never
"hello fellow recruiters," never chaotic random-meme energy.

The avatar is a small generic explorer: hood up, backpack, headphones around the
neck (nods to music taste without being on the nose). Readable as "a traveler,"
faintly Matthew. No face detail at base resolution; personality comes from
animation, not likeness.

---

## 5. Visual Style

- **Top-down, DS-era pixel exploration feel.** Think the *feeling* of overworld
  exploration on a small handheld, not any specific game's tiles or palette.
- **Resolution:** fixed low-res internal buffer (target 320x180 or 384x216
  internal), integer-scaled to the viewport for crisp pixels. Never sub-pixel
  scale the game layer.
- **Tile size:** 16x16 base tiles. Characters ~16x24.
- **Palette:** restrained, ~24–32 colors total, with a distinct sub-palette per
  zone so each area reads differently at a glance. Must support a day/dusk shift
  that can echo the site's light/dark theme without being a hard requirement.
- **Lighting/atmosphere:** light use of an overlay tint + soft vignette per zone
  for mood. Optional subtle dithered gradients. No modern glow/bloom that breaks
  the pixel read.
- **UI:** diegetic where possible (signs, terminals, NPCs) over HUD chrome. Any
  HUD uses the same pixel font and is minimal: interact prompt, pause/exit.
- **Type:** a single pixel font for in-game text. Keep the portfolio's real
  fonts (milker / SF / Caveat) out of the game world to preserve the "different
  place" feeling.

Consistency rule: the game world must look intentionally *unlike* the portfolio.
The contrast is the point of the transition.

---

## 6. Transition Concept

Goal: the portfolio visibly *becomes* the game, tile by tile, over ~3.5–4.5s.

Sequence (target ~4.0s total):
1. **Trigger (0.0s):** "Matthew" is activated. Play a short low chime. Lock
   scroll. Freeze the portfolio underneath (it stays visible as the backdrop).
2. **Seed (0.0–0.6s):** a few pixel blocks appear at the click/focus origin (the
   "Matthew" word position), as if the word shattered into tiles.
3. **Construct (0.6–3.0s):** blocks propagate outward across the screen on a
   grid, filling in over the frozen portfolio. Fill order is an eased radial /
   diagonal sweep from the origin, not random noise. Mid-build, blocks begin
   resolving from flat color into actual game tiles (ground, grass, paths).
4. **Resolve (3.0–4.0s):** the last blocks settle, the avatar drops/fades into
   the spawn point, a short rising arpeggio plays, world controls enable.
5. **Hand-off (4.0s):** transition layer unmounts; the game loop is already
   running underneath so there is no second load hitch.

Style: it should feel *constructed*, deliberate, like the world is being built
for you, not a generic dissolve. Reuse the pacing discipline of the existing
`ThreeAirplaneTransition` (phased timeline constants, eased progress), but this
transition is 2D canvas/grid based, not three.js.

Exit transition: faster (~1.2–1.6s), tiles retract back toward the origin and
the portfolio re-emerges, scroll position restored exactly.

Reduced motion: collapse to a ~0.6s crossfade with no block construction. Same
enter/exit semantics, no large moving fields.

---

## 7. First Playable MVP Scope

The smallest thing that proves the whole pipeline and is genuinely fun to walk
around for 60–90 seconds. One zone only.

Must have:
- Trigger on "Matthew" (hover/focus affordance + click + keyboard activation).
- Full enter transition (can ship a simpler block-fill first, polish later).
- One zone: **The Workshop** (Matthew's room/workspace — see zones).
- Grid map with collision; walkable floor, blocking walls/objects.
- Player movement: 4-directional, walk animation, keyboard + on-screen d-pad.
- Camera that follows the player, clamped to map bounds.
- One NPC with a short branching-free dialogue (intro / who you are).
- Two interactable objects:
  - a **terminal** that surfaces one real project (e.g. PantryPal) in-world;
  - a **collectible "fragment"** (memory shard) that persists as collected.
- Pause/exit overlay reachable by Esc and an on-screen button.
- Exit transition back to the exact portfolio scroll position.
- Save: localStorage stores collected fragments + last spawn. Survives reload.
- Reduced-motion and keyboard paths working.

Explicitly out of MVP: multiple zones, combat, inventory UI, quests, audio music
bed, NPC branching, save slots, settings menu.

Definition of done for MVP: a first-time visitor can discover "Matthew," watch
the world build, walk around The Workshop, talk to one NPC, read one real
project on a terminal, grab one fragment, leave, reload, and see the fragment
still collected — all on desktop and mobile, with keyboard support.

---

## 8. Long-Term Game Structure

- **Hub-and-zones.** A central area (The Workshop / home) connects out to themed
  zones via doors, paths, or a small overworld map. Zones load on demand.
- **Fragments as the spine.** Collectible "memory fragments" are scattered across
  zones. Collecting them unlocks short personal vignettes and gradually reveals
  the overarching narrative thread (growth over time). They are the soft
  completion metric — no score, no timer.
- **NPCs as voices.** A small recurring cast (not real people, archetypes:
  a builder, a coach, a DJ, a traveler) gives the world life and delivers
  personality and story beats.
- **Light objectives, no fail state.** Optional tiny quests ("find the three
  fragments in the Workshop," "switch on every machine in the Lab"). Never a
  game-over. Exploration is always valid.
- **Persistent save** (localStorage now; pluggable later). State: visited zones,
  collected fragments, seen dialogue, settings.
- **Endgame mood, not boss.** A final quiet space that reflects back what was
  collected — a "where I'm headed" room — rather than a victory screen.

The narrative arc: origin → building/learning → interests/identity → outlook.
Walking deeper into the world walks forward through Matthew's story.

---

## 9. World / Zone Ideas

Each zone maps to real content already on the site, so the game and portfolio
reinforce each other. Tie-ins to existing systems noted.

- **The Workshop (hub).** Matthew's room/workspace. Desk, a half-built robot
  (Mechatronics @ Waterloo), terminals for real projects (PantryPal, the
  Waterloo assignment planner). MVP zone.
- **Origin / Home.** Quiet, warm zone about background and heritage. Subtle Korea
  motif — connects to the existing Korean-flag easter egg on "Kim" in the title.
- **The Court.** Basketball-themed open area. Ties to the existing basketball
  easter egg. A short shoot-the-hoop micro-interaction.
- **The Record Shop.** Music taste as a place. Crates to flip, a turntable that
  actually plays. Ties to the music easter egg and `MusicContext`.
- **The Departures Hall / Map.** Travel zone. Pins, photos, a plane motif. Ties
  to the existing travel gallery + airplane transition.
- **The Gallery.** Generative/creative work as walkable installations. Ties to
  the existing `GenerativeArtGallery`.
- **The Build Lab.** Bigger projects and experiments; switch-on machines that
  demo what each project does.
- **The Lookout (endgame mood).** A high, quiet vantage. "Where I'm headed."
  Unlocks as fragments accumulate.

Zones ship one at a time. Do not block MVP on more than The Workshop.

---

## 10. Interaction Ideas

- **Examine / interact prompt** on objects (signs, terminals, posters, machines)
  — single button (E / tap), context-sensitive.
- **NPC dialogue** in a pixel text box, advance on input, no time pressure.
- **Collect fragments** with a small pickup animation + sound; persists.
- **Switches/machines** that visibly do something when activated (a project
  "boots," a record plays, a robot arm moves).
- **Readable terminals** that present a real project succinctly, in-world, with a
  clearly-marked optional "open the real thing" link out to the live site/repo.
- **Hidden nooks** behind walkable gaps — reward thorough exploration with the
  most personal fragments.
- **Ambient micro-interactions:** stepping in grass rustles, a cat that follows
  for a few tiles (nod to the existing Bubby easter egg), light flickers.
- **Diegetic exit:** a door / "save & leave" object in addition to Esc.

Keep interactions to a tiny verb set: move, interact, advance, exit. Resist
adding mechanics that need a tutorial.

---

## 11. Technical Architecture

Mirror the proven pattern already in the codebase (`TravelContext` +
`TravelOverlay`, mounted in `ClientRoot`). The game is a parallel, heavier
version of that same idea.

State + mounting:
- **`GameContext`** (new): state machine like `TravelContext`:
  `idle → transitioning-in → playing → paused → transitioning-out → idle`.
  Exposes `enter()`, `exit()`, `pause()`, `resume()` and internal `_advance*`
  hooks the overlay calls when animations finish.
- **`GameOverlay`** (new): full-screen portal, mounted once in `ClientRoot`
  alongside `TravelOverlay` / `PersistentMusicPlayer`. Renders nothing while
  `idle`.
- **Trigger:** the "Matthew" span in `AnimatedTitle` (chars `0..KIM_START`,
  KIM_START = 8) becomes a focusable, activatable control that calls
  `enter()`. "Kim" (the second span) keeps its existing flag easter egg,
  untouched.

Rendering:
- **Custom lightweight canvas engine**, not a framework. One `<canvas>`, a fixed
  low-res internal buffer, integer-scaled. Single `requestAnimationFrame` loop
  with a fixed-timestep update + render split.
- **No DOM-per-tile.** Tiles are drawn to canvas from a sprite atlas. Framer
  Motion is used only for overlay chrome (transition layer, pause menu), never
  the game loop.
- **No Phaser / no heavy game engine.** Keep the engine in-repo, small, and
  understood. Revisit only if scope genuinely demands it.

Code-splitting / loading:
- The entire game (engine, assets manifest, zone data) is **dynamically imported**
  (`next/dynamic`, `ssr: false`) and only when `enter()` fires or on a
  deliberate idle prefetch after the portfolio is interactive. It must add ~0 to
  the portfolio's initial JS.
- Assets (atlases, maps, audio) load per zone, lazily, with a tiny in-transition
  loader. The ~4s transition doubles as cover for first-zone asset load.

Data:
- **Tilemaps** as JSON/TS per zone (authored by hand or via a tiny tool later):
  layers for ground / decoration / collision / objects / spawns.
- **Sprite atlases** as PNG + a typed manifest. Typed `Zone`, `TileLayer`,
  `NPC`, `Interactable`, `Fragment` interfaces, kept in `src/game/types.ts`.
- **Project content** reuses existing data (`src/data/projects.ts`) so in-world
  terminals and the real portfolio never drift.

Input:
- Keyboard (arrows + WASD, E interact, Esc pause/exit), on-screen touch d-pad +
  action button for mobile, abstracted behind one input layer so the game loop
  reads a single intent state. Gamepad optional later.

Audio:
- Reuse the existing sound system (`src/lib/sounds.ts`, `sounds.*`) for UI/SFX
  and add game-specific keys there. Respect the existing global mute
  (`SoundToggle`). No music bed in early phases.

Persistence:
- `localStorage` behind a typed `saveGame` / `loadGame` module with a schema
  `version` field for forward migration. No backend.

Suggested layout:
```
src/game/
  GameContext.tsx
  GameOverlay.tsx
  engine/        (loop, renderer, camera, input, collision)
  transition/    (block-construct enter/exit)
  data/          (zones, atlases manifest)
  types.ts
  save.ts
```

Cleanup is mandatory: on exit, cancel RAF, release canvas/image references,
remove listeners, restore scroll. No loop runs while `idle` or tab hidden.

---

## 12. Accessibility Requirements

- **Discoverable without hover.** The "Matthew" trigger is a real focusable
  control (`role`/button semantics, `aria-label` like "Enter the game"), in the
  tab order, activatable by Enter/Space, with a visible focus state. Hover is an
  enhancement, never the only path.
- **Full keyboard play.** Move, interact, advance dialogue, pause, and exit all
  work from the keyboard with no mouse.
- **Esc always exits/pauses.** Never trap the user in the overlay.
- **Reduced motion** (`prefers-reduced-motion`, already used via Framer's
  `useReducedMotion`): short crossfade instead of block construction, no large
  parallax, no screen shake.
- **No essential audio.** All information available visually; respects global
  mute.
- **Dialogue is not timed**; text is high-contrast on its box; no flashing /
  strobe in the transition (seizure safety).
- **Focus management:** moving into the overlay moves focus into it; exiting
  returns focus to the "Matthew" trigger.
- **Respect the portfolio's accessibility baseline** in CLAUDE.md (semantic
  structure, contrast, visible focus).

The game is optional content; discovering and ignoring it must never harm the
core portfolio's accessibility.

---

## 13. Mobile Requirements

- **Touch controls:** on-screen d-pad + single action button, thumb-reachable,
  with safe-area insets. Tap-to-interact on nearby objects as a secondary path.
- **Responsive canvas:** integer-scale the low-res buffer to fit the viewport;
  letterbox rather than distort. Support both portrait and landscape; portrait
  shows a smaller world viewport, controls below.
- **No hover dependence** anywhere in the game (already required by a11y).
- **Trigger works on touch:** "Matthew" is tappable with an adequate hit target
  on small screens.
- **Performance budget tighter on mobile** (see below); cap effects and DPR.
- **Don't fight the OS:** prevent the game from hijacking page scroll/zoom only
  while actively playing; restore normal behavior on exit.

Target: smooth exploration on a mid-range phone, not just flagship desktop.

---

## 14. Performance Requirements

- **Zero impact on portfolio initial load.** Game code/assets are code-split and
  never in the first bundle. Measure: portfolio LCP/JS unchanged with the game
  present.
- **60fps target** for the game loop on desktop and recent mobile; degrade
  gracefully (cap particles/lighting) before dropping frames.
- **Fixed-timestep update**, decoupled render; no work proportional to map size
  per frame — only draw visible tiles (camera culling).
- **One canvas, one RAF.** Pause the loop when paused, exited, or
  `document.hidden`.
- **Asset discipline:** sprite atlases over many images; lazy-load per zone;
  cap device pixel ratio (e.g. ≤2) for the scaled buffer.
- **Memory:** release zone assets when leaving a zone in long sessions; no leaks
  across enter/exit cycles (verify RAF + listeners are torn down).
- **Transition cost:** the ~4s construct effect must itself hold target fps;
  prefer drawing blocks to canvas over animating thousands of DOM nodes.

---

## 15. Phased Roadmap

- **Phase 0 — Foundations (no gameplay).** `GameContext` state machine,
  `GameOverlay` mounted in `ClientRoot`, "Matthew" trigger wired (a11y + touch),
  dynamic-import plumbing, empty canvas that opens/closes cleanly with scroll
  lock/restore. Prove the open/close pipeline before any world.
- **Phase 1 — Enter/exit transition.** Block-construct enter (~4s) and fast exit,
  reduced-motion fallback, sound hooks. Still no playable world underneath.
- **Phase 2 — MVP world (The Workshop).** Tile renderer + camera, collision,
  player movement (keyboard + touch), one NPC, one terminal (real project), one
  fragment, pause/exit, localStorage save. This is the "first playable" in §7.
- **Phase 3 — Polish the core loop.** Walk/idle animation, SFX, interact prompts,
  dialogue box feel, transition refinement, mobile tuning.
- **Phase 4 — Second & third zones.** Add zone loading/streaming, a hub
  connection, 2–3 more zones from §9 with fragments and NPCs.
- **Phase 5 — Narrative layer.** Fragment-driven vignettes, light objectives,
  the endgame "Lookout" mood room.
- **Phase 6 — Depth & tooling.** A small map-authoring path, settings menu,
  optional music bed, more interactions, save schema migrations.

Ship and stabilize each phase before starting the next. Phases 0–2 are the
priority; everything after is iteration.

---

## 16. Things To Avoid

- A resume in a game skin: walls of bullet-point text, "Skills: React, TS…"
  signs, fake metrics, or NPCs that recite a CV.
- Corny or quippy writing; meme energy; "hire me" winks at the camera.
- A heavy game engine or large dependency that bloats the bundle or makes the
  site feel generic (no Phaser/Unity-web/etc. without a real, documented reason).
- Anything that adds to the portfolio's initial load or slows first paint.
- Hover-only discovery or mouse-only controls.
- A transition that is flashy-but-random (pure noise dissolve), strobing, or
  motion-sickness inducing; or one so long it annoys (>~4.5s).
- DOM-per-tile rendering or per-frame allocations in the loop.
- Breaking the portfolio's existing easter eggs (Kim/Korea flag, basketball,
  music, travel, Bubby) — the game extends them, never overwrites them.
- Over-explaining the world; killing the mystery with tooltips and tutorials.
- Letting this doc and the code drift.

---

## 17. What NOT To Build Yet

Deliberately out of scope until the core loop (Phases 0–2) is solid and good:

- Multiplayer / presence / anything networked.
- Cloud saves or any backend; localStorage is enough for now.
- More than one zone (build The Workshop first, prove it, then expand).
- Combat, enemies, health, or any fail state.
- Inventory/crafting systems or complex menus.
- A full music score / dynamic audio (SFX only early).
- Procedural generation — all early maps are hand-authored.
- Achievements, leaderboards, scoring, timers.
- A custom level editor / heavy tooling (revisit in Phase 6 only if hand-editing
  maps becomes the bottleneck).
- Cutscenes or scripted set-pieces beyond the enter/exit transition.

If a feature is not needed to make one zone genuinely fun to explore, it waits.
