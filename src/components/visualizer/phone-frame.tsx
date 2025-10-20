
import { cn } from '@/lib/utils';
import React from 'react';

type PhoneFrameProps = {
  children: React.ReactNode;
  className?: string;
};

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cn("relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-full w-full shadow-xl", className)}>
      <div className="w-full h-full bg-black rounded-[2rem] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
