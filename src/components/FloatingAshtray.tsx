"use client";

import { forwardRef, ReactNode } from "react";
import { Float } from "@react-three/drei";

import { FlightController } from "@/components/FlightController";
import { Group } from "three";

type FloatingCanProps = {
  flavor?: string;
  floatSpeed?: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  floatingRange?: [number, number];
  children?: ReactNode;
};

const FloatingAshtray = forwardRef<Group, FloatingCanProps>(
  (
    {
      flavor = "blackCherry",
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
          <FlightController />
        </Float>
      </group>
    );
  },
);

FloatingAshtray.displayName = "FloatingAshtray";

export default FloatingAshtray;
