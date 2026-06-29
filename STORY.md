# STORY.md

Story & gameplay blueprint for `matthew.exe` — the hidden game inside the
portfolio. Source of truth for narrative, tone, and gameplay direction. See
`GAME_DESIGN.md` for the technical/architecture plan.

Planning only. No gameplay implemented from this doc yet.

---

## 1. Core concept

`matthew.exe` is the version of me that "runs" underneath the portfolio. The
site is the polished front end; the game is the program beneath it — a small,
bright top-down world made of my workshop and the places my interests live.

You boot it, explore, switch things on, and bring the world back to life.
Projects are machines you start; interests are places you wander into. No
combat, no fail state — curiosity is the mechanic. The world grows as the real
portfolio grows.

Direction: bright, fun, polished, DS-era top-down adventure. Not dark, edgy, or
melodramatic. Not a resume museum.

---

## 2. Why clicking `matthew` launches `matthew.exe`

The name is the executable. Clicking the author runs the author — a clean tech
pun (`.exe`) that is personal, not corny. It frames the game as "running me," so
a world built out of how I think and build makes sense.

---

## 3. Player role

A nameless explorer who lands in the world just after it boots. Not me — a
visitor given a body in my world, so a stranger (recruiter, friend, you) is the
lens. Generic-but-charming explorer avatar.

---

## 4. Main objective

The world boots on almost no power. Explore the hub and the zones beyond,
collect **build fragments** scattered through them, and use them to power
machines and open gates to more of the map.

Soft completion: the more you find, the more of me you understand. No score, no
timer, no failing. The gate is the meta-frontier — the world expands as the real
portfolio is built.

---

## 5. First scene: The Workshop

The bright courtyard hub. An open-air plaza with grass, stone paths, a workshop
building, a pond, trees and props, and a half-built gate that hints at the
larger world. It is the spawn point and the access point to everything else.

Keep the name **The Workshop**.

---

## 6. First objective: wake up the workshop

Small and teaching. Find **3 build fragments** in the courtyard and power the
gate. The three interactables each give context and a hint; the fragments are
the concrete goal. A minimal tracker shows `fragments 0/3`.

When all three are collected, the gate hums to life and teases the wider world.
This converts "a room you walk around" into "a small thing you accomplish."

---

## 7. First 3 interactables and dialogue

Lowercase, short, in voice. The three objects give context and point toward the
fragments.

**workbench (project terminal)**
- "the terminal blinks awake. it remembers every half-finished idea i've fed it."
- "this is where things start — small tools, robots, builds that outgrow the bench."
- "power's low, though. the whole place is running on one light."

**notice board (thought board)**
- "pinned notes, arrows, and one stubborn sketch of a robot arm."
- "i think by building. sketch it, break it, learn why, try again."
- "there's a list here — mostly things i haven't made yet."

**locked gate (portal)**
- "a half-built gate. the road keeps going past it."
- "more of this world is still going up. places i'm still figuring out."
- "it runs on fragments. find a few and it'll open."

Later, projects appear as machines/stations you switch on (a brief visual demo +
one or two lines), never as cards or bullet lists.

---

## 8. Future zones

One at a time; do not build these yet.

1. **The Workshop** (hub) — how I build. Spawn, project access, the gate.
2. **The Court** — play, discipline, not taking myself too seriously. Basketball.
3. **The Studio** — focus, taste, late nights. Music + creative/generative work.
4. **Departures** — curiosity and roots. Travel + Korean/Canadian identity, food.
5. **The Build Lab / Yard** — ambition. Bigger projects, robotics, the
   "under construction" frontier the gate opens to.

Future capstone: **The Lookout** — a quiet "where I'm headed" endgame room,
unlocked by fragments.

Identity threads appear as places with one specific detail each, discovered not
delivered: Waterloo/co-op as real project machines (library project, assignment
planner); Korean/Canadian as a warm home nook with a bilingual sign (ties to the
existing Kim / Korea-flag easter egg); music as a record player you toggle;
basketball as a half-court hoop; travel as a departures board with pins (ties to
the existing travel gallery).

---

## 9. Collectibles / unlockables

- **Build fragments** (primary): glowing chips that power machines and open
  gates. The main collect loop.
- **Zone stamps** (secondary, light): a travel-passport feel for places visited.
- **Explorer cosmetics** (optional, later): hat / color.

MVP uses fragments only.

---

## 10. Bubby guide concept (for later)

A near-silent companion: **Bubby**, my actual dog and an existing site easter
egg. Not a narrator, not a robot mascot, no "hi, i'm your guide." He trots
along, sits, looks at things, and "speaks" only in short bracketed cues.

- "*(a small dog trots over, sits, and looks from you to the gate.)*"
- "bubby: `[this way]`"

Personal, charming, ties to the existing world, dodges every mascot cliché. Add
only after the core loop feels good.

---

## 11. Dialogue tone rules

- First-person, understated, specific, a little dry. Same voice as the portfolio
  copy.
- Short lines. Let specificity do the work.
- Lowercase aesthetic to match the menu (uppercase only when genuinely needed,
  e.g. key names like `WASD`, `E`).
- No corporate filler, no exclamation spam, no melodrama, no "embark on a
  journey," no symbolic monologues.
- Never list resume bullets in dialogue. Never fake metrics or testimonials.

---

## 12. Systems to build next

In order, one scene only:

1. **Build fragments** as a collectible type in the scene data (3 placed in the
   courtyard) with a small pickup interaction.
2. **Objective tracker + pickup feedback** — minimal lowercase `fragments 0/3`
   tracker and a brief toast, styled like the portfolio UI, reduced-motion safe.
3. **"World reacts" beat** — at 3/3, the gate visibly powers up (accent glow /
   hum) and its dialogue updates to acknowledge it's ready. No new scene loads.
4. **Locked-gate gating** as the unlock mechanic.
5. (Optional, only if clean) **Bubby** as a simple follow companion with a
   `[this way]` cue near the nearest uncollected fragment.

---

## 13. Systems to wait on

- Multiple zones + zone transitions.
- Project mini-demo machines.
- The pixel construction transition (revisit once a second scene exists).
- Music / ambient audio.
- Passport / stamps.
- Save persistence.
- Companion AI / pathfinding.
- Settings menu, cosmetics.

One at a time, after the first loop feels good.

---

## 14. Things to avoid

- A resume museum: project cards, skill lists, bullets in dialogue.
- Fake metrics, fake testimonials, fake experience.
- Over-explaining; symbolic or emotional monologues; melodrama.
- A mascot that introduces itself.
- Dark, edgy, or overly serious tone.
- Generic fantasy tropes.
- Copying Pokémon or any copyrighted characters: no creatures, gyms, pokeballs,
  "gotta catch" framing.
- Pun overload; filler verbs ("embark," "delve," "seamless").
- Perfectly symmetric, lifeless layouts.
- Piling on systems before one loop feels good.
