
'use client';

import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { SlidersHorizontal, Box, Layers, Camera } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { StudioScene } from '@/components/studio/studio-scene';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function StudioPage() {
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex-grow flex">
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
                                <p className="text-xs text-muted-foreground pt-4">More object properties will appear here.</p>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col p-4 gap-4">
            <main className="flex-grow flex items-center justify-center rounded-lg bg-black/30 border border-border overflow-hidden">
                <StudioScene backgroundColor={backgroundColor} />
            </main>
             <Card className="h-48 shrink-0">
                <CardContent className="p-4 flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Timeline / Keyframes</p>
                </CardContent>
            </Card>
        </SidebarInset>
      </div>
      <Footer />
    </div>
  );
}
