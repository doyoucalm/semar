import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface P5CardProps {
  children: React.ReactNode;
  className?: string;
  rotation?: number;
  accentColor?: 'red' | 'magenta' | 'cyan' | 'gold';
}

export function P5Card({ 
  children, 
  className, 
  rotation = 0, 
  accentColor = 'red' 
}: P5CardProps) {
  const accentClasses = {
    red: 'border-semar-red shadow-[4px_4px_0px_#ff004033]',
    magenta: 'border-semar-magenta shadow-[4px_4px_0px_#ff00ff33]',
    cyan: 'border-semar-cyan shadow-[4px_4px_0px_#00ffff33]',
    gold: 'border-semar-gold shadow-[4px_4px_0px_#ffd70033]',
  };

  return (
    <div 
      className={cn(
        "bg-panel border-2 p-6 relative transition-transform duration-300",
        accentClasses[accentColor],
        className
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </div>
  );
}
