"use client";

import { useState, useCallback } from 'react';
import { useGameLayout } from '@/contexts/GameLayoutContext';

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;

export function useResizablePanel() {
  const { panelWidth, setPanelWidth } = useGameLayout();
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    let rafId: number;

    const startResizing = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      // Schedule the update on the next animation frame
      rafId = requestAnimationFrame(() => {
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, e.clientX - 60)
        );
        setPanelWidth(newWidth);
      });
    };

    const stopResizing = () => {
      setIsResizing(false);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', startResizing);
      window.removeEventListener('mouseup', stopResizing);
    };

    window.addEventListener('mousemove', startResizing);
    window.addEventListener('mouseup', stopResizing);
  }, [setPanelWidth]);

  return {
    width: panelWidth,
    isResizing,
    handleMouseDown,
  };
}
