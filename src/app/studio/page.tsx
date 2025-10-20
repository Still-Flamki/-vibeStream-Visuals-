
'use client';

import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { SlidersHorizontal, Box, Layers, Camera, Move3d, Rotate3d, Scale3d, PlusCircle, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StudioScene } from '@/components/studio/studio-scene';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Vector3 = {
    x: number;
    y: number;
    z: number;
};

export type ObjectShape = 'cube' | 'sphere' | 'cone' | 'torus';

export type SceneObject = {
    id: string;
    name: string;
    shape: ObjectShape;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
};

let objectCount = 1;

export default function StudioPage() {
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');

  const [objects, setObjects] = useState<Record<string, SceneObject>>({
    'default-cube': {
        id: 'default-cube',
        name: 'Default Cube',
        shape: 'cube',
        position: { x: 0, y: 0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
    }
  });

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('default-cube');
  
  const selectedObject = selectedObjectId ? objects[selectedObjectId] : null;

  const handleObjectChange = (id: string, newProps: Partial<SceneObject>) => {
    setObjects(prev => ({
        ...prev,
        [id]: { ...prev[id], ...newProps }
    }));
  };

  const handleSliderChange = (axis: 'x' | 'y' | 'z', value: number, property: 'position' | 'rotation' | 'scale') => {
      if (selectedObject) {
          const newVector = { ...selectedObject[property], [axis]: value };
          handleObjectChange(selectedObject.id, { [property]: newVector });
      }
  };

  const handleAddObject = () => {
    objectCount++;
    const newId = `cube-${objectCount}`;
    const newObject: SceneObject = {
        id: newId,
        name: `Object ${objectCount}`,
        shape: 'cube',
        position: { x: (Math.random() - 0.5) * 10, y: 0.5, z: (Math.random() - 0.5) * 10 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
    };
    setObjects(prev => ({ ...prev, [newId]: newObject }));
    setSelectedObjectId(newId);
  };
  
  const handleDeleteObject = (id: string) => {
    setObjects(prev => {
        const newObjects = { ...prev };
        delete newObjects[id];
        return newObjects;
    });
    if (selectedObjectId === id) {
        setSelectedObjectId(null);
    }
  };

  return (
    <>
      <Sidebar>
          <SidebarContent className="p-4">
              <Accordion type="multiple" defaultValue={['scene', 'properties']} className="w-full">
                  <AccordionItem value="scene">
                      <AccordionTrigger>
                          <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              <span>Scene</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-2 pb-2">
                           <Button variant="outline" size="sm" className="w-full" onClick={handleAddObject}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add Object
                           </Button>
                        </div>
                         <SidebarMenu>
                             {Object.values(objects).map(obj => (
                                <SidebarMenuItem key={obj.id} className="group/item">
                                  <SidebarMenuButton 
                                    size="sm" 
                                    isActive={selectedObjectId === obj.id}
                                    onClick={() => setSelectedObjectId(obj.id)}
                                  >
                                      <Box className="h-4 w-4" />
                                      <span>{obj.name}</span>
                                  </SidebarMenuButton>
                                  <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100"
                                      onClick={() => handleDeleteObject(obj.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                              </SidebarMenuItem>
                             ))}
                              <SidebarMenuItem>
                                  <SidebarMenuButton size="sm">
                                      <Camera className="h-4 w-4" />
                                      <span>Camera</span>
                                  </SidebarMenuButton>
                              </SidebarMenuItem>
                         </SidebarMenu>
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="properties">
                      <AccordionTrigger>
                           <div className="flex items-center gap-2">
                              <SlidersHorizontal className="h-4 w-4" />
                              <span>Properties</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent>
                         <div className="p-2 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bg-color">Background Color</Label>
                                <Input 
                                    id="bg-color"
                                    type="color" 
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-full h-10 p-1"
                                />
                            </div>

                            {selectedObject && (
                            <>
                                <Separator />
                                <p className="font-medium text-sm text-center">{selectedObject.name}</p>
                                
                                <div className="space-y-2">
                                    <Label>Shape</Label>
                                    <Select 
                                        value={selectedObject.shape} 
                                        onValueChange={(value: ObjectShape) => handleObjectChange(selectedObject.id, { shape: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select shape" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cube">Cube</SelectItem>
                                            <SelectItem value="sphere">Sphere</SelectItem>
                                            <SelectItem value="cone">Cone</SelectItem>
                                            <SelectItem value="torus">Torus</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />
                                {/* Position */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Move3d className="h-4 w-4" />
                                        <span>Position</span>
                                    </div>
                                    <div className="space-y-2 pl-2">
                                        <Label className="text-xs">X: {selectedObject.position.x.toFixed(2)}</Label>
                                        <Slider value={[selectedObject.position.x]} onValueChange={([val]) => handleSliderChange('x', val, 'position')} min={-10} max={10} step={0.1} />
                                        <Label className="text-xs">Y: {selectedObject.position.y.toFixed(2)}</Label>
                                        <Slider value={[selectedObject.position.y]} onValueChange={([val]) => handleSliderChange('y', val, 'position')} min={-10} max={10} step={0.1} />
                                        <Label className="text-xs">Z: {selectedObject.position.z.toFixed(2)}</Label>
                                        <Slider value={[selectedObject.position.z]} onValueChange={([val]) => handleSliderChange('z', val, 'position')} min={-10} max={10} step={0.1} />
                                    </div>
                                </div>
                                <Separator />
                                {/* Rotation */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Rotate3d className="h-4 w-4" />
                                        <span>Rotation</span>
                                    </div>
                                    <div className="space-y-2 pl-2">
                                        <Label className="text-xs">X: {selectedObject.rotation.x.toFixed(0)}&deg;</Label>
                                        <Slider value={[selectedObject.rotation.x]} onValueChange={([val]) => handleSliderChange('x', val, 'rotation')} min={0} max={360} step={1} />
                                        <Label className="text-xs">Y: {selectedObject.rotation.y.toFixed(0)}&deg;</Label>
                                        <Slider value={[selectedObject.rotation.y]} onValueChange={([val]) => handleSliderChange('y', val, 'rotation')} min={0} max={360} step={1} />
                                        <Label className="text-xs">Z: {selectedObject.rotation.z.toFixed(0)}&deg;</Label>
                                        <Slider value={[selectedObject.rotation.z]} onValueChange={([val]) => handleSliderChange('z', val, 'rotation')} min={0} max={360} step={1} />
                                    </div>
                                </div>
                                <Separator />
                                {/* Scale */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Scale3d className="h-4 w-4" />
                                        <span>Scale</span>
                                    </div>
                                    <div className="space-y-2 pl-2">
                                        <Label className="text-xs">X: {selectedObject.scale.x.toFixed(2)}</Label>
                                        <Slider value={[selectedObject.scale.x]} onValueChange={([val]) => handleSliderChange('x', val, 'scale')} min={0.1} max={5} step={0.1} />
                                        <Label className="text-xs">Y: {selectedObject.scale.y.toFixed(2)}</Label>
                                        <Slider value={[selectedObject.scale.y]} onValueChange={([val]) => handleSliderChange('y', val, 'scale')} min={0.1} max={5} step={0.1} />
                                        <Label className="text-xs">Z: {selectedObject.scale.z.toFixed(2)}</Label>
                                        <Slider value={[selectedObject.scale.z]} onValueChange={([val]) => handleSliderChange('z', val, 'scale')} min={0.1} max={5} step={0.1} />
                                    </div>
                                </div>
                            </>
                            )}
                         </div>
                      </AccordionContent>
                  </AccordionItem>
              </Accordion>
          </SidebarContent>
      </Sidebar>
      <SidebarInset>
          <div className="flex-grow flex items-center justify-center rounded-lg bg-black/30 border border-border overflow-hidden m-4">
              <StudioScene 
                backgroundColor={backgroundColor}
                objects={Object.values(objects)}
                selectedObjectId={selectedObjectId}
                onSelectObject={setSelectedObjectId}
                onObjectChange={handleObjectChange}
              />
          </div>
           <Card className="h-48 shrink-0 mx-4 mb-4">
              <CardContent className="p-4 flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Timeline / Keyframes</p>
              </CardContent>
          </Card>
      </SidebarInset>
    </>
  );
}

    