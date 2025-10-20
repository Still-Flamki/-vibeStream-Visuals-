
"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Mood, VisualizationType } from '@/types';
import type { VisualizerControls, ThreeSceneProps } from './visualizer-props';


const moodColors: Record<Mood, { c1: THREE.Color; c2: THREE.Color }> = {
  happy: { c1: new THREE.Color('#FFD700'), c2: new THREE.Color('#FFA500') },
  dark: { c1: new THREE.Color('#8B0000'), c2: new THREE.Color('#4B0082') },
  chill: { c1: new THREE.Color('#00FFFF'), c2: new THREE.Color('#1E90FF') },
  energetic: { c1: new THREE.Color('#FF00FF'), c2: new THREE.Color('#FF4500') },
};

const presetColors: { [key: string]: THREE.Color } = {
  crimson: new THREE.Color('#DC143C'),
  ocean: new THREE.Color('#0077be'),
  lime: new THREE.Color('#32CD32'),
  gold: new THREE.Color('#FFD700'),
  violet: new THREE.Color('#EE82EE'),
  pink: new THREE.Color('#FF69B4'),
};


export interface ThreeSceneHandle {
  getCanvas: () => HTMLCanvasElement | null;
  resize: () => void;
  setAspectRatio: (aspect: number) => void;
}

