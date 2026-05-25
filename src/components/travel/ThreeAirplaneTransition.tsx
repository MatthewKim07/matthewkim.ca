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
export const PLANE_BANK_AMOUNT = 0.22;
export const PLANE_PITCH_AMOUNT = 0.2;
export const CAMERA_POSITION = [0, 0, 7] as const;
export const LIGHT_INTENSITY = 3.1;

const MODEL_PATH = "/models/airplane.glb";
const MODEL_ROTATION = [0.05, Math.PI, 0] as const;

type AirplaneModelState =
  | { status: "loading"; scene: null }
  | { status: "ready"; scene: THREE.Group }
  | { status: "error"; scene: null };

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if ("geometry" in child && child.geometry instanceof THREE.BufferGeometry) {
      child.geometry.dispose();
    }

    if ("material" in child) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material instanceof THREE.Material) {
          material.dispose();
        }
      });
    }
  });
}

function normalizeModel(scene: THREE.Group) {
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const normalized = new THREE.Group();

  scene.position.sub(center);
  normalized.add(scene);
  normalized.scale.setScalar(1 / maxDimension);

  return normalized;
}

function useAirplaneModel() {
  const [model, setModel] = useState<AirplaneModelState>({
    status: "loading",
    scene: null,
  });

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      MODEL_PATH,
      (gltf) => {
        if (cancelled) {
          disposeObject(gltf.scene);
          return;
        }

        setModel({ status: "ready", scene: normalizeModel(gltf.scene) });
      },
      undefined,
      () => {
        if (!cancelled) {
          setModel({ status: "error", scene: null });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (model.scene) {
        disposeObject(model.scene);
      }
    };
  }, [model.scene]);

  return model;
}


function FlyingAirplane({ progressRef }: { progressRef: { current: number } }) {
  const model = useAirplaneModel();
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
    // Pitch tracks the arc vertical velocity so nose follows actual trajectory.
    // Yaw stays near 0 (facing right); small lerp adds slight perspective shift.
    const pitchFromArc = Math.cos(progress * Math.PI) * PLANE_PITCH_AMOUNT;
    groupRef.current.rotation.set(
      pitchFromArc,
      THREE.MathUtils.lerp(0.06, -0.06, progress),
      Math.sin((progress - 0.12) * Math.PI) * PLANE_BANK_AMOUNT,
    );
  });

  if (model.status !== "ready") {
    return null;
  }

  return (
    <group ref={groupRef} scale={PLANE_SCALE}>
      <primitive object={model.scene} rotation={MODEL_ROTATION} />
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
