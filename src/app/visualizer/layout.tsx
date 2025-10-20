
'use client';

import { VisualizerProvider } from '@/contexts/visualizer-context';
import type { ReactNode } from 'react';

export default function VisualizerLayout({ children }: { children: ReactNode }) {
  return (
      <VisualizerProvider>
          {children}
      </VisualizerProvider>
  );
}
