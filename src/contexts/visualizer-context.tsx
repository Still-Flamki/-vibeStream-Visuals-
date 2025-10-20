
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

  useEffect(() => {
    analyser.current = new Tone.Analyser('fft', 2048);
    player.current = new Tone.Player().chain(analyser.current, Tone.Destination);
    player.current.sync().start(0);

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
      const currentProgress = (Tone.Transport.seconds / player.current.buffer.duration);
      if (isFinite(currentProgress)) {
        setProgress(currentProgress);
        if (currentProgress >= 1) {
          setIsPlaying(false);
          Tone.Transport.stop();
          setProgress(1); 
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
          return;
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(updateProgress);
  }, []);

  const analyzeAndSetMood = useCallback(async () => {
    if (!analyser.current || !player.current || !player.current.loaded) return;
    
    const wasPlaying = Tone.Transport.state === 'started';
    const originalTime = Tone.Transport.seconds;
    
    if (wasPlaying) {
        Tone.Transport.pause();
    }

    try {
        await Tone.start();
        
        // Temporarily mute, seek to middle, play a short snippet, then restore.
        player.current.mute = true;
        const middleTime = player.current.buffer.duration / 2;
        player.current.seek(middleTime);
        player.current.start(Tone.now());
        
        // Wait for analysis
        await new Promise(res => setTimeout(res, 300));
        const frequencyData = analyser.current.getValue();
        player.current.stop();
        player.current.mute = false;
        
        if (frequencyData instanceof Float32Array) {
            const fftSize = analyser.current.size;
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
            toast({ title: "Mood Detected", description: `The vibe is ${newMood}!` });
        }
    } catch (error) {
      console.error("Error analyzing mood:", error);
      const moods: Mood[] = ['happy', 'dark', 'chill', 'energetic'];
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      setMood(randomMood);
    } finally {
        if (player.current) {
            player.current.stop();
            Tone.Transport.seconds = originalTime;
            if (wasPlaying) {
                Tone.Transport.start(undefined, originalTime);
            }
        }
    }
  }, [toast]);
  
  const loadAudio = useCallback(async (url: string, name?: string) => {
    if (!player.current) return;
    setIsLoading(true);
    setAudioSrc(null);
    setFileName(null);
    
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    }
    setIsPlaying(false);
    setProgress(0);
    Tone.Transport.seconds = 0;

    try {
      await player.current.load(url);
      setAudioSrc(url);
      setFileName(name || url.split('/').pop() || "Audio Track");
      setIsLoading(false);
      await analyzeAndSetMood();
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
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    } else {
       if (progress >= 1) { // If at the end, restart from 0
        Tone.Transport.seconds = 0;
        setProgress(0);
      }
      Tone.Transport.start();
      setIsPlaying(true);
      animationFrameId.current = requestAnimationFrame(updateProgress);
    }
  }, [progress, updateProgress]);


  const seek = useCallback((newProgress: number) => {
    if (player.current && player.current.loaded) {
      const duration = player.current.buffer.duration;
      if(isFinite(duration) && isFinite(newProgress)) {
        const newTime = duration * newProgress;
        if (isFinite(newTime)) {
          Tone.Transport.seconds = newTime;
          setProgress(newProgress);
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
