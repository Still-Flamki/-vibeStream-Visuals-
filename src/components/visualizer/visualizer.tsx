
"use client";

import { useVisualizer } from '@/contexts/visualizer-context';
import ThreeScene, { type ThreeSceneHandle } from './three-scene';
import ControlsPanel from '../controls/controls-panel';
import { Card, CardContent } from '../ui/card';
import { VibeStreamIcon } from '../icons';
import { useRef } from 'react';

export default function Visualizer() {
  const { audioSrc, analyser, isPlaying, mood, visualizationType, controls } = useVisualizer();
  const threeSceneRef = useRef<ThreeSceneHandle>(null);

  return (
    <div className="w-full h-full max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-4 p-4">
      <div className="xl:col-span-3 h-full min-h-[300px] xl:min-h-0">
        <Card className="h-full relative rounded-lg overflow-hidden bg-black shadow-2xl shadow-primary/20 border-accent/20">
          <CardContent className="p-0 h-full w-full">
            {audioSrc ? (
              <ThreeScene 
                ref={threeSceneRef}
                analyserNode={analyser} 
                isPlaying={isPlaying} 
                mood={mood} 
                visualizationType={visualizationType} 
                controls={controls}
              />
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
      </div>
      <div className="xl:col-span-1 h-full min-h-[500px] xl:min-h-0">
        <ControlsPanel threeSceneRef={threeSceneRef} />
      </div>
    </div>
  );
}
