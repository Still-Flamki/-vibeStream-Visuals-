
"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import * as Tone from 'tone';
import type { Mood, VisualizationType, VideoQuality } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { VisualizerControls } from '@/components/visualizer/visualizer-props';
import { type ThreeSceneHandle } from '@/components/visualizer/three-scene';
import { analyzeMood } from '@/ai/flows/mood-detection';

interface VisualizerContextType {
  loadAudioFile: (file: File) => void;
  loadAudioUrl: (url: string) => void;
  togglePlay: () => void;
  seek: (progress: number) => void;
  analyserNode: Tone.Analyser | null;
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
  startRecording: (threeSceneRef: React.RefObject<ThreeSceneHandle>, quality: VideoQuality) => boolean;
  stopRecording: () => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
}

const VisualizerContext = createContext<VisualizerContextType | undefined>(undefined);

const qualitySettings = {
  '720p': { vertical: 720, bitrate: 5 * 1000 * 1000 },
  '1080p': { vertical: 1080, bitrate: 8 * 1000 * 1000 },
  '4k': { vertical: 2160, bitrate: 20 * 1000 * 1000 },
};

export const aspectRatios: { [key: string]: { label: string; value: number, isMobile: boolean } } = {
  '16:9': { label: 'Widescreen (16:9)', value: 16 / 9, isMobile: false },
  '2.39:1': { label: 'Cinematic (2.39:1)', value: 2.39 / 1, isMobile: false },
};

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<Mood>('chill');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('sphere_pulse');
  const [aspectRatio, setAspectRatio] = useState('2.39:1');
  const [analyserNode, setAnalyserNode] = useState<Tone.Analyser | null>(null);
  const [controls, setControls] = useState<VisualizerControls>({
    particleSize: 0.8,
    bassSensitivity: 1.0,
    trebleSensitivity: 1.0,
    rotation: {
      speed: 0.5,
      direction: 'right',
      x: 0,
      y: 0,
      z: 0,
    }
  });
  const [isRecording, setIsRecording] = useState(false);

  const player = useRef<Tone.Player | null>(null);
  const animationFrameId = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const isConnected = useRef(false);

  const cleanup = useCallback(() => {
    console.log("Cleaning up Tone.js objects");
    
    if (Tone.Transport.state !== 'stopped') {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
    }
    
    if (player.current) {
        player.current.unsync();
        player.current.disconnect();
        player.current.dispose();
        player.current = null;
    }
    
    if (analyserNode) {
        analyserNode.dispose();
        setAnalyserNode(null);
    }

    if(animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    setAudioSrc(null);
    setFileName(null);
    setIsPlaying(false);
    setProgress(0);
    isConnected.current = false;
  }, [analyserNode]);
  
  useEffect(() => {
    if (!streamDestinationRef.current) {
      streamDestinationRef.current = Tone.context.createMediaStreamDestination();
    }
    return () => cleanup();
  }, [cleanup]);

  const analyzeAndSetMood = useCallback(async (trackName: string) => {
    if (!player.current?.loaded) return;
    try {
      const newMood = await analyzeMood(trackName);
      setMood(newMood);
    } catch (e) {
      console.error("Mood analysis failed:", e);
    }
  }, []);

  const loadAudio = useCallback(async (url: string, name?: string) => {
    if (isLoading) return;
    
    if (player.current) {
      cleanup();
    }
    setIsLoading(true);

    try {
      const newPlayer = new Tone.Player({
          url,
          onload: () => {
              player.current = newPlayer;
              setAudioSrc(url);
              const trackName = name || url.split('/').pop() || "Audio Track";
              setFileName(trackName);
              
              const newAnalyser = new Tone.Analyser('fft', 1024);
              setAnalyserNode(newAnalyser);
              
              analyzeAndSetMood(trackName);
              setIsLoading(false);
              toast({ title: "Audio Ready", description: `"${trackName}" is loaded. Press play to start.` });
          },
          onerror: (err) => {
             console.error("Tone.Player error:", err);
             toast({ variant: 'destructive', title: "Audio Error", description: "Failed to load audio file. It may be corrupt or in an unsupported format." });
             cleanup();
             setIsLoading(false);
          }
      });
      await newPlayer.load(url);
    } catch(err) {
      console.error("Error loading audio:", err);
      toast({ variant: 'destructive', title: "Audio Error", description: "Could not load audio. The URL may be invalid or protected by CORS." });
      cleanup();
      setIsLoading(false);
    }
  }, [cleanup, analyzeAndSetMood, toast, isLoading]);

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
        const duration = player.current.buffer.duration;
        if (duration > 0) {
          const currentProgress = Tone.Transport.seconds / duration;
          if (isFinite(currentProgress)) {
              setProgress(Math.min(currentProgress, 1));
          }
          if (currentProgress >= 1) {
              Tone.Transport.stop();
              setIsPlaying(false);
              setProgress(1);
              if (animationFrameId.current) {
                  cancelAnimationFrame(animationFrameId.current);
              }
              return;
          }
        }
        animationFrameId.current = requestAnimationFrame(updateProgress);
    }
  }, []);
  
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

  const togglePlay = useCallback(async () => {
    if (!player.current || !player.current.loaded) return;
    
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (!isConnected.current && analyserNode) {
      player.current.connect(analyserNode);
      if (streamDestinationRef.current) {
        player.current.connect(streamDestinationRef.current);
      }
      player.current.toDestination();
      isConnected.current = true;
    }

    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    } else {
        if (progress >= 1) {
          seek(0);
        }
        if (player.current.state === 'stopped') {
            player.current.sync().start(0);
        }
        Tone.Transport.start();
        setIsPlaying(true);
        animationFrameId.current = requestAnimationFrame(updateProgress);
    }
  }, [updateProgress, progress, seek, analyserNode]);

  const startRecording = (threeSceneRef: React.RefObject<ThreeSceneHandle>, quality: VideoQuality, onStop?: () => void) => {
    const canvas = threeSceneRef.current?.getCanvas();
    if (isRecording || !streamDestinationRef.current || !canvas) return false;

    const numericAspectRatio = aspectRatios[aspectRatio].value;
    const height = qualitySettings[quality].vertical;
    const width = Math.round(height * numericAspectRatio);
    const bitrate = qualitySettings[quality].bitrate;

    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
          throw new Error("Could not create 2D context for recording canvas.");
      }

      const videoStream = tempCanvas.captureStream(30); 
      const audioStream = streamDestinationRef.current.stream;
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      mediaRecorderRef.current = new MediaRecorder(combinedStream, { 
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond : bitrate
      });
      
      const drawFrame = () => {
        if (mediaRecorderRef.current?.state !== 'recording') return;
        tempCtx.drawImage(canvas, 0, 0, width, height);
        requestAnimationFrame(drawFrame);
      };
      
      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibestream-visuals-${quality}-${width}x${height}-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        recordedChunksRef.current = [];
        onStop?.();
      };

      mediaRecorderRef.current.start();
      drawFrame();
      setIsRecording(true);
      return true;
    } catch (e) {
      console.error("Recording failed to start:", e);
      toast({ variant: 'destructive', title: 'Recording Error', description: 'Could not start recording. Your browser may not support this feature or codec.' });
      return false;
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const value: VisualizerContextType = {
    loadAudioFile,
    loadAudioUrl,
    togglePlay,
    seek,
    analyserNode: analyserNode,
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
    startRecording,
    stopRecording,
    aspectRatio,
    setAspectRatio,
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

    