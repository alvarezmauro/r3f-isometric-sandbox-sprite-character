import { CameraControls, KeyboardControls, Stats } from "@react-three/drei";
import { useRef } from "react";
import BVHEcctrl, {
  StaticCollider,
  useEcctrlStore,
  type BVHEcctrlApi,
  type StoreState,
} from "bvhecctrl";
import { button, useControls } from "leva";

import LightingEnvironment from "../components/environment/LightingEnvironment";
import SpriteCharacter from "../components/character/SpriteCharacter";
import CozyTavernMap from "../components/world/CozyTavernMap";
import { CHARACTER_KEYBOARD_CONTROLS } from "../constants/keyboardControls";
import { useFollowCamera } from "../hooks/useFollowCamera";

/**
 * Main scene rendered inside the React Three Fiber canvas.
 *
 * It wires together the environment lighting, the tavern map, the sprite-based character
 * and the BVH-based character controller. Extensive inline comments describe how the
 * different libraries collaborate to create the experience.
 */
export default function IsometricSandboxScene() {
  /**
   * Access to the third-person controller API so we can read its Three.js group
   * (required to make the camera follow the player) and reset its state via Leva.
   */
  const controllerRef = useRef<BVHEcctrlApi | null>(null);

  /**
   * CameraControls come from drei and extend the default orbit controller with smoother
   * damping and imperative utilities such as `moveTo`. We store a ref for both debugging
   * and to drive the follow-camera behaviour.
   */
  const cameraControlsRef = useRef<CameraControls | null>(null);

  /**
   * `bvhecctrl` exposes the collider meshes it creates through a Zustand store. By
   * forwarding those meshes to <CameraControls /> the camera respects level geometry
   * instead of clipping through walls when the player backs up.
   */
  const colliderMeshes = useEcctrlStore(
    (state: StoreState) => state.colliderMeshesArray
  );

  /**
   * Hook up the helper that keeps the camera centred on the character. It executes on
   * every animation frame but stays tiny and declarative from the component perspective.
   */
  useFollowCamera(cameraControlsRef, () => controllerRef.current?.group ?? null);

  /**
   * Debug UI built with Leva.
   * The "Reset Player" button teleports the character back to the origin and cancels
   * its velocity which is useful while tweaking physics settings.
   */
  useControls("Character Control", {
    ResetPlayer: button(() => {
      controllerRef.current?.group?.position.set(0, 0, 0);
      controllerRef.current?.resetLinVel();
    }),
  });

  return (
    <>
      {/*
       * Small performance overlay showing FPS, draw calls and other runtime stats.
       * Helpful while optimising the scene or profiling heavier models.
       */}
      <Stats />

      {/* Scene lighting and background environment map. */}
      <LightingEnvironment />

      {/*
       * Orbit-style camera that we further control through the `useFollowCamera` hook.
       * By marking it as the default controls, any drei helper will use it automatically.
       */}
      <CameraControls
        ref={cameraControlsRef}
        colliderMeshes={colliderMeshes}
        smoothTime={0.1}
        makeDefault
        enabled={false} // disable manual orbiting
      />

      {/*
       * KeyboardControls abstracts the manual keyboard event handling we would otherwise
       * have to implement. It injects the current pressed keys into R3F events so the
       * controller can react to them.
       */}
      <KeyboardControls map={CHARACTER_KEYBOARD_CONTROLS}>
        {/*
         * `bvhecctrl` is a robust third-person controller that handles collisions against
         * complex geometry using a bounding volume hierarchy. It provides a physics-aware
         * Three.js group via `controllerRef.current?.group`.
         */}
        <BVHEcctrl
          ref={controllerRef}
          turnSpeed={1}         // radians per second
          maxWalkSpeed={5}      // units per second
          counterVelFactor={0}  // no counter velocity
          deceleration={100}     // units per second squared
        >
          <SpriteCharacter />
        </BVHEcctrl>
      </KeyboardControls>

      {/*
       * Collider used by the controller. Because the tavern GLTF already contains
       * collision-friendly meshes we can reuse them directly.
       */}
      <StaticCollider>
        <CozyTavernMap />
      </StaticCollider>
    </>
  );
}
