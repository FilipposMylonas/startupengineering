'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';

// Create a context for the Lenis instance
const SmoothScrollContext = createContext<Lenis | null>(null);

export const useSmoothScroll = () => {
  return useContext(SmoothScrollContext);
};

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis with optimal settings for super smooth scrolling
    const lenisInstance = new Lenis({
      duration: 1.2, // Slightly longer duration for more obvious smooth effect
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing function
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    // Function to bind Lenis scroll to requestAnimationFrame
    function raf(time: number) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    
    // Start the animation loop
    requestAnimationFrame(raf);
    
    // Save the Lenis instance to state and context
    setLenis(lenisInstance);

    // Clean up on unmount
    return () => {
      lenisInstance.destroy();
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={lenis}>
      {children}
    </SmoothScrollContext.Provider>
  );
} 