
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

export default function StudioPage() {
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
  const [position, setPosition] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState<Vector3>({ x: 1.5, y: 1.5, z: 1.5 });

  const handleSliderChange = (axis: 'x' | 'y' | 'z', value: number, setter: React.Dispatch<React.SetStateAction<Vector3>>) => {
      setter(prev => ({...prev, [axis]: value}));
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
                              <SidebarMenuItem>
                                  <SidebarMenuButton size="sm" isActive>
                                      <Box className="h-4 w-4" />
                                      <span>Default Cube</span>
                                  </SidebarMenuButton>
                              </SidebarMenuItem>
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
                            <Separator />
                            {/* Position */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 font-medium">
                                    <Move3d className="h-4 w-4" />
                                    <span>Position</span>
                                </div>
                                <div className="space-y-2 pl-2">
                                    <Label className="text-xs">X: {position.x.toFixed(2)}</Label>
                                    <Slider value={[position.x]} onValueChange={([val]) => handleSliderChange('x', val, setPosition)} min={-5} max={5} step={0.1} />
                                    <Label className="text-xs">Y: {position.y.toFixed(2)}</Label>
                                    <Slider value={[position.y]} onValueChange={([val]) => handleSliderChange('y', val, setPosition)} min={-5} max={5} step={0.1} />
                                    <Label className="text-xs">Z: {position.z.toFixed(2)}</Label>
                                    <Slider value={[position.z]} onValueChange={([val]) => handleSliderChange('z', val, setPosition)} min={-5} max={5} step={0.1} />
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
                                    <Label className="text-xs">X: {rotation.x.toFixed(0)}&deg;</Label>
                                    <Slider value={[rotation.x]} onValueChange={([val]) => handleSliderChange('x', val, setRotation)} min={0} max={360} step={1} />
                                    <Label className="text-xs">Y: {rotation.y.toFixed(0)}&deg;</Label>
                                    <Slider value={[rotation.y]} onValueChange={([val]) => handleSliderChange('y', val, setRotation)} min={0} max={360} step={1} />
                                    <Label className="text-xs">Z: {rotation.z.toFixed(0)}&deg;</Label>
                                    <Slider value={[rotation.z]} onValueChange={([val]) => handleSliderChange('z', val, setRotation)} min={0} max={360} step={1} />
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
                                    <Label className="text-xs">X: {scale.x.toFixed(2)}</Label>
                                    <Slider value={[scale.x]} onValueChange={([val]) => handleSliderChange('x', val, setScale)} min={0.1} max={5} step={0.1} />
                                    <Label className="text-xs">Y: {scale.y.toFixed(2)}</Label>
                                    <Slider value={[scale.y]} onValueChange={([val]) => handleSliderChange('y', val, setScale)} min={0.1} max={5} step={0.1} />
                                    <Label className="text-xs">Z: {scale.z.toFixed(2)}</Label>
                                    <Slider value={[scale.z]} onValueChange={([val]) => handleSliderChange('z', val, setScale)} min={0.1} max={5} step={0.1} />
                                </div>
                            </div>
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
                position={position}
                rotation={rotation}
                scale={scale}
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
