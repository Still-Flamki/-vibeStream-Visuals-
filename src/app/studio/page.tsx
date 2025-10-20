
'use client';

import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { SlidersHorizontal, Shapes, Clock, Box, Layers, Camera } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { StudioScene } from '@/components/studio/studio-scene';

export default function StudioPage() {
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
                            <p className="text-xs text-muted-foreground p-2">Select an object to see its properties.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="timeline">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Timeline</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <p className="text-xs text-muted-foreground p-2">Animation timeline controls will appear here.</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col p-4 gap-4">
            <main className="flex-grow flex items-center justify-center rounded-lg bg-black/30 border border-border overflow-hidden">
                <StudioScene />
            </main>
             <Card className="h-48">
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
