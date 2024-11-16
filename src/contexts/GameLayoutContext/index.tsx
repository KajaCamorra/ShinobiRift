// src/contexts/GameLayoutContext/index.tsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import type { GameLayoutContextType, ActivePanel } from './types';

const GameLayoutContext = createContext<GameLayoutContextType | null>(null);

const DEFAULT_PANEL_WIDTH = 300;

export function GameLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);

  // Load saved panel width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidePanelWidth');
    if (savedWidth) {
      setPanelWidth(Number(savedWidth));
    }
  }, []);

  return (
    <GameLayoutContext.Provider
      value={{
        isPanelOpen,
        setIsPanelOpen,
        activePanel,
        setActivePanel,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        panelWidth,
        setPanelWidth,
      }}
    >
      {children}
    </GameLayoutContext.Provider>
  );
}

export function useGameLayout() {
  const context = useContext(GameLayoutContext);
  if (!context) {
    throw new Error('useGameLayout must be used within a GameLayoutProvider');
  }
  return context;
}