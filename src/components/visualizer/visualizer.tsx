
"use client";

import { useVisualizer } from '@/contexts/visualizer-context';
import ThreeScene, { type ThreeSceneHandle } from './three-scene';
import { Card, CardContent } from '../ui/card';
import { VibeStreamIcon } from '../icons';
import { useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Video, Download, Share2, CircleDot, Sparkles, Loader2, Crop, Undo2, Redo2, RotateCcw, RotateCw, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VideoQuality, VisualizationType, ColorMode } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { PhoneFrame } from './phone-frame';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import * as THREE from 'three';
import { aspectRatios } from '@/contexts/visualizer-context';
import { Input } from '../ui/input';

export default function Visualizer() {
  const { 
    audioSrc, 
    analyserNode, 
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
    colorMode,
    setColorMode,
    customColor,
    setCustomColor,
  } = useVisualizer();
  const threeSceneRef = useRef<ThreeSceneHandle>(null);
  const { toast } = useToast();

  const numericAspectRatio = aspectRatios[aspectRatio]?.value || 16/9;
  const currentAspectRatio = aspectRatios[aspectRatio];

  useEffect(() => {
    const handleResize = () => {
      if (threeSceneRef.current) {
        threeSceneRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
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

  const handleRotationSet = (axis: 'x' | 'y' | 'z', degrees: number) => {
    setControls(c => ({
      ...c,
      rotation: { ...c.rotation, direction: 'none', [axis]: THREE.MathUtils.degToRad(degrees) }
    }));
  };

  const handleContinuousRotation = (direction: 'left' | 'right' | 'none') => {
     setControls(c => ({
      ...c,
      rotation: { ...c.rotation, direction, x: 0, y: 0, z: 0 }
    }));
  };

  const isDisabled = isRecording || isLoading;
  const isMobileAspectRatio = currentAspectRatio ? currentAspectRatio.isMobile : false;

  const VisualizerContent = (
      <ThreeScene 
        ref={threeSceneRef}
        analyserNode={analyserNode} 
        isPlaying={isPlaying} 
        mood={mood} 
        visualizationType={visualizationType} 
        controls={controls}
        aspectRatio={numericAspectRatio}
        colorMode={colorMode}
        customColor={customColor}
      />
  );

  return (
    <div className="w-full flex-grow flex flex-col gap-4 min-h-0">
      <div className="flex-grow w-full h-full flex items-center justify-center p-4 min-h-0">
        <Card 
          className="relative rounded-lg overflow-hidden bg-black/50 shadow-2xl shadow-primary/20 w-full max-w-full h-full max-h-full"
          style={{aspectRatio: audioSrc ? numericAspectRatio : '16 / 9'}}
        >
          <CardContent className="p-0 h-full w-full">
             {audioSrc && !isLoading && (
              <>
                <div className="absolute top-4 left-4 z-10 flex flex-col md:flex-row gap-2">
                    <div className="space-y-2">
                        <Select onValueChange={(value: VisualizationType) => setVisualizationType(value)} defaultValue={visualizationType} disabled={isDisabled}>
                          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-primary/20">
                              <SelectValue placeholder="Select a visualization" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="sphere_pulse">Sphere Pulse</SelectItem>
                              <SelectItem value="warp_drive">Warp Drive</SelectItem>
                              <SelectItem value="cosmic_web">Cosmic Web</SelectItem>
                              <SelectItem value="tidal_wave">Tidal Wave</SelectItem>
                              <SelectItem value="torus_knot">Torus Knot</SelectItem>
                              <SelectItem value="audio_city">Audio City</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Select onValueChange={(value: string) => setAspectRatio(value)} defaultValue={aspectRatio} disabled={isDisabled}>
                          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-primary/20">
                              <SelectValue placeholder="Select an aspect ratio" />
                          </SelectTrigger>
                          <SelectContent>
                              {Object.entries(aspectRatios).map(([key, {label}]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value: ColorMode) => setColorMode(value)} defaultValue={colorMode} disabled={isDisabled}>
                        <SelectTrigger className="w-[150px] bg-card/50 backdrop-blur-sm border-primary/20">
                            <SelectValue placeholder="Select a color mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mood">Mood-Based</SelectItem>
                            <SelectItem value="multicolor">Multicolor</SelectItem>
                            <SelectItem value="crimson">Crimson</SelectItem>
                            <SelectItem value="ocean">Ocean</SelectItem>
                            <SelectItem value="lime">Lime</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="violet">Violet</SelectItem>
                            <SelectItem value="pink">Pink</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>

                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant={isRecording ? "destructive" : "outline"} size="icon" disabled={!audioSrc} className="bg-card/50 backdrop-blur-sm border-primary/20">
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
                  <Button variant="outline" size="icon" onClick={handleExportGif} disabled={isDisabled || !audioSrc} className="bg-card/50 backdrop-blur-sm border-primary/20">
                    <Download />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare} disabled={isDisabled || !audioSrc} className="bg-card/50 backdrop-blur-sm border-primary/20">
                    <Share2 />
                  </Button>
                </div>
              </>
            )}
            
            {audioSrc || isLoading ? (
              isLoading ? (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm p-8 text-center border border-primary/20 rounded-lg">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    <p className="mt-4 text-muted-foreground">Loading your audio...</p>
                 </div>
              ) : isMobileAspectRatio ? (
                <div className="w-full h-full flex items-center justify-center bg-black p-4 md:p-8">
                  <PhoneFrame className="h-full w-auto">
                    {VisualizerContent}
                  </PhoneFrame>
                </div>
              ) : (
                VisualizerContent
              )
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
      
      {audioSrc && !isLoading && (
          <Card className="bg-card/50 backdrop-blur-sm w-full max-w-7xl mx-auto">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  
                  <div className='space-y-3 md:col-span-2'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-1'>
                        <Label className="text-xs">Bass Reactivity</Label>
                        <Slider id="bassSensitivity" min={0} max={2} step={0.1} value={[controls.bassSensitivity]} onValueChange={([val]) => setControls(c => ({...c, bassSensitivity: val}))} disabled={isDisabled} />
                      </div>
                      <div className='space-y-1'>
                        <Label className="text-xs">Treble Reactivity</Label>                      
                        <Slider id="trebleSensitivity" min={0} max={2} step={0.1} value={[controls.trebleSensitivity]} onValueChange={([val]) => setControls(c => ({...c, trebleSensitivity: val}))} disabled={isDisabled} />
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-1'>
                        <Label className="text-xs">Particle Size</Label>
                        <Slider id="particleSize" min={0.1} max={2} step={0.1} value={[controls.particleSize]} onValueChange={([val]) => setControls(c => ({...c, particleSize: val}))} disabled={isDisabled} />
                      </div>
                       <div className='space-y-1'>
                        <Label className="text-xs">Bounce Intensity</Label>
                        <Slider id="bounceIntensity" min={0} max={5} step={0.1} value={[controls.bounceIntensity]} onValueChange={([val]) => setControls(c => ({...c, bounceIntensity: val}))} disabled={isDisabled} />
                      </div>
                    </div>
                  </div>

                  <div className='space-y-3 md:col-span-1'>
                     <div className='space-y-1'>
                      <Label className="text-xs">Rotation Speed</Label>
                      <Slider min={0} max={2} step={0.1} value={[controls.rotation.speed]} onValueChange={([val]) => setControls(c => ({...c, rotation: {...c.rotation, speed: val}}))} disabled={isDisabled || controls.rotation.direction === 'none'} />
                    </div>
                    <div className='flex gap-2 items-center'>
                      <Label className="text-xs">Direction</Label>
                      <ToggleGroup 
                        type="single" 
                        size="sm" 
                        variant="outline"
                        value={controls.rotation.direction}
                        onValueChange={(value) => handleContinuousRotation(value as 'left' | 'right' | 'none' || 'none')}
                        disabled={isDisabled}
                      >
                        <ToggleGroupItem value="left" aria-label="Rotate left"><Undo2/></ToggleGroupItem>
                        <ToggleGroupItem value="right" aria-label="Rotate right"><Redo2/></ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                     <div className='flex gap-2 items-center'>
                      <Label className="text-xs">Set Angle</Label>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRotationSet('y', 90)} disabled={isDisabled}><RotateCcw /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRotationSet('y', -90)} disabled={isDisabled}><RotateCw /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRotationSet('y', 180)} disabled={isDisabled}>180</Button>
                    </div>
                  </div>

                  <div className='space-y-3 md:col-span-1 flex items-center justify-center pt-4'>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">Vibe:</span>
                      {isLoading ? (
                          <Loader2 className="animate-spin" />
                      ) : (
                          <Badge variant="secondary" className="capitalize text-sm px-3 py-1 bg-accent/20 text-accent-foreground border-accent/50">{mood}</Badge>
                      )}
                      </div>
                  </div>
                </div>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
