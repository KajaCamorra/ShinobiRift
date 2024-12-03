"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function DebugLoginButton() {
  const { debugLogin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    console.log('Debug login button clicked');
    if (!debugLogin) {
      console.warn('Debug login is not enabled');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await debugLogin();
      router.push('/game');
    } catch (err) {
      console.error('Debug login error:', err);
      setError(err instanceof Error ? err.message : 'Debug login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!debugLogin) {
    return null;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 text-sm text-red-500 bg-red-100/10 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={handleClick}
        disabled={loading}
        className="
          w-full px-4 py-2
          bg-gray-700 hover:bg-gray-600
          text-white rounded-md
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? 'Connecting...' : 'Debug Login'}
      </button>
    </div>
  );
}
