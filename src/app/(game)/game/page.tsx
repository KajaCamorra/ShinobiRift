// src/app/(game)/game/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function GamePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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
    <div className="min-h-screen bg-dark-bg text-text p-4">
      <h1 className="text-2xl font-goldman text-bright-blue mb-4">
        Welcome, {user.displayName}!
      </h1>
      <p>Game interface coming soon...</p>
    </div>
  );
}