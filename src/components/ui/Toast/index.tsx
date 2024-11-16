"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = {
    success: 'border-green-500 bg-green-500/10 text-green-500',
    error: 'border-red-500 bg-red-500/10 text-red-500',
    info: 'border-bright-blue bg-bright-blue/10 text-bright-blue',
    warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'max-w-md p-4 rounded-lg border',
        'transform transition-all duration-300',
        colors[type],
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      )}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}