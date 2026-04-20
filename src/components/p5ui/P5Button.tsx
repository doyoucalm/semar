import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface P5ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  accentColor?: 'red' | 'magenta' | 'cyan' | 'gold';
}

export function P5Button({
  children,
  className,
  variant = 'solid',
  size = 'md',
  accentColor = 'red',
  ...props
}: P5ButtonProps) {
  const baseClasses = "font-expose uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50";
  
  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-2 text-sm",
    lg: "px-10 py-4 text-lg",
  };

  const variantClasses = {
    solid: {
      red: "bg-semar-red text-black hover:shadow-[0_0_15px_#ff0040] border-2 border-semar-red",
      magenta: "bg-semar-magenta text-black hover:shadow-[0_0_15px_#ff00ff] border-2 border-semar-magenta",
      cyan: "bg-semar-cyan text-black hover:shadow-[0_0_15px_#00ffff] border-2 border-semar-cyan",
      gold: "bg-semar-gold text-black hover:shadow-[0_0_15px_#ffd700] border-2 border-semar-gold",
    },
    ghost: {
      red: "bg-transparent text-semar-red border-2 border-semar-red hover:bg-semar-red hover:text-black",
      magenta: "bg-transparent text-semar-magenta border-2 border-semar-magenta hover:bg-semar-magenta hover:text-black",
      cyan: "bg-transparent text-semar-cyan border-2 border-semar-cyan hover:bg-semar-cyan hover:text-black",
      gold: "bg-transparent text-semar-gold border-2 border-semar-gold hover:bg-semar-gold hover:text-black",
    }
  };

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant][accentColor],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
