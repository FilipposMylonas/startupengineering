"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

const basePath = process.env.NODE_ENV === 'production' ? '/startupengineering' : '';

useGLTF.preload(`${basePath}/Ashtray.gltf`);

const flavorTextures = {
  lemonLime: `${basePath}/labels/Ashtray_Texture.png`,
  grape: `${basePath}/labels/Ashtray_Texture.png`,
  blackCherry: `${basePath}/labels/Ashtray_Texture.png`,
  strawberryLemonade: `${basePath}/labels/Ashtray_Texture.png`,
  watermelon: `${basePath}/labels/Ashtray_Texture.png`,
};

export type SodaCanProps = {
  flavor?: keyof typeof flavorTextures;
  scale?: number;
};

export function Ashtray({
                          flavor = "blackCherry",
                          scale = 1,
                          ...props
                        }: SodaCanProps) {
  const { nodes, materials } = useGLTF(`${basePath}/Ashtray.gltf`);
  const labels = useTexture(flavorTextures);

  // Fix texture flipping
  Object.values(labels).forEach((texture) => (texture.flipY = false));

  // Ensure the correct label texture is applied
  const label = labels[flavor];

  return (
    <group {...props} dispose={null} scale={scale} rotation={[0, -Math.PI, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.Circle_007 as THREE.Mesh).geometry}
        material={new THREE.MeshStandardMaterial({
          map: label, // Apply label texture
          roughness: 0.7,
          metalness: 0.7,
          color: "#ffffff", // Base color to allow texture visibility
          emissive: new THREE.Color(0, 1, 0.007891120013859713),
          emissiveIntensity: 0,
        })}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.Circle_007_1 as THREE.Mesh).geometry}
        material={new THREE.MeshStandardMaterial({
          roughness: 1,
          metalness: 0,
          color: "#000000",
          emissive: new THREE.Color(0.204, 1, 0),
          emissiveIntensity: 4.6,
        })}
      />
    </group>
  );
}
