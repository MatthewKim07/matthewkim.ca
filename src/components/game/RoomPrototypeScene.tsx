"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useAnimations, useGLTF } from "@react-three/drei";
import { ArrowLeft } from "lucide-react";
import * as THREE from "three";

const MODEL_PATH = "/models/matthew-avatar-animated.glb";
const BED_MODEL = "/models/bed.glb";
const DESK_MODEL = "/models/desk.glb";
const ISO_DISTANCE = 9;
const CAMERA_ZOOM = 68;
const PLAYER_HEIGHT = 1.05;
const FLOOR_WIDTH = 8;
const FLOOR_DEPTH = 6;
const PLAYER_MARGIN = 0.55;
const PLAYER_RADIUS = 0.24;
const COLLISION_EPS = 0.002;
const MOVE_SPEED = 2.15;
const TURN_SMOOTHING = 10;

useGLTF.preload(MODEL_PATH);
useGLTF.preload(BED_MODEL);
useGLTF.preload(DESK_MODEL);

// Tuned so exported meshes match the 2D spawn-room footprint and wall alignment.
const BED_ROTATION_Y = Math.PI / 2;
const DESK_ROTATION_Y = 0;

type ClipMap = {
  idle: string | null;
  walk: string | null;
};

type Collider = { minX: number; maxX: number; minZ: number; maxZ: number };

function identifyClips(names: string[]): ClipMap {
  const idle = names.find((name) => /idle/i.test(name)) ?? names[0] ?? null;
  const walk =
    names.find((name) => /walk/i.test(name)) ??
    names.find((name) => /run/i.test(name)) ??
    idle;
  return { idle, walk };
}

function getIsoPosition(distance: number): [number, number, number] {
  const unit = distance / Math.sqrt(3);
  return [unit, unit, unit];
}

function layoutAvatar(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.y <= 1e-6) return;

  const scale = PLAYER_HEIGHT / size.y;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -fitted.min.y, -center.z);
  root.updateMatrixWorld(true);
}

function makeOpaque(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((material) => {
      material.transparent = false;
      material.opacity = 1;
      material.alphaTest = 0;
      material.depthWrite = true;
      material.depthTest = true;
      material.side = THREE.FrontSide;

      if (material instanceof THREE.MeshPhysicalMaterial) {
        material.transmission = 0;
        material.thickness = 0;
      }

      material.needsUpdate = true;
    });
  });
}

function layoutOnFloor(root: THREE.Object3D, footprintW: number, footprintD: number) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.x <= 1e-6 || size.z <= 1e-6) return;

  const scale = Math.min(footprintW / size.x, footprintD / size.z);
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(root);
  const center = fitted.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -fitted.min.y, -center.z);
  root.updateMatrixWorld(true);
}

function colliderFromMeshes(root: THREE.Object3D, inset = 0.01): Collider {
  const box = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    box.union(new THREE.Box3().setFromObject(obj));
  });
  return {
    minX: box.min.x + inset,
    maxX: box.max.x - inset,
    minZ: box.min.z + inset,
    maxZ: box.max.z - inset,
  };
}

function FurnitureAsset({
  modelPath,
  position,
  footprintW,
  footprintD,
  rotationY = 0,
  onCollider,
}: {
  modelPath: string;
  position: [number, number, number];
  footprintW: number;
  footprintD: number;
  rotationY?: number;
  onCollider: (box: Collider) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const mount = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    makeOpaque(model);
  }, [model]);

  useLayoutEffect(() => {
    if (!mount.current || !root.current) return;
    mount.current.scale.setScalar(1);
    mount.current.position.set(0, 0, 0);
    layoutOnFloor(mount.current, footprintW, footprintD);
    root.current.updateMatrixWorld(true);
    onCollider(colliderFromMeshes(root.current));
  }, [footprintW, footprintD, model, onCollider, position, rotationY]);

  return (
    <group ref={root} position={position} rotation={[0, rotationY, 0]}>
      <group ref={mount}>
        <primitive object={model} />
      </group>
    </group>
  );
}

