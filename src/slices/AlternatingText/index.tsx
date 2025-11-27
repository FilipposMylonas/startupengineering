"use client";

import { View } from "@react-three/drei";
import Scene from "./Scene";
import clsx from "clsx";

const CONTENT = [
  {
    heading: "Precision Engineering",
    body: "Every component is CNC-machined from aircraft-grade aluminum. Hall-effect sensors deliver contactless accuracy with zero degradation over time. High-precision cam mechanisms and industrial-grade bearings ensure consistent, reliable performance flight after flight."
  },
  {
    heading: "Modular Architecture",
    body: "Our ecosystem is designed for longevity. Interchangeable grips, swappable bases, and user-serviceable internals mean you replace only what needs replacing. Full parts availability ensures your investment is protected for years to come."
  },
  {
    heading: "Accessible Excellence",
    body: "Commercial-grade performance shouldn't require a commercial budget. Our complete system delivers at €800 what competitors charge €1,150+ for—same premium materials, same precision manufacturing, engineered to the same exacting standards."
  }
];

export default function AlternatingText(): JSX.Element {
  return (
    <section className="alternating-text-container relative bg-[#020617] text-white overflow-visible">
      {/* Wrapper for the 3D view - breaks out of container to full viewport width */}
      <div className="absolute inset-0 overflow-visible">
        {/* 3D View - Full viewport width using left/right calc to break out of parent */}
        <View 
          className="alternating-text-view pointer-events-none absolute top-0 h-screen z-50"
          style={{
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            width: '100vw',
          }}
        >
          <Scene />
        </View>
      </div>

      {/* Content container with max-width for text */}
      <div className="relative z-[100] mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="grid">
          {CONTENT.map((item, index) => (
            <div
              key={item.heading}
              className="alternating-section grid h-screen place-items-center gap-x-12 md:grid-cols-2"
            >
              <div
                className={clsx(
                  index % 2 === 0 ? "col-start-1" : "md:col-start-2",
                  "p-4 relative z-10",
                )}
              >
                <h2 className="text-balance text-6xl font-bold">
                  {item.heading}
                </h2>
                <div className="mt-4 text-xl">
                  <p>{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
