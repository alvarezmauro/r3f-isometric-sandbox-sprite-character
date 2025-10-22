import "./styles.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { Bvh } from "@react-three/drei";
import { Leva } from "leva";

import App from "./App";

/**
 * Entry point of the React application.
 *
 * React Three Fiber works by mounting a <Canvas /> component which internally creates a
 * Three.js renderer. Everything we render as children of the canvas becomes part of the
 * 3D scene graph.
 */
const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <>
    {/*
     * Leva is a handy control panel for React projects. By rendering it next to the
     * canvas we always have access to debugging toggles without writing custom UI code.
     */}
    <Leva collapsed />

    {/*
     * Canvas accepts the same camera parameters you would pass to a manual Three.js
     * perspective camera. Shadow mapping is enabled so the directional light casts
     * visible shadows on the character and the environment.
     */}
    <Canvas
      shadows
      camera={{
        fov: 65,
        near: 0.1,
        far: 1000,
        position: [5, 5, 5],
      }}
    >
      {/*
       * Uncomment the fog to give the tavern some atmospheric depth.
       * Keeping it here documents that the scene supports fog out of the box.
       */}
      {/* <fog attach="fog" args={["#333", 8, 100]} /> */}

      {/*
       * Suspense lets us wait for GLTF models to load before showing the scene. The
       * <Bvh /> wrapper from drei improves raycasting performance by using a bounding
       * volume hierarchy around the entire subtree.
       */}
      <React.Suspense fallback={null}>
        <Bvh firstHitOnly>
          <App />
        </Bvh>
      </React.Suspense>
    </Canvas>
  </>
);
