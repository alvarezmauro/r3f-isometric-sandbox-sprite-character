import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import {
  DoubleSide,
  Mesh,
  NearestFilter,
  RepeatWrapping,
  Vector3,
} from "three";

import {
  characterStatus,
  useAnimationStore,
  type CharacterAnimationStatus,
} from "bvhecctrl";

type FacingDirection = "south" | "west" | "east" | "north";

type AnimationConfig = {
  frameCount: number;
  speedFps: number;
};

const SPRITE_COLUMNS = 8;
const SPRITE_ROWS = 4;
const DIRECTION_ROW: Record<FacingDirection, number> = {
  south: 0,
  west: 1,
  east: 2,
  north: 3,
};

const ANIMATION_CONFIG: Record<CharacterAnimationStatus, AnimationConfig> = {
  IDLE: { frameCount: 4, speedFps: 2 },
  WALK: { frameCount: 8, speedFps: 8 },
  RUN: { frameCount: 8, speedFps: 12 },
  JUMP_START: { frameCount: 1, speedFps: 1 },
  JUMP_IDLE: { frameCount: 2, speedFps: 3 },
  JUMP_FALL: { frameCount: 2, speedFps: 3 },
  JUMP_LAND: { frameCount: 2, speedFps: 6 },
};

const WORLD_FORWARD = new Vector3(0, 0, 1);
const WORLD_RIGHT = new Vector3(1, 0, 0);

const zeroVector = new Vector3();

function resolveFacingDirection(movingDir: Vector3): FacingDirection {
  if (movingDir.lengthSq() < 1e-6) {
    return "south";
  }

  const projectionForward = movingDir.dot(WORLD_FORWARD);
  const projectionRight = movingDir.dot(WORLD_RIGHT);

  if (Math.abs(projectionRight) > Math.abs(projectionForward)) {
    return projectionRight > 0 ? "east" : "west";
  }

  return projectionForward > 0 ? "south" : "north";
}

export default function SpriteCharacter() {
  const meshRef = useRef<Mesh>(null);
  const { camera } = useThree();

  const texture = useTexture("./octopath-traveler-alaic.png");

  useMemo(() => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.repeat.set(1 / SPRITE_COLUMNS, 1 / SPRITE_ROWS);
    texture.flipY = false;
    texture.needsUpdate = true;
  }, [texture]);

  const animationStatus = useAnimationStore((state) => state.animationStatus);

  const directionRef = useRef<FacingDirection>("south");
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const previousStatusRef = useRef<CharacterAnimationStatus>(animationStatus);

  useFrame((_, delta) => {
    if (previousStatusRef.current !== animationStatus) {
      previousStatusRef.current = animationStatus;
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }

    const target = characterStatus.movingDir.lengthSq() > 1e-6
      ? characterStatus.movingDir
      : characterStatus.inputDir;

    if (target.lengthSq() > 1e-6) {
      directionRef.current = resolveFacingDirection(target);
    }

    const { frameCount, speedFps } = ANIMATION_CONFIG[animationStatus];

    if (frameCount <= 1 || speedFps <= 0) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    } else {
      elapsedRef.current += delta;
      const frameDuration = 1 / speedFps;
      while (elapsedRef.current >= frameDuration) {
        elapsedRef.current -= frameDuration;
        frameIndexRef.current = (frameIndexRef.current + 1) % frameCount;
      }
    }

    const rowIndex = DIRECTION_ROW[directionRef.current];
    const columnIndex = frameIndexRef.current % SPRITE_COLUMNS;

    texture.offset.set(
      columnIndex / SPRITE_COLUMNS,
      1 - (rowIndex + 1) / SPRITE_ROWS
    );

    if (meshRef.current) {
      const position = meshRef.current.getWorldPosition(zeroVector);
      meshRef.current.lookAt(camera.position.x, position.y, camera.position.z);
    }
  });

  return (
    <group position={[0, -0.55, 0]}>
      <mesh ref={meshRef} scale={[0.9, 1.2, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.2}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
