"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ─── enter (787, left → right) ──────────────────────────────────────────────
export const PLANE_DURATION    = 5.0;
export const PLANE_SCALE       = 5.2;
export const PLANE_START       = [-1.1,  -0.16, 0.35] as const;
export const PLANE_END         = [1.5,    0.1, -0.85] as const;
export const PLANE_HEIGHT      = 1.05;
export const PLANE_BANK_AMOUNT = 0.28;
export const PLANE_PITCH_AMOUNT = 0.2;

// ─── exit (A380, right → left, descending) ──────────────────────────────────
export const EXIT_PLANE_DURATION = 5.0;
const EXIT_PLANE_SCALE           = 5.0;
export const EXIT_PLANE_START    = [0.95,  0.38, -0.3 ] as const; // top-right, off-screen
export const EXIT_PLANE_END      = [-1.55, -0.3,  0.45] as const; // bottom-left, off-screen
const EXIT_BANK_AMOUNT           = 0.18;

// ─── shared ─────────────────────────────────────────────────────────────────
export const CAMERA_POSITION = [0, 0, 7] as const;
export const LIGHT_INTENSITY = 3.1;

const ENTER_MODEL_PATH     = "/models/boeing_787_dreamliner.glb";
const ENTER_MODEL_ROTATION = [-0.4,  Math.PI / 2, 0] as const;
const EXIT_MODEL_PATH      = "/models/airbus_a380.glb";
const EXIT_MODEL_ROTATION  = [ 0.0,  Math.PI / 2, 0] as const; // face left; wheels stay down

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── module-level model caches (load + parse once at page init) ──────────────

function makeLoader(path: string) {
  let cache: THREE.Group | null = null;
  let promise: Promise<THREE.Group> | null = null;

  function get(): Promise<THREE.Group> {
    if (cache) return Promise.resolve(cache);
    if (promise) return promise;
    promise = new Promise((resolve, reject) => {
      new GLTFLoader().load(path, (gltf) => {
        const box   = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const group  = new THREE.Group();
        gltf.scene.position.sub(center);
        group.add(gltf.scene);
        group.scale.setScalar(1 / maxDim);
        cache = group;
        resolve(group);
      }, undefined, reject);
    });
    return promise;
  }

  function useModel() {
    const [scene, setScene] = useState<THREE.Group | null>(() => cache);
    useEffect(() => {
      if (cache) return;
      let cancelled = false;
      get().then((s) => { if (!cancelled) setScene(s); }).catch(() => {});
      return () => { cancelled = true; };
    }, []);
    return scene;
  }

  return { get, useModel };
}

const enterLoader = makeLoader(ENTER_MODEL_PATH);
const exitLoader  = makeLoader(EXIT_MODEL_PATH);

// Start both loading at page init so they're ready before the user interacts.
if (typeof window !== "undefined") {
  enterLoader.get();
  exitLoader.get();
}

// ─── shared Canvas wrapper ───────────────────────────────────────────────────

function PlaneCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="travel-three-transition"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none" }}
    >
      <style>{`
        .travel-three-transition canvas {
          position: fixed !important; inset: 0 !important;
          width: 100vw !important; height: 100vh !important;
          display: block !important; pointer-events: none !important;
        }
      `}</style>
      <Canvas
        dpr={[1, 1.5]}
        frameloop="always"
        onCreated={({ gl }) => {
          Object.assign(gl.domElement.style, {
            position: "fixed", inset: "0px",
            width: "100vw", height: "100vh",
            display: "block", pointerEvents: "none",
          });
        }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
      >
        <PerspectiveCamera makeDefault fov={42} position={CAMERA_POSITION} />
        <ambientLight intensity={LIGHT_INTENSITY * 0.5} />
        <directionalLight intensity={LIGHT_INTENSITY}        position={[-4,  3.5, 5]} />
        <directionalLight intensity={LIGHT_INTENSITY * 0.55} position={[ 4, -1.5, 3]} />
        <hemisphereLight  intensity={LIGHT_INTENSITY * 0.35} groundColor="#1a1a1a" />
        {children}
      </Canvas>
    </div>
  );
}

// ─── enter plane (787, left → right) ────────────────────────────────────────

function FlyingAirplane({ progressRef }: { progressRef: { current: number } }) {
  const scene    = enterLoader.useModel();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ viewport }) => {
    if (!groupRef.current) return;
    const progress = easeInOutCubic(THREE.MathUtils.clamp(progressRef.current, 0, 1));
    const arc = Math.sin(progress * Math.PI);
    const x = viewport.width  * THREE.MathUtils.lerp(PLANE_START[0], PLANE_END[0], progress);
    const y = viewport.height * THREE.MathUtils.lerp(PLANE_START[1], PLANE_END[1], progress) + arc * PLANE_HEIGHT;
    const z = THREE.MathUtils.lerp(PLANE_START[2], PLANE_END[2], progress) - arc * 0.45;
    groupRef.current.position.set(x, y, z);
    const pitchFromArc = Math.cos(progress * Math.PI) * PLANE_PITCH_AMOUNT;
    groupRef.current.rotation.set(
      pitchFromArc,
      THREE.MathUtils.lerp(0.06, -0.06, progress),
      -Math.sin(progress * Math.PI) * PLANE_BANK_AMOUNT,
    );
  });

  if (!scene) return null;
  return (
    <group ref={groupRef} scale={PLANE_SCALE}>
      <primitive object={scene} rotation={ENTER_MODEL_ROTATION} />
    </group>
  );
}

export function ThreeAirplaneTransition({ progressRef }: { progressRef: { current: number } }) {
  return <PlaneCanvas><FlyingAirplane progressRef={progressRef} /></PlaneCanvas>;
}

// ─── exit plane (A380, right → left, descending) ────────────────────────────

function FlyingExitAirplane({ progressRef }: { progressRef: { current: number } }) {
  const scene    = exitLoader.useModel();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ viewport }) => {
    if (!groupRef.current) return;
    const progress = easeInOutCubic(THREE.MathUtils.clamp(progressRef.current, 0, 1));
    // Straight descending path — no upward arc, it's a landing approach.
    const x = viewport.width  * THREE.MathUtils.lerp(EXIT_PLANE_START[0], EXIT_PLANE_END[0], progress);
    const y = viewport.height * THREE.MathUtils.lerp(EXIT_PLANE_START[1], EXIT_PLANE_END[1], progress);
    const z = THREE.MathUtils.lerp(EXIT_PLANE_START[2], EXIT_PLANE_END[2], progress);
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.set(
      0.12,
      THREE.MathUtils.lerp(-0.05, 0.05, progress),
      -Math.sin(progress * Math.PI / 2) * EXIT_BANK_AMOUNT,
    );
  });

  if (!scene) return null;
  return (
    <group ref={groupRef} scale={EXIT_PLANE_SCALE}>
      <primitive object={scene} rotation={EXIT_MODEL_ROTATION} />
    </group>
  );
}

export function ThreeAirplaneExitTransition({ progressRef }: { progressRef: { current: number } }) {
  return <PlaneCanvas><FlyingExitAirplane progressRef={progressRef} /></PlaneCanvas>;
}
