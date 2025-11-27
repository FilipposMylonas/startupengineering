"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

useGLTF.preload("/scene.gltf");

export function FlightController(props: any) {
  const { scene } = useGLTF("/scene.gltf");
  
  // Clone the scene to ensure each instance is unique
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Scale correction: The model seems to be scaled x100 internally, so we scale down.
  // Vertices are ~0.5, Node scales by 100 -> size 50. We want size ~1-2.
  // 0.03 * 0.75 = 0.0225 (25% smaller)
  // Lowering the model by -0.5 on Y axis to center it better
  return <primitive object={clonedScene} {...props} scale={0.0225} position={[0, -0.5, 0]} />;
}

