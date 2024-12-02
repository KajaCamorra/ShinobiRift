"use client";

import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useGameLayout } from '@/contexts/GameLayoutContext';

export default function GamePage() {
  const { user, loading } = useAuth();
  const { activePanel } = useGameLayout();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen text-text p-4" style={{ background: 'none' }}>
      <h1 className="text-2xl font-goldman text-bright-blue mb-4">
        Welcome, {user.displayName}!
      </h1>
      <div className="flex flex-col space-y-4">
        <div className="bg-dark-bg/50 rounded-lg p-4 border border-neon-pink/20">
          <h2 className="text-xl font-goldman text-neon-pink mb-2">Current Location</h2>
          <p>Crystal Wastes</p>
          <div className="mt-2 text-sm text-text/70">
            <p>Energy Level: 85%</p>
            <p>Active Effects: Speed Boost (2:45), Shadow Veil (1:30)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
