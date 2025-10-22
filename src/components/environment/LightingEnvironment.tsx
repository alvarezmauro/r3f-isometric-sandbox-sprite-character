import { Environment } from "@react-three/drei";

/**
 * Scene-wide lighting setup.
 *
 * React Three Fiber allows us to compose Three.js lights with JSX. This component
 * groups every light used across the sandbox so that the scene configuration is easy
 * to locate and tweak. Someone new to R3F can read it just like regular React markup.
 */
export default function LightingEnvironment() {
  return (
    <>
      {/*
       * The <Environment> component loads an HDRI preset from drei and applies it as the
       * ambient illumination as well as the background. Think of it as surrounding the
       * entire world with a glowing sphere.
       */}
      <Environment
        background
        backgroundBlurriness={0.3}
        environmentIntensity={1.5}
        preset="night"
      />

      {/*
       * Primary key light.
       * We cast shadows so the character feels grounded and use an orthographic camera
       * for the shadow map to avoid perspective distortion in the shadow edges.
       */}
      <directionalLight
        castShadow
        color={"#FFFFED"}
        intensity={1.5}
        shadow-bias={-0.0001}
        position={[10, 20, 10]}
      >
        <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
      </directionalLight>
    </>
  );
}
