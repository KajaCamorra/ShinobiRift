// src/components/game/layout/ResizableSidePanel/index.tsx
"use client";

import { useGameLayout } from '@/contexts/GameLayoutContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { cn } from '@/lib/utils';
import SideNav from './SideNav';
import PanelContent from './PanelContent';

export default function ResizableSidePanel() {
  const { isPanelOpen, setIsPanelOpen, activePanel } = useGameLayout();
  const { width, isResizing, handleMouseDown } = useResizablePanel();

  return (
    <>
      {/* Desktop Side Navigation */}
      <div className="hidden lg:block">
        <SideNav />
      </div>

      {/* Panel Content */}
      <aside
        className={cn(
          // Base styles
          "fixed z-[1001]",
          !isResizing && "transition-all duration-300 ease-in-out",
          
          // Mobile styles
          "lg:hidden inset-0 bg-dark-bg/95 backdrop-blur-md",
          !isPanelOpen && "-translate-y-full",
          isPanelOpen && "translate-y-0",
          
          // Desktop styles
          "lg:translate-y-0 lg:top-[60px] lg:left-[60px]",
          "lg:h-[calc(100vh-60px)] lg:bg-neon-pink/5",
          "lg:border-r lg:border-neon-pink/10",
          "lg:block",
          !isPanelOpen && "lg:hidden"
        )}
        style={{ 
          width: window.innerWidth >= 1024 ? (isPanelOpen ? width : 0) : '100%'
        }}
      >
        <div 
          className={cn(
            "h-full overflow-hidden",
            !isResizing && "transition-all duration-300 ease-in-out"
          )}
          style={{ 
            width: window.innerWidth >= 1024 ? width : '100%'
          }}
        >
          <PanelContent onClose={() => setIsPanelOpen(false)} />
        </div>
        
        {/* Resize handle - desktop only */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize",
            "hover:bg-bright-blue/20",
            isResizing && "bg-bright-blue/20",
            "hidden lg:block"
          )}
        />
      </aside>

      {/* Mobile overlay backdrop */}
      {isPanelOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-dark-bg/50 backdrop-blur-sm z-[1000]"
          onClick={() => setIsPanelOpen(false)}
        />
      )}
    </>
  );
}