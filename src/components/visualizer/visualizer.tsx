
"use client";

import { useVisualizer } from '@/contexts/visualizer-context';
import ThreeScene, { type ThreeSceneHandle } from './three-scene';
import ControlsPanel from '../controls/controls-panel';
import { Card, CardContent } from '../ui/card';
import { VibeStreamIcon } from '../icons';
import { useRef } from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Video, Download, Share2, CircleDot, ChevronDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VideoQuality } from '@/types';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

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
    setControls,
    isLoading
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

  const isDisabled = isRecording || isLoading;

  return (
    <div className="w-full h-full max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-4 p-4">
      <div className="xl:col-span-3 h-full flex flex-col gap-4">
        <Card className="flex-grow relative rounded-lg overflow-hidden bg-black shadow-2xl shadow-primary/20 border-accent/20">
          <CardContent className="p-0 h-full w-full">
            {audioSrc && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={isRecording ? "destructive" : "outline"} size="icon" disabled={!audioSrc}>
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
                <Button variant="outline" size="icon" onClick={handleExportGif} disabled={isDisabled || !audioSrc}>
                  <Download />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare} disabled={isDisabled || !audioSrc}>
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
        
        {audioSrc && (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Vibe:</span>
                  {isLoading ? (
                      <Loader2 className="animate-spin" />
                  ) : (
                      <Badge variant="secondary" className="capitalize text-base px-3 py-1 bg-accent/20 text-accent-foreground border-accent">{mood}</Badge>
                  )}
              </div>

              <div className='flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 items-center'>
                <div className='space-y-1'>
                  <Label htmlFor='particleSize' className="text-xs">Particle Size</Label>
                  <Slider id="particleSize" min={0.1} max={2} step={0.1} value={[controls.particleSize]} onValueChange={([val]) => setControls(c => ({...c, particleSize: val}))} disabled={isDisabled} />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='bassSensitivity' className="text-xs">Bass Reactivity</Label>
                  <Slider id="bassSensitivity" min={0} max={2} step={0.1} value={[controls.bassSensitivity]} onValueChange={([val]) => setControls(c => ({...c, bassSensitivity: val}))} disabled={isDisabled} />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='trebleSensitivity' className="text-xs">Treble Reactivity</Label>
                  <Slider id="trebleSensitivity" min={0} max={2} step={0.1} value={[controls.trebleSensitivity]} onValueChange={([val]) => setControls(c => ({...c, trebleSensitivity: val}))} disabled={isDisabled} />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='rotationSpeed' className="text-xs">Rotation Speed</Label>
                  <Slider id="rotationSpeed" min={0} max={2} step={0.1} value={[controls.rotationSpeed]} onValueChange={([val]) => setControls(c => ({...c, rotationSpeed: val}))} disabled={isDisabled} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="xl:col-span-1 h-full min-h-[300px] xl:min-h-0">
        <ControlsPanel threeSceneRef={threeSceneRef} />
      </div>
    </div>
  );
}
