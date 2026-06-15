import React from "react";
import { Composition } from "remotion";
import { RegentDemo } from "./RegentDemo";
import { totalDurationInFrames } from "./manifest";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="RegentDemo"
      component={RegentDemo}
      durationInFrames={totalDurationInFrames}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
