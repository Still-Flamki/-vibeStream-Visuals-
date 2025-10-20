import { VibeStreamIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export default function Header() {
  return (
    <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center gap-4">
        <VibeStreamIcon />
        <h1 className="text-2xl font-bold font-headline tracking-tight">
          VibeStream Visuals
        </h1>
      </div>
    </header>
  );
}
