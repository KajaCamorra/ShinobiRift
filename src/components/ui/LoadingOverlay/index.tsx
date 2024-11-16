"use client";

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  fullScreen = false,
  className 
}: LoadingOverlayProps) {
  const [showDelayed, setShowDelayed] = useState(false);

  // Only show loading overlay if loading takes more than 500ms
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowDelayed(true), 500);
      return () => clearTimeout(timer);
    }
    setShowDelayed(false);
  }, [isLoading]);

  if (!isLoading || !showDelayed) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "bg-dark-bg/80 backdrop-blur-sm",
        fullScreen ? "fixed inset-0 z-50" : "absolute inset-0",
        className
      )}
    >
      <div className="relative">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-bright-blue/20" />
        
        {/* Spinning inner ring */}
        <div className="w-12 h-12 rounded-full border-2 border-bright-blue 
                      border-t-transparent animate-spin" />
      </div>
      
      {message && (
        <p className="mt-4 text-bright-blue font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}