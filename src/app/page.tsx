
import { Button } from '@/components/ui/button';
import { VibeStreamIcon } from '@/components/icons';
import { ArrowRight, Bot, Cuboid, Rocket, Waves, Share2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <Waves className="h-8 w-8 text-primary" />,
    title: 'Dynamic, Audio-Reactive Visuals',
    description: 'Watch as our advanced algorithms translate every beat, harmony, and rhythm into stunning, real-time 3D motion graphics.',
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Mood Detection',
    description: 'Our AI analyzes the energy and emotional tone of your track to automatically select colors and effects that match the vibe.',
  },
  {
    icon: <Cuboid className="h-8 w-8 text-primary" />,
    title: 'Build Your Own Scenes',
    description: 'Use the integrated Studio to design custom 3D scenes. Add objects, change their shape, color, position, and scale to create your unique visual identity.',
  },
    {
    icon: <Rocket className="h-8 w-8 text-primary" />,
    title: 'Multiple Visual Styles',
    description: 'Choose from a curated library of visual themes—from cosmic nebulae to synthwave grids—or use a scene you built in the Studio.',
  },
    {
    icon: <Share2 className="h-8 w-8 text-primary" />,
    title: 'High-Quality Exports',
    description: 'Record your audiovisual masterpiece in multiple aspect ratios and up to 4K resolution, ready for any social media platform.',
  },
];

export default function HomePage() {
  const heroImage = placeholderImages.find(p => p.id === 'hero-visual')!;
  const featureImage = placeholderImages.find(p => p.id === 'feature-export')!;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto pt-12 md:pt-20 pb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-start text-left">
              <VibeStreamIcon className="h-24 w-24 text-primary mb-6" />
              <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
                See Your Sound. Feel the Flow.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground">
                VibeStream turns any audio into a mesmerizing, 3D interactive visual experience. Create, customize, and share your unique audiovisual art with the world.
              </p>
              <div className="mt-10">
                <Button asChild size="lg" className="text-lg py-7 px-10">
                  <Link href="/visualizer">
                    Launch Visualizer <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-primary/20">
                <Image 
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  className="object-cover"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-secondary/50 py-24">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold font-headline">A New Dimension of Audio</h2>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">VibeStream Visuals isn't just a player; it's an instrument. Explore features designed to bring your music to life.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 max-w-6xl mx-auto">
                    {features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex flex-col items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                        <p className="text-muted-foreground mt-2">{feature.description}</p>
                    </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 max-w-4xl mx-auto mt-12">
                     {features.slice(3).map((feature, index) => (
                    <div key={index} className="flex flex-col items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                        <p className="text-muted-foreground mt-2">{feature.description}</p>
                    </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto text-center py-24">
             <h2 className="text-4xl font-bold font-headline">Ready to Create?</h2>
             <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
                Your next masterpiece is just a click away. Launch the visualizer and start your audiovisual journey.
             </p>
             <div className="mt-8">
                <Button asChild size="lg" className="text-lg py-6 px-8">
                <Link href="/visualizer">
                    Start Visualizing <ArrowRight className="ml-2" />
                </Link>
                </Button>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
