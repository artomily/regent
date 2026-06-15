import data from "../public/vo/manifest.json";

export type VOScene = {
  id: string;
  file: string;
  durationInFrames: number;
  lead: number;
  seconds: number;
  text: string;
};

export const voScenes = data as VOScene[];

export const totalDurationInFrames = voScenes.reduce(
  (sum, s) => sum + s.durationInFrames,
  0
);

// Cumulative start frame for each scene, by index.
export const sceneStarts: number[] = voScenes.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + voScenes[i - 1].durationInFrames);
  return acc;
}, []);
