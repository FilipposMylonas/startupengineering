"use client";

import { forwardRef, ReactNode } from "react";
import { Float } from "@react-three/drei";

import { Throttle } from "@/components/Throttle";
import { Group } from "three";

type FloatingThrottleProps = {
  floatSpeed?: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  floatingRange?: [number, number];
  children?: ReactNode;
};

const FloatingThrottle = forwardRef<Group, FloatingThrottleProps>(
  (
    {
      floatSpeed = 1.5,
      rotationIntensity = 1,
      floatIntensity = 1,
      floatingRange = [-0.1, 0.1],
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <group ref={ref} {...props}>
        <Float
          speed={floatSpeed}
          rotationIntensity={rotationIntensity}
          floatIntensity={floatIntensity}
          floatingRange={floatingRange}
        >
          {children}
          <Throttle />
        </Float>
      </group>
    );
  },
);

FloatingThrottle.displayName = "FloatingThrottle";

export default FloatingThrottle;

