"use client";

import React, { useState, useRef } from 'react';
import { useVisualizer } from '@/contexts/visualizer-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Upload, Link, Play, Pause, Loader2, Music } from 'lucide-react';

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
  
  const isDisabled = isLoading;

  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="flex-grow">
          <Tabs defaultValue="upload" className="w-full">
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
        </div>
        
        <div className={`flex-grow transition-opacity duration-500 ${fileName ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
                <div className="w-full flex flex-col justify-center gap-2">
                  <Slider value={[progress * 100]} onValueChange={handleSeek} disabled={isDisabled || !fileName}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
