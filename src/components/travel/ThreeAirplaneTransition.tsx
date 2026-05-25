"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const PLANE_DURATION = 3.7;
export const PLANE_SCALE = 5.2;
export const PLANE_START = [-0.72, -0.16, 0.35] as const;
export const PLANE_END = [1.5, 0.1, -0.85] as const;
export const PLANE_HEIGHT = 1.05;
export const PLANE_BANK_AMOUNT = 0.28;
export const PLANE_PITCH_AMOUNT = 0.2;
export const CAMERA_POSITION = [0, 0, 7] as const;
export const LIGHT_INTENSITY = 3.1;

const MODEL_PATH = "/models/boeing_787_dreamliner.glb";
const MODEL_ROTATION = [-0.4, Math.PI / 2, 0] as const;

// Module-level singleton: load + parse once at page init, reuse forever.
// This ensures the model is ready before the user ever triggers the transition.
let _modelCache: THREE.Group | null = null;
let _modelPromise: Promise<THREE.Group> | null = null;

function getModel(): Promise<THREE.Group> {
  if (_modelCache) return Promise.resolve(_modelCache);
  if (_modelPromise) return _modelPromise;
  _modelPromise = new Promise((resolve, reject) => {
    new GLTFLoader().load(MODEL_PATH, (gltf) => {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      const normalized = new THREE.Group();
      gltf.scene.position.sub(center);
      normalized.add(gltf.scene);
      normalized.scale.setScalar(1 / maxDimension);
      _modelCache = normalized;
      resolve(normalized);
    }, undefined, reject);
  });
  return _modelPromise;
}

// Kick off loading immediately when this module is first imported (page load).
if (typeof window !== "undefined") getModel();

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function useAirplaneModel() {
  const [scene, setScene] = useState<THREE.Group | null>(() => _modelCache);

  useEffect(() => {
    if (_modelCache) return;
    let cancelled = false;
    getModel().then((s) => { if (!cancelled) setScene(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return scene;
}


function FlyingAirplane({ progressRef }: { progressRef: { current: number } }) {
  const scene = useAirplaneModel();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ viewport }) => {
    if (!groupRef.current) return;

    const progress = easeInOutCubic(THREE.MathUtils.clamp(progressRef.current, 0, 1));
    const arc = Math.sin(progress * Math.PI);

    const x = viewport.width * THREE.MathUtils.lerp(PLANE_START[0], PLANE_END[0], progress);
    const y =
      viewport.height * THREE.MathUtils.lerp(PLANE_START[1], PLANE_END[1], progress) +
      arc * PLANE_HEIGHT;
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
      <primitive object={scene} rotation={MODEL_ROTATION} />
    </group>
  );
}

export function ThreeAirplaneTransition({ progressRef }: { progressRef: { current: number } }) {
  return (
    <div
      aria-hidden
      className="travel-three-transition"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
      }}
    >
      <style>
        {`
          .travel-three-transition canvas {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: block !important;
            pointer-events: none !important;
          }
        `}
      </style>
      <Canvas
        dpr={[1, 1.5]}
        frameloop="always"
        onCreated={({ gl }) => {
          Object.assign(gl.domElement.style, {
            position: "fixed",
            inset: "0px",
            width: "100vw",
            height: "100vh",
            display: "block",
            pointerEvents: "none",
          });
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      >
        <PerspectiveCamera makeDefault fov={42} position={CAMERA_POSITION} />
        <ambientLight intensity={LIGHT_INTENSITY * 0.5} />
        <directionalLight intensity={LIGHT_INTENSITY} position={[-4, 3.5, 5]} />
        <directionalLight intensity={LIGHT_INTENSITY * 0.55} position={[4, -1.5, 3]} />
        <hemisphereLight intensity={LIGHT_INTENSITY * 0.35} groundColor="#1a1a1a" />
        <FlyingAirplane progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
