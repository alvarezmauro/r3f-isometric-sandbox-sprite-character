import type { KeyboardControlsEntry } from "@react-three/drei";

/**
 * Keyboard mappings used by the {@link KeyboardControls} component.
 *
 * They match the default setup from typical third-person games and are grouped in
 * a dedicated module so the README can reference them and players can tweak them easily.
 */
export const CHARACTER_KEYBOARD_CONTROLS: KeyboardControlsEntry<string>[] = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
  { name: "rightward", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "run", keys: ["Shift"] },
];
