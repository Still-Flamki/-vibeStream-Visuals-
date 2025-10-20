
'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Vector3 = { x: number; y: number; z: number; };

interface StudioSceneProps {
  backgroundColor: string;
  position: Vector3;
  setPosition: React.Dispatch<React.SetStateAction<Vector3>>;
  rotation: Vector3;
  scale: Vector3;
}

export function StudioScene({ backgroundColor, position, setPosition, rotation, scale }: StudioSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lastPanPosition = useRef<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Camera
    const aspect = currentMount.clientWidth / currentMount.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect > 0 ? aspect : 1, 0.1, 1000);
    camera.position.set(3, 3, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Default Cube
    const geometry = new THREE.BoxGeometry(1, 1, 1); // Use 1x1x1 and control size via scale
    const material = new THREE.MeshStandardMaterial({ color: 0x6f42c1 });
    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);
    
    // Grid Helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x444444);
    scene.add(gridHelper);


    const handleControlChange = () => {
        if (!controlsRef.current || !cubeRef.current) return;
        
        // This calculates the difference in the pan and applies it to the cube
        const panDelta = new THREE.Vector3().subVectors(controls.target, lastPanPosition.current);
        if (panDelta.lengthSq() > 0) { // Check if there was an actual pan
            cubeRef.current.position.add(panDelta);
            lastPanPosition.current.copy(controls.target);
            // Update the state in the parent component
            setPosition(prev => ({
                x: cubeRef.current!.position.x,
                y: cubeRef.current!.position.y,
                z: cubeRef.current!.position.z,
            }));
        }
    };
    
    controls.addEventListener('change', handleControlChange);
    controls.addEventListener('start', () => {
        if (controlsRef.current) {
            lastPanPosition.current.copy(controlsRef.current.target);
        }
    });

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (currentMount) {
        const { clientWidth, clientHeight } = currentMount;
        renderer.setSize(clientWidth, clientHeight);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial resize after a short delay
    setTimeout(handleResize, 100);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', handleControlChange);
      cancelAnimationFrame(animationFrameId);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor]);

  useEffect(() => {
    if (cubeRef.current) {
      cubeRef.current.position.set(position.x, position.y, position.z);
    }
  }, [position]);

  useEffect(() => {
    if (cubeRef.current) {
      cubeRef.current.rotation.set(
        THREE.MathUtils.degToRad(rotation.x),
        THREE.MathUtils.degToRad(rotation.y),
        THREE.MathUtils.degToRad(rotation.z)
      );
    }
  }, [rotation]);

  useEffect(() => {
    if (cubeRef.current) {
      cubeRef.current.scale.set(scale.x, scale.y, scale.z);
    }
  }, [scale]);

  return <div ref={mountRef} className="w-full h-full" />;
}
