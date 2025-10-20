
"use client";

import { useVisualizer } from '@/contexts/visualizer-context';
import ThreeScene, { type ThreeSceneHandle } from './three-scene';
import ControlsPanel from '../controls/controls-panel';
import { Card, CardContent } from '../ui/card';
import { VibeStreamIcon } from '../icons';
import { useRef } from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Video, Download, Share2, CircleDot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VideoQuality } from '@/types';

export default function Visualizer() {
  const { 
    audioSrc, 
    analyser, 
    isPlaying, 
    mood, 
    visualizationType, 
    controls, 
    isRecording,
    startRecording,
    stopRecording,
  } = useVisualizer();
  const threeSceneRef = useRef<ThreeSceneHandle>(null);
  const { toast } = useToast();

  const handleRecordClick = (quality: VideoQuality) => {
    if (!threeSceneRef.current?.getCanvas()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find visualization to record.' });
      return;
    }
    if (isRecording) {
      stopRecording();
      toast({ title: 'Recording Stopped', description: `Your ${quality} download will begin shortly.` });
    } else {
      if (startRecording(threeSceneRef, quality)) {
        toast({ title: `Recording Started (${quality})`, description: 'Click the record button again to stop and download.' });
      }
    }
  };

  const handleExportGif = () => {
    toast({
      title: 'Exporting...',
      description: `GIF export is being prepared. This feature is coming soon!`,
    });
    console.log(`Export to GIF requested.`);
  };

  const handleShare = () => {
    toast({
      title: 'Sharing...',
      description: 'Your creation is ready to be shared. This feature is coming soon!',
    });
    console.log('Share requested.');
  };

  const isDisabled = isRecording;

  return (
    <div className="w-full h-full max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
      <div className="xl:col-span-2 h-full flex flex-col gap-4 min-h-[480px]">
        <Card className="flex-grow relative rounded-lg overflow-hidden bg-black/50 shadow-2xl shadow-primary/20 border-primary/20 backdrop-blur-sm">
          <CardContent className="p-0 h-full w-full">
            {audioSrc && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={isRecording ? "destructive" : "outline"} size="icon" disabled={!audioSrc} className="bg-card/80 backdrop-blur-sm">
                       {isRecording 
                          ? <CircleDot className="text-red-500 animate-pulse" /> 
                          : <Video />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRecordClick('720p')} disabled={isRecording}>720p</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRecordClick('1080p')} disabled={isRecording}>1080p</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRecordClick('4k')} disabled={isRecording}>4K</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" onClick={handleExportGif} disabled={isDisabled || !audioSrc} className="bg-card/80 backdrop-blur-sm">
                  <Download />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare} disabled={isDisabled || !audioSrc} className="bg-card/80 backdrop-blur-sm">
                  <Share2 />
                </Button>
              </div>
            )}
            
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm p-8 text-center border border-primary/20 rounded-lg">
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

      <div className="xl:col-span-1 h-full min-h-[480px] xl:min-h-0">
        <ControlsPanel />
      </div>
    </div>
  );
}
