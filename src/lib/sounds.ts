const rawCache: Record<string, ArrayBuffer> = {};
const bufferCache: Record<string, AudioBuffer> = {};
let audioCtx: AudioContext | null = null;

let soundEnabled = true;
let vinylLogicallyPlaying = false;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (vinylLogicallyPlaying) {
    if (enabled) {
      vlAudio?.play().catch(() => {});
    } else {
      vlAudio?.pause();
    }
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Fetch raw bytes immediately — no AudioContext needed, no browser restriction
function prefetch(src: string) {
  if (typeof window === "undefined" || rawCache[src]) return;
  fetch(src)
    .then((r) => r.arrayBuffer())
    .then((buf) => { rawCache[src] = buf; })
    .catch(() => {});
}

async function decodeAll() {
  const c = getCtx();
  const allFiles = [
    "/sfx/bubble-pop.mp3",
    "/sfx/leaf-crunch.mp3",
    "/sfx/vinyl-start.mp3",
    "/sfx/vinyl-stop.mp3",
    "/sfx/basketball-launch.mp3",
    "/sfx/you-vs-you-demo-click.mp3",
    "/sfx/plane-flyby.mp3",
    "/sfx/linkedin-button.mp3",
    "/sfx/satisfying-button-press.mp3",
    "/sfx/mouse-click.mp3",
    "/sfx/message-sound.mp3",
    "/sfx/demo-click.mp3",
    "/sfx/music-click.mp3",
    "/sfx/pantry-pal-click.mp3",
    "/sfx/light-switch-on.mp3",
    "/sfx/light-switch-off.mp3",
    ...BOUNCE_FILES,
  ];
  await Promise.all(
    allFiles.map(async (src) => {
      if (bufferCache[src]) return;
      const raw = rawCache[src];
      if (!raw) return;
      bufferCache[src] = await c.decodeAudioData(raw.slice(0));
    })
  );
}

if (typeof window !== "undefined") {
  const warmup = () => {
    decodeAll().catch(() => {});
    window.removeEventListener("pointerdown", warmup);
  };
  window.addEventListener("pointerdown", warmup);
}

async function play(src: string, volume = 0.5, offset = 0) {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const c = getCtx();
    if (!bufferCache[src]) {
      let raw = rawCache[src];
      if (!raw) {
        raw = await fetch(src).then((r) => r.arrayBuffer());
      }
      // slice() because decodeAudioData consumes the buffer
      bufferCache[src] = await c.decodeAudioData(raw.slice(0));
    }
    const source = c.createBufferSource();
    source.buffer = bufferCache[src];
    const gain = c.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(c.destination);
    source.start(0, offset);
  } catch {
    // silently fail
  }
}

const BOUNCE_FILES = [
  "/sfx/basketball-first-bounce.mp3",
  "/sfx/basketball-second-bounce.mp3",
  "/sfx/basketball-third-bounce.mp3",
  "/sfx/basketball-fourth-bounce.mp3",
  "/sfx/basketball-fifth-bounce.mp3",
  "/sfx/basketball-sixth-bounce.mp3",
];

const BARK_FILES = [
  "/sfx/bubby-bark-one.mp3",
  "/sfx/bubby-bark-two.mp3",
  "/sfx/bubby-bark-three.mp3",
];

let vlAudio: HTMLAudioElement | null = null;

export const vinylLoop = {
  start() {
    vinylLogicallyPlaying = true;
    if (!soundEnabled || typeof window === "undefined") return;
    if (!vlAudio) {
      vlAudio = new Audio("/sfx/vinyl-loop.mp3");
      vlAudio.loop = true;
      vlAudio.volume = 0.35;
    }
    vlAudio.play().catch(() => {});
  },
  stop() {
    vinylLogicallyPlaying = false;
    vlAudio?.pause();
  },
};

if (typeof window !== "undefined") {
  prefetch("/sfx/bubble-pop.mp3");
  prefetch("/sfx/leaf-crunch.mp3");
  prefetch("/sfx/vinyl-start.mp3");
  prefetch("/sfx/vinyl-stop.mp3");
  prefetch("/sfx/basketball-launch.mp3");
  prefetch("/sfx/you-vs-you-demo-click.mp3");
  prefetch("/sfx/plane-flyby.mp3");
  prefetch("/sfx/linkedin-button.mp3");
  prefetch("/sfx/satisfying-button-press.mp3");
  prefetch("/sfx/mouse-click.mp3");
  prefetch("/sfx/message-sound.mp3");
  prefetch("/sfx/demo-click.mp3");
  prefetch("/sfx/music-click.mp3");
  prefetch("/sfx/pantry-pal-click.mp3");
  prefetch("/sfx/light-switch-on.mp3");
  prefetch("/sfx/light-switch-off.mp3");
  BOUNCE_FILES.forEach(prefetch);
  BARK_FILES.forEach(prefetch);
}

export const sounds = {
  bubble:           () => play("/sfx/bubble-pop.mp3",  0.5,  0),
  crunch:           () => play("/sfx/leaf-crunch.mp3", 0.5,  0),
  vinylStart:       () => play("/sfx/vinyl-start.mp3", 0.175, 0),
  vinylStop:        () => play("/sfx/vinyl-stop.mp3",  0.105, 0),
  basketballLaunch: () => play("/sfx/basketball-launch.mp3", 0.5, 0),
  bubbyBark: () => {
    const src = BARK_FILES[Math.floor(Math.random() * BARK_FILES.length)];
    play(src, 0.5, 0);
  },
  basketballBounce: (bounceCount: number) => {
    const idx = Math.min(bounceCount - 1, BOUNCE_FILES.length - 1);
    const extraBounces = Math.max(0, bounceCount - BOUNCE_FILES.length);
    const volume = 0.5 * Math.pow(0.8, extraBounces);
    play(BOUNCE_FILES[idx], volume, 0);
  },
  demoClick:       () => play("/sfx/you-vs-you-demo-click.mp3",   0.5,   0),
  demoOpen:        () => play("/sfx/demo-click.mp3",              0.5,   0),
  musicClick:      () => play("/sfx/music-click.mp3",             0.3,   0),
  pantryPalClick:  () => play("/sfx/pantry-pal-click.mp3",        0.5,   0),
  planeFlyby:      () => play("/sfx/plane-flyby.mp3",             0.5,   0),
  linkedinClick:   () => play("/sfx/linkedin-button.mp3",         0.5,   0),
  satisfyingPress: () => play("/sfx/satisfying-button-press.mp3", 0.5,   0),
  mouseClick:      () => play("/sfx/mouse-click.mp3",             0.5,   0),
  messageSound:    () => play("/sfx/message-sound.mp3",           0.375, 0),
  lightSwitchOn:   () => play("/sfx/light-switch-on.mp3",         0.5,   0),
  lightSwitchOff:  () => play("/sfx/light-switch-off.mp3",        0.5,   0),
};
