
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VibeStreamIcon } from '@/components/icons';
import { ArrowRight, Bot, Download, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const features = [
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: 'AI Mood Detection',
    description: 'Our advanced AI analyzes your track\'s energy and harmony to dynamically match the visuals to the vibe.',
  },
  {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    title: 'Stunning Visual Styles',
    description: 'Choose from a curated library of visual themes, from cosmic nebulae to synthwave grids, all reacting in real-time to your sound.',
  },
  {
    icon: <Download className="h-10 w-10 text-primary" />,
    title: 'High-Quality Exports',
    description: 'Record and download your visual masterpiece in up to 4K resolution, perfect for sharing on any social media platform.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto flex flex-col items-center justify-center text-center py-20 md:py-32">
          <VibeStreamIcon className="h-24 w-24 text-primary mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
            See Your Sound.
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground">
            Turn any audio into a mesmerizing, 3D interactive visual experience. Create, customize, and share your unique audiovisual art.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="text-lg py-6 px-8">
              <Link href="/visualizer">
                Launch Visualizer <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-primary/20 text-center">
                <CardHeader className="items-center">
                  {feature.icon}
                  <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
