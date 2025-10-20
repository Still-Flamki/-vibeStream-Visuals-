
'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Vector3 = { x: number; y: number; z: number; };

type SceneObject = {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
};

interface StudioSceneProps {
  backgroundColor: string;
  objects: SceneObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onObjectChange: (id: string, newProps: Partial<SceneObject>) => void;
}

export function StudioScene({ 
    backgroundColor, 
    objects,
    selectedObjectId,
    onSelectObject,
    onObjectChange
}: StudioSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectMeshes = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Effect to set up the basic scene, camera, renderer, and controls
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
    camera.position.set(5, 5, 8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    
    // Grid Helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x555555);
    scene.add(gridHelper);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Event Listeners
    const handleResize = () => {
      if (currentMount && cameraRef.current && rendererRef.current) {
        const { clientWidth, clientHeight } = currentMount;
        rendererRef.current.setSize(clientWidth, clientHeight);
        cameraRef.current.aspect = clientWidth / clientHeight;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
        if (!currentMount) return;
        
        // Check if it's a left click
        if (event.button !== 0) return;
        
        const rect = currentMount.getBoundingClientRect();
        mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(mouse.current, camera);

        const meshesToIntersect = Array.from(objectMeshes.current.values());
        const intersects = raycaster.current.intersectObjects(meshesToIntersect);

        if (intersects.length > 0) {
            const firstIntersected = intersects[0].object;
            if (firstIntersected.userData.id) {
                onSelectObject(firstIntersected.userData.id);
            }
        } else {
            onSelectObject(null);
        }
    };
    
    const handlePan = () => {
        if (!controlsRef.current || !selectedObjectId) return;
        const targetMesh = objectMeshes.current.get(selectedObjectId);
        if (!targetMesh) return;

        const newPosition = controlsRef.current.target;
        onObjectChange(selectedObjectId, { position: { x: newPosition.x, y: newPosition.y, z: newPosition.z } });
    };

    window.addEventListener('resize', handleResize);
    currentMount.addEventListener('mousedown', handleMouseDown);
    controls.addEventListener('change', handlePan);
    setTimeout(handleResize, 100);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeEventListener('mousedown', handleMouseDown);
      controls.removeEventListener('change', handlePan);
      cancelAnimationFrame(animationFrameId);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update scene background color
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor]);
  
  // Sync scene with objects prop
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentIds = new Set(objects.map(o => o.id));
    
    // Remove old meshes
    objectMeshes.current.forEach((mesh, id) => {
        if (!currentIds.has(id)) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
            objectMeshes.current.delete(id);
        }
    });

    // Add/Update meshes
    objects.forEach(obj => {
        let mesh = objectMeshes.current.get(obj.id);
        if (!mesh) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ 
              color: 0x6f42c1,
              emissive: 0x000000, 
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.userData.id = obj.id;
            scene.add(mesh);
            objectMeshes.current.set(obj.id, mesh);
        }

        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        mesh.rotation.set(
            THREE.MathUtils.degToRad(obj.rotation.x),
            THREE.MathUtils.degToRad(obj.rotation.y),
            THREE.MathUtils.degToRad(obj.rotation.z)
        );
        mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    });
  }, [objects]);

  // Handle selection outline and controls target
  useEffect(() => {
    objectMeshes.current.forEach((mesh, id) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        const isSelected = id === selectedObjectId;
        
        material.emissive.set(isSelected ? 0xaaaa00 : 0x000000);
    });

    if (selectedObjectId && controlsRef.current) {
        const selectedMesh = objectMeshes.current.get(selectedObjectId);
        if (selectedMesh) {
            controlsRef.current.target.copy(selectedMesh.position);
        }
    }
  }, [selectedObjectId]);

  return <div ref={mountRef} className="w-full h-full cursor-pointer" />;
}
