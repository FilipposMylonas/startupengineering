"use client";

import { View } from "@react-three/drei";
import { Bounded } from "@/components/Bounded";
import Scene from "./Scene";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const exampleContent = {
  sentence: "PRECISION MODULAR DURABLE",
  flavor: {
    label: "Default",
    hex: "#38bdf8"
  }
};

export default function SkyDive(): JSX.Element {
  const isDesktop = useMediaQuery("(min-width: 768px)", true);

  return (
    <Bounded className="skydive h-screen">
      <h2 className="sr-only">{exampleContent.sentence}</h2>
      <View className="h-screen w-screen">
        <Scene
          flavor={exampleContent.flavor}
          sentence={exampleContent.sentence}
          isDesktop={isDesktop}
        />
      </View>
    </Bounded>
  );
}
