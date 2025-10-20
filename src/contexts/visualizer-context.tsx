
"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import * as Tone from 'tone';
import type { Mood, VisualizationType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { VisualizerControls } from '@/components/visualizer/visualizer-props';
import { type ThreeSceneHandle } from '@/components/visualizer/three-scene';

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
  visualizationType: VisualizationType;
  setVisualizationType: (type: VisualizationType) => void;
  controls: VisualizerControls;
  setControls: React.Dispatch<React.SetStateAction<VisualizerControls>>;
  isRecording: boolean;
  toggleRecording: (threeSceneRef: React.RefObject<ThreeSceneHandle>) => void;
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
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('sphere_pulse');
  const [controls, setControls] = useState<VisualizerControls>({
    particleSize: 0.8,
    bassSensitivity: 1.0,
    trebleSensitivity: 1.0,
    rotationSpeed: 0.5,
  });
  const [isRecording, setIsRecording] = useState(false);

  const player = useRef<Tone.Player | null>(null);
  const analyser = useRef<Tone.Analyser | null>(null);
  const animationFrameId = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

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
    streamDestinationRef.current = null;
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

  const analyzeAndSetMood = useCallback(async () => {
    if (!analyser.current) return;

    try {
      // Get the frequency data directly from the live analyser
      const frequencyData = analyser.current.getValue();
      
      if (frequencyData instanceof Float32Array) {
        const fftSize = analyser.current.size;
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
      } else {
        throw new Error("Could not retrieve valid frequency data.");
      }
    } catch (error) {
      console.error("Error analyzing mood:", error);
      // Fallback to random mood if analysis fails
      const moods: Mood[] = ['happy', 'dark', 'chill', 'energetic'];
      setMood(moods[Math.floor(Math.random() * moods.length)]);
    }
  }, []);

  const loadAudio = useCallback(async (url: string, name?: string) => {
    setIsLoading(true);
    cleanup();
    
    try {
      await Tone.start();
      
      analyser.current = new Tone.Analyser('fft', 2048);
      streamDestinationRef.current = Tone.context.createMediaStreamDestination();
      const meter = new Tone.Meter();
      const destinationWithMeter = new Tone.Channel().connect(meter);
      destinationWithMeter.connect(Tone.Destination);
      destinationWithMeter.connect(streamDestinationRef.current);
      
      const newPlayer = new Tone.Player();
      
      newPlayer.fan(analyser.current, destinationWithMeter);
      
      await newPlayer.load(url);
      player.current = newPlayer;

      setAudioSrc(url);
      setFileName(name || url.split('/').pop() || "Audio Track");
      
      setTimeout(() => analyzeAndSetMood(), 500);

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
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
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
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    } else {
       if (player.current.state === 'stopped' || Tone.Transport.state === 'paused') {
          if (!player.current.synced) {
            player.current.sync().start(0);
          }
        }
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

  const startRecording = (threeSceneRef: React.RefObject<ThreeSceneHandle>) => {
    const canvas = threeSceneRef.current?.getCanvas();
    if (isRecording || !streamDestinationRef.current || !canvas) return;

    try {
      // Resize for 4K
      threeSceneRef.current?.resize(3840, 2160);

      const videoStream = canvas.captureStream(30); // 30 FPS
      const audioStream = streamDestinationRef.current.stream;
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      mediaRecorderRef.current = new MediaRecorder(combinedStream, { 
        mimeType: 'video/webm',
        videoBitsPerSecond : 16 * 1000 * 1000 // 16 Mbps
      });
      
      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Resize back to normal
        threeSceneRef.current?.resize();

        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibestream-visuals-4k-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: '4K Recording Started', description: 'Click the record button again to stop and download.' });
    } catch (e) {
      console.error("Recording failed to start:", e);
      toast({ variant: 'destructive', title: 'Recording Error', description: 'Could not start recording. Your browser may not support this feature.' });
      // Resize back if failed
      threeSceneRef.current?.resize();
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    toast({ title: 'Recording Stopped', description: 'Your 4K download will begin shortly.' });
  };
  
  const toggleRecording = (threeSceneRef: React.RefObject<ThreeSceneHandle>) => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(threeSceneRef);
    }
  };

  const value: VisualizerContextType = {
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
    visualizationType,
    setVisualizationType,
    controls,
    setControls,
    isRecording,
    toggleRecording,
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

    