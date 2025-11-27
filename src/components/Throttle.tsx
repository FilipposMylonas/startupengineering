"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

const basePath = process.env.NODE_ENV === 'production' ? '/startupengineering' : '';

useGLTF.preload(`${basePath}/Throddle.gltf`);

export function Throttle(props: any) {
  const { scene } = useGLTF(`${basePath}/Throddle.gltf`);
  
  // Clone the scene to ensure each instance is unique
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Scale and position adjustments for the throttle model
  return <primitive object={clonedScene} {...props} scale={0.03} position={[0, -0.3, 0]} />;
}