function StageCamera({ targetRef }: { targetRef: React.RefObject<THREE.Group | null> }) {
  const camera = useThree((s) => s.camera);
  const lookTarget = useMemo(() => new THREE.Vector3(0, PLAYER_HEIGHT * 0.45, 0), []);
  const camOffset = useMemo(() => new THREE.Vector3(...getIsoPosition(ISO_DISTANCE)), []);
  const camPos = useMemo(() => new THREE.Vector3(...getIsoPosition(ISO_DISTANCE)), []);

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    camera.position.copy(camOffset);
    camera.zoom = CAMERA_ZOOM;
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();
  }, [camera, camOffset, lookTarget]);

  useFrame((_, delta) => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    const target = targetRef.current;
    const tx = target?.position.x ?? 0;
    const tz = target?.position.z ?? 0;
    const alpha = 1 - Math.exp(-6 * delta);
    lookTarget.x += (tx - lookTarget.x) * alpha;
    lookTarget.z += (tz - lookTarget.z) * alpha;
    camPos.x += (tx + camOffset.x - camPos.x) * alpha;
    camPos.z += (tz + camOffset.z - camPos.z) * alpha;
    camera.position.copy(camPos);
    camera.lookAt(lookTarget);
  });

  return null;
}

function RoomPrototypeAvatar({
  furnitureColliders,
}: {
  furnitureColliders: React.RefObject<Collider[]>;
}) {
  const root = useRef<THREE.Group>(null);
  const mover = useRef<THREE.Group>(null);
  const input = useRef({ up: false, down: false, left: false, right: false });
  const [clips, setClips] = useState<ClipMap>({ idle: null, walk: null });
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);

  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names } = useAnimations(animations, scene);
  const currentClip = useRef<string | null>(null);
  const moveVec = useMemo(() => new THREE.Vector2(), []);

  useLayoutEffect(() => {
    if (!root.current) return;
    layoutAvatar(root.current);
    makeOpaque(scene);
  }, [scene]);

  useEffect(() => {
    if (!names.length) return;
    const found = identifyClips(names);
    setClips(found);
    console.log("[matthew.exe room-proto] clips:", names);
    console.log("[matthew.exe room-proto] idle:", found.idle, "walk:", found.walk);
  }, [names]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") input.current.up = true;
      if (key === "s" || key === "arrowdown") input.current.down = true;
      if (key === "a" || key === "arrowleft") input.current.left = true;
      if (key === "d" || key === "arrowright") input.current.right = true;
    };
    const onUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") input.current.up = false;
      if (key === "s" || key === "arrowdown") input.current.down = false;
      if (key === "a" || key === "arrowleft") input.current.left = false;
      if (key === "d" || key === "arrowright") input.current.right = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    const next = moving ? clips.walk : clips.idle;
    if (!next || currentClip.current === next || !actions[next]) return;
    const nextAction = actions[next];
    const prev = currentClip.current ? actions[currentClip.current] : null;
    if (prev && prev !== nextAction) {
      nextAction?.reset().crossFadeFrom(prev, 0.2, true).play();
      prev.fadeOut(0.2);
    } else {
      nextAction?.reset().fadeIn(0.2).play();
    }
    currentClip.current = next;
  }, [actions, clips, moving]);

  useFrame((_, delta) => {
    const actor = mover.current;
    if (!actor) return;

    // Map inputs in screen-space cardinal directions so WASD matches what you see:
    // W = straight up, A = straight left, S = straight down, D = straight right.
    const horizontal = (input.current.right ? 1 : 0) - (input.current.left ? 1 : 0);
    const vertical = (input.current.up ? 1 : 0) - (input.current.down ? 1 : 0);
    const worldX = horizontal - vertical;
    const worldZ = -(horizontal + vertical);
    moveVec.set(worldX, worldZ);
    const hasMove = moveVec.lengthSq() > 0;

    if (hasMove !== movingRef.current) {
      movingRef.current = hasMove;
      setMoving(hasMove);
    }
    if (!hasMove) return;

    moveVec.normalize();
    const stepX = moveVec.x * MOVE_SPEED * delta;
    const stepZ = moveVec.y * MOVE_SPEED * delta;
    const pos = { x: actor.position.x, z: actor.position.z };

    moveCircleWithCollision(pos, PLAYER_RADIUS, furnitureColliders.current, stepX, stepZ);

    const halfW = FLOOR_WIDTH * 0.5 - PLAYER_MARGIN;
    const halfD = FLOOR_DEPTH * 0.5 - PLAYER_MARGIN;
    pos.x = THREE.MathUtils.clamp(pos.x, -halfW, halfW);
    pos.z = THREE.MathUtils.clamp(pos.z, -halfD, halfD);

    actor.position.x = pos.x;
    actor.position.z = pos.z;

    const targetRot = Math.atan2(moveVec.x, moveVec.y);
    const turnAlpha = 1 - Math.exp(-TURN_SMOOTHING * delta);
    const shortestDelta =
      THREE.MathUtils.euclideanModulo(targetRot - actor.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    actor.rotation.y += shortestDelta * turnAlpha;
  });

  return (
    <>
      <StageCamera targetRef={mover} />
      <group ref={mover} position={[0, 0, 0]}>
        <group ref={root}>
          <primitive object={scene} />
        </group>
      </group>
    </>
  );
}

