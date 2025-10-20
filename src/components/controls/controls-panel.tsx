"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useVisualizer } from '@/contexts/visualizer-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Upload, Link, Play, Pause, Download, Share2, Loader2 } from 'lucide-react';

export default function ControlsPanel() {
  const { 
    loadAudioFile, 
    loadAudioUrl,
    togglePlay, 
    isPlaying, 
    mood,
    isLoading,
    progress,
    seek
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

  const handleExport = (format: 'MP4' | 'GIF') => {
    toast({
      title: 'Exporting...',
      description: `Your ${format} is being prepared. This feature is coming soon!`,
    });
    console.log(`Export to ${format} requested.`);
  };

  const handleShare = () => {
    toast({
      title: 'Sharing...',
      description: 'Your creation is ready to be shared. This feature is coming soon!',
    });
    console.log('Share requested.');
  };

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Controls</CardTitle>
        <CardDescription>Load your audio and shape the visuals.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-6">
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload"><Upload className="mr-2" /> Upload</TabsTrigger>
            <TabsTrigger value="url"><Link className="mr-2" /> URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <Input
              type="file"
              accept="audio/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
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
              />
              <Button onClick={handleUrlSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Load'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Note: Streaming from many sites is blocked due to CORS policies.</p>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Playback</h3>
          <div className="flex items-center gap-4">
            <Button onClick={togglePlay} size="icon" className="rounded-full w-14 h-14" disabled={isLoading}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </Button>
            <div className="w-full flex flex-col gap-2">
              <Slider value={[progress * 100]} onValueChange={handleSeek} disabled={isLoading}/>
            </div>
          </div>
        </div>

        <div className="space-y-2">
            <h3 className="text-lg font-semibold">Vibe Analysis</h3>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Current Mood:</span>
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <Badge variant="secondary" className="capitalize text-base px-3 py-1 bg-accent/20 text-accent-foreground border-accent">{mood}</Badge>
                )}
            </div>
        </div>

        <div className="space-y-2 flex-grow flex flex-col justify-end">
          <h3 className="text-lg font-semibold">Export & Share</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => handleExport('MP4')}><Download className="mr-2"/> MP4</Button>
            <Button variant="outline" onClick={() => handleExport('GIF')}><Download className="mr-2"/> GIF</Button>
          </div>
          <Button onClick={handleShare}><Share2 className="mr-2"/> Share Experience</Button>
        </div>
      </CardContent>
    </Card>
  );
}
