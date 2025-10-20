
'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import * as THREE from 'three';

type Vector3 = { x: number; y: number; z: number };
export type ObjectShape = 'cube' | 'sphere' | 'cone' | 'torus';

export type SceneObject = {
    id: string;
    name: string;
    shape: ObjectShape;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    color: string;
};

interface StudioContextType {
    objects: Record<string, SceneObject>;
    setObjects: React.Dispatch<React.SetStateAction<Record<string, SceneObject>>>;
    backgroundColor: string;
    setBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
    addObject: () => SceneObject;
    updateObject: (id: string, props: Partial<SceneObject>) => void;
    removeObject: (id: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

let objectCount = 1;

const createNewObject = (): SceneObject => {
    objectCount++;
    const newId = `object-${objectCount}`;
    const randomColor = new THREE.Color().setHSL(Math.random(), 0.7, 0.6).getHexString();

    return {
        id: newId,
        name: `Object ${objectCount}`,
        shape: 'cube',
        position: { x: (Math.random() - 0.5) * 10, y: 0.5, z: (Math.random() - 0.5) * 10 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: `#${randomColor}`,
    };
};

export function StudioProvider({ children }: { children: ReactNode }) {
    const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
    const [objects, setObjects] = useState<Record<string, SceneObject>>(() => {
        const defaultId = 'default-cube';
        const defaultColor = new THREE.Color(0x9b59b6).getHexString();
        return {
            [defaultId]: {
                id: defaultId,
                name: 'Default Cube',
                shape: 'cube',
                position: { x: 0, y: 0.5, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                color: `#${defaultColor}`
            }
        };
    });

    const addObject = () => {
        const newObject = createNewObject();
        setObjects(prev => ({ ...prev, [newObject.id]: newObject }));
        return newObject;
    };

    const updateObject = (id: string, props: Partial<SceneObject>) => {
        setObjects(prev => ({
            ...prev,
            [id]: { ...prev[id], ...props }
        }));
    };
    
    const removeObject = (id: string) => {
        setObjects(prev => {
            const newObjects = { ...prev };
            delete newObjects[id];
            return newObjects;
        });
    };

    const value: StudioContextType = {
        objects,
        setObjects,
        backgroundColor,
        setBackgroundColor,
        addObject,
        updateObject,
        removeObject,
    };

    return (
        <StudioContext.Provider value={value}>
            {children}
        </StudioContext.Provider>
    );
}

export function useStudio(): StudioContextType {
    const context = useContext(StudioContext);
    if (context === undefined) {
        throw new Error('useStudio must be used within a StudioProvider');
    }
    return context;
}
