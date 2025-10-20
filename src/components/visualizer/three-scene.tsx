"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Analyser } from 'tone';
import type { Mood, VisualizationType } from '@/types';

type ThreeSceneProps = {
  analyserNode: Analyser | null;
  isPlaying: boolean;
  mood: Mood;
  visualizationType: VisualizationType;
};

const moodColors: Record<Mood, { c1: THREE.Color; c2: THREE.Color }> = {
  happy: { c1: new THREE.Color('#FFD700'), c2: new THREE.Color('#FFA500') },
  dark: { c1: new THREE.Color('#8B0000'), c2: new THREE.Color('#4B0082') },
  chill: { c1: new THREE.Color('#00FFFF'), c2: new THREE.Color('#1E90FF') },
  energetic: { c1: new THREE.Color('#FF00FF'), c2: new THREE.Color('#FF4500') },
};

export default function ThreeScene({ analyserNode, isPlaying, mood, visualizationType }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const visualRef = useRef<THREE.Points | THREE.Mesh>();
  const initialPositionsRef = useRef<Float32Array>();
  const clockRef = useRef(new THREE.Clock());

  // Animation and visual logic
  const animate = () => {
    if (!analyserNode || !isPlaying || !visualRef.current) {
        requestAnimationFrame(animate);
        controlsRef.current?.update();
        if(sceneRef.current && cameraRef.current && rendererRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        return;
    };

    const frequencyData = analyserNode.getValue();
    const positionAttribute = (visualRef.current.geometry as THREE.BufferGeometry).getAttribute('position');
    const colorAttribute = (visualRef.current.geometry as THREE.BufferGeometry).getAttribute('color');
    const initialPositions = initialPositionsRef.current!;
    
    if (!(frequencyData instanceof Float32Array) || !positionAttribute || !initialPositions) {
        requestAnimationFrame(animate);
        controlsRef.current?.update();
         if(sceneRef.current && cameraRef.current && rendererRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        return;
    }

    const lowerHalf = frequencyData.slice(0, frequencyData.length / 2);
    const lowerAvg = lowerHalf.reduce((a, b) => a + Math.abs(b), 0) / lowerHalf.length;
    const upperHalf = frequencyData.slice(frequencyData.length / 2);
    const upperAvg = upperHalf.reduce((a, b) => a + Math.abs(b), 0) / upperHalf.length;

    const bassBoost = isFinite(lowerAvg) ? (Math.abs(lowerAvg) / 100) : 0;
    const trebleBoost = isFinite(upperAvg) ? (Math.abs(upperAvg) / 100) : 0;
    const time = clockRef.current.getElapsedTime();

    const { c1, c2 } = moodColors[mood];

    for (let i = 0; i < positionAttribute.count; i++) {
        const i3 = i * 3;
        const ix = initialPositions[i3];
        const iy = initialPositions[i3 + 1];
        const iz = initialPositions[i3 + 2];

        let x = ix, y = iy, z = iz;
        const freqIndex = i % frequencyData.length;
        const freqValue = isFinite(frequencyData[freqIndex]) ? frequencyData[freqIndex] : 0;

        switch (visualizationType) {
            case 'sphere_pulse': {
                const r = Math.sqrt(ix*ix + iy*iy + iz*iz);
                const displacement = bassBoost * (freqValue / 10);
                const newRadius = r + displacement;
                if (r > 0 && isFinite(newRadius)) {
                    const ratio = newRadius / r;
                    x = ix * ratio;
                    y = iy * ratio;
                    z = iz * ratio;
                }
                break;
            }
            case 'warp_drive': {
                const r = Math.sqrt(ix*ix + iy*iy);
                const angle = Math.atan2(iy, ix);
                const displacement = bassBoost * 50;
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
                y = wave + crest + iy * (1 + freqValue * 0.01);
                break;
            }
        }

        if (isFinite(x) && isFinite(y) && isFinite(z)) {
            positionAttribute.setXYZ(i, x, y, z);
        } else {
            positionAttribute.setXYZ(i, ix, iy, iz);
        }

        if (colorAttribute) {
            const mixFactor = (iy / 100 + 1) / 2;
            const color = c1.clone().lerp(c2, isNaN(mixFactor) ? 0.5 : mixFactor);
            const colorBoost = 1 + trebleBoost * 2 * Math.random();
            color.multiplyScalar(isFinite(colorBoost) ? colorBoost : 1);
            colorAttribute.setXYZ(i, color.r, color.g, color.b);
        }
    }
    
    positionAttribute.needsUpdate = true;
    if (colorAttribute) colorAttribute.needsUpdate = true;

    if (visualRef.current) {
        visualRef.current.rotation.y += 0.0005 + bassBoost * 0.001;
    }
    
    controlsRef.current?.update();
    if(sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    requestAnimationFrame(animate);
  };
  
  // Setup and teardown
  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 100;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 250;
    controlsRef.current = controls;

    // Start animation loop
    const animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      visualRef.current?.geometry.dispose();
      (visualRef.current?.material as THREE.Material)?.dispose();
      scene.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Visual type switching
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clean up previous visual
    if (visualRef.current) {
        sceneRef.current.remove(visualRef.current);
        visualRef.current.geometry.dispose();
        (visualRef.current.material as THREE.Material | THREE.Material[]).dispose();
    }
    
    let geometry: THREE.BufferGeometry;
    let material: THREE.PointsMaterial | THREE.MeshBasicMaterial;
    let newVisual: THREE.Points | THREE.Mesh;
    
    let particleCount: number;

    switch (visualizationType) {
        case 'sphere_pulse':
            particleCount = 5000;
            const spherePositions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const radius = 50 + Math.random() * 10;
                const phi = Math.acos(-1 + (2 * i) / particleCount);
                const theta = Math.sqrt(particleCount * Math.PI) * phi;
                spherePositions[i3] = radius * Math.cos(theta) * Math.sin(phi);
                spherePositions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
                spherePositions[i3 + 2] = radius * Math.cos(phi);
            }
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(spherePositions, 3));
            initialPositionsRef.current = new Float32Array(spherePositions);
            break;
        case 'warp_drive':
            particleCount = 5000;
            const tubePositions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const r = 20 + Math.random() * 10;
                const angle = Math.random() * Math.PI * 2;
                tubePositions[i3] = Math.cos(angle) * r;
                tubePositions[i3 + 1] = Math.sin(angle) * r;
                tubePositions[i3 + 2] = (Math.random() - 0.5) * 200;
            }
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(tubePositions, 3));
            initialPositionsRef.current = new Float32Array(tubePositions);
            break;
        case 'cosmic_web':
            particleCount = 8000;
            const webPositions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                webPositions[i3] = (Math.random() - 0.5) * 150;
                webPositions[i3 + 1] = (Math.random() - 0.5) * 150;
                webPositions[i3 + 2] = (Math.random() - 0.5) * 150;
            }
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(webPositions, 3));
            initialPositionsRef.current = new Float32Array(webPositions);
            break;
        case 'tidal_wave':
            const size = 200;
            const segments = 100;
            const wavePositions = new Float32Array(segments * segments * 3);
            let idx = 0;
             for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const x = (i / segments - 0.5) * size;
                    const z = (j / segments - 0.5) * size;
                    wavePositions[idx++] = x;
                    wavePositions[idx++] = 0; // y
                    wavePositions[idx++] = z;
                }
            }
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
            initialPositionsRef.current = new Float32Array(wavePositions);
            break;
    }
    
    const colors = new Float32Array(positionAttribute.count * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    material = new THREE.PointsMaterial({
        size: visualizationType === 'tidal_wave' ? 1.5 : 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: true,
    });

    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;

    newVisual = new THREE.Points(geometry, material);
    visualRef.current = newVisual;
    sceneRef.current.add(newVisual);

  }, [visualizationType]);
  

  return <div ref={mountRef} className="w-full h-full" />;
}
