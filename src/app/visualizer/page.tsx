
import Visualizer from '@/components/visualizer/visualizer';
import { VisualizerProvider } from '@/contexts/visualizer-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ControlsPanel from '@/components/controls/controls-panel';

export default function VisualizerPage() {
  return (
    <VisualizerProvider>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <div className="w-full max-w-7xl mx-auto p-4">
          <ControlsPanel />
        </div>
        <main className="flex-grow flex flex-col items-center justify-center relative min-h-0 px-4 pb-4">
          <Visualizer />
        </main>
        <Footer />
      </div>
    </VisualizerProvider>
  );
}
