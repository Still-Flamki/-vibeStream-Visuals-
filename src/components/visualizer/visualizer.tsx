"use client";

import { useVisualizer } from '@/contexts/visualizer-context';
import ThreeScene from './three-scene';
import ControlsPanel from '../controls/controls-panel';
import { Card, CardContent } from '../ui/card';
import { VibeStreamIcon } from '../icons';

export default function Visualizer() {
  const { audioSrc, analyser, isPlaying, mood, visualizationType } = useVisualizer();

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6 p-4 md:p-6 h-full flex-grow">
      <Card className="xl:col-span-3 aspect-video relative rounded-lg overflow-hidden bg-black shadow-2xl shadow-primary/20 border-accent/20">
        <CardContent className="p-0 h-full w-full">
          {audioSrc ? (
            <ThreeScene analyserNode={analyser} isPlaying={isPlaying} mood={mood} visualizationType={visualizationType} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-card p-8 text-center">
              <VibeStreamIcon className="h-24 w-24 text-primary animate-pulse" />
              <h2 className="mt-6 text-2xl font-bold font-headline">Welcome to VibeStream Visuals</h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                Upload an audio file or paste a URL to start the experience. Your beats, visualized.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="xl:col-span-1">
        <ControlsPanel />
      </div>
    </div>
  );
}
