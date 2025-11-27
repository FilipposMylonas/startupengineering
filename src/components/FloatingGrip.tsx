"use client";

import { forwardRef, ReactNode } from "react";
import { Float } from "@react-three/drei";

import { Grip } from "@/components/Grip";
import { Group } from "three";

type FloatingGripProps = {
  floatSpeed?: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  floatingRange?: [number, number];
  children?: ReactNode;
};

const FloatingGrip = forwardRef<Group, FloatingGripProps>(
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
          <Grip />
        </Float>
      </group>
    );
  },
);

FloatingGrip.displayName = "FloatingGrip";

export default FloatingGrip;

