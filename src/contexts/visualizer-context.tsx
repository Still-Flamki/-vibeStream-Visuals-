"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import * as Tone from 'tone';
import { analyzeMood } from '@/ai/flows/mood-detection';
import type { Mood } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface VisualizerContextType {
  loadAudioFile: (file: File) => void;
  loadAudioUrl: (url: string) => void;
  togglePlay: () => void;
  player: Tone.Player | null;
  analyser: Tone.Analyser | null;
  audioSrc: string | null;
  isPlaying: boolean;
  mood: Mood;
  isLoading: boolean;
  isAiLoading: boolean;
  progress: number;
}

const VisualizerContext = createContext<VisualizerContextType | undefined>(undefined);

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<Mood>('chill');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const player = useRef<Tone.Player | null>(null);
  const analyser = useRef<Tone.Analyser | null>(null);

  useEffect(() => {
    player.current = new Tone.Player().toDestination();
    analyser.current = new Tone.Analyser('fft', 2048);
    player.current.connect(analyser.current);

    const progressLoop = new Tone.Loop(time => {
      if (player.current?.state === "started" && player.current.buffer.duration > 0) {
        const currentProgress = player.current.progress;
        setProgress(currentProgress);
      }
    }, "16n").start(0);

    return () => {
      progressLoop.dispose();
      player.current?.dispose();
      analyser.current?.dispose();
    }
  }, []);

  const handleAudioLoad = useCallback(async (trackInfo: string) => {
    try {
      if (player.current) {
        setIsLoading(false);
        setIsAiLoading(true);
        const newMood = await analyzeMood(trackInfo);
        setMood(newMood);
        setIsAiLoading(false);
        toast({ title: "Mood Detected", description: `The vibe is ${newMood}!` });
      }
    } catch (error) {
      console.error("Error analyzing mood:", error);
      toast({ variant: 'destructive', title: "AI Error", description: "Could not analyze the music's mood." });
      setIsAiLoading(false);
    }
  }, [toast]);
  
  const loadAudio = useCallback((url: string, trackInfo: string) => {
    if (!player.current) return;
    setIsLoading(true);
    setAudioSrc(url);

    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
    }
    setIsPlaying(false);
    setProgress(0);

    player.current.load(url)
      .then(() => handleAudioLoad(trackInfo))
      .catch(err => {
        console.error("Error loading audio:", err);
        toast({ variant: 'destructive', title: "Audio Error", description: "Failed to load audio." });
        setIsLoading(false);
      });
  }, [handleAudioLoad, toast]);

  const loadAudioFile = (file: File) => {
    const url = URL.createObjectURL(file);
    loadAudio(url, file.name);
  };

  const loadAudioUrl = (url: string) => {
    // Basic validation. Note: CORS issues are very common with remote URLs.
    if (!url.startsWith('http')) {
        toast({ variant: 'destructive', title: "Invalid URL", description: "Please enter a valid URL." });
        return;
    }
    loadAudio(url, url.split('/').pop() || 'remote track');
  };
  
  const togglePlay = useCallback(async () => {
    if (!player.current || player.current.state === 'stopped') {
      if (audioSrc) {
        await Tone.start();
        player.current?.start();
        Tone.Transport.start();
        setIsPlaying(true);
      }
    } else if (player.current.state === 'started') {
      player.current.pause();
      Tone.Transport.pause();
      setIsPlaying(false);
    } else if (player.current.state === 'paused') {
      await Tone.start();
      player.current.start();
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, [audioSrc]);

  const value = {
    loadAudioFile,
    loadAudioUrl,
    togglePlay,
    player: player.current,
    analyser: analyser.current,
    audioSrc,
    isPlaying,
    mood,
    isLoading,
    isAiLoading,
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
