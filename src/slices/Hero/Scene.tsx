"use client";

import { useRef } from "react";
import { Environment } from "@react-three/drei";
import { Group } from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import FloatingGrip from "@/components/FloatingGrip";
import FloatingThrottle from "@/components/FloatingThrottle";
import { useStore } from "@/hooks/useStore";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {};

export default function Scene({}: Props) {
  const isReady = useStore((state) => state.isReady);

  const gripRef = useRef<Group>(null);
  const throttleRef = useRef<Group>(null);

  const gripGroupRef = useRef<Group>(null);
  const throttleGroupRef = useRef<Group>(null);

  const groupRef = useRef<Group>(null);

  const FLOAT_SPEED = 1.5;

  useGSAP(() => {
    if (
      !gripRef.current ||
      !throttleRef.current ||
      !gripGroupRef.current ||
      !throttleGroupRef.current ||
      !groupRef.current
    )
      return;

    isReady();

    // Set starting positions - Grip on left, Throttle on right
    gsap.set(gripRef.current.position, { x: -1.5 });
    gsap.set(gripRef.current.rotation, { z: -0.5 });

    gsap.set(throttleRef.current.position, { x: 1.5 });
    gsap.set(throttleRef.current.rotation, { z: 0.5 });

    const introTl = gsap.timeline({
      defaults: {
        duration: 3,
        ease: "back.out(1.4)",
      },
    });

    if (window.scrollY < 20) {
      introTl
        .from(gripGroupRef.current.position, { y: -5, x: 1 }, 0)
        .from(gripGroupRef.current.rotation, { z: 3 }, 0)
        .from(throttleGroupRef.current.position, { y: 5, x: 1 }, 0)
        .from(throttleGroupRef.current.rotation, { z: 3 }, 0);
    }

    const scrollTl = gsap.timeline({
      defaults: {
        duration: 2,
      },
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
    });

    scrollTl
      // Rotate the whole group
      .to(groupRef.current.rotation, { y: Math.PI * 2 })

      // Grip - move to center-left
      .to(gripRef.current.position, { x: -0.5, y: -0.3, z: -1 }, 0)
      .to(gripRef.current.rotation, { z: 0.2 }, 0)

      // Throttle - move to center-right
      .to(throttleRef.current.position, { x: 0.5, y: -0.3, z: -1 }, 0)
      .to(throttleRef.current.rotation, { z: -0.2 }, 0)

      .to(
        groupRef.current.position,
        { x: 1, duration: 3, ease: "sine.inOut" },
        1.3,
      );
  });

  return (
    <group ref={groupRef}>
      {/* Grip on the left */}
      <group ref={gripGroupRef}>
        <FloatingGrip
          ref={gripRef}
          floatSpeed={FLOAT_SPEED}
        />
      </group>

      {/* Throttle on the right */}
      <group ref={throttleGroupRef}>
        <FloatingThrottle
          ref={throttleRef}
          floatSpeed={FLOAT_SPEED}
        />
      </group>

      <Environment files="/hdr/lobby.hdr" environmentIntensity={0.6} />
    </group>
  );
}
