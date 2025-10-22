import IsometricSandboxScene from "./scenes/IsometricSandboxScene";

/**
 * Thin wrapper that keeps the React component tree expressive.
 *
 * The heavy lifting happens inside {@link IsometricSandboxScene} which is rendered by
 * the React Three Fiber <Canvas /> declared in {@link src/index.tsx}.
 */
export default function App() {
  return <IsometricSandboxScene />;
}
