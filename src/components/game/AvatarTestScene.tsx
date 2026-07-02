"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { ArrowLeft, RotateCcw } from "lucide-react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { AnimationAction } from "three";

const MODEL_PATH = "/models/matthew-avatar-animated.glb";
const ANIM_FADE = 0.35;

// 2D spawn room + sprite proportions (engine.ts / render.ts drawPlayer).
const ROOM_WORLD_W = 256;
const ROOM_WORLD_H = 192;
const PLAYER_SPRITE_H = 22;
const GAME_ROOM_UNITS_W = 10;
const GAME_ROOM_UNITS_H = GAME_ROOM_UNITS_W * (ROOM_WORLD_H / ROOM_WORLD_W);

type ScaleMode = "inspection" | "gameplay";

type ViewPreset = {
  label: string;
  characterHeight: number;
  isoDist: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  floorSize: number;
  lookAtFactor: number;
};

const INSPECTION_CHAR_HEIGHT = 1.65;
const INSPECTION_FRAMING_H = INSPECTION_CHAR_HEIGHT * 2.2;
const GAMEPLAY_CHAR_HEIGHT = GAME_ROOM_UNITS_W * (PLAYER_SPRITE_H / ROOM_WORLD_W);
// Frame the gameplay-scale avatar (not the full room) so details read on screen.
const GAMEPLAY_FRAMING_H = GAMEPLAY_CHAR_HEIGHT * 2.35;
const INSPECTION_ZOOM = 72;
const INSPECTION_ISO_DIST = 8;
const GAMEPLAY_ZOOM = INSPECTION_ZOOM * (INSPECTION_FRAMING_H / GAMEPLAY_FRAMING_H);

const SCALE_PRESETS: Record<ScaleMode, ViewPreset> = {
  inspection: {
    label: "inspection close-up",
    characterHeight: INSPECTION_CHAR_HEIGHT,
    isoDist: INSPECTION_ISO_DIST,
    zoom: INSPECTION_ZOOM,
    minZoom: 42,
    maxZoom: 115,
    floorSize: 8,
    lookAtFactor: 0.45,
  },
  gameplay: {
    label: "gameplay scale",
    characterHeight: GAMEPLAY_CHAR_HEIGHT,
    isoDist: INSPECTION_ISO_DIST,
    zoom: GAMEPLAY_ZOOM,
    minZoom: 85,
    maxZoom: 175,
    floorSize: GAME_ROOM_UNITS_W,
    lookAtFactor: 0.45,
  },
};

function isoPosition(dist: number): [number, number, number] {
  const unit = dist / Math.sqrt(3);
  return [unit, unit, unit];
}

function lookAtYFor(preset: ViewPreset) {
  return preset.characterHeight * preset.lookAtFactor;
}

useGLTF.preload(MODEL_PATH);

const SIDE_LABELS: Record<number, string> = {
  [THREE.FrontSide]: "FrontSide",
  [THREE.BackSide]: "BackSide",
  [THREE.DoubleSide]: "DoubleSide",
};

type MaterialSideMode = "front" | "double";

function getMeshMaterials(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function textureLabel(texture: THREE.Texture | null | undefined): string | null {
  if (!texture) return null;
  const image = texture.image as { src?: string } | undefined;
  return image?.src ?? "(texture)";
}

function logAvatarMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    getMeshMaterials(obj).forEach((material, index) => {
      const textured =
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial ||
        material instanceof THREE.MeshBasicMaterial
          ? material
          : null;

      console.log(`[matthew.exe avatar-test] material "${material.name || `index-${index}`}" on mesh "${obj.name}"`, {
        type: material.type,
        transparent: material.transparent,
        opacity: material.opacity,
        alphaTest: material.alphaTest,
        depthWrite: material.depthWrite,
        depthTest: material.depthTest,
        side: SIDE_LABELS[material.side] ?? material.side,
        map: textureLabel(textured?.map),
        alphaMap: textureLabel(textured?.alphaMap),
      });
    });
  });
}

