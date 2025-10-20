
import type { Analyser } from 'tone';
import type { Mood, VisualizationType, ColorMode } from '@/types';

export type VisualizerControls = {
  particleSize: number;
  bounceIntensity: number;
  bassSensitivity: number;
  trebleSensitivity: number;
  rotation: {
    speed: number;
    direction: 'left' | 'right' | 'none';
    x: number;
    y: number;
    z: number;
  };
};

export type ThreeSceneProps = {
  analyserNode: Analyser | null;
  isPlaying: boolean;
  mood: Mood;
  visualizationType: VisualizationType;
  controls: VisualizerControls;
  aspectRatio: number;
  colorMode: ColorMode;
  customColor: string;
};
