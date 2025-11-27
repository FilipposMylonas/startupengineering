"use client";

import { Environment, View, Center } from "@react-three/drei";
import { useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { Group } from "three";
import gsap from "gsap";

import FloatingGrip from "@/components/FloatingGrip";
import FloatingThrottle from "@/components/FloatingThrottle";
import { ArrowIcon } from "./ArrowIcon";
import { WavyCircles } from "./WavyCircles";
import AddToCart from "@/components/AddToCart";

const SPINS_ON_CHANGE = 4;

const PRODUCT_VARIANTS: {
  id: number;
  modelType: "grip" | "throttle" | "bundle";
  color: string;
  darkColor: string;
  name: string;
  price: number;
  description: string;
}[] = [
  { 
    id: 1, 
    modelType: "grip", 
    color: "#38bdf8", 
    darkColor: "#0f172a", 
    name: "Raptor Grip", 
    price: 250,
    description: "Hall-effect sensors. CNC aluminum construction. Zero deadzone."
  },
  { 
    id: 2, 
    modelType: "throttle", 
    color: "#f97316", 
    darkColor: "#1c1917", 
    name: "Raptor Throttle", 
    price: 300,
    description: "Precision-machined aluminum rails. Smooth, linear resistance."
  },
  { 
    id: 3, 
    modelType: "bundle", 
    color: "#22c55e", 
    darkColor: "#052e16", 
    name: "Complete System", 
    price: 800,
    description: "Full HOTAS setup with grip, throttle, base, and universal mounts."
  },
];

const CONTENT = {
  heading: "Select Your Configuration",
};

export default function Carousel(): JSX.Element {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const gripRef = useRef<Group>(null);
  const throttleRef = useRef<Group>(null);
  const bundleRef = useRef<Group>(null);
  const containerRef = useRef<Group>(null);

  const getModelRef = useCallback((type: string) => {
    switch (type) {
      case "grip": return gripRef;
      case "throttle": return throttleRef;
      case "bundle": return bundleRef;
      default: return gripRef;
    }
  }, []);

  function changeProduct(index: number) {
    if (isAnimating) return;
    
    const nextIndex = (index + PRODUCT_VARIANTS.length) % PRODUCT_VARIANTS.length;
    if (nextIndex === currentProductIndex) return;
    
    const currentVariant = PRODUCT_VARIANTS[currentProductIndex];
    const nextVariant = PRODUCT_VARIANTS[nextIndex];
    const currentRef = getModelRef(currentVariant.modelType);
    const nextRef = getModelRef(nextVariant.modelType);
    
    setIsAnimating(true);

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false)
    });

    // Animate current model out (scale down + fade + spin)
    if (currentRef.current) {
      tl.to(
        currentRef.current.scale,
        {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.4,
          ease: "back.in(2)",
        },
        0,
      ).to(
        currentRef.current.rotation,
        {
          y: `+=${Math.PI * 2}`,
          duration: 0.4,
          ease: "power2.in",
        },
        0,
      );
    }

    // Background and circles color transition
    tl.to(
      ".carousel .background",
      {
        backgroundColor: nextVariant.darkColor,
        ease: "power2.inOut",
        duration: 0.6,
      },
      0.1,
    ).to(
      ".wavy-circles-outer, .wavy-circles-inner",
      {
        fill: nextVariant.color,
        ease: "power2.inOut",
        duration: 0.6,
      },
      0.1,
    );

    // Text fade out
    tl.to(".text-wrapper", { 
      duration: 0.25, 
      y: -15, 
      opacity: 0,
      ease: "power2.in"
    }, 0);

    // Switch the product index at the midpoint
    tl.call(() => setCurrentProductIndex(nextIndex), [], 0.4);

    // Prepare next model (start scaled down)
    if (nextRef.current) {
      tl.set(nextRef.current.scale, { x: 0, y: 0, z: 0 }, 0.4);
      tl.set(nextRef.current.rotation, { y: -Math.PI }, 0.4);
      
      // Animate next model in (scale up + spin in)
      tl.to(
        nextRef.current.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        0.45,
      ).to(
        nextRef.current.rotation,
        {
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        0.45,
      );
    }

    // Text fade in
    tl.to(".text-wrapper", { 
      duration: 0.3, 
      y: 0, 
      opacity: 1,
      ease: "power2.out"
    }, 0.55);
  }

  const currentVariant = PRODUCT_VARIANTS[currentProductIndex];

  return (
    <section
      id="shop-carousel"
      className="carousel relative grid grid-rows-[auto,1fr,auto] justify-center overflow-hidden py-8 text-white"
    >
      <div className="background pointer-events-none absolute inset-0 bg-[#0f172a] opacity-95" />

      <WavyCircles className="absolute left-1/2 top-1/2 h-[120vmin] -translate-x-1/2 -translate-y-1/2" style={{ color: currentVariant.color }} />

      <h2 className="relative text-center text-5xl font-bold mb-4">
        {CONTENT.heading}
      </h2>

      <div className="grid grid-cols-[auto,auto,auto] items-center">
        <ArrowButton
          onClick={() => changeProduct(currentProductIndex + 1)}
          direction="left"
          label="Previous"
          disabled={isAnimating}
        />
        <View className="aspect-square h-[55vmin] min-h-40">
          <Center position={[0, 0, 1.5]}>
            <group ref={containerRef} rotation={[0.2, 0, 0]}>
              {/* Grip Model */}
              <group 
                ref={gripRef} 
                visible={currentVariant.modelType === "grip"}
              >
                <FloatingGrip
                  floatIntensity={0.3}
                  rotationIntensity={1}
                />
              </group>

              {/* Throttle Model */}
              <group 
                ref={throttleRef} 
                visible={currentVariant.modelType === "throttle"}
              >
                <FloatingThrottle
                  floatIntensity={0.3}
                  rotationIntensity={1}
                />
              </group>

              {/* Bundle Model (both together - scaled down to fit) */}
              <group 
                ref={bundleRef} 
                visible={currentVariant.modelType === "bundle"}
                scale={0.5}
              >
                <group position={[-0.25, 0.05, 0.1]} rotation={[0, 0.5, 0]}>
                  <FloatingGrip
                    floatIntensity={0.2}
                    rotationIntensity={0.2}
                  />
                </group>
                <group position={[0.25, -0.05, -0.1]} rotation={[0, -0.5, 0]}>
                  <FloatingThrottle
                    floatIntensity={0.2}
                    rotationIntensity={0.2}
                  />
                </group>
              </group>
            </group>
          </Center>

          <Environment
            files="/hdr/lobby.hdr"
            environmentIntensity={0.2}
            environmentRotation={[0, 3, 0]}
          />
          <directionalLight intensity={1.5} position={[0, 1, 1]} />
        </View>
        <ArrowButton
          onClick={() => changeProduct(currentProductIndex - 1)}
          direction="right"
          label="Next"
          disabled={isAnimating}
        />
      </div>

      <div className="text-area relative mx-auto text-center max-w-md px-4 pb-8 pt-4">
        <div className="text-wrapper text-4xl font-medium">
          <p>{currentVariant.name}</p>
        </div>
        <div className="text-wrapper mt-1 text-lg font-normal opacity-75">
          <p>{currentVariant.description}</p>
        </div>
        <div className="text-wrapper mt-2 text-2xl font-normal opacity-90">
          <p>€{currentVariant.price} · Free Shipping</p>
        </div>
        
        <div className="mt-4">
          <AddToCart 
            productId={currentVariant.id.toString()}
            name={currentVariant.name}
            price={currentVariant.price}
            variant={currentVariant.name}
            modelType={currentVariant.modelType}
          />
        </div>
      </div>
    </section>
  );
}

type ArrowButtonProps = {
  direction?: "right" | "left";
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

function ArrowButton({
                       label,
                       onClick,
                       direction = "right",
                       disabled = false,
                     }: ArrowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "size-12 rounded-full border-2 border-slate-400/20 bg-slate-800/20 p-3 ring-white/50 focus:outline-none focus-visible:opacity-100 focus-visible:ring-4 md:size-16 lg:size-20 transition-all duration-200",
        disabled ? "opacity-50 cursor-not-allowed" : "opacity-85 hover:bg-slate-800/40 hover:scale-105"
      )}
    >
      <ArrowIcon className={clsx(direction === "right" && "-scale-x-100")} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
