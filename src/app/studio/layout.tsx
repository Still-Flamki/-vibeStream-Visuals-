
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import type { ReactNode } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <SidebarProvider>
        <div className="flex-grow flex">
          {children}
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
}