const ThreeScene = forwardRef<ThreeSceneHandle, ThreeSceneProps>(({ analyserNode, isPlaying, mood, visualizationType, controls, aspectRatio, colorMode, customColor }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const visualRef = useRef<THREE.Points | THREE.Mesh>();
  const initialPositionsRef = useRef<Float32Array>();
  const clockRef = useRef(new THREE.Clock());
  const animationFrameIdRef = useRef<number>(0);

  // Store a mutable reference to the props that the animation loop can access
  const latestProps = useRef({ analyserNode, isPlaying, mood, visualizationType, controls, aspectRatio, colorMode, customColor });
  useEffect(() => {
    latestProps.current = { analyserNode, isPlaying, mood, visualizationType, controls, aspectRatio, colorMode, customColor };
  }, [analyserNode, isPlaying, mood, visualizationType, controls, aspectRatio, colorMode, customColor]);


  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      return rendererRef.current?.domElement || null;
    },
    resize: () => {
      if (rendererRef.current && cameraRef.current && mountRef.current) {
        const { clientWidth, clientHeight } = mountRef.current;
        rendererRef.current.setSize(clientWidth, clientHeight);
        cameraRef.current.aspect = clientWidth > 0 && clientHeight > 0 ? clientWidth / clientHeight : 1;
        cameraRef.current.updateProjectionMatrix();
      }
    },
    setAspectRatio: (aspect: number) => {
       if (cameraRef.current && mountRef.current) {
          cameraRef.current.aspect = aspect > 0 ? aspect : 1;
          cameraRef.current.updateProjectionMatrix();
          ref.current?.resize();
       }
    }
  }));

  const updateVisuals = () => {
    if (!visualRef.current) return;

    const { analyserNode, isPlaying, mood, visualizationType, controls, colorMode } = latestProps.current;
    const geometry = (visualRef.current.geometry as THREE.BufferGeometry);
    if (!geometry) return;
    const positionAttribute = geometry.getAttribute('position');
    const colorAttribute = geometry.getAttribute('color');
    const initialPositions = initialPositionsRef.current;

    if (!positionAttribute || !initialPositions) return;

    let bassBoost = 0;
    let trebleBoost = 0;
    let frequencyData: Float32Array | null = null;
    
    if (analyserNode && isPlaying) {
        const rawFrequencyData = analyserNode.getValue();
        if (rawFrequencyData instanceof Float32Array && rawFrequencyData.length > 0) {
            frequencyData = rawFrequencyData;
            const lowerHalf = frequencyData.slice(0, Math.floor(frequencyData.length / 4));
            const upperHalf = frequencyData.slice(Math.floor(frequencyData.length / 2));
            
            if (lowerHalf.length > 0) {
                const lowerAvg = lowerHalf.reduce((a, b) => a + Math.abs(b), 0) / lowerHalf.length;
                bassBoost = isFinite(lowerAvg) ? (Math.abs(lowerAvg) / 100) * controls.bassSensitivity : 0;
            }
            if(upperHalf.length > 0) {
                const upperAvg = upperHalf.reduce((a, b) => a + Math.abs(b), 0) / upperHalf.length;
                trebleBoost = isFinite(upperAvg) ? (Math.abs(upperAvg) / 100) * controls.trebleSensitivity : 0;
            }
        }
    }
    
    bassBoost = (isFinite(bassBoost) ? bassBoost : 0) * controls.bounceIntensity;
    trebleBoost = (isFinite(trebleBoost) ? trebleBoost : 0) * controls.bounceIntensity;

    const time = clockRef.current.getElapsedTime();
    
    const { c1, c2 } = moodColors[mood];

    for (let i = 0; i < positionAttribute.count; i++) {
        const i3 = i * 3;
        const ix = initialPositions[i3];
        const iy = initialPositions[i3 + 1];
        const iz = initialPositions[i3 + 2];

        let x = ix, y = iy, z = iz;
        const freqIndex = i % (frequencyData?.length || 1);
        const rawFreqValue = (frequencyData && isFinite(frequencyData[freqIndex])) ? frequencyData[freqIndex] : -Infinity;
        const freqValue = rawFreqValue > -100 ? (rawFreqValue + 100) / 100 : 0; // Normalize dB from -100,0 to 0,1

        if (isPlaying) {
            switch (visualizationType) {
                case 'sphere_pulse':
                case 'digital_earth': {
                    const r = Math.sqrt(ix*ix + iy*iy + iz*iz);
                    const displacement = freqValue * bassBoost * 5;
                    const newRadius = r + displacement;
                    if (r > 0 && isFinite(newRadius)) {
                        const ratio = newRadius / r;
                        x = ix * ratio;
                        y = iy * ratio;
                        z = iz * ratio;
                    }
                    break;
                }
                case 'heartbeat': {
                    const r = Math.sqrt(ix*ix + iy*iy + iz*iz);
                    const beat = Math.pow(Math.max(0, Math.sin(time * Math.PI * 2 * (60/120) + r * 0.1)), 10) * bassBoost * 20;
                    const displacement = freqValue * bassBoost * 2 + beat;
                    const newRadius = r + displacement;
                     if (r > 0 && isFinite(newRadius)) {
                        const ratio = newRadius / r;
                        x = ix * ratio;
                        y = iy * ratio;
                        z = iz * ratio;
                    }
                    break;
                }
                case 'galaxy': {
                    const r = Math.sqrt(ix*ix + iy*iy);
                    const angle = Math.atan2(iy, ix);
                    const displacement = freqValue * bassBoost * 0.1;
                    x = r * Math.cos(angle + displacement);
                    y = r * Math.sin(angle + displacement);
                    z = iz + Math.sin(r * 0.1 + time) * trebleBoost;
                    break;
                }
                case 'warp_drive': {
                    const r = Math.sqrt(ix*ix + iy*iy);
                    const angle = Math.atan2(iy, ix);
                    x = r * Math.cos(angle + iz * 0.1 * bassBoost);
                    y = r * Math.sin(angle + iz * 0.1 * bassBoost);
                    z = (iz + time * 50 * (1 + bassBoost)) % 200 - 100;
                    break;
                }
                case 'cosmic_web': {
                    const r = Math.sqrt(ix*ix + iy*iy + iz*iz);
                    const displacement = freqValue * bassBoost * 0.5;
                    const noise = trebleBoost * 5 * (Math.sin(iy * 0.1 + time) + Math.cos(ix * 0.1 + time));
                    if (r > 0 && isFinite(r + displacement + noise)) {
                        const ratio = (r + displacement + noise) / r;
                        x = ix * ratio;
                        y = iy * ratio;
                        z = iz * ratio;
                    }
                    break;
                }
                case 'tidal_wave': {
                    const wave = Math.sin(ix * 0.2 + time * 2) * bassBoost * 20;
                    const crest = Math.pow(Math.max(0, Math.sin(ix * 0.1 + time * 3)), 5) * trebleBoost * 30;
                    const freqDisplacement = freqValue * 10;
                    y = wave + crest + iy + freqDisplacement;
                    break;
                }
                case 'torus_knot': {
                    const r = Math.sqrt(ix * ix + iy * iy + iz * iz);
                    const displacement = freqValue * bassBoost * 0.5;
                    const noise = trebleBoost * (Math.sin(iy * 0.5 + time) + Math.cos(ix * 0.5 + time));
                     if (r > 0 && isFinite(r + displacement + noise)) {
                        const ratio = (r + displacement + noise) / r;
                        x = ix * ratio;
                        y = iy * ratio;
                        z = iz * ratio;
                    }
                    break;
                }
                case 'audio_city': {
                    const barFreqIndex = Math.floor(i / 4) % (frequencyData?.length || 1);
                    const barRawFreqValue = (frequencyData && isFinite(frequencyData[barFreqIndex])) ? frequencyData[barFreqIndex] : -Infinity;
                    const barFreqValue = barRawFreqValue > -100 ? (barRawFreqValue + 100) / 100 : 0;
                    const height = Math.max(0, barFreqValue * 100 * bassBoost);
                    
                    if (i % 4 === 1 || i % 4 === 2) {
                        y = iy + height;
                    } else {
                        y = iy;
                    }
                    break;
                }
            }
        }

        if (isFinite(x) && isFinite(y) && isFinite(z)) {
            positionAttribute.setXYZ(i, x, y, z);
        } else {
            positionAttribute.setXYZ(i, ix, iy, iz); // Fallback to initial position
        }

        if (colorAttribute) {
            let color: THREE.Color;
            switch(colorMode) {
                case 'mood':
                    const mixFactor = (iy / 100 + 1) / 2;
                    color = c1.clone().lerp(c2, isNaN(mixFactor) ? 0.5 : mixFactor);
                    break;
                case 'multicolor':
                    const hue = (time * 0.1 + ix * 0.01) % 1;
                    color = new THREE.Color().setHSL(hue, 1, 0.5);
                    break;
                case 'crimson':
                case 'ocean':
                case 'lime':
                case 'gold':
                case 'violet':
                case 'pink':
                    color = presetColors[colorMode].clone();
                    break;
                default:
                    color = new THREE.Color(0xffffff);
                    break;
            }
            
            const colorBoost = 1 + trebleBoost * 2 * Math.random();
            color.multiplyScalar(isFinite(colorBoost) ? colorBoost : 1);
            colorAttribute.setXYZ(i, color.r, color.g, color.b);
        }
    }
    
    positionAttribute.needsUpdate = true;
    if (colorAttribute) colorAttribute.needsUpdate = true;

    if (visualRef.current) {
      if (controls.rotation.direction === 'left') {
        visualRef.current.rotation.y -= (0.0005 + bassBoost * 0.001) * controls.rotation.speed;
      } else if (controls.rotation.direction === 'right') {
        visualRef.current.rotation.y += (0.0005 + bassBoost * 0.001) * controls.rotation.speed;
      } else {
        visualRef.current.rotation.x = THREE.MathUtils.lerp(visualRef.current.rotation.x, controls.rotation.x, 0.1);
        visualRef.current.rotation.y = THREE.MathUtils.lerp(visualRef.current.rotation.y, controls.rotation.y, 0.1);
        visualRef.current.rotation.z = THREE.MathUtils.lerp(visualRef.current.rotation.z, controls.rotation.z, 0.1);
      }
    }
  };

  // Setup and teardown
  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const aspect = currentMount.clientWidth / currentMount.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect > 0 ? aspect : 1, 0.1, 1000);
    camera.position.z = 100;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // Controls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.minDistance = 50;
    orbitControls.maxDistance = 250;
    orbitControlsRef.current = orbitControls;

    // Animation and visual logic
    const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);

        if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
        
        orbitControlsRef.current?.update();

        updateVisuals();
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Start animation loop
    animate();

    const handleResize = () => {
        if (ref.current) {
            ref.current.resize();
        }
    };
    window.addEventListener('resize', handleResize);
    // Initial resize after a short delay to ensure layout is stable
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameIdRef.current);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      visualRef.current?.geometry.dispose();
      if (visualRef.current?.material) {
        if (Array.isArray(visualRef.current.material)) {
          visualRef.current.material.forEach(m => m.dispose());
        } else {
          (visualRef.current.material as THREE.Material).dispose();
        }
      }
      scene.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update aspect ratio when prop changes
  useEffect(() => {
    if (ref.current) {
        ref.current.setAspectRatio(aspectRatio);
    }
  }, [aspectRatio, ref]);

  // Visual type switching
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clean up previous visual
    if (visualRef.current) {
        sceneRef.current.remove(visualRef.current);
        visualRef.current.geometry.dispose();
         if (visualRef.current?.material) {
            if (Array.isArray(visualRef.current.material)) {
              visualRef.current.material.forEach(m => m.dispose());
            } else {
              (visualRef.current.material as THREE.Material).dispose();
            }
        }
    }
    
    let geometry: THREE.BufferGeometry;
    let newVisual: THREE.Points | THREE.Mesh;
    let particleCount: number;
    let positions: Float32Array;

    switch (visualizationType) {
        case 'digital_earth': {
            particleCount = 10000;
            positions = new Float32Array(particleCount * 3);
            const radius = 50;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const phi = Math.acos(-1 + (2 * i) / particleCount);
                const theta = Math.sqrt(particleCount * Math.PI) * phi;

                const isLand = (Math.sin(phi * 5) * Math.cos(theta * 7) + Math.sin(phi * 3) * Math.sin(theta * 5)) > 0.3;
                
                let r = radius;
                if (!isLand) {
                    r = radius * 0.98; // Place water slightly inside
                }
                
                positions[i3] = r * Math.cos(theta) * Math.sin(phi);
                positions[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
                positions[i3 + 2] = r * Math.cos(phi);
            }
            break;
        }
        case 'heartbeat': {
            particleCount = 5000;
            positions = new Float32Array(particleCount * 3);
             for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const t = Math.random() * Math.PI * 2;
                const x = 16 * Math.pow(Math.sin(t), 3) * 3;
                const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 3;
                const z = (Math.random() - 0.5) * 10;
                positions[i3] = x;
                positions[i3+1] = y;
                positions[i3+2] = z;
            }
            break;
        }
        case 'galaxy':
            particleCount = 15000;
            positions = new Float32Array(particleCount * 3);
            const arms = 4;
            const armAngle = 2 * Math.PI / arms;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const r = Math.random() * 80;
                const spin = r * 0.1;
                const armIndex = Math.floor(Math.random() * arms);
                const angle = armIndex * armAngle + Math.random() * 0.2 - 0.1 + spin;
                
                positions[i3] = Math.cos(angle) * r;
                positions[i3+1] = Math.sin(angle) * r;
                positions[i3+2] = (Math.random() - 0.5) * 5;
            }
            break;
        case 'sphere_pulse':
            particleCount = 5000;
            positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const radius = 50 + Math.random() * 10;
                const phi = Math.acos(-1 + (2 * i) / particleCount);
                const theta = Math.sqrt(particleCount * Math.PI) * phi;
                positions[i3] = radius * Math.cos(theta) * Math.sin(phi);
                positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
                positions[i3 + 2] = radius * Math.cos(phi);
            }
            break;
        case 'warp_drive':
            particleCount = 5000;
            positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const r = 20 + Math.random() * 10;
                const angle = Math.random() * Math.PI * 2;
                positions[i3] = Math.cos(angle) * r;
                positions[i3 + 1] = Math.sin(angle) * r;
                positions[i3 + 2] = (Math.random() - 0.5) * 200;
            }
            break;
        case 'cosmic_web':
            particleCount = 8000;
            positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * 150;
                positions[i3 + 1] = (Math.random() - 0.5) * 150;
                positions[i3 + 2] = (Math.random() - 0.5) * 150;
            }
            break;
        case 'torus_knot':
            particleCount = 10000;
            positions = new Float32Array(particleCount * 3);
            const p = 2, q = 3;
            const radius = 30;
            const tube = 15;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const u = (i / particleCount) * Math.PI * 2 * p;
                const r = Math.cos(q * u) + radius;
                const x = r * Math.cos(p * u);
                const y = r * Math.sin(p * u);
                const z = -Math.sin(q * u) * tube;
                
                const randomRadius = Math.random() * tube;
                const randomAngle = Math.random() * Math.PI * 2;
                const randomAngle2 = Math.random() * Math.PI * 2;

                positions[i3] = x + Math.cos(randomAngle) * randomRadius;
                positions[i3 + 1] = y + Math.sin(randomAngle) * randomRadius;
                positions[i3 + 2] = z + Math.sin(randomAngle2) * randomRadius;
            }
            break;
         case 'audio_city':
            const citySize = 50;
            const barWidth = 4;
            const barSpacing = 2;
            const positionsList: number[] = [];
            for (let i = -citySize; i < citySize; i += barWidth + barSpacing) {
                for (let j = -citySize; j < citySize; j += barWidth + barSpacing) {
                    const x = i;
                    const z = j;
                    // Define a quad for the top of the bar
                    positionsList.push(x, 0, z);
                    positionsList.push(x + barWidth, 0, z);
                    positionsList.push(x + barWidth, 0, z + barWidth);
                    positionsList.push(x, 0, z + barWidth);
                }
            }
            positions = new Float32Array(positionsList);
            break;
        case 'tidal_wave':
        default:
            const size = 200;
            const segments = 100;
            positions = new Float32Array(segments * segments * 3);
            let idx = 0;
             for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const x = (i / segments - 0.5) * size;
                    const z = (j / segments - 0.5) * size;
                    positions[idx++] = x;
                    positions[idx++] = 0; // y
                    positions[idx++] = z;
                }
            }
            break;
    }
    
    geometry = new THREE.BufferGeometry();
    initialPositionsRef.current = new Float32Array(positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(initialPositionsRef.current.slice(), 3));

    const colors = new Float32Array(positions.length);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    let material: THREE.PointsMaterial | THREE.MeshBasicMaterial;

    if (visualizationType === 'audio_city') {
        const indices: number[] = [];
        const numQuads = positions.length / 3 / 4;
        for (let i = 0; i < numQuads; i++) {
            const base = i * 4;
            indices.push(base, base + 1, base + 2);
            indices.push(base, base + 2, base + 3);
        }
        geometry.setIndex(indices);
        material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide
        });
        newVisual = new THREE.Mesh(geometry, material);
    } else {
        material = new THREE.PointsMaterial({
            size: controls.particleSize * (visualizationType === 'tidal_wave' ? 1.5 : 1),
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true,
        });
        newVisual = new THREE.Points(geometry, material);
    }

    visualRef.current = newVisual;
    sceneRef.current.add(newVisual);

  }, [visualizationType, controls.particleSize]);

  // Update material based on controls
  useEffect(() => {
    if (visualRef.current && 'material' in visualRef.current) {
        const material = (visualRef.current as THREE.Points).material;
        if (material && 'size' in material) {
            (material as THREE.PointsMaterial).size = controls.particleSize * (visualizationType === 'tidal_wave' ? 1.5 : 1);
            material.needsUpdate = true;
        }
    }
  }, [controls.particleSize, visualizationType]);
  

  return <div ref={mountRef} className="w-full h-full" />;
});

ThreeScene.displayName = 'ThreeScene';
export default ThreeScene;
