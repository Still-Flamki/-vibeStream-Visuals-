"use client";

import { useVisualizer } from '@/contexts/visualizer-context';
import ThreeScene, { type ThreeSceneHandle } from './three-scene';
import { Card, CardContent } from '../ui/card';
import { VibeStreamIcon } from '../icons';
import { useRef } from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Video, Download, Share2, CircleDot, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VideoQuality, VisualizationType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
    setVisualizationType,
    controls,
    setControls,
    isLoading,
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
    <div className="flex-grow flex flex-col gap-4 min-h-0">
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
                  <DropdownMenuItem onClick={() => handleRecordClick('720p')} disabled={isRecording}>Record 720p</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRecordClick('1080p')} disabled={isRecording}>Record 1080p</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRecordClick('4k')} disabled={isRecording}>Record 4K</DropdownMenuItem>
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
      
      {audioSrc && (
          <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className='space-y-3'>
                      <div className="space-y-2">
                          <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="text-primary"/> Visual Style</h3>
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
                      <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Vibe:</span>
                      {isLoading ? (
                          <Loader2 className="animate-spin" />
                      ) : (
                          <Badge variant="secondary" className="capitalize text-base px-3 py-1 bg-accent/20 text-accent-foreground border-accent/50">{mood}</Badge>
                      )}
                      </div>
                  </div>
                  <div className='space-y-3'>
                    <div className='space-y-1'>
                      <Label htmlFor='particleSize' className="text-xs">Particle Size</Label>
                      <Slider id="particleSize" min={0.1} max={2} step={0.1} value={[controls.particleSize]} onValueChange={([val]) => setControls(c => ({...c, particleSize: val}))} disabled={isDisabled} />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor='rotationSpeed' className="text-xs">Rotation Speed</Label>
                      <Slider id="rotationSpeed" min={0} max={2} step={0.1} value={[controls.rotationSpeed]} onValueChange={([val]) => setControls(c => ({...c, rotationSpeed: val}))} disabled={isDisabled} />
                    </div>
                  </div>
                  <div className='space-y-3'>
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
