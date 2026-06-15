import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { voScenes, sceneStarts } from "./manifest";
import { C } from "./theme";
import {
  Scene1,
  Scene2,
  Scene3,
  Scene4,
  Scene5,
  Scene6,
  Scene7,
  Scene8,
  SceneProps,
} from "./scenes";

const COMPONENTS: Record<string, React.FC<SceneProps>> = {
  s1: Scene1,
  s2: Scene2,
  s3: Scene3,
  s4: Scene4,
  s5: Scene5,
  s6: Scene6,
  s7: Scene7,
  s8: Scene8,
};

export const RegentDemo: React.FC = () => {
  const total = voScenes.length;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {voScenes.map((vo, i) => {
        const Comp = COMPONENTS[vo.id];
        return (
          <Sequence
            key={vo.id}
            from={sceneStarts[i]}
            durationInFrames={vo.durationInFrames}
            name={`Scene ${i + 1} — ${vo.id}`}
          >
            <Comp
              index={i}
              total={total}
              caption={vo.text}
              durationInFrames={vo.durationInFrames}
            />
            {/* narration begins after the scene's lead-in */}
            <Sequence from={vo.lead} name="vo">
              <Audio src={staticFile(vo.file)} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
