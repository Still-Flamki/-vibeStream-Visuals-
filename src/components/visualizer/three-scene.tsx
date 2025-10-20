"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Analyser } from 'tone';
import type { Mood } from '@/types';

type ThreeSceneProps = {
  analyserNode: Analyser | null;
  isPlaying: boolean;
  mood: Mood;
};

const moodColors: Record<Mood, { c1: THREE.Color; c2: THREE.Color }> = {
  happy: { c1: new THREE.Color('#FFD700'), c2: new THREE.Color('#FFA500') },
  dark: { c1: new THREE.Color('#8B0000'), c2: new THREE.Color('#4B0082') },
  chill: { c1: new THREE.Color('#00FFFF'), c2: new THREE.Color('#1E90FF') },
  energetic: { c1: new THREE.Color('#FF00FF'), c2: new THREE.Color('#FF4500') },
};

export default function ThreeScene({ analyserNode, isPlaying, mood }: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<THREE.Points>();
  const initialPositionsRef = useRef<Float32Array>();

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 100;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 200;

    // Particles
    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 50;
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;
        positions[i3] = radius * Math.cos(theta) * Math.sin(phi);
        positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
        positions[i3 + 2] = radius * Math.cos(phi);
    }
    initialPositionsRef.current = new Float32Array(positions);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: true,
    });
    
    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (analyserNode && isPlaying && particles) {
        const frequencyData = analyserNode.getValue();
        const positionAttribute = particles.geometry.getAttribute('position');
        const colorAttribute = particles.geometry.getAttribute('color');
        const initialPositions = initialPositionsRef.current!;

        if (frequencyData instanceof Float32Array && positionAttribute && colorAttribute && initialPositions) {
            const lowerHalf = frequencyData.slice(0, frequencyData.length / 2);
            const lowerAvg = lowerHalf.reduce((a, b) => a + Math.abs(b), 0) / lowerHalf.length;
            const upperHalf = frequencyData.slice(frequencyData.length / 2);
            const upperAvg = upperHalf.reduce((a, b) => a + Math.abs(b), 0) / upperHalf.length;

            const bassBoost = isFinite(lowerAvg) ? (lowerAvg / 100) * 20 : 0;
            const trebleBoost = isFinite(upperAvg) ? (upperAvg / 100) * 1.5 : 0;

            const {c1, c2} = moodColors[mood];

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                const ix = initialPositions[i3];
                const iy = initialPositions[i3 + 1];
                const iz = initialPositions[i3 + 2];
                const r = Math.sqrt(ix*ix + iy*iy + iz*iz);

                const freqIndex = i % frequencyData.length;
                const freqValue = isFinite(frequencyData[freqIndex]) ? frequencyData[freqIndex] : 0;
                const displacement = bassBoost * (freqValue / 20);
                
                const newRadius = r + displacement;

                let x = ix, y = iy, z = iz;

                if (r > 0 && isFinite(newRadius)) {
                    const ratio = newRadius / r;
                    x = ix * ratio;
                    y = iy * ratio;
                    z = iz * ratio;
                }
                
                if (isFinite(x) && isFinite(y) && isFinite(z)) {
                  positionAttribute.setXYZ(i, x, y, z);
                } else {
                  positionAttribute.setXYZ(i, ix, iy, iz);
                }

                const mixFactor = (iy / r + 1) / 2;
                const color = c1.clone().lerp(c2, isNaN(mixFactor) ? 0.5 : mixFactor);
                const colorBoost = 1 + trebleBoost * Math.random();
                color.multiplyScalar(isFinite(colorBoost) ? colorBoost : 1);
                colorAttribute.setXYZ(i, color.r, color.g, color.b);
            }
            positionAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
        }
      }
      if (particles) {
        particles.rotation.y += 0.0005;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
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
      geometry.dispose();
      material.dispose();
    };
  }, [isPlaying, mood, analyserNode]);

  return <div ref={mountRef} className="w-full h-full" />;
}
