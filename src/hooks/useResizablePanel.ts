// src/hooks/useResizablePanel.ts
"use client";

import { useState, useEffect } from 'react';
import { useGameLayout } from '@/contexts/GameLayoutContext';

const MIN_WIDTH = 250;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 300;

export function useResizablePanel() {
  const { setPanelWidth } = useGameLayout();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidePanelWidth');
    if (savedWidth) {
      const parsedWidth = Number(savedWidth);
      setWidth(parsedWidth);
      setPanelWidth(parsedWidth);
    }
  }, [setPanelWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startResizing = (e: MouseEvent) => {
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, e.clientX - 60)
      );
      setWidth(newWidth);
      setPanelWidth(newWidth);
      localStorage.setItem('sidePanelWidth', String(newWidth));
    };

    const stopResizing = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', startResizing);
      window.removeEventListener('mouseup', stopResizing);
    };

    window.addEventListener('mousemove', startResizing);
    window.addEventListener('mouseup', stopResizing);
  };

  return {
    width,
    isResizing,
    handleMouseDown,
  };
}