"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { View } from "@react-three/drei";

import { Bounded } from "@/components/Bounded";
import Button from "@/components/Button";
import Scene from "./Scene";
import dynamic from 'next/dynamic';
import { useStore } from "@/hooks/useStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Dynamically import CigaretteSmoke with no SSR
const CigaretteSmoke = dynamic(() => import('./Bubbles'), { ssr: false });

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface HeroProps {}

const Hero = ({}: HeroProps): JSX.Element => {
  const ready = useStore((state) => state.ready);
  const isDesktop = useMediaQuery("(min-width: 768px)", true);

  const scrollToShop = () => {
    const shopCarousel = document.getElementById('shop-carousel');
    if (shopCarousel) {
      shopCarousel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useGSAP(
    () => {
      if (!ready) return;

      const introTl = gsap.timeline();

      introTl
        .set(".hero", { opacity: 1 })
        .from(".hero-header-word", {
          scale: 3,
          opacity: 0,
          ease: "power4.in",
          delay: 0.3,
          stagger: 1,
        })
        .from(
          ".hero-subheading",
          {
            opacity: 0,
            y: 30,
          },
          "+=.8",
        )
        .from(".hero-body", {
          opacity: 0,
          y: 10,
        })
        .from(".hero-button", {
          opacity: 0,
          y: 10,
          duration: 0.6,
        });

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });

      scrollTl
        .fromTo(
          "body",
          {
            backgroundColor: "#0f172a",
          },
          {
            backgroundColor: "#020617",
            overwrite: "auto",
          },
          1,
        )
        .from(".text-side-heading .split-char", {
          scale: 1.3,
          y: 40,
          rotate: -25,
          opacity: 0,
          stagger: 0.1,
          ease: "back.out(3)",
          duration: 0.5,
        })
        .from(".text-side-body", {
          y: 20,
          opacity: 0,
        });
    },
    { dependencies: [ready] },
  );

  return (
    <Bounded className="hero opacity-0">
      {isDesktop ? (
        <View className="hero-scene pointer-events-none sticky top-0 z-50 -mt-[100vh] h-screen w-screen">
          <Scene />
          <CigaretteSmoke />
        </View>
      ) : (
        <View className="hero-scene-mobile pointer-events-none sticky top-0 z-30 -mt-[100vh] h-screen w-screen">
          <Scene />
          <CigaretteSmoke />
          <directionalLight intensity={2} position={[0, 1, 1]} />
        </View>
      )}

      <div className="grid">
        <div className="grid h-screen place-items-center">
          <div className="grid auto-rows-min place-items-center text-center px-4">
            <h1 className="hero-header text-6xl font-black uppercase leading-[.8] text-white md:text-[9rem] lg:text-[13rem]">
              <span className="hero-header-word">
                Raptor
                Gear
              </span>
            </h1>
            <div className="hero-subheading mt-8 md:mt-12 text-4xl md:text-5xl font-semibold text-white lg:text-6xl">
              <p>Precision Flight Control</p>
            </div>
            <div className="hero-body text-xl md:text-2xl font-normal text-white/80">
              <p>
                Commercial-grade hardware. Modular by design.
              </p>
            </div>
            <Button
              onClick={scrollToShop}
              buttonText="Explore Products"
              className="hero-button mt-8 md:mt-12"
            />
          </div>
        </div>

        <div className="text-side relative z-[80] grid h-screen items-center gap-4 md:grid-cols-2 px-4 md:px-0">
          <div className="text-center md:text-left mx-auto md:mx-0">
            <h2 className="text-side-heading text-balance text-5xl md:text-6xl font-black uppercase text-white lg:text-8xl">
              Engineered for Excellence
            </h2>
            <div className="text-side-body mt-4 max-w-xl text-balance text-lg md:text-xl font-normal text-white/90 mx-auto md:mx-0">
              <p>
                Professional-grade flight simulation hardware built with CNC-machined aluminum and hall-effect sensors. Our modular architecture allows component-level serviceability—replace only what you need. Premium performance at 30% below comparable systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Bounded>
  );
};

export default Hero;
