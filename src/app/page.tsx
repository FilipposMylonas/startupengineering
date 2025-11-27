import { Metadata } from "next";

// Import slices directly from their index files
import AlternatingText from "@/slices/AlternatingText";
import Carousel from "@/slices/Carousel";
import Hero from "@/slices/Hero";
import SkyDive from "@/slices/SkyDive";

// Static metadata
export const metadata: Metadata = {
  title: "Raptor Gear | Premium Flight Simulation Controllers",
  description: "Professional-grade HOTAS and HOSAS flight simulation hardware. Precision hall-effect sensors, CNC-machined aluminum construction, and fully modular design. Starting at €250.",
  openGraph: {
    title: "Raptor Gear | Premium Flight Simulation Controllers",
    description: "Commercial-grade precision. Modular construction. Designed for serious pilots.",
    images: [{ url: "public/labels/Logo White PNG High Res.png" }],
  },
};

export default function Index() {
  return (
    <main>
      <Hero />
      <SkyDive/>
      <Carousel />
      <AlternatingText />
    </main>
  );
}
