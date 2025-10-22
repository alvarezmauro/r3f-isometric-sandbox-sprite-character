import { useFrame } from "@react-three/fiber";
import type { CameraControls } from "@react-three/drei";
import type { Group } from "three";
import { MutableRefObject } from "react";

interface UseFollowCameraOptions {
  /** Additional offset applied to the target position. */
  offset?: [x: number, y: number, z: number];
  /** Allows toggling the behaviour without removing the hook. */
  enabled?: boolean;
}

type TargetResolver = () => Group | null | undefined;

/**
 * Smoothly moves {@link CameraControls} so it tracks a target Three.js group.
 *
 * The hook intentionally hides the imperative calls required to keep a third-person
 * camera glued to the player avatar. All consumer components need to provide is a ref
 * to the controls instance and a way to resolve the target group (usually provided by
 * a character controller library such as `bvhecctrl`).
 */
export function useFollowCamera(
  cameraControlsRef: MutableRefObject<CameraControls | null>,
  resolveTarget: TargetResolver,
  { offset = [0, 0.3, 0], enabled = true }: UseFollowCameraOptions = {}
) {
  useFrame(() => {
    if (!enabled) return;

    const cameraControls = cameraControlsRef.current;
    const target = resolveTarget();

    if (!cameraControls || !target) {
      return;
    }

    const [offsetX, offsetY, offsetZ] = offset;

    cameraControls.moveTo(
      target.position.x + offsetX,
      target.position.y + offsetY,
      target.position.z + offsetZ,
      true
    );
  });
}
