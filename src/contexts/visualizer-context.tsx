
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
  const animationFrameId = useRef<number>(0);

  // Cleanup function to dispose of Tone.js objects
  const cleanup = useCallback(() => {
    if (Tone.Transport.state !== 'stopped') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    player.current?.dispose();
    analyser.current?.dispose();
    player.current = null;
    analyser.current = null;
    setIsPlaying(false);
    setAudioSrc(null);
    setFileName(null);
    setProgress(0);
    if(animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, []);
  
  // Effect for cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Vibe analysis based on frequency
  const analyzeAndSetMood = useCallback(async () => {
    if (!player.current || !player.current.loaded) return;

    try {
      // The analyser is already connected to the player, we can get data from it.
      // To get a representative snapshot, we can average the analysis over a short period.
      // However, for a quick analysis, a single snapshot can suffice.
      const fft = new Tone.FFT({ size: 2048 });
      player.current.connect(fft);

      // We need to briefly play to get data. We can do this at 0 volume.
      const originalVolume = Tone.Destination.volume.value;
      Tone.Destination.volume.value = -Infinity; // Mute
      
      player.current.start();
      await new Promise(resolve => setTimeout(resolve, 200)); // Analyze for 200ms
      const frequencyData = fft.getValue();
      player.current.stop();

      Tone.Destination.volume.value = originalVolume; // Unmute
      
      if (frequencyData instanceof Float32Array) {
        const fftSize = fft.size;
        const sampleRate = Tone.context.sampleRate;
        const bassEndIndex = Math.floor(250 / (sampleRate / fftSize));
        const midEndIndex = Math.floor(4000 / (sampleRate / fftSize));
        
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
    } catch (error) {
      console.error("Error analyzing mood:", error);
      // Fallback to random mood on error
      const moods: Mood[] = ['happy', 'dark', 'chill', 'energetic'];
      setMood(moods[Math.floor(Math.random() * moods.length)]);
    }
  }, []);

  const loadAudio = useCallback(async (url: string, name?: string) => {
    setIsLoading(true);
    cleanup(); // Clean up previous instances before loading
    
    try {
      await Tone.start();
      
      analyser.current = new Tone.Analyser('fft', 2048);
      
      const newPlayer = new Tone.Player();
      
      // Fan out the player's output to both the analyser and the main destination
      newPlayer.fan(analyser.current, Tone.Destination);
      
      await newPlayer.load(url);
      player.current = newPlayer;

      setAudioSrc(url);
      setFileName(name || url.split('/').pop() || "Audio Track");
      
      await analyzeAndSetMood();

    } catch(err) {
      console.error("Error loading audio:", err);
      toast({ variant: 'destructive', title: "Audio Error", description: "Failed to load audio. The file format may be unsupported or the URL may be invalid/protected by CORS." });
      setAudioSrc(null);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, [analyzeAndSetMood, toast, cleanup]);

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

  const updateProgress = useCallback(() => {
    if (player.current && player.current.loaded && Tone.Transport.state === 'started') {
      const currentProgress = Tone.Transport.seconds / player.current.buffer.duration;
      if (isFinite(currentProgress) && currentProgress <= 1) {
        setProgress(currentProgress);
      } else if (currentProgress > 1) {
        setProgress(1);
        setIsPlaying(false);
        Tone.Transport.stop();
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(updateProgress);
    }
  }, []);
  
  const togglePlay = useCallback(async () => {
    if (!player.current || !player.current.loaded) return;
    
    await Tone.start();

    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameId.current);
    } else {
      // Sync the player to the transport
      player.current.sync().start(0, Tone.Transport.seconds);
      Tone.Transport.start();
      setIsPlaying(true);
      animationFrameId.current = requestAnimationFrame(updateProgress);
    }
  }, [updateProgress]);

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
