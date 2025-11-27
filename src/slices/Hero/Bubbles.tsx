"use client";

import React, { useRef } from "react";
import { Cloud } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CigaretteSmoke: React.FC = () => {
  const cloudRef = useRef<THREE.Group>(null);

  // Animate the cloud rising
  useFrame((state, delta) => {
    if (cloudRef.current) {
      cloudRef.current.position.y += delta * 0.1; // Slow upward movement

      // Reset position when cloud gets too high
      if (cloudRef.current.position.y > 5) {
        cloudRef.current.position.y = -2;
      }
    }
  });

  return (
    <group position={[0, -2, 0]}>
      <Cloud
        ref={cloudRef}
        opacity={0.2}
        speed={0.5} // Slower speed for more smoke-like behavior
        segments={11} // More segments for smoother look
        fade={1} // Longer fade for wispy effect
        color="#cbd5e1"
      />
    </group>
  );
};

export default CigaretteSmoke;