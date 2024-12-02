"use client";

import { useGameLayout } from '@/contexts/GameLayoutContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { cn } from '@/lib/utils';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isPanelOpen, panelWidth } = useGameLayout();
  const { isResizing } = useResizablePanel();

  return (
    <div 
      className="fixed top-[60px] bottom-0 overflow-y-auto lg:left-[60px] left-0 right-0"
      style={{
        right: '0',
        left: window.innerWidth >= 1024 ? `${isPanelOpen ? panelWidth + 60 : 60}px` : '0'
      }}
    >
      <main className="min-h-full w-full">
        <div className="min-h-screen bg-dark-bg/60 backdrop-blur-md text-text p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
