// src/app/(game)/game/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GamePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-bright-blue">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
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