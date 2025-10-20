
"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import * as Tone from 'tone';
import type { Mood } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface VisualizerContextType {
  loadAudioFile: (file: File) => void;
  loadAudioUrl: (url: string) => void;
  togglePlay: () => void;
  seek: (progress: number) => void;
  player: Tone.Player | null;
  analyser: Tone.Analyser | null;
  audioSrc: string | null;
  fileName: string | null;
  isPlaying: boolean;
  mood: Mood;
  isLoading: boolean;
  progress: number;
}

const VisualizerContext = createContext<VisualizerContextType | undefined>(undefined);

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<Mood>('chill');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const player = useRef<Tone.Player | null>(null);
  const analyser = useRef<Tone.Analyser | null>(null);
  const animationFrameId = useRef<number>();

  const cleanup = () => {
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    player.current?.dispose();
    analyser.current?.dispose();
    player.current = null;
    analyser.current = null;
  };
  
  useEffect(() => {
    return () => cleanup();
  }, []);

  const analyzeAndSetMood = useCallback(async () => {
    if (!analyser.current || !player.current || !player.current.loaded) return;

    try {
        const wasPlaying = Tone.Transport.state === 'started';
        const originalTime = Tone.Transport.seconds;
        if(wasPlaying) Tone.Transport.pause();
        
        await Tone.start();
        
        const buffer = player.current.buffer.get();
        if (!buffer) return;

        const fft = new Tone.FFT(2048);
        player.current.connect(fft);
        
        const frequencyData = fft.getValue();

        if (frequencyData instanceof Float32Array) {
            const fftSize = fft.size;
            const bassEndIndex = Math.floor(250 / (Tone.context.sampleRate / fftSize));
            const midEndIndex = Math.floor(4000 / (Tone.context.sampleRate / fftSize));
            
            const bass = frequencyData.slice(0, bassEndIndex).reduce((acc, v) => acc + Math.abs(v), 0);
            const mid = frequencyData.slice(bassEndIndex, midEndIndex).reduce((acc, v) => acc + Math.abs(v), 0);
            const treble = frequencyData.slice(midEndIndex).reduce((acc, v) => acc + Math.abs(v), 0);
            
            const total = bass + mid + treble || 1;
            const bassRatio = bass / total;
            const trebleRatio = treble / total;

            let newMood: Mood = 'chill';
            if (bassRatio > 0.45) newMood = 'dark';
            else if (trebleRatio > 0.3) newMood = 'energetic';
            else if (bassRatio > 0.3 && trebleRatio < 0.2) newMood = 'chill';
            else newMood = 'happy';
            
            setMood(newMood);
        }

        fft.dispose();
        player.current.disconnect(fft);
        if(wasPlaying) Tone.Transport.start(undefined, originalTime);


    } catch (error) {
      console.error("Error analyzing mood:", error);
      const moods: Mood[] = ['happy', 'dark', 'chill', 'energetic'];
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      setMood(randomMood);
    } 
  }, []);

  const loadAudio = useCallback(async (url: string, name?: string) => {
    setIsLoading(true);
    cleanup(); // Clean up existing instances before loading new audio
    
    setAudioSrc(null);
    setFileName(null);
    setIsPlaying(false);
    setProgress(0);
    
    try {
        await Tone.start();
        analyser.current = new Tone.Analyser('fft', 2048);
        player.current = new Tone.Player(url, async () => {
            // This callback runs after the audio is loaded
            setAudioSrc(url);
            setFileName(name || url.split('/').pop() || "Audio Track");
            
            Tone.Transport.stop();
            Tone.Transport.seconds = 0;
            setProgress(0);
            
            await analyzeAndSetMood();
            setIsLoading(false);
        }).chain(analyser.current, Tone.Destination);
        
        player.current.sync();

        Tone.Transport.scheduleRepeat(() => {
            if (player.current && player.current.loaded) {
              const currentProgress = Tone.Transport.progress;
              if (isFinite(currentProgress)) {
                  setProgress(currentProgress);
                  if (currentProgress >= 1) {
                      Tone.Transport.stop();
                      setIsPlaying(false);
                      setProgress(1);
                  }
              }
            }
        }, "0.1s");

    } catch(err) {
      console.error("Error loading audio:", err);
      toast({ variant: 'destructive', title: "Audio Error", description: "Failed to load audio. The file format may be unsupported or the URL may be invalid/protected by CORS." });
      setIsLoading(false);
      setAudioSrc(null);
      setFileName(null);
    }
  }, [analyzeAndSetMood, toast]);

  const loadAudioFile = (file: File) => {
    const url = URL.createObjectURL(file);
    loadAudio(url, file.name);
  };

  const loadAudioUrl = (url: string) => {
    if (!url.startsWith('http')) {
        toast({ variant: 'destructive', title: "Invalid URL", description: "Please enter a valid URL." });
        return;
    }
    loadAudio(url);
  };

  const togglePlay = useCallback(async () => {
    if (!player.current || !player.current.loaded) return;

    await Tone.start();

    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      if (progress >= 1) { // If at the end, restart from 0
        Tone.Transport.seconds = 0;
        setProgress(0);
      }
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, [progress]);

  const seek = useCallback((newProgress: number) => {
    if (player.current && player.current.loaded) {
      const duration = player.current.buffer.duration;
      if(isFinite(duration) && isFinite(newProgress) && newProgress >= 0 && newProgress <= 1) {
        const newTime = duration * newProgress;
        Tone.Transport.seconds = newTime;
        setProgress(newProgress);
      }
    }
  }, []);

  const value = {
    loadAudioFile,
    loadAudioUrl,
    togglePlay,
    seek,
    player: player.current,
    analyser: analyser.current,
    audioSrc,
    fileName,
    isPlaying,
    mood,
    isLoading,
    progress,
  };

  return (
    <VisualizerContext.Provider value={value}>
      {children}
    </VisualizerContext.Provider>
  );
}

export function useVisualizer(): VisualizerContextType {
  const context = useContext(VisualizerContext);
  if (context === undefined) {
    throw new Error('useVisualizer must be used within a VisualizerProvider');
  }
  return context;
}
