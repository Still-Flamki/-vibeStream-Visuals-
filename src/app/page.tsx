import Visualizer from '@/components/visualizer/visualizer';
import { VisualizerProvider } from '@/contexts/visualizer-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ControlsPanel from '@/components/controls/controls-panel';

export default function Home() {
  return (
    <VisualizerProvider>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center relative min-h-0">
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 p-4 flex-grow">
            <ControlsPanel />
            <Visualizer />
          </div>
        </main>
        <Footer />
      </div>
    </VisualizerProvider>
  );
}
