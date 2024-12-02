"use client";

import { useGameLayout } from '@/contexts/GameLayoutContext';
import { cn } from '@/lib/utils';
import { MessageSquare, Package, Map, Settings } from 'lucide-react';

export default function BottomPanel() {
  const { activePanel, setActivePanel, isPanelOpen, setIsPanelOpen } = useGameLayout();

  const handlePanelClick = (panel: 'chat' | 'inventory' | 'map' | 'settings') => {
    if (activePanel === panel && isPanelOpen) {
      setIsPanelOpen(false);
    } else {
      setActivePanel(panel);
      setIsPanelOpen(true);
    }
  };

  const NavButton = ({ 
    panel, 
    icon: Icon 
  }: { 
    panel: 'chat' | 'inventory' | 'map' | 'settings';
    icon: typeof MessageSquare;
  }) => (
    <button
      onClick={() => handlePanelClick(panel)}
      className={cn(
        "flex-1 h-14 flex items-center justify-center",
        "text-text/50 hover:text-neon-pink transition-colors",
        activePanel === panel && isPanelOpen && "text-neon-pink"
      )}
    >
      <Icon className="w-6 h-6" />
    </button>
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-dark-bg/95 border-t border-neon-pink/10 flex">
      <NavButton panel="chat" icon={MessageSquare} />
      <NavButton panel="inventory" icon={Package} />
      <NavButton panel="map" icon={Map} />
      <NavButton panel="settings" icon={Settings} />
    </nav>
  );
}
