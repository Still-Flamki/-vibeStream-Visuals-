import Visualizer from '@/components/visualizer/visualizer';
import { VisualizerProvider } from '@/contexts/visualizer-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function Home() {
  return (
    <VisualizerProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center">
          <Visualizer />
        </main>
        <Footer />
      </div>
    </VisualizerProvider>
  );
}
