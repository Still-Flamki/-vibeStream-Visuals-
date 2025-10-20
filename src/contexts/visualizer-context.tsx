
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

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<Mood>('chill');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const player = useRef<Tone.Player | null>(null);
  const analyser = useRef<Tone.Analyser | null>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    // Initialize Tone.js components
    player.current = new Tone.Player().toDestination();
    player.current.connect(new Tone.Limiter(-6).toDestination());
    analyser.current = new Tone.Analyser('fft', 2048);
    player.current.connect(analyser.current);

    // Stop and clean up on component unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
      player.current?.dispose();
      analyser.current?.dispose();
    };
  }, []);

  const updateProgress = useCallback(() => {
    if (player.current?.state === "started" && player.current.buffer.duration > 0) {
      const currentProgress = player.current.progress;
      if (isFinite(currentProgress)) {
        setProgress(currentProgress);
        if (currentProgress >= 1) {
          setIsPlaying(false);
          player.current.stop();
          Tone.Transport.stop();
          setProgress(0);
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
          return; // Stop the loop
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(updateProgress);
  }, []);

  const analyzeAndSetMood = useCallback(async () => {
    if (!analyser.current || !player.current || !player.current.loaded) return;
    
    // We need to play a small snippet to get frequency data
    const originalState = {
      isPlaying: Tone.Transport.state === 'started',
      progress: player.current.progress,
      isMuted: player.current.mute,
    };

    try {
      // Mute, play a snippet, analyze, then revert
      player.current.mute = true;
      if (Tone.Transport.state !== 'started') {
        await Tone.start();
        player.current.start();
        Tone.Transport.start();
      }
      
      // Wait a moment for analysis
      await new Promise(res => setTimeout(res, 200));

      const frequencyData = analyser.current.getValue();

      if (frequencyData instanceof Float32Array) {
        const fftSize = analyser.current.size;
        // Approximate frequency ranges
        const bassEndIndex = Math.floor(250 / (Tone.context.sampleRate / fftSize));
        const midEndIndex = Math.floor(4000 / (Tone.context.sampleRate / fftSize));
        
        const bass = frequencyData.slice(0, bassEndIndex).reduce((acc, v) => acc + Math.abs(v), 0);
        const mid = frequencyData.slice(bassEndIndex, midEndIndex).reduce((acc, v) => acc + Math.abs(v), 0);
        const treble = frequencyData.slice(midEndIndex).reduce((acc, v) => acc + Math.abs(v), 0);
        
        const total = bass + mid + treble;
        const bassRatio = bass / total;
        const midRatio = mid / total;
        const trebleRatio = treble / total;

        let newMood: Mood;

        if (bassRatio > 0.4) {
          newMood = 'dark';
        } else if (trebleRatio > 0.35) {
          newMood = 'energetic';
        } else if (midRatio > 0.4) {
          newMood = 'happy';
        } else {
          newMood = 'chill';
        }
        
        setMood(newMood);
        toast({ title: "Mood Detected", description: `The vibe is ${newMood}!` });
      }

    } catch (error) {
      console.error("Error analyzing mood:", error);
      // fallback to random if analysis fails
      const moods: Mood[] = ['happy', 'dark', 'chill', 'energetic'];
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      setMood(randomMood);
    } finally {
        // Revert player state
        if (player.current) {
            if (!originalState.isPlaying) {
                player.current.stop();
                Tone.Transport.stop();
                const seekTime = originalState.progress * player.current.buffer.duration;
                if(isFinite(seekTime)) {
                    player.current.seek(seekTime);
                }
            }
            player.current.mute = originalState.isMuted;
        }
    }
  }, [toast]);

  
  const loadAudio = useCallback(async (url: string) => {
    if (!player.current) return;
    setIsLoading(true);
    setAudioSrc(url);

    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    setIsPlaying(false);
    setProgress(0);

    try {
      await player.current.load(url);
      setIsLoading(false);
      await analyzeAndSetMood();
    } catch(err) {
      console.error("Error loading audio:", err);
      toast({ variant: 'destructive', title: "Audio Error", description: "Failed to load audio." });
      setIsLoading(false);
    }
  }, [analyzeAndSetMood, toast]);

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
      Tone.Transport.pause();
      setIsPlaying(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    } else {
      await Tone.start();
      
      const currentProgress = player.current.progress;
      if (currentProgress >= 1 || !isFinite(currentProgress)) { 
          player.current.seek(0);
          setProgress(0);
      }
      
      const startTime = player.current.progress * player.current.buffer.duration;
      if (isFinite(startTime)) {
        player.current.start(undefined, startTime);
        Tone.Transport.start();
        setIsPlaying(true);
        animationFrameId.current = requestAnimationFrame(updateProgress);
      } else {
        console.error("Cannot start playback, invalid start time.");
      }
    }
  }, [isPlaying, updateProgress]);

  const seek = useCallback((progress: number) => {
    if (player.current && player.current.loaded) {
      const duration = player.current.buffer.duration;
      if(isFinite(duration) && isFinite(progress)) {
        const newTime = duration * progress;
        if (isFinite(newTime)) {
          player.current.seek(newTime);
          setProgress(progress);
        }
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
