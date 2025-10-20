
import Visualizer from '@/components/visualizer/visualizer';
import { VisualizerProvider } from '@/contexts/visualizer-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ControlsPanel from '@/components/controls/controls-panel';

export default function VisualizerPage() {
  return (
    <VisualizerProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow flex flex-col items-center w-full py-4 px-4 gap-4 min-h-0">
          <ControlsPanel />
          <Visualizer />
        </main>
        <Footer />
      </div>
    </VisualizerProvider>
  );
}
