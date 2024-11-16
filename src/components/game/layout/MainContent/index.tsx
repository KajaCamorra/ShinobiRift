// src/components/game/layout/MainContent/index.tsx
"use client";

import { useGameLayout } from '@/contexts/GameLayoutContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { cn } from '@/lib/utils';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isPanelOpen, panelWidth } = useGameLayout();
  const { isResizing } = useResizablePanel();

  return (
    <div 
      className="fixed top-[60px] right-0 bottom-0 left-[60px] overflow-y-auto"
      style={{
        left: window.innerWidth >= 1024 ? `${isPanelOpen ? panelWidth + 60 : 60}px` : '0'
      }}
    >
      <main
        className={cn(
          "min-h-full w-full",
          "bg-bright-blue/5 border border-bright-blue/10 backdrop-blur-md",
          !isResizing && "transition-transform duration-300 ease-in-out",
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}