function roomPoint(px: number, py: number): [number, number] {
  const x = (px / 256) * FLOOR_WIDTH - FLOOR_WIDTH / 2;
  const z = (py / 192) * FLOOR_DEPTH - FLOOR_DEPTH / 2;
  return [x, z];
}

function roomRect(cx: number, cy: number, w: number, h: number) {
  const [x, z] = roomPoint(cx + w / 2, cy + h / 2);
  const rw = (w / 256) * FLOOR_WIDTH;
  const rd = (h / 192) * FLOOR_DEPTH;
  return { x, z, w: rw, d: rd };
}

function circleIntersectsAABB(px: number, pz: number, radius: number, box: Collider) {
  const closestX = THREE.MathUtils.clamp(px, box.minX, box.maxX);
  const closestZ = THREE.MathUtils.clamp(pz, box.minZ, box.maxZ);
  const dx = px - closestX;
  const dz = pz - closestZ;
  const r = Math.max(radius - COLLISION_EPS, 0);
  return dx * dx + dz * dz < r * r;
}

function circleIntersectsAny(px: number, pz: number, radius: number, colliders: Collider[]) {
  for (const box of colliders) {
    if (circleIntersectsAABB(px, pz, radius, box)) return true;
  }
  return false;
}

function depenetrateCircle(
  pos: { x: number; z: number },
  radius: number,
  colliders: Collider[],
) {
  const r = Math.max(radius - COLLISION_EPS, 0);
  for (let pass = 0; pass < 4; pass++) {
    let fixed = false;
    for (const box of colliders) {
      const closestX = THREE.MathUtils.clamp(pos.x, box.minX, box.maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, box.minZ, box.maxZ);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq >= r * r) continue;
      fixed = true;
      if (distSq < 1e-10) {
        const penXLeft = pos.x - box.minX;
        const penXRight = box.maxX - pos.x;
        const penZNear = pos.z - box.minZ;
        const penZFar = box.maxZ - pos.z;
        const minPen = Math.min(penXLeft, penXRight, penZNear, penZFar);
        if (minPen === penXLeft) pos.x = box.minX - radius;
        else if (minPen === penXRight) pos.x = box.maxX + radius;
        else if (minPen === penZNear) pos.z = box.minZ - radius;
        else pos.z = box.maxZ + radius;
      } else {
        const dist = Math.sqrt(distSq);
        const push = (r - dist) / dist;
        pos.x += dx * push;
        pos.z += dz * push;
      }
    }
    if (!fixed) break;
  }
}

function resolveCircleAxis(
  pos: { x: number; z: number },
  radius: number,
  colliders: Collider[],
  axis: "x" | "z",
  delta: number,
) {
  if (delta === 0) return;
  if (axis === "x") pos.x += delta;
  else pos.z += delta;

  for (let pass = 0; pass < 4; pass++) {
    let hit = false;
    if (axis === "x") {
      if (delta > 0) {
        let limit = pos.x;
        for (const box of colliders) {
          if (!circleIntersectsAABB(pos.x, pos.z, radius, box)) continue;
          hit = true;
          limit = Math.min(limit, box.minX - radius);
        }
        if (hit) pos.x = limit;
      } else if (delta < 0) {
        let limit = pos.x;
        for (const box of colliders) {
          if (!circleIntersectsAABB(pos.x, pos.z, radius, box)) continue;
          hit = true;
          limit = Math.max(limit, box.maxX + radius);
        }
        if (hit) pos.x = limit;
      }
    } else if (delta > 0) {
      let limit = pos.z;
      for (const box of colliders) {
        if (!circleIntersectsAABB(pos.x, pos.z, radius, box)) continue;
        hit = true;
        limit = Math.min(limit, box.minZ - radius);
      }
      if (hit) pos.z = limit;
    } else if (delta < 0) {
      let limit = pos.z;
      for (const box of colliders) {
        if (!circleIntersectsAABB(pos.x, pos.z, radius, box)) continue;
        hit = true;
        limit = Math.max(limit, box.maxZ + radius);
      }
      if (hit) pos.z = limit;
    }
    if (!hit) break;
  }
}

