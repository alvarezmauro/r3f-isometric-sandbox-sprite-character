/**
 * Cozy Tavern - First Floor 2 by Nick Slough [CC-BY] via Poly Pizza
 */

import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { Mesh } from "three";

/**
 * Loads and renders the tavern map that the character explores.
 */
export default function CozyTavernMap() {
  const map = useGLTF("./Cozy Tavern - First Floor 2.glb");

  useEffect(() => {
    map.scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [map]);

  // rotate the map 45 degrees to match isometric view
  // return <primitive object={map.scene} scale={1.5}/>;
  return <primitive object={map.scene} scale={1.5} position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]} />;
}

useGLTF.preload("./Cozy Tavern - First Floor 2.glb");
