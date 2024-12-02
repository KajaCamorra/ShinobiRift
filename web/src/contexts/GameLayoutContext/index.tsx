"use client";

import { createContext, useContext, useState } from 'react';
import type { GameLayoutContextType, ActivePanel } from './types';

const GameLayoutContext = createContext<GameLayoutContextType | null>(null);

const DEFAULT_PANEL_WIDTH = 300;

export function GameLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);

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
