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
  isPlaying: boolean;
  mood: Mood;
  isLoading: boolean;
  progress: number;
}

const VisualizerContext = createContext<VisualizerContextType | undefined>(undefined);

const moods: Mood[] = ['happy', 'dark', 'chill', 'energetic'];

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<Mood>('chill');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const player = useRef<Tone.Player | null>(null);
  const analyser = useRef<Tone.Analyser | null>(null);

  useEffect(() => {
    player.current = new Tone.Player().toDestination();
    player.current.connect(new Tone.Limiter(-6).toDestination());
    analyser.current = new Tone.Analyser('fft', 2048);
    player.current.connect(analyser.current);

    const progressLoop = new Tone.Loop(time => {
      if (player.current?.state === "started" && player.current.buffer.duration > 0) {
        const currentProgress = player.current.progress;
        setProgress(currentProgress);
        if (currentProgress >= 1) {
          setIsPlaying(false);
          player.current.stop();
          Tone.Transport.stop();
          setProgress(0);
        }
      }
    }, "16n").start(0);

    return () => {
      progressLoop.dispose();
      player.current?.dispose();
      analyser.current?.dispose();
    }
  }, []);

  const handleAudioLoad = useCallback(async () => {
    try {
      if (player.current) {
        setIsLoading(false);
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        setMood(randomMood);
        toast({ title: "Mood Detected", description: `The vibe is ${randomMood}!` });
      }
    } catch (error) {
      console.error("Error setting mood:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not set the music's mood." });
    }
  }, [toast]);
  
  const loadAudio = useCallback((url: string) => {
    if (!player.current) return;
    setIsLoading(true);
    setAudioSrc(url);

    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
    }
    setIsPlaying(false);
    setProgress(0);

    player.current.load(url)
      .then(async () => {
        handleAudioLoad();
      })
      .catch(err => {
        console.error("Error loading audio:", err);
        toast({ variant: 'destructive', title: "Audio Error", description: "Failed to load audio." });
        setIsLoading(false);
      });
  }, [handleAudioLoad, toast]);

  const loadAudioFile = (file: File) => {
    const url = URL.createObjectURL(file);
    loadAudio(url);
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

    if (isPlaying) {
      player.current.pause();
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      await Tone.start();
      if (player.current.progress === 1) { 
          player.current.seek(0);
          setProgress(0);
      }
      const startTime = player.current.progress * player.current.buffer.duration;
      if (isFinite(startTime)) {
        player.current.start(undefined, startTime);
        Tone.Transport.start();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const seek = useCallback((progress: number) => {
    if (player.current && player.current.loaded) {
      const duration = player.current.buffer.duration;
      if(isFinite(duration)) {
        const newTime = duration * progress;
        player.current.seek(newTime);
        setProgress(progress);
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
