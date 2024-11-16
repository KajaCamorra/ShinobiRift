// src/components/game/layout/ResizableSidePanel/SideNav.tsx
"use client";

import { useGameLayout } from '@/contexts/GameLayoutContext';
import { MessageSquare, Heart, Map, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'chat', icon: MessageSquare },
  { id: 'inventory', icon: Heart },
  { id: 'map', icon: Map },
  { id: 'settings', icon: Settings },
] as const;

export default function SideNav() {
  const { isPanelOpen, setIsPanelOpen, activePanel, setActivePanel } = useGameLayout();

  return (
    <nav className="hidden md:flex flex-col w-[60px] h-[calc(100vh-60px)] 
                   bg-dark-bg/60 border-r border-bright-blue/10 backdrop-blur-md">
      <div className="flex-1 flex flex-col gap-4 p-4">
        {NAV_ITEMS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center",
              "border border-bright-blue/20 rounded-lg",
              "bg-bright-blue/5 text-bright-blue",
              "transition-all duration-300",
              "hover:bg-bright-blue/20 hover:border-bright-blue",
              "hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]",
              "hover:translate-x-1",
              activePanel === id && "bg-bright-blue/20 border-bright-blue"
            )}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="w-10 h-10 mx-auto mb-4 flex items-center justify-center
                 border border-bright-blue/20 rounded-lg
                 bg-bright-blue/5 text-bright-blue
                 transition-all duration-300
                 hover:bg-bright-blue/20 hover:border-bright-blue"
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