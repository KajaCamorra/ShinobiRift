// src/app/(game)/layout.tsx
import Header from '@/components/game/layout/Header';
import ResizableSidePanel from '@/components/game/layout/ResizableSidePanel';
import MainContent from '@/components/game/layout/MainContent';
import BottomPanel from '@/components/game/layout/BottomPanel';
import Footer from '@/components/shared/Footer';
import { GameLayoutProvider } from '@/contexts/GameLayoutContext';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameLayoutProvider>
      <div 
        className="min-h-screen flex flex-col bg-dark-bg"
        style={{
          background: `linear-gradient(rgba(1, 0, 10, 0.7), rgba(1, 0, 10, 0.5)), url('/assets/images/landing/bg14.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <Header />
        <div className="flex-1 flex mt-[60px] relative">
          <ResizableSidePanel />
          <MainContent>
            {children}
            <BottomPanel />
          </MainContent>
        </div>
        <Footer />
      </div>
    </GameLayoutProvider>
  );
}