function moveCircleWithCollision(
  pos: { x: number; z: number },
  radius: number,
  colliders: Collider[],
  dx: number,
  dz: number,
) {
  if (dx === 0 && dz === 0) return;

  depenetrateCircle(pos, radius, colliders);

  const startX = pos.x;
  const startZ = pos.z;

  const trySlide = (sx: number, sz: number, ax: number, az: number) => {
    const next = { x: sx, z: sz };
    if (ax !== 0) resolveCircleAxis(next, radius, colliders, "x", ax);
    if (az !== 0) resolveCircleAxis(next, radius, colliders, "z", az);
    return circleIntersectsAny(next.x, next.z, radius, colliders) ? null : next;
  };

  const full = trySlide(startX, startZ, dx, dz);
  if (full) {
    pos.x = full.x;
    pos.z = full.z;
    return;
  }

  const xOnly = dx !== 0 ? trySlide(startX, startZ, dx, 0) : null;
  const zOnly = dz !== 0 ? trySlide(startX, startZ, 0, dz) : null;

  if (xOnly && zOnly) {
    const combined = { x: xOnly.x, z: zOnly.z };
    if (!circleIntersectsAny(combined.x, combined.z, radius, colliders)) {
      pos.x = combined.x;
      pos.z = combined.z;
      return;
    }
  }

  if (xOnly) {
    pos.x = xOnly.x;
    pos.z = startZ;
    return;
  }

  if (zOnly) {
    pos.x = startX;
    pos.z = zOnly.z;
    return;
  }

  pos.x = startX;
  pos.z = startZ;
}

/** Cozy DS-era palette for placeholder props. */
const C = {
  wall: "#3a4250",
  wallTrim: "#2f3642",
  floor: "#262c35",
  rug: "#5c4a42",
  rugAccent: "#7a6358",
  shelf: "#4f4238",
  bookA: "#c47b5a",
  bookB: "#5a8f7b",
  bookC: "#8b7355",
  door: "#5a4f45",
  doorPanel: "#7a6b5c",
  knob: "#d4a84b",
} as const;

function Block({
  args,
  position = [0, 0, 0],
  color,
  castShadow = true,
  receiveShadow = true,
}: {
  args: [number, number, number];
  position?: [number, number, number];
  color: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.88} metalness={0.02} />
    </mesh>
  );
}

