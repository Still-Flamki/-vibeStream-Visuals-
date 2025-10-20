
"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import * as Tone from 'tone';
import type { Mood, VisualizationType, VideoQuality } from '@/types';
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
  '16:9': { label: 'Widescreen (16:9)', value: 16 / 9, isMobile: true },
  '9:16': { label: 'Portrait (9:16)', value: 9 / 16, isMobile: true },
  '1:1': { label: 'Square (1:1)', value: 1 / 1, isMobile: false },
  '4:5': { label: 'Social (4:5)', value: 4 / 5, isMobile: true },
  '2.39:1': { label: 'Cinematic (2.39:1)', value: 2.39 / 1, isMobile: true },
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
  const [aspectRatio, setAspectRatio] = useState('16:9');
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
    if (!analyser.current || !player.current?.loaded) return;

    try {
      // Analyze a buffer to get a good overview
      const buffer = player.current.buffer.get() as AudioBuffer;
      const offlineContext = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const bufferSource = offlineContext.createBufferSource();
      bufferSource.buffer = buffer;
      const offlineAnalyser = offlineContext.createAnalyser();
      offlineAnalyser.fftSize = 2048;
      bufferSource.connect(offlineAnalyser);
      bufferSource.start();
      await offlineContext.startRendering();
      
      const frequencyData = new Float32Array(offlineAnalyser.frequencyBinCount);
      offlineAnalyser.getFloatFrequencyData(frequencyData);

      const fftSize = offlineAnalyser.fftSize;
      const sampleRate = offlineContext.sampleRate;
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
      
      player.current = new Tone.Player(url, async () => {
        // This callback runs after the buffer is loaded
        setAudioSrc(url);
        setFileName(name || url.split('/').pop() || "Audio Track");
        setIsLoading(false);
        // Ensure player is connected before analyzing
        if (player.current && analyser.current && streamDestinationRef.current) {
            player.current.fan(analyser.current, Tone.Destination, streamDestinationRef.current);
            analyzeAndSetMood();
        }
      });
      
      await Tone.loaded();

    } catch(err) {
      console.error("Error loading audio:", err);
      toast({ variant: 'destructive', title: "Audio Error", description: "Failed to load audio. The file format may be unsupported or the URL may be invalid/protected by CORS." });
      setAudioSrc(null);
      setFileName(null);
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
        if (isFinite(currentProgress)) {
            setProgress(Math.min(currentProgress, 1));
        }
        
        // Check if playback is effectively over
        if (currentProgress >= 1) {
            // This doesn't stop the transport, just the animation loop requests
            // The transport will be stopped by the 'stop' event on the player or scheduled event
            setIsPlaying(false);
            setProgress(1);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            return;
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
    
    await Tone.start();

    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    } else {
       // If the track is at the end, restart it.
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
  }, [updateProgress, progress, seek]);

  const startRecording = (threeSceneRef: React.RefObject<ThreeSceneHandle>, quality: VideoQuality, onStop?: () => void) => {
    const canvas = threeSceneRef.current?.getCanvas();
    if (isRecording || !streamDestinationRef.current || !canvas) return false;

    const settings = qualitySettings[quality];
    const numericAspectRatio = aspectRatios[aspectRatio].value;
    const width = Math.round(settings.vertical * numericAspectRatio);
    const height = settings.vertical;

    try {
      threeSceneRef.current?.resize();

      const videoStream = canvas.captureStream(30); // 30 FPS
      const audioStream = streamDestinationRef.current.stream;
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      mediaRecorderRef.current = new MediaRecorder(combinedStream, { 
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond : settings.bitrate
      });
      
      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        threeSceneRef.current?.resize();

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
      setIsRecording(true);
      return true;
    } catch (e) {
      console.error("Recording failed to start:", e);
      toast({ variant: 'destructive', title: 'Recording Error', description: 'Could not start recording. Your browser may not support this feature or codec.' });
      threeSceneRef.current?.resize();
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
