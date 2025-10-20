
"use client";

import { useVisualizer } from '@/contexts/visualizer-context';
import ThreeScene, { type ThreeSceneHandle } from './three-scene';
import { Card, CardContent } from '../ui/card';
import { VibeStreamIcon } from '../icons';
import { useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Video, Download, Share2, CircleDot, Sparkles, Loader2, Crop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VideoQuality, VisualizationType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

const aspectRatios: { [key: string]: { label: string; value: number } } = {
  '16:9': { label: 'Widescreen (16:9)', value: 16 / 9 },
  '9:16': { label: 'Portrait (9:16)', value: 9 / 16 },
  '1:1': { label: 'Square (1:1)', value: 1 / 1 },
  '4:5': { label: 'Social (4:5)', value: 4 / 5 },
  '2.39:1': { label: 'Cinematic (2.39:1)', value: 2.39 / 1 },
};

export default function Visualizer() {
  const { 
    audioSrc, 
    analyser, 
    isPlaying, 
    mood, 
    visualizationType,
    setVisualizationType,
    controls,
    setControls,
    isLoading,
    isRecording,
    startRecording,
    stopRecording,
    aspectRatio,
    setAspectRatio,
  } = useVisualizer();
  const threeSceneRef = useRef<ThreeSceneHandle>(null);
  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => {
      if (threeSceneRef.current) {
        threeSceneRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial resize
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="w-full flex-grow flex flex-col gap-4 min-h-0 items-center justify-center">
       <div 
        className="w-full h-full max-w-full max-h-full flex items-center justify-center"
        ref={visualizerContainerRef}
      >
        <Card 
          className="relative rounded-lg overflow-hidden bg-black/50 shadow-2xl shadow-primary/20 w-full h-full"
          style={{aspectRatio: audioSrc ? aspectRatio : '16 / 9'}}
        >
          <CardContent className="p-0 h-full w-full">
            {audioSrc && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={isRecording ? "destructive" : "outline"} size="icon" disabled={!audioSrc} className="bg-card/50 backdrop-blur-sm">
                        {isRecording 
                          ? <CircleDot className="text-red-500 animate-pulse" /> 
                          : <Video />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRecordClick('720p')} disabled={isRecording}>Record 720p</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRecordClick('1080p')} disabled={isRecording}>Record 1080p</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRecordClick('4k')} disabled={isRecording}>Record 4K</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" onClick={handleExportGif} disabled={isDisabled || !audioSrc} className="bg-card/50 backdrop-blur-sm">
                  <Download />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare} disabled={isDisabled || !audioSrc} className="bg-card/50 backdrop-blur-sm">
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
                aspectRatio={aspectRatio}
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
      
      {audioSrc && (
          <Card className="bg-card/50 backdrop-blur-sm w-full max-w-7xl">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className='space-y-3 md:col-span-1'>
                      <div className="space-y-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="text-primary h-4 w-4"/> Visual Style</h3>
                          <Select onValueChange={(value: VisualizationType) => setVisualizationType(value)} defaultValue={visualizationType} disabled={isDisabled}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a visualization" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sphere_pulse">Sphere Pulse</SelectItem>
                                <SelectItem value="warp_drive">Warp Drive</SelectItem>
                                <SelectItem value="cosmic_web">Cosmic Web</SelectItem>
                                <SelectItem value="tidal_wave">Tidal Wave</SelectItem>
                            </SelectContent>
                          </Select>
                      </div>
                       <div className="space-y-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2"><Crop className="text-primary h-4 w-4"/> Aspect Ratio</h3>
                          <Select onValueChange={(value: string) => setAspectRatio(aspectRatios[value].value)} defaultValue={Object.keys(aspectRatios).find(key => aspectRatios[key].value === aspectRatio)} disabled={isDisabled}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an aspect ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(aspectRatios).map(([key, {label}]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <div className='space-y-3 md:col-span-1 flex items-center justify-center'>
                    <div className="flex items-center gap-2 pt-5">
                      <span className="text-muted-foreground text-sm">Vibe:</span>
                      {isLoading ? (
                          <Loader2 className="animate-spin" />
                      ) : (
                          <Badge variant="secondary" className="capitalize text-sm px-3 py-1 bg-accent/20 text-accent-foreground border-accent/50">{mood}</Badge>
                      )}
                      </div>
                  </div>
                  <div className='space-y-3 md:col-span-1'>
                    <div className='space-y-1'>
                      <Label htmlFor='particleSize' className="text-xs">Particle Size</Label>
                      <Slider id="particleSize" min={0.1} max={2} step={0.1} value={[controls.particleSize]} onValueChange={([val]) => setControls(c => ({...c, particleSize: val}))} disabled={isDisabled} />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='rotationSpeed' className="text-xs">Rotation Speed</Label>
                      <Slider id="rotationSpeed" min={0} max={2} step={0.1} value={[controls.rotationSpeed]} onValueChange={([val]) => setControls(c => ({...c, rotationSpeed: val}))} disabled={isDisabled} />
                    </div>
                  </div>
                  <div className='space-y-3 md:col-span-1'>
                    <div className='space-y-1'>
                      <Label htmlFor='bassSensitivity' className="text-xs">Bass Reactivity</Label>
                      <Slider id="bassSensitivity" min={0} max={2} step={0.1} value={[controls.bassSensitivity]} onValueChange={([val]) => setControls(c => ({...c, bassSensitivity: val}))} disabled={isDisabled} />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='trebleSensitivity' className="text-xs">Treble Reactivity</Label>
                      <Slider id="trebleSensitivity" min={0} max={2} step={0.1} value={[controls.trebleSensitivity]} onValueChange={([val]) => setControls(c => ({...c, trebleSensitivity: val}))} disabled={isDisabled} />
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
