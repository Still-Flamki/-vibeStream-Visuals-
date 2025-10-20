
import type { Analyser } from 'tone';
import type { Mood, VisualizationType } from '@/types';

export type VisualizerControls = {
  particleSize: number;
  bassSensitivity: number;
  trebleSensitivity: number;
  rotationSpeed: number;
};

export type ThreeSceneProps = {
  analyserNode: Analyser | null;
  isPlaying: boolean;
  mood: Mood;
  visualizationType: VisualizationType;
  controls: VisualizerControls;
};
