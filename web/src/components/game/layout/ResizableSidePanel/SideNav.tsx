"use client";

import { useGameLayout } from '../../../../contexts/GameLayoutContext';
import { MessageSquare, Heart, Map, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';

const NAV_ITEMS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'inventory', icon: Heart, label: 'Inventory' },
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

export default function SideNav() {
  const { isPanelOpen, setIsPanelOpen, activePanel, setActivePanel } = useGameLayout();

  const handlePanelToggle = (id: typeof NAV_ITEMS[number]['id']) => {
    if (activePanel === id && isPanelOpen) {
      setIsPanelOpen(false);
    } else {
      setActivePanel(id);
      setIsPanelOpen(true);
    }
  };

  return (
    <nav className="fixed top-[60px] left-0 w-[60px] h-[calc(100vh-60px)] 
                   bg-dark-bg/60 border-r border-bright-blue/10 backdrop-blur-md">
      <div className="flex-1 flex flex-col gap-4 p-4">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => handlePanelToggle(id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center group relative",
              "border border-bright-blue/20 rounded-lg",
              "bg-bright-blue/5 text-bright-blue",
              "transition-all duration-300",
              "hover:bg-bright-blue/20 hover:border-bright-blue",
              "hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]",
              "hover:translate-x-1",
              activePanel === id && isPanelOpen && "bg-bright-blue/20 border-bright-blue"
            )}
          >
            <Icon className="w-5 h-5" />
            {label && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-dark-bg/90 rounded
                            text-xs whitespace-nowrap opacity-0 group-hover:opacity-100
                            pointer-events-none transition-opacity">
                {label}
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={cn(
          "w-10 h-10 mx-auto mb-4 flex items-center justify-center",
          "border border-bright-blue/20 rounded-lg",
          "bg-bright-blue/5 text-bright-blue",
          "transition-all duration-300",
          "hover:bg-bright-blue/20 hover:border-bright-blue",
          "absolute bottom-0 left-1/2 -translate-x-1/2"
        )}
      >
        {isPanelOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>
    </nav>
  );
}