function fixAvatarMaterials(root: THREE.Object3D, sideMode: MaterialSideMode) {
  const side = sideMode === "double" ? THREE.DoubleSide : THREE.FrontSide;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    getMeshMaterials(obj).forEach((material) => {
      material.transparent = false;
      material.opacity = 1;
      material.alphaTest = 0;
      material.depthWrite = true;
      material.depthTest = true;
      material.side = side;

      if (material instanceof THREE.MeshPhysicalMaterial) {
        material.transmission = 0;
        material.thickness = 0;
        material.ior = 1.5;
      }

      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial ||
        material instanceof THREE.MeshBasicMaterial
      ) {
        if (material.map) material.map.premultiplyAlpha = false;
      }

      material.needsUpdate = true;
    });
  });
}

function pickIdleClip(names: string[]): string | null {
  const idle = names.find((n) => /idle/i.test(n));
  return idle ?? names[0] ?? null;
}

function layoutAvatar(root: THREE.Object3D, targetHeight: number): boolean {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.y <= 1e-6) return false;

  const scale = targetHeight / size.y;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -fitted.min.y, -center.z);
  root.updateMatrixWorld(true);

  return true;
}

function resetViewCamera(
  camera: THREE.Camera,
  controls: OrbitControlsImpl | null,
  preset: ViewPreset,
) {
  if (!(camera instanceof THREE.OrthographicCamera)) return;
  const lookAtY = lookAtYFor(preset);
  camera.position.set(...isoPosition(preset.isoDist));
  camera.zoom = preset.zoom;
  camera.updateProjectionMatrix();
  if (controls) {
    controls.target.set(0, lookAtY, 0);
    controls.update();
  } else {
    camera.lookAt(0, lookAtY, 0);
  }
}

function InspectionCamera({
  preset,
  resetToken,
}: {
  preset: ViewPreset;
  resetToken: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const lookAtY = lookAtYFor(preset);

  useEffect(() => {
    if (resetToken === 0) return;
    resetViewCamera(camera, controlsRef.current, preset);
  }, [resetToken, camera, preset]);

  useEffect(() => {
    resetViewCamera(camera, controlsRef.current, preset);
  }, [camera, preset]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, lookAtY, 0]}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minZoom={preset.minZoom}
      maxZoom={preset.maxZoom}
    />
  );
}

function playClip(
  actions: Record<string, AnimationAction | null>,
  clipName: string,
  prevClip: string | null,
) {
  const next = actions[clipName];
  if (!next) return false;

  const prev = prevClip && prevClip !== clipName ? actions[prevClip] : null;

  if (prev?.isRunning()) {
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    next.crossFadeFrom(prev, ANIM_FADE, true).play();
  } else {
    Object.values(actions).forEach((action) => {
      if (action && action !== next && action.isRunning()) {
        action.fadeOut(ANIM_FADE);
      }
    });
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(ANIM_FADE).play();
  }

  return true;
}

function AvatarModel({
  activeClip,
  materialSide,
  preset,
  onReady,
}: {
  activeClip: string | null;
  materialSide: MaterialSideMode;
  preset: ViewPreset;
  onReady: (names: string[]) => void;
}) {
  const outer = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names } = useAnimations(animations, scene);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const reported = useRef(false);
  const materialsLogged = useRef(false);
  const prevClip = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!materialsLogged.current) {
      logAvatarMaterials(scene);
      materialsLogged.current = true;
    }
    fixAvatarMaterials(scene, materialSide);
  }, [scene, materialSide]);

  useLayoutEffect(() => {
    if (!outer.current) return;
    outer.current.scale.setScalar(1);
    outer.current.position.set(0, 0, 0);
    layoutAvatar(outer.current, preset.characterHeight);
  }, [preset.characterHeight]);

  useEffect(() => {
    if (reported.current || names.length === 0) return;
    reported.current = true;
    console.log("[matthew.exe avatar-test] animation clips:", names.length ? names : "(none)");
    names.forEach((name, i) => console.log(`  [${i}] ${name}`));
    onReady(names);
  }, [names, onReady]);

  useEffect(() => {
    if (!activeClip || !names.includes(activeClip)) return;
    if (playClip(actionsRef.current, activeClip, prevClip.current)) {
      prevClip.current = activeClip;
      console.log("[matthew.exe avatar-test] playing:", activeClip);
    }
  }, [activeClip, names]);

  return (
    <group ref={outer}>
      <primitive object={scene} />
    </group>
  );
}

