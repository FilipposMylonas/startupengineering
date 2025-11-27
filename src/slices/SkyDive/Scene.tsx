"use client";

import { Environment, Cloud, Clouds, Text } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useFrame } from "@react-three/fiber";

import FloatingGrip from "@/components/FloatingGrip";
import FloatingThrottle from "@/components/FloatingThrottle";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type FlavorType = {
  label: string;
  hex: string;
};

type SceneProps = {
  sentence: string;
  flavor: FlavorType;
  isDesktop?: boolean;
};

export default function Scene({ sentence, flavor, isDesktop = true }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const gripOrbitRef = useRef<THREE.Group>(null);
  const throttleOrbitRef = useRef<THREE.Group>(null);
  const cloud1Ref = useRef<THREE.Group>(null);
  const cloud2Ref = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const wordsRef = useRef<THREE.Group>(null);

  // Planetary orbit animation - continuous rotation like planets
  useFrame((state) => {
    if (!gripOrbitRef.current || !throttleOrbitRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const orbitRadius = 0.7;
    const orbitSpeed = 0.5;
    
    // Grip orbits in one direction
    gripOrbitRef.current.position.x = Math.cos(time * orbitSpeed) * orbitRadius;
    gripOrbitRef.current.position.z = Math.sin(time * orbitSpeed) * orbitRadius * 0.5;
    gripOrbitRef.current.position.y = Math.sin(time * orbitSpeed * 2) * 0.1;
    gripOrbitRef.current.rotation.y = time * 0.6;
    
    // Throttle orbits opposite direction (180 degrees offset)
    throttleOrbitRef.current.position.x = Math.cos(time * orbitSpeed + Math.PI) * orbitRadius;
    throttleOrbitRef.current.position.z = Math.sin(time * orbitSpeed + Math.PI) * orbitRadius * 0.5;
    throttleOrbitRef.current.position.y = Math.sin(time * orbitSpeed * 2 + Math.PI) * 0.1;
    throttleOrbitRef.current.rotation.y = -time * 0.6;
    
    // Whole orbit group tilts slightly for depth
    if (orbitRef.current) {
      orbitRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
      orbitRef.current.rotation.z = Math.cos(time * 0.25) * 0.05;
    }
  });

  useGSAP(() => {
    if (!cloudsRef.current || !orbitRef.current || !wordsRef.current || !cloud1Ref.current || !cloud2Ref.current) return;

    // Initial positions - DRAMATIC start from above (falling from sky)
    gsap.set(cloudsRef.current.position, { z: 12 });
    gsap.set(orbitRef.current.position, { x: 0, y: 6, z: -3 });
    gsap.set(orbitRef.current.rotation, { x: 0.4 });
    gsap.set(orbitRef.current.scale, { x: 0.4, y: 0.4, z: 0.4 });

    // Set initial word positions - above (keep text animation unchanged)
    const words = wordsRef.current.children;
    words.forEach((word, index) => {
      gsap.set(word.position, {
        x: 0,
        y: 7,
        z: 2,
        opacity: 0
      });
    });

    // Cloud movement - vertical movement
    const DISTANCE = 15;
    const DURATION = 6;

    gsap.set([cloud1Ref.current.position, cloud2Ref.current.position], {
      x: 0,
      y: DISTANCE,
      z: 0
    });

    gsap.to(cloud1Ref.current.position, {
      y: -DISTANCE,
      ease: "none",
      repeat: -1,
      duration: DURATION,
    });

    gsap.to(cloud2Ref.current.position, {
      y: -DISTANCE,
      ease: "none",
      repeat: -1,
      delay: DURATION / 2,
      duration: DURATION,
    });

    // Scroll animation
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".skydive",
        pin: true,
        start: "top top",
        end: isDesktop ? "+=2000" : "+=1500",
        scrub: 1.5,
      },
    });

    scrollTl
      .to("body", {
        backgroundColor: "#0f172a",
        overwrite: "auto",
        duration: 0.1,
      })
      // Clouds rush in
      .to(cloudsRef.current.position, { z: 0, duration: 0.3 }, 0)
      
      // Products FALL dramatically into view
      .to(orbitRef.current.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.4,
        ease: "power3.out",
      }, 0.05)
      .to(orbitRef.current.rotation, {
        x: 0,
        duration: 0.4,
        ease: "power2.out",
      }, 0.05)
      .to(orbitRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.4)",
      }, 0.05);

    // Animate each word sequentially (text animation unchanged)
    words.forEach((word, index) => {
      scrollTl
        .to(word.position, {
          x: 0,
          y: 0,
          z: -1,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        })
        .to(word.position, {
          x: 0,
          y: -7,
          z: -7,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        }, "+=0.3");
    });

    // Final exit - products dive down
    scrollTl
      .to(orbitRef.current.position, {
        x: 0,
        y: -5,
        z: 2,
        duration: 0.5,
        ease: "power2.in",
      })
      .to(orbitRef.current.rotation, {
        x: -0.5,
        duration: 0.5,
        ease: "power2.in",
      }, "<")
      .to(orbitRef.current.scale, {
        x: 0.6,
        y: 0.6,
        z: 0.6,
        duration: 0.5,
      }, "<")
      .to(cloudsRef.current.position, { z: 7, duration: 0.5 }, "<");
  });

  return (
    <group ref={groupRef}>
      {/* Orbiting Grip and Throttle */}
      <group ref={orbitRef}>
        {/* Grip - orbits around */}
        <group ref={gripOrbitRef}>
          <FloatingGrip
            rotationIntensity={0}
            floatIntensity={0.3}
            floatSpeed={2}
          >
            <pointLight intensity={10} color="#38bdf8" decay={0.7} />
          </FloatingGrip>
        </group>

        {/* Throttle - orbits opposite */}
        <group ref={throttleOrbitRef}>
          <FloatingThrottle
            rotationIntensity={0}
            floatIntensity={0.3}
            floatSpeed={2}
          >
            <pointLight intensity={10} color="#f97316" decay={0.7} />
          </FloatingThrottle>
        </group>
      </group>

      {/* Clouds */}
      <Clouds ref={cloudsRef}>
        <Cloud ref={cloud1Ref} bounds={[10, 10, 2]} color="#EEEEEE" />
        <Cloud ref={cloud2Ref} bounds={[10, 10, 2]} color="#EEEEEE" />
      </Clouds>

      {/* Text */}
      <group ref={wordsRef}>
        <ThreeText sentence={sentence} color="#f8fafc" isDesktop={isDesktop} />
      </group>

      {/* Lights */}
      <ambientLight intensity={0.5} color="#cbd5e1" />
      <Environment files="/hdr/lobby.hdr" environmentIntensity={0.6} />
    </group>
  );
}

function ThreeText({
                     sentence,
                     color = "white",
                     isDesktop = true,
                   }: {
  sentence: string;
  color?: string;
  isDesktop?: boolean;
}) {
  const words = sentence.toUpperCase().split(" ");
  const material = new THREE.MeshLambertMaterial();
  const scale = isDesktop ? 1 : 0.5;
  const wordSpacing = isDesktop ? 2 : 1.5;

  return words.map((word: string, wordIndex: number) => (
    <Text
      key={`${wordIndex}-${word}`}
      position={[0, -wordIndex * wordSpacing, 0]}
      scale={scale}
      color={color}
      material={material}
      font="/fonts/Alpino-Variable.woff"
      fontWeight={900}
      anchorX="center"
      anchorY="middle"
      characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!,.?'"
    >
      {word}
    </Text>
  ));
}
