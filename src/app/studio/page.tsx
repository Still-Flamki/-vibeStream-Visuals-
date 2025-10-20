
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function StudioPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <CardTitle className="text-4xl font-headline flex items-center justify-center gap-4">
                    <Construction className="h-10 w-10 text-primary" />
                    Studio Mode
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground pt-2">
                    Under Construction
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>This is the future home of the VibeStream 3D Studio.</p>
                <p className="mt-2 text-muted-foreground">Here, you'll be able to import your own 3D models, apply audio-reactive effects, and build custom scenes to render and share.</p>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
