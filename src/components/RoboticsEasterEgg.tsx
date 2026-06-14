"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { sounds } from "@/lib/sounds";

const MODEL_PATH = "/models/basic_robot_arm.glb";

interface LoadedModel {
  group: THREE.Group;
  animations: THREE.AnimationClip[];
}

// Module-level cache so the model is only fetched/parsed once, however many
// times the viewer is spawned and despawned.
let cachedModel: LoadedModel | null = null;
let loadPromise: Promise<LoadedModel> | null = null;

function loadModel(): Promise<LoadedModel> {
  if (cachedModel) return Promise.resolve(cachedModel);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    new GLTFLoader().load(MODEL_PATH, (gltf) => {
      const box = new THREE.Box3();
      const clip = gltf.animations[0];
      if (clip) {
        // Sample the animation on a throwaway clone to find the full reach of
        // the arm (not just its bind pose), so framing/scale below accounts
        // for the whole motion and nothing gets clipped mid-animation.
        const sampleScene = cloneSkinned(gltf.scene);
        const mixer = new THREE.AnimationMixer(sampleScene);
        mixer.clipAction(clip).play();
        const SAMPLES = 16;
        for (let i = 0; i <= SAMPLES; i++) {
          mixer.update(i === 0 ? 0 : clip.duration / SAMPLES);
          sampleScene.updateMatrixWorld(true);
          box.union(new THREE.Box3().setFromObject(sampleScene));
        }
      } else {
        box.setFromObject(gltf.scene);
      }
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const group = new THREE.Group();
      gltf.scene.position.sub(center);
      group.add(gltf.scene);
      // maxDim covers the full animated reach, so this fills the frame
      // (the camera below adds only a small margin for orbiting).
      group.scale.setScalar(2 / maxDim);
      const loaded = { group, animations: gltf.animations };
      cachedModel = loaded;
      resolve(loaded);
    }, undefined, reject);
  });
  return loadPromise;
}

if (typeof window !== "undefined") {
  loadModel();
}

function RobotArm() {
  const [model, setModel] = useState<LoadedModel | null>(() => cachedModel);
  const reducedRef = useRef(false);
  const { ref, actions, names } = useAnimations(model?.animations ?? []);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (cachedModel) return;
    let cancelled = false;
    loadModel().then((m) => { if (!cancelled) setModel(m); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (reducedRef.current) return;
    const action = names[0] ? actions[names[0]] : undefined;
    action?.reset().play();
    return () => { action?.stop(); };
  }, [actions, names]);

  if (!model) return null;
  return (
    <group ref={ref}>
      <primitive object={model.group} />
    </group>
  );
}

function RobotArmViewer() {
  return (
    <div
      aria-hidden="true"
      className="absolute z-30 -right-24 sm:right-[calc(-25vw_+_16px)] md:right-[calc(-25vw_-_16px)] lg:right-[calc(-25vw_-_64px)] top-1/2 -translate-y-1/2 w-56 h-56 sm:w-72 sm:h-72 md:w-[22rem] md:h-[22rem] lg:w-[28rem] lg:h-[28rem]"
    >
      <Canvas camera={{ position: [3.45, 2.65, 3.45], fov: 35 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} />
        <RobotArm />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

export function RoboticsWord() {
  const [spawned, setSpawned] = useState(false);

  const toggle = useCallback(() => {
    sounds.mouseClick();
    setSpawned((s) => !s);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    toggle();
  };

  return (
    <>
      <button
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-pressed={spawned}
        aria-label={spawned ? "robotics (click to hide robot arm model)" : "robotics (click to show robot arm model)"}
        className="cursor-pointer hover:text-[#4169E1] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded-sm"
      >
        robotics
      </button>

      {spawned && <RobotArmViewer />}
    </>
  );
}
