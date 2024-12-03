"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/game/layout/Header';
import ResizableSidePanel from '@/components/game/layout/ResizableSidePanel';
import MainContent from '@/components/game/layout/MainContent';
import BottomPanel from '@/components/game/layout/BottomPanel';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { GameLayoutProvider } from '@/contexts/GameLayoutContext';

const DEBUG = true;
const RESTORE_TIMEOUT = 700; // 0,7 seconds to wait for session restoration

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [waitingForSession, setWaitingForSession] = useState(true);

  useEffect(() => {
    // Start a timer to wait for session restoration
    const timer = setTimeout(() => {
      if (DEBUG) {
        console.log('[Game Layout] Session restoration timeout reached');
      }
      setWaitingForSession(false);
    }, RESTORE_TIMEOUT);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect if:
    // 1. We're not loading
    // 2. We're not waiting for session restoration
    // 3. There's no user
    if (!loading && !waitingForSession && !user) {
      if (DEBUG) {
        console.log('[Game Layout] No authenticated user found after waiting, redirecting to landing page');
      }
      router.replace('/');
    }
  }, [user, loading, waitingForSession, router]);

  // Show loading state during initial load, session restoration, or while checking auth
  if (loading || waitingForSession || !user) {
    if (DEBUG) {
      console.log('[Game Layout] Showing loading state:', { 
        loading, 
        waitingForSession,
        hasUser: !!user,
        userId: user?.id,
        hasSessionTicket: !!user?.sessionTicket
      });
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <LoadingSpinner />
      </div>
    );
  }

  if (DEBUG) {
    console.log('[Game Layout] Rendering game interface:', {
      userId: user.id,
      displayName: user.displayName,
      hasSessionTicket: !!user.sessionTicket
    });
  }

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
      </div>
    </GameLayoutProvider>
  );
}
