
'use client';

import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { SlidersHorizontal, Box, Layers, Camera, Move3d, Rotate3d, Scale3d } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StudioScene } from '@/components/studio/studio-scene';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

type Vector3 = {
    x: number;
    y: number;
    z: number;
};

type SceneObject = {
    id: string;
    name: string;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
};

export default function StudioPage() {
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');

  const [objects, setObjects] = useState<Record<string, SceneObject>>({
    'default-cube': {
        id: 'default-cube',
        name: 'Default Cube',
        position: { x: 0, y: 0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.5, y: 1.5, z: 1.5 },
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
                         <SidebarMenu>
                             {Object.values(objects).map(obj => (
                                <SidebarMenuItem key={obj.id}>
                                  <SidebarMenuButton 
                                    size="sm" 
                                    isActive={selectedObjectId === obj.id}
                                    onClick={() => setSelectedObjectId(obj.id)}
                                  >
                                      <Box className="h-4 w-4" />
                                      <span>{obj.name}</span>
                                  </SidebarMenuButton>
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
