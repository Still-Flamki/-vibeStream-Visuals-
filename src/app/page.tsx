import Visualizer from '@/components/visualizer/visualizer';
import { VisualizerProvider } from '@/contexts/visualizer-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function Home() {
  return (
    <VisualizerProvider>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center relative min-h-0">
          <Visualizer />
        </main>
        <Footer />
      </div>
    </VisualizerProvider>
  );
}
