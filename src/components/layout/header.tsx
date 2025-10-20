
import { VibeStreamIcon } from "@/components/icons";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <VibeStreamIcon className="h-6 w-6"/>
          <h1 className="text-xl font-bold font-headline tracking-tight">
            VibeStream Visuals
          </h1>
        </Link>
        <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
                <Link href="/visualizer">Visualizer</Link>
            </Button>
            <Button variant="ghost" asChild>
                <Link href="/studio">Studio</Link>
            </Button>
        </nav>
      </div>
    </header>
  );
}
