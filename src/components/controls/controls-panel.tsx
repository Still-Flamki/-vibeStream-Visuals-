"use client";

import React, { useState, useRef } from 'react';
import { useVisualizer } from '@/contexts/visualizer-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Upload, Link, Play, Pause, Loader2, Music } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';

export default function ControlsPanel() {
  const { 
    loadAudioFile, 
    loadAudioUrl,
    togglePlay, 
    isPlaying,
    fileName,
    isLoading,
    progress,
    seek,
    isRecording,
  } = useVisualizer();
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };

  const handleUrlSubmit = () => {
    if (url) {
      loadAudioUrl(url);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: 'Please enter a URL to stream from.',
      });
    }
  };
  
  const handleSeek = (value: number[]) => {
    seek(value[0] / 100);
  };
  
  const isDisabled = isRecording || isLoading;

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Controls</CardTitle>
        <CardDescription>Load audio and shape your visuals.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6">

            <Tabs defaultValue="upload">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" disabled={isDisabled}><Upload className="mr-2 h-4 w-4" /> Upload</TabsTrigger>
                <TabsTrigger value="url" disabled={isDisabled}><Link className="mr-2 h-4 w-4" /> URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-4">
                <Input
                  type="file"
                  accept="audio/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isDisabled}
                />
                <Button className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isDisabled}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Select Audio File'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">Your file is processed locally in your browser.</p>
              </TabsContent>
              <TabsContent value="url" className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="https://... (CORS required)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isDisabled}
                  />
                  <Button onClick={handleUrlSubmit} disabled={isDisabled}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Load'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Note: Streaming from many sites is blocked due to CORS policies.</p>
              </TabsContent>
            </Tabs>
            
            {fileName && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="w-4 h-4" />
                  <span className="truncate flex-1">{fileName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Button onClick={togglePlay} size="icon" className="rounded-full w-14 h-14" disabled={isDisabled || !fileName}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                  </Button>
                  <div className="w-full flex flex-col gap-2">
                    <Slider value={[progress * 100]} onValueChange={handleSeek} disabled={isDisabled || !fileName}/>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
