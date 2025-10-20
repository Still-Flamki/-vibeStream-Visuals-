


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
  const visualRef = useRef<THREE.Points | THREE.Mesh | THREE.Group>();
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
    
    if (visualizationType === 'audio_sword' && visualRef.current instanceof THREE.Group) {
      if(analyserNode && isPlaying) {
        const rawFrequencyData = analyserNode.getValue();
        if (rawFrequencyData instanceof Float32Array && rawFrequencyData.length > 0) {
            const lowerHalf = rawFrequencyData.slice(0, Math.floor(rawFrequencyData.length / 4));
            let bassBoost = 0;
            if (lowerHalf.length > 0) {
                const lowerAvg = lowerHalf.reduce((a, b) => a + Math.abs(b), 0) / lowerHalf.length;
                bassBoost = isFinite(lowerAvg) ? (Math.abs(lowerAvg) / 100) * controls.bassSensitivity : 0;
            }
            bassBoost = (isFinite(bassBoost) ? bassBoost : 0) * controls.bounceIntensity;
            
            const blade = visualRef.current.children[0] as THREE.Mesh;
            const bladeMaterial = blade.material as THREE.MeshPhysicalMaterial;
            bladeMaterial.emissiveIntensity = THREE.MathUtils.lerp(bladeMaterial.emissiveIntensity, bassBoost * 5, 0.2);
        }
      } else {
        const blade = visualRef.current.children[0] as THREE.Mesh;
        const bladeMaterial = blade.material as THREE.MeshPhysicalMaterial;
        bladeMaterial.emissiveIntensity = THREE.MathUtils.lerp(bladeMaterial.emissiveIntensity, 0, 0.1);
      }
      
      visualRef.current.rotation.y += 0.005 * controls.rotation.speed;
      return;
    }


    if (visualizationType === 'audio_city' && visualRef.current instanceof THREE.Group) {
      // Logic for Audio City (Group of Meshes)
      if (analyserNode && isPlaying) {
          const frequencyData = analyserNode.getValue();
          if (frequencyData instanceof Float32Array && frequencyData.length > 0) {
            visualRef.current.children.forEach((mesh, index) => {
              const barFreqIndex = index % frequencyData.length;
              const barRawFreqValue = isFinite(frequencyData[barFreqIndex]) ? frequencyData[barFreqIndex] : -Infinity;
              const barFreqValue = barRawFreqValue > -100 ? (barRawFreqValue + 100) / 100 : 0; // Normalize dB from -100,0 to 0,1
              
              const targetScaleY = Math.max(0.01, barFreqValue * 50 * controls.bassSensitivity);
              const targetPositionY = targetScaleY / 2;

              mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetScaleY, 0.2);
              mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetPositionY, 0.2);

              if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshBasicMaterial) {
                const hue = (index * 0.05) % 1;
                mesh.material.color.setHSL(hue, 1, 0.5 + barFreqValue * 0.5);
              }
            });
          }
      } else {
        // Smoothly scale down when not playing
        visualRef.current.children.forEach((mesh) => {
           mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, 0.01, 0.1);
           mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, 0.01 / 2, 0.1);
        });
      }
      return; // End update for audio city
    }


    // Logic for Particle-based visuals
    const geometry = (visualRef.current as THREE.Points | THREE.Mesh)?.geometry as THREE.BufferGeometry;
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
                 case 'aurora_borealis': {
                    const wave1 = Math.sin(ix * 0.01 + time * 0.5 + iz * 0.005) * bassBoost * 30;
                    const wave2 = Math.cos(ix * 0.005 - time * 0.3 + iz * 0.01) * trebleBoost * 20;
                    y = iy + wave1 + wave2;
                    break;
                }
                case 'rhythmic_tunnel': {
                    const radius = 20 + bassBoost * 20 + freqValue * 10;
                    const angle = Math.atan2(iy, ix);
                    x = Math.cos(angle) * radius;
                    y = Math.sin(angle) * radius;
                    z = (iz + time * 50) % 200 - 100;
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
                case 'rainbow_shift':
                    const hue = (time * 0.1 + ix * 0.01 + iy * 0.01) % 1;
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

    if (visualRef.current && !(visualRef.current instanceof THREE.Group)) {
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

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);

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

      if (visualRef.current) {
        if (visualRef.current instanceof THREE.Group) {
            visualRef.current.children.forEach(child => {
                const mesh = child as THREE.Mesh;
                mesh.geometry.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    (mesh.material as THREE.Material).dispose();
                }
            });
        } else {
            (visualRef.current as THREE.Points | THREE.Mesh).geometry.dispose();
            const material = (visualRef.current as THREE.Points | THREE.Mesh).material;
             if (Array.isArray(material)) {
                material.forEach(m => m.dispose());
            } else {
                material.dispose();
            }
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
    if (!sceneRef.current || !cameraRef.current || !orbitControlsRef.current) return;

    // Reset camera and controls for specific views
    cameraRef.current.position.set(0, 0, 100);
    orbitControlsRef.current.minDistance = 5;
    orbitControlsRef.current.maxDistance = 500;


    // Clean up previous visual
    if (visualRef.current) {
        sceneRef.current.remove(visualRef.current);
        // Proper disposal
        if (visualRef.current instanceof THREE.Group) {
            visualRef.current.children.forEach(child => {
                const mesh = child as THREE.Mesh;
                mesh.geometry.dispose();
                 if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    (mesh.material as THREE.Material).dispose();
                }
            });
        } else if (visualRef.current.geometry) {
            visualRef.current.geometry.dispose();
        }

        if ('material' in visualRef.current && visualRef.current.material) {
            if (Array.isArray(visualRef.current.material)) {
                visualRef.current.material.forEach(m => m.dispose());
            } else {
                (visualRef.current.material as THREE.Material).dispose();
            }
        }
        visualRef.current = undefined;
    }
    
    let geometry: THREE.BufferGeometry | undefined;
    let newVisual: THREE.Points | THREE.Mesh | THREE.Group | undefined;
    let particleCount: number;
    let positions: Float32Array;

    switch (visualizationType) {
        case 'audio_sword': {
            const sword = new THREE.Group();

            const bladeMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xc0c0c0,
                metalness: 1,
                roughness: 0.2,
                reflectivity: 1,
                clearcoat: 1,
                clearcoatRoughness: 0.1,
                emissive: moodColors[mood].c1,
                emissiveIntensity: 0,
            });
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 1), bladeMaterial);
            blade.position.y = 4;
            sword.add(blade);

            const guardMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });
            const guard = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1.5), guardMaterial);
            guard.position.y = 0;
            sword.add(guard);

            const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2e05, roughness: 0.8, metalness: 0.1 });
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 16), handleMaterial);
            handle.position.y = -2;
            sword.add(handle);

            const pommelMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1, roughness: 0.3 });
            const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), pommelMaterial);
            pommel.position.y = -3.8;
            sword.add(pommel);
            
            sword.scale.set(5, 5, 5); // Scale up the sword to be visible
            sword.position.y = 10;
            newVisual = sword;
            cameraRef.current.position.set(0, 15, 30);
            orbitControlsRef.current.target.set(0,10,0);
            break;
        }
        case 'digital_earth': {
            particleCount = 10000;
            positions = new Float32Array(particleCount * 3);
            const radius = 50;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const phi = Math.acos(-1 + (2 * i) / particleCount);
                const theta = Math.sqrt(particleCount * Math.PI) * phi;

                const isLand = (Math.sin(phi * 5) * Math.cos(theta * 7) + Math.sin(phi * 3) * Math.sin(theta * 5)) > 0.3;
                
                let r = isLand ? radius : radius * 0.98; // Place water slightly inside
                
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
                positions[i3] = x + (Math.random() - 0.5) * 5;
                positions[i3+1] = y + (Math.random() - 0.5) * 5;
                positions[i3+2] = z + (Math.random() - 0.5) * 5;
            }
            break;
        }
        case 'galaxy': {
            particleCount = 20000;
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
        }
        case 'sphere_pulse': {
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
        }
        case 'warp_drive': {
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
        }
        case 'cosmic_web': {
            particleCount = 8000;
            positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * 150;
                positions[i3 + 1] = (Math.random() - 0.5) * 150;
                positions[i3 + 2] = (Math.random() - 0.5) * 150;
            }
            break;
        }
        case 'torus_knot': {
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
        }
         case 'audio_city': {
            const cityGroup = new THREE.Group();
            const citySize = 100;
            const gridSize = 20;

            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    const barWidth = Math.random() * 3 + 2;
                    const barDepth = Math.random() * 3 + 2;
                    const boxGeometry = new THREE.BoxGeometry(barWidth, 1, barDepth);
                    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    const bar = new THREE.Mesh(boxGeometry, boxMaterial);
                    
                    const x = (i / (gridSize -1) - 0.5) * citySize + (Math.random() - 0.5) * 5;
                    const z = (j / (gridSize -1) - 0.5) * citySize + (Math.random() - 0.5) * 5;

                    bar.position.set(x, 0.5, z);
                    bar.scale.y = 0.01; // Start flat
                    cityGroup.add(bar);
                }
            }
            newVisual = cityGroup;
            cameraRef.current.position.set(0, 80, 120); // Adjust camera for better view
            break;
        }
        case 'aurora_borealis': {
            const ribbonCount = 10;
            const ribbonLength = 200;
            const ribbonWidth = 20;
            const segments = 50;
            const allPositions: number[] = [];
            for(let r = 0; r < ribbonCount; r++) {
                const startX = (Math.random() - 0.5) * 200;
                const startZ = (Math.random() - 0.5) * 50 - 20;
                for(let i = 0; i < segments; i++) {
                    const x1 = startX + (i/segments) * ribbonLength - ribbonLength / 2;
                    const x2 = startX + ((i+1)/segments) * ribbonLength - ribbonLength / 2;

                    allPositions.push(x1, -ribbonWidth, startZ);
                    allPositions.push(x2, -ribbonWidth, startZ);
                    allPositions.push(x2, ribbonWidth, startZ);

                    allPositions.push(x1, -ribbonWidth, startZ);
                    allPositions.push(x2, ribbonWidth, startZ);
                    allPositions.push(x1, ribbonWidth, startZ);
                }
            }
            positions = new Float32Array(allPositions);
            break;
        }
        case 'rhythmic_tunnel': {
            const numRings = 50;
            const segmentsPerRing = 64;
            const tunnelLength = 200;
            particleCount = numRings * segmentsPerRing;
            positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < numRings; i++) {
                const z = (i / numRings - 0.5) * tunnelLength;
                for (let j = 0; j < segmentsPerRing; j++) {
                    const angle = (j / segmentsPerRing) * Math.PI * 2;
                    const idx = (i * segmentsPerRing + j) * 3;
                    positions[idx] = Math.cos(angle) * 20; // Initial radius
                    positions[idx + 1] = Math.sin(angle) * 20;
                    positions[idx + 2] = z;
                }
            }
            cameraRef.current.position.set(0, 0, 0); // Fly through the tunnel
            break;
        }
        case 'tidal_wave':
        default:
            const size = 200;
            const segments = 100;
            particleCount = segments * segments * 6;
            positions = new Float32Array(particleCount * 3);
            let idx = 0;
             for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const x1 = (i / segments - 0.5) * size;
                    const z1 = (j / segments - 0.5) * size;
                    const x2 = ((i+1) / segments - 0.5) * size;
                    const z2 = ((j+1) / segments - 0.5) * size;

                    // Triangle 1
                    positions[idx++] = x1; positions[idx++] = 0; positions[idx++] = z1;
                    positions[idx++] = x2; positions[idx++] = 0; positions[idx++] = z1;
                    positions[idx++] = x1; positions[idx++] = 0; positions[idx++] = z2;
                    
                    // Triangle 2
                    positions[idx++] = x2; positions[idx++] = 0; positions[idx++] = z1;
                    positions[idx++] = x2; positions[idx++] = 0; positions[idx++] = z2;
                    positions[idx++] = x1; positions[idx++] = 0; positions[idx++] = z2;
                }
            }
            break;
    }
    
    if ((visualizationType !== 'audio_city' && visualizationType !== 'audio_sword') && positions) {
        geometry = new THREE.BufferGeometry();
        initialPositionsRef.current = new Float32Array(positions);
        geometry.setAttribute('position', new THREE.BufferAttribute(initialPositionsRef.current.slice(), 3));

        const colors = new Float32Array(positions.length);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        let material: THREE.Material;

        if (visualizationType === 'tidal_wave' || visualizationType === 'aurora_borealis') {
             material = new THREE.MeshBasicMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: visualizationType === 'aurora_borealis' ? 0.7 : 1.0,
            });
            newVisual = new THREE.Mesh(geometry, material);
        } else {
            material = new THREE.PointsMaterial({
                size: controls.particleSize,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true,
                sizeAttenuation: true,
            });
            newVisual = new THREE.Points(geometry, material);
        }
    }


    if (newVisual) {
        visualRef.current = newVisual;
        sceneRef.current.add(newVisual);
    } else {
        // Fallback or error handling
        console.warn(`No visual could be created for type: ${visualizationType}`);
    }


  }, [visualizationType, controls.particleSize, mood]);

  // Update material based on controls
  useEffect(() => {
    if (visualRef.current && 'material' in visualRef.current && visualRef.current.material) {
        if (visualRef.current instanceof THREE.Points) {
            const material = visualRef.current.material as THREE.PointsMaterial;
            if (material && 'size' in material) {
                material.size = controls.particleSize;
                material.needsUpdate = true;
            }
        }
    }
  }, [controls.particleSize]);
  

  return <div ref={mountRef} className="w-full h-full" />;
});

ThreeScene.displayName = 'ThreeScene';
export default ThreeScene;

    