function AvatarStage({
  activeClip,
  materialSide,
  preset,
  onReady,
  cameraResetToken,
}: {
  activeClip: string | null;
  materialSide: MaterialSideMode;
  preset: ViewPreset;
  onReady: (names: string[]) => void;
  cameraResetToken: number;
}) {
  return (
    <>
      <InspectionCamera preset={preset} resetToken={cameraResetToken} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[preset.floorSize, preset.floorSize]} />
        <meshStandardMaterial color="#1a1f28" roughness={0.92} metalness={0.05} />
      </mesh>

      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.45}
        scale={preset.floorSize}
        blur={2.2}
        far={preset.floorSize * 0.5}
        resolution={512}
        color="#000000"
      />

      <AvatarModel
        activeClip={activeClip}
        materialSide={materialSide}
        preset={preset}
        onReady={onReady}
      />
    </>
  );
}

export function AvatarTestScene({ onMenu }: { onMenu: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [clipNames, setClipNames] = useState<string[]>([]);
  const [activeClip, setActiveClip] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [materialSide, setMaterialSide] = useState<MaterialSideMode>("front");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("gameplay");
  const preset = SCALE_PRESETS[scaleMode];

  const handleReady = useCallback((names: string[]) => {
    setClipNames(names);
    setLoaded(true);
    setActiveClip((current) => current ?? pickIdleClip(names));
  }, []);

  const resetCamera = useCallback(() => {
    setCameraResetToken((n) => n + 1);
  }, []);

  const toggleScaleMode = useCallback(() => {
    setScaleMode((mode) => (mode === "gameplay" ? "inspection" : "gameplay"));
    setCameraResetToken((n) => n + 1);
  }, []);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        e.preventDefault();
        onMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onMenu]);

  return (
    <div ref={rootRef} tabIndex={-1} className="absolute inset-0 bg-[#0b0d12] focus:outline-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        className="h-full w-full"
        orthographic
        camera={{
          position: isoPosition(preset.isoDist),
          zoom: preset.zoom,
          near: 0.1,
          far: 100,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, lookAtYFor(preset), 0);
        }}
      >
        <color attach="background" args={["#0b0d12"]} />
        <AvatarStage
          activeClip={activeClip}
          materialSide={materialSide}
          preset={preset}
          onReady={handleReady}
          cameraResetToken={cameraResetToken}
        />
      </Canvas>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-[#FED34C] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            menu
          </button>
          <button
            type="button"
            onClick={toggleScaleMode}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#FED34C]/35 bg-[#FED34C]/10 px-2.5 py-1 text-xs font-medium text-[#FED34C] backdrop-blur-sm transition-colors hover:border-[#FED34C]/55 hover:bg-[#FED34C]/15 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FED34C]/70"
          >
            scale: {preset.label}
          </button>
          <button
            type="button"
            onClick={resetCamera}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/30 hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
          >
            <RotateCcw size={12} strokeWidth={2} />
            reset camera
          </button>
        </div>

        <div className="rounded-md border border-[#FED34C]/30 bg-black/50 px-3 py-2 text-right backdrop-blur-sm">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#FED34C]">
            dev · model inspector
          </p>
          <p className="mt-1 text-[0.7rem] text-white/55">
            {loaded
              ? `${clipNames.length} clip${clipNames.length === 1 ? "" : "s"} · ${preset.label}`
              : "loading model…"}
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div className="pointer-events-auto mx-auto max-w-lg rounded-md border border-white/15 bg-black/65 px-3 py-2.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-white/40">animations</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.65rem] text-white/35">drag to orbit · scroll to zoom</p>
              <button
                type="button"
                onClick={() => setMaterialSide((s) => (s === "front" ? "double" : "front"))}
                className="rounded border border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                side: {materialSide === "front" ? "FrontSide" : "DoubleSide"}
              </button>
            </div>
          </div>

          {!loaded ? (
            <p className="mt-2 text-xs text-white/60">loading model…</p>
          ) : clipNames.length === 0 ? (
            <p className="mt-2 text-xs text-white/60">none exported</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {clipNames.map((name) => {
                const active = name === activeClip;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setActiveClip(name)}
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-md border border-[#FED34C] bg-[#FED34C] px-3 py-1.5 text-xs font-medium text-black shadow-[0_0_12px_rgba(254,211,76,0.25)] transition-colors"
                        : "rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
                    }
                  >
                    {active ? `▶ ${name}` : name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