function PlaceholderProps({
  onBedCollider,
  onDeskCollider,
}: {
  onBedCollider: (box: Collider) => void;
  onDeskCollider: (box: Collider) => void;
}) {
  const bed = roomRect(20, 22, 52, 44);
  const desk = roomRect(166, 22, 62, 24);
  const shelf = roomRect(18, 120, 16, 42);
  const door = roomRect(110, 178, 36, 14);
  const rug = roomRect(88, 78, 80, 62);

  return (
    <group>
      {/* Rug — flat on floor, center of room */}
      <mesh position={[rug.x, 0.008, rug.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[rug.w * 0.92, rug.d * 0.9]} />
        <meshStandardMaterial color={C.rug} roughness={0.98} metalness={0} />
      </mesh>
      <mesh position={[rug.x, 0.009, rug.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[rug.w * 0.35, rug.d * 0.28]} />
        <meshStandardMaterial color={C.rugAccent} roughness={0.98} metalness={0} />
      </mesh>

      <FurnitureAsset
        modelPath={BED_MODEL}
        position={[bed.x, 0, bed.z]}
        footprintW={bed.w}
        footprintD={bed.d}
        rotationY={BED_ROTATION_Y}
        onCollider={onBedCollider}
      />

      <FurnitureAsset
        modelPath={DESK_MODEL}
        position={[desk.x, 0, desk.z]}
        footprintW={desk.w}
        footprintD={desk.d}
        rotationY={DESK_ROTATION_Y}
        onCollider={onDeskCollider}
      />

      {/* Bookshelf — left wall */}
      <group position={[shelf.x, 0, shelf.z]}>
        <Block
          args={[shelf.w, (42 / 192) * FLOOR_DEPTH * 1.05, 0.14]}
          position={[0, ((42 / 192) * FLOOR_DEPTH * 1.05) / 2, 0]}
          color={C.shelf}
        />
        {[0.25, 0.5, 0.72].map((t) => (
          <Block
            key={t}
            args={[shelf.w * 0.85, 0.04, 0.1]}
            position={[0, (42 / 192) * FLOOR_DEPTH * 1.05 * t, 0.04]}
            color={C.shelf}
            castShadow={false}
          />
        ))}
        <Block args={[0.06, 0.12, 0.08]} position={[0, (42 / 192) * FLOOR_DEPTH * 0.35, 0.1]} color={C.bookA} />
        <Block args={[0.05, 0.1, 0.07]} position={[0.04, (42 / 192) * FLOOR_DEPTH * 0.55, 0.1]} color={C.bookB} />
        <Block args={[0.05, 0.11, 0.07]} position={[-0.03, (42 / 192) * FLOOR_DEPTH * 0.78, 0.1]} color={C.bookC} />
      </group>

      {/* Door — bottom wall */}
      <group position={[door.x, 0, door.z]}>
        <Block args={[door.w + 0.2, 0.95, 0.12]} position={[0, 0.48, 0]} color={C.door} />
        <Block args={[door.w * 0.75, 0.82, 0.06]} position={[0.08, 0.45, 0.04]} color={C.doorPanel} />
        <Block args={[0.06, 0.06, 0.06]} position={[-door.w * 0.28, 0.45, 0.08]} color={C.knob} />
      </group>
    </group>
  );
}

function RoomGeometry({
  onBedCollider,
  onDeskCollider,
}: {
  onBedCollider: (box: Collider) => void;
  onDeskCollider: (box: Collider) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 7, 5]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 4, -1]} intensity={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_WIDTH, FLOOR_DEPTH]} />
        <meshStandardMaterial color={C.floor} roughness={0.95} metalness={0.03} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0.55, -FLOOR_DEPTH / 2]} receiveShadow castShadow>
        <boxGeometry args={[FLOOR_WIDTH, 1.1, 0.14]} />
        <meshStandardMaterial color={C.wall} roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-FLOOR_WIDTH / 2, 0.55, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.14, 1.1, FLOOR_DEPTH]} />
        <meshStandardMaterial color={C.wallTrim} roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Right wall (low segment) */}
      <mesh position={[FLOOR_WIDTH / 2, 0.55, 0.4]} receiveShadow castShadow>
        <boxGeometry args={[0.14, 1.1, FLOOR_DEPTH * 0.65]} />
        <meshStandardMaterial color={C.wall} roughness={0.9} metalness={0.02} />
      </mesh>

      <PlaceholderProps onBedCollider={onBedCollider} onDeskCollider={onDeskCollider} />

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.42}
        scale={Math.max(FLOOR_WIDTH, FLOOR_DEPTH)}
        blur={2.8}
        far={3.4}
        resolution={512}
        color="#000000"
      />
    </>
  );
}

function RoomPrototypeWorld() {
  const furnitureColliders = useRef<Collider[]>([]);
  const onBedCollider = useCallback((box: Collider) => {
    furnitureColliders.current[0] = box;
  }, []);
  const onDeskCollider = useCallback((box: Collider) => {
    furnitureColliders.current[1] = box;
  }, []);

  return (
    <>
      <RoomGeometry onBedCollider={onBedCollider} onDeskCollider={onDeskCollider} />
      <RoomPrototypeAvatar furnitureColliders={furnitureColliders} />
    </>
  );
}

export function RoomPrototypeScene({ onMenu }: { onMenu: () => void }) {
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
    <div className="absolute inset-0 bg-[#0b0d12]">
      <Canvas
        shadows
        dpr={[1, 2]}
        orthographic
        gl={{ antialias: true, alpha: false }}
        camera={{
          position: getIsoPosition(ISO_DISTANCE),
          zoom: CAMERA_ZOOM,
          near: 0.1,
          far: 100,
        }}
        className="h-full w-full"
      >
        <color attach="background" args={["#0b0d12"]} />
        <RoomPrototypeWorld />
      </Canvas>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-3"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <button
          type="button"
          onClick={onMenu}
          className="pointer-events-auto inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-[#FED34C] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          menu
        </button>

        <div className="rounded-md border border-[#FED34C]/30 bg-black/50 px-3 py-2 text-right backdrop-blur-sm">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#FED34C]">
            dev · 3d room prototype
          </p>
          <p className="mt-1 text-[0.7rem] text-white/55">move: wasd / arrows · esc: menu</p>
        </div>
      </div>
    </div>
  );
}
