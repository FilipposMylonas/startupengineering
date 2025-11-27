"use client";

import { Environment } from "@react-three/drei";
import { useRef } from "react";
import { Group } from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import FloatingThrottle from "@/components/FloatingThrottle";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const basePath = process.env.NODE_ENV === 'production' ? '/startupengineering' : '';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {};

// Feature zoom configurations - each section zooms into a different part
// Using moderate x positions to keep object visible while zooming into features
const FEATURE_VIEWS = [
  {
    // Section 0: "Silky Smooth" - Show the smooth rail/slider area, positioned right
    position: { x: 0.8, y: 0, z: 0 },
    rotation: { x: 0, y: -0.3, z: 0 },
    scale: 1,
  },
  {
    // Section 1: "Fix It, Don't Trash It" - Zoom into modular components, positioned left
    // Moderate left position with zoom to show detail
    position: { x: -0.6, y: 0.15, z: 0.8 },
    rotation: { x: 0.12, y: 0.6, z: 0.03 },
    scale: 1.5,
  },
  {
    // Section 2: "Same Quality, Less Pain" - Full product showcase, centered-right
    position: { x: 0.5, y: -0.05, z: 0.5 },
    rotation: { x: -0.08, y: -0.5, z: -0.03 },
    scale: 1.3,
  },
];

// Mobile-optimized views (centered, different scales)
const FEATURE_VIEWS_MOBILE = [
  {
    position: { x: 0, y: 0.1, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
  },
  {
    position: { x: 0, y: 0.25, z: 0.6 },
    rotation: { x: 0.15, y: 0.7, z: 0 },
    scale: 1.4,
  },
  {
    position: { x: 0, y: 0, z: 0.4 },
    rotation: { x: -0.08, y: -0.4, z: 0 },
    scale: 1.25,
  },
];

export default function Scene({}: Props) {
  const throttleRef = useRef<Group>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)", true);

  // Updated with darker grayscale colors for better contrast
  const bgColors = ["#0A0A0A", "#111111", "#151515"];
  
  // Choose feature views based on device
  const featureViews = isDesktop ? FEATURE_VIEWS : FEATURE_VIEWS_MOBILE;

  useGSAP(
    () => {
      if (!throttleRef.current) return;

      const sections = gsap.utils.toArray(".alternating-section");

      // Add text color change to white
      gsap.set(".alternating-section", {
        color: "#FFFFFF"
      });

      // Set initial state
      const initialView = featureViews[0];
      gsap.set(throttleRef.current.position, initialView.position);
      gsap.set(throttleRef.current.rotation, initialView.rotation);
      gsap.set(throttleRef.current.scale, { 
        x: initialView.scale, 
        y: initialView.scale, 
        z: initialView.scale 
      });

      // First, wait for the skydive animation to complete
      // by checking if we're beyond its scroll range
      ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        endTrigger: ".alternating-text-container",
        onEnter: () => {
          // Create the main scrolling animation with delayed start
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: ".alternating-text-view",
              endTrigger: ".alternating-text-container",
              pin: true,
              start: "top+=10% top",
              end: "bottom bottom",
              scrub: 1.5, // Smoother scrub for better feel
            },
          });

          sections.forEach((_, index) => {
            if (!throttleRef.current) return;
            if (index === 0) return;

            const targetView = featureViews[index];
            const duration = 1;

            // Animate position with smooth easing
            scrollTl
              .to(throttleRef.current.position, {
                x: targetView.position.x,
                y: targetView.position.y,
                z: targetView.position.z,
                ease: "power2.inOut",
                duration: duration,
              })
              // Animate rotation simultaneously
              .to(
                throttleRef.current.rotation,
                {
                  x: targetView.rotation.x,
                  y: targetView.rotation.y,
                  z: targetView.rotation.z,
                  ease: "power2.inOut",
                  duration: duration,
                },
                "<", // Start at same time as position
              )
              // Animate scale (zoom effect)
              .to(
                throttleRef.current.scale,
                {
                  x: targetView.scale,
                  y: targetView.scale,
                  z: targetView.scale,
                  ease: "power3.inOut",
                  duration: duration,
                },
                "<", // Start at same time
              )
              // Background color transition
              .to(
                ".alternating-text-container",
                {
                  backgroundColor: gsap.utils.wrap(bgColors, index),
                  duration: duration * 0.8,
                  ease: "power1.inOut",
                },
                "<+=0.1", // Slight delay for staggered feel
              );
          });
        }
      });
    },
    { dependencies: [isDesktop, featureViews] },
  );

  // Initial position based on first feature view
  const initialView = featureViews[0];

  return (
    <group
      ref={throttleRef}
      position={[initialView.position.x, initialView.position.y, initialView.position.z]}
      rotation={[initialView.rotation.x, initialView.rotation.y, initialView.rotation.z]}
      scale={initialView.scale}
    >
      <FloatingThrottle 
        floatSpeed={1.2}
        rotationIntensity={0.3}
        floatIntensity={0.4}
        floatingRange={[-0.05, 0.05]}
      />
      <Environment
        files={`${basePath}/hdr/lobby.hdr`}
        environmentIntensity={0.6}
      />
      {/* Add subtle ambient light for better visibility in dark theme */}
      <ambientLight intensity={0.3} color="#ffffff" />
      {/* Add directional light to enhance depth during zoom */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.4} 
        color="#ffffff"
      />
    </group>
  );
